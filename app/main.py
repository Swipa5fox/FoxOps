from __future__ import annotations

import logging
import platform
import socket
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Optional

import psutil
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import (
    Depends,
    FastAPI,
    Header,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import __version__, collector, db, defense, docker_ops, ownership, sysops, weather
from .settings import settings


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("foxops")
STARTED_AT = time.time()

# 容器部署：psutil 默认只看得到容器自己的 /proc。FOXOPS_PROCFS_PATH 指到挂载进来的
# 宿主机 proc（如 /host/proc），CPU / 内存 / 负载 / 网卡统计才反映真实宿主机。
if settings.procs_path:
    psutil.PROCFS_PATH = settings.procs_path
# FoxOps only schedules 2 jobs (collect + maintenance). The default
# ThreadPoolExecutor spins up 10 workers; 3 is more than enough and trims
# idle thread stacks on small-memory hosts.
scheduler = BackgroundScheduler(
    timezone="UTC",
    executors={"default": ThreadPoolExecutor(max_workers=3)},
)


def operating_system_name() -> str:
    os_release = Path("/etc/os-release")
    try:
        for line in os_release.read_text(encoding="utf-8").splitlines():
            if line.startswith("PRETTY_NAME="):
                return line.split("=", 1)[1].strip().strip('"')
    except OSError:
        pass
    return platform.system() or "Linux"


# OS name does not change during the process lifetime; read it once at import
# time instead of hitting /etc/os-release on every /api/summary request.
OS_NAME = operating_system_name()


def require_admin_access(
    authorization: Annotated[Optional[str], Header()] = None,
) -> None:
    """管理操作的门禁：仅管理员（admin）用户会话可通行，访客一律 403。

    "Guest 无管理功能"由本依赖拒绝 guest 会话 + 前端隐藏入口双重保障。
    """
    token = _bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="valid bearer token or admin session required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = db.get_session_username(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="session expired",
        )
    user = db.get_user(username)
    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="访客账号无权执行此操作",
        )


# ---------------------------------------------------------------------------
# 用户认证（登录 / 退出 / 改密码）
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):].strip()
    return token or None


def scheduled_maintenance() -> None:
    try:
        result = db.run_maintenance()
        logger.info("maintenance complete deleted=%s backup=%s", result["deleted"], result["backup"])
    except Exception:
        logger.exception("scheduled maintenance failed")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate()
    db.init_db()
    # 后台管理里保存的策略优先于环境变量；损坏时忽略并沿用默认值。
    defense.load_saved_policy()
    try:
        collector.collect_once()
    except Exception:
        logger.exception("initial metric collection failed")
    scheduler.add_job(
        collector.collect_once,
        "interval",
        seconds=settings.collect_interval_seconds,
        id="collect-metrics",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    scheduler.add_job(
        scheduled_maintenance,
        "cron",
        hour=3,
        minute=10,
        id="maintenance",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    scheduler.start()
    # 秒级实时采样（系统运维页）单独一条线程，不占 APScheduler 的分钟级节奏。
    sysops.start()
    yield
    sysops.stop()
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="FoxOps",
    version=__version__,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)
# 最外层先过限速与封禁：被拦的请求不再进入路由、数据库与静态文件处理。
app.add_middleware(defense.RequestDefenseMiddleware)

# 图标沿用固定文件名（浏览器还会自己来要 /favicon.ico），内容却随版本变。浏览器对
# favicon 的启发式缓存非常顽固，不显式声明就得等缓存过期才肯重新拉取——换图标后
# 标签页长期是旧图。这里统一要求回源校验（有 ETag/Last-Modified，没改就 304）。
_NO_CACHE_PATHS = frozenset({"/favicon.ico", "/icons/favicon.svg"})


@app.middleware("http")
async def no_cache_icons(request: Request, call_next):
    response = await call_next(request)
    if request.url.path in _NO_CACHE_PATHS:
        response.headers["Cache-Control"] = "no-cache"
    return response


@app.get("/api/auth/me")
def auth_me(
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    """返回当前登录用户及角色；未登录返回 401（前端据此切换登录态）。"""
    token = _bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="not logged in")
    username = db.get_session_username(token)
    if not username:
        raise HTTPException(status_code=401, detail="session expired")
    user = db.get_user(username)
    role = str(user.get("role") or "guest") if user else "guest"
    return {"authenticated": True, "username": username, "role": role}


@app.post("/api/login")
def login(payload: LoginRequest, request: Request) -> dict:
    remote_addr = request.client.host if request.client else "unknown"
    user = db.get_user(payload.username)
    if not user or not db.verify_password(payload.password, user["password_hash"]):
        db.write_audit("login", payload.username, False, "bad credentials", remote_addr)
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    token = db.create_session(payload.username)
    db.write_audit("login", payload.username, True, "login ok", remote_addr)
    return {"token": token, "username": payload.username}


@app.post("/api/logout")
def logout(
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    token = _bearer_token(authorization)
    remote_addr = request.client.host if request.client else "unknown"
    if token:
        username = db.get_session_username(token)
        db.delete_session(token)
        if username:
            db.write_audit("logout", username, True, "logout ok", remote_addr)
    return {"ok": True}


@app.post("/api/change-password")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    token = _bearer_token(authorization)
    remote_addr = request.client.host if request.client else "unknown"
    if not token:
        raise HTTPException(status_code=401, detail="not logged in")
    username = db.get_session_username(token)
    if not username:
        raise HTTPException(status_code=401, detail="session expired")

    user = db.get_user(username)
    if not user or not db.verify_password(payload.old_password, user["password_hash"]):
        db.write_audit("change_password", username, False, "wrong old password", remote_addr)
        raise HTTPException(status_code=400, detail="原密码错误")

    db.update_user_password(username, payload.new_password)
    # 改密码后使所有旧会话失效，强制用新密码重新登录。
    db.delete_user_sessions(username)
    db.write_audit("change_password", username, True, "password changed", remote_addr)
    return {"ok": True}


@app.exception_handler(Exception)
async def unhandled_exception(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled request error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "internal server error"})


@app.get("/api/health")
def health(response: Response) -> dict:
    database_ok = False
    latest = None
    try:
        database_ok = db.database_check()
        latest = db.latest_metric() if database_ok else None
    except Exception as exc:
        logger.warning("health database check failed: %s", exc)

    sample_age_seconds: int | None = None
    if latest and latest.get("ts"):
        try:
            sampled_at = datetime.fromisoformat(str(latest["ts"]))
            if sampled_at.tzinfo is None:
                sampled_at = sampled_at.replace(tzinfo=timezone.utc)
            sample_age_seconds = max(
                0,
                int((datetime.now(timezone.utc) - sampled_at).total_seconds()),
            )
        except (TypeError, ValueError):
            sample_age_seconds = None

    freshness_limit = max(settings.collect_interval_seconds * 3, 60)
    collector_ok = (
        sample_age_seconds is not None
        and sample_age_seconds <= freshness_limit
    )
    scheduler_ok = scheduler.running
    healthy = database_ok and collector_ok and scheduler_ok
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if healthy else "degraded",
        "version": __version__,
        "uptime_seconds": int(time.time() - STARTED_AT),
        "database": "ok" if database_ok else "error",
        "collector": "ok" if collector_ok else ("stale" if latest else "missing"),
        "sample_age_seconds": sample_age_seconds,
        "scheduler": "running" if scheduler_ok else "stopped",
    }


def _visible_services() -> list[dict]:
    """已卸载（not-found）的服务不进面板：它不是故障，是没了。"""
    return [item for item in db.latest_services() if item.get("status") != "not-found"]


@app.get("/api/summary")
def summary() -> dict:
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    services = _visible_services()
    # 使用方标注是"现在"的关系而非历史采样，实时计算（ownership 内部带 30s 缓存）。
    for item in services:
        item["used_by"] = ownership.used_by(item["service"])
        # 只有配置清单里的服务在 polkit 规则内，其余自动发现的不可重启。
        item["managed"] = item["service"] in settings.services
    return {
        "metric": db.latest_metric(),
        "services": services,
        "alerts": db.active_alerts(),
        "host": {
            "cloud_provider": settings.cloud_provider,
            "hostname": socket.gethostname(),
            "boot_time": psutil.boot_time(),
            "cpu_count": psutil.cpu_count(),
            "memory_total": memory.total,
            "memory_used": memory.used,
            "memory_available": memory.available,
            "disk_total": disk.total,
            "disk_used": disk.used,
            "disk_free": disk.free,
            "os_name": OS_NAME,
            "kernel_release": platform.release(),
        },
        "version": __version__,
    }


@app.get("/api/weather")
def local_weather(
    place: Annotated[Optional[str], Query()] = None,
    latitude: Annotated[Optional[float], Query(ge=-90, le=90)] = None,
    longitude: Annotated[Optional[float], Query(ge=-180, le=180)] = None,
) -> dict:
    try:
        if place:
            return weather.current_weather_by_name(place)
        if latitude is not None and longitude is not None:
            return weather.current_weather(latitude, longitude)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供 place（城市名）或经纬度",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("weather lookup failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="天气服务暂时不可用",
        ) from exc


@app.get("/api/metrics")
def metrics(
    range_name: Annotated[
        str, Query(alias="range", pattern="^(10m|1h|24h|7d)$")
    ] = "10m",
) -> dict:
    minutes = {
        "10m": 10,
        "1h": 60,
        "24h": 24 * 60,
        "7d": 7 * 24 * 60,
    }[range_name]
    return {"range": range_name, "points": db.metric_history(minutes)}


@app.get("/api/services")
def services() -> dict:
    return {"services": _visible_services(), "whitelist": list(settings.services)}


@app.get("/api/sysops/realtime")
def sysops_realtime() -> dict:
    """秒级实时快照（CPU / 内存 / 磁盘 + 最近 90s 序列）。只读，访客可见。"""
    return sysops.realtime()


@app.get("/api/sysops/docker")
def sysops_docker() -> dict:
    """docker 容器清单。docker 不可用时返回 available=False 与修复提示。"""
    return sysops.containers()


@app.get(
    "/api/docker/containers/{container_id}/logs",
    dependencies=[Depends(require_admin_access)],
)
def docker_container_logs(
    container_id: str,
    tail: Annotated[int, Query(ge=1, le=2000)] = 200,
) -> dict:
    """按需抓容器日志尾部。

    app 没有 docker 权限，请求转给 root 探针执行（见 app/docker_ops.py）。
    """
    try:
        answer = docker_ops.container_logs(container_id, tail)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except docker_ops.QueueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    if not answer.get("ok"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(answer.get("error") or "docker logs 执行失败")[:300],
        )
    return answer.get("data") or {}


@app.get(
    "/api/docker/containers/{container_id}/inspect",
    dependencies=[Depends(require_admin_access)],
)
def docker_container_inspect(container_id: str) -> dict:
    """容器详情摘要；环境变量里名字像密钥的项已打码。"""
    try:
        answer = docker_ops.container_inspect(container_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except docker_ops.QueueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    if not answer.get("ok"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(answer.get("error") or "docker inspect 执行失败")[:300],
        )
    return answer.get("data") or {}


@app.get("/api/alerts")
def alerts() -> dict:
    return {"alerts": db.active_alerts()}


@app.get("/api/audit", dependencies=[Depends(require_admin_access)])
def audit(limit: Annotated[int, Query(ge=1, le=500)] = 100) -> dict:
    return {"entries": db.audit_logs(limit)}


# ---------------------------------------------------------------------------
# 安全防护（DDoS 限速 / 封禁）
# ---------------------------------------------------------------------------

class UnbanRequest(BaseModel):
    ip: str = Field(min_length=1, max_length=64)


@app.get("/api/security/status", dependencies=[Depends(require_admin_access)])
def security_status() -> dict:
    """限流参数、最近一分钟流量、当前封禁与高频来源。

    封禁名单属于攻击面情报，只给管理员看；访客进不到这里（403）。
    """
    return defense.guard.status()


@app.post("/api/security/unban", dependencies=[Depends(require_admin_access)])
def security_unban(
    payload: UnbanRequest,
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    """手工解封；误封（例如 NAT 后的共用出口）靠它恢复访问。"""
    remote_addr = request.client.host if request.client else "unknown"
    token = _bearer_token(authorization)
    operator = db.get_session_username(token) if token else None
    removed = defense.guard.unban(payload.ip)
    db.write_audit(
        "unban_ip",
        payload.ip,
        removed,
        f"operator={operator or 'unknown'}; "
        + ("ban removed" if removed else "ip was not banned"),
        remote_addr,
    )
    return {"ok": True, "ip": payload.ip, "removed": removed}


class SecurityPolicyRequest(BaseModel):
    enabled: bool
    burst_limit: int
    burst_window_seconds: float
    sustained_limit: int
    sustained_window_seconds: float
    max_concurrent: int
    max_global_concurrent: int
    max_body_bytes: int
    strike_limit: int
    strike_window_seconds: float
    ban_seconds: float
    max_ban_seconds: float


@app.get("/api/security/policy", dependencies=[Depends(require_admin_access)])
def security_policy() -> dict:
    """当前生效策略 + 环境变量默认值 + 可调边界（后台管理页用）。"""
    return defense.policy_state()


@app.put("/api/security/policy", dependencies=[Depends(require_admin_access)])
def update_security_policy(
    payload: SecurityPolicyRequest,
    request: Request,
) -> dict:
    """保存并立即生效；持久化在数据卷 SQLite，重启后仍沿用。"""
    remote_addr = request.client.host if request.client else "unknown"
    try:
        policy = defense.save_policy(payload.model_dump())
    except defense.PolicyError as exc:
        db.write_audit(
            "update_security_policy", "security", False, str(exc), remote_addr
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    db.write_audit(
        "update_security_policy",
        "security",
        True,
        f"enabled={policy['enabled']}; "
        f"burst={policy['burst_limit']}/{policy['burst_window_seconds']}s; "
        f"sustained={policy['sustained_limit']}/{policy['sustained_window_seconds']}s; "
        f"concurrent={policy['max_concurrent']}/{policy['max_global_concurrent']}; "
        f"ban={policy['ban_seconds']}s",
        remote_addr,
    )
    return defense.policy_state()


@app.delete("/api/security/policy", dependencies=[Depends(require_admin_access)])
def reset_security_policy(request: Request) -> dict:
    """删除自定义策略，回到环境变量默认值。"""
    remote_addr = request.client.host if request.client else "unknown"
    defense.reset_policy()
    db.write_audit(
        "reset_security_policy",
        "security",
        True,
        "policy reset to environment defaults",
        remote_addr,
    )
    return defense.policy_state()


@app.post(
    "/api/services/{service}/restart",
    dependencies=[Depends(require_admin_access)],
)
def restart(service: str, request: Request) -> dict:
    remote_addr = request.client.host if request.client else "unknown"
    if service not in settings.services:
        db.write_audit(
            "restart_service",
            service,
            False,
            "rejected: not in whitelist",
            remote_addr,
        )
        raise HTTPException(status_code=403, detail="service is not in whitelist")

    success, detail = collector.restart_service(service)
    db.write_audit("restart_service", service, success, detail, remote_addr)
    if not success:
        raise HTTPException(status_code=500, detail=detail)
    collector.collect_once()
    return {"ok": True, "service": service, "detail": detail}


@app.post("/api/maintenance/run", dependencies=[Depends(require_admin_access)])
def run_maintenance(request: Request) -> dict:
    remote_addr = request.client.host if request.client else "unknown"
    try:
        result = db.run_maintenance()
    except Exception as exc:
        db.write_audit(
            "run_maintenance", "database", False, str(exc), remote_addr
        )
        raise HTTPException(status_code=500, detail="maintenance failed") from exc
    db.write_audit(
        "run_maintenance",
        "database",
        True,
        f"deleted={result['deleted']}; backup={result['backup']}",
        remote_addr,
    )
    return {"ok": True, "deleted": result["deleted"], "backup": result["backup"]}


STATIC_DIR = Path(__file__).resolve().parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
