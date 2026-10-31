"""Root-side docker probe.

Docker 的访问权限只有"全通"这一档：把服务用户塞进 docker 组，等于给它
root 级控制权（`docker run -v /:/host` 一步就能读写宿主机根目录）。所以
foxops 不碰 docker.sock，改为：

    foxops-docker.timer (root) -> app/docker_probe.py -> /var/lib/foxops/docker.json
    app (foxops 用户) 只读这份 JSON

与 foxops-inspect.{service,timer} 同一套做法，区别只是刷新更密（10s，
容器启停/占用变化远比套接字关系快）。

除了单向落盘，还有一条反向的请求队列：面板要看某个容器的日志或详情，
app 写 req-<id>.json 进来，本进程执行 docker 命令后写 res-<id>.json。
请求内容只有 (kind, 12 位容器 ID, tail)，没有自由拼接的命令串。

本模块的 collect() 也被 app/sysops.py 复用，作为开发机的直连兜底（本地
有 docker 权限时无需部署探针）。
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


# 路径常量：app/sysops.py 读同一个文件，一旦可配置就会静默错位。
SNAPSHOT_FILE = Path("/var/lib/foxops/docker.json")
QUEUE_DIR = Path("/var/lib/foxops/docker-queue")
DOCKER_TIMEOUT_SECONDS = 8
# 探针 10s 一轮，留三个周期余量再判定为过期。
SNAPSHOT_MAX_AGE_SECONDS = 35
# 进程每秒醒一次专门处理队列，但 ps/stats 没必要跟着跑，按这个间隔节流。
SNAPSHOT_INTERVAL_SECONDS = 10
# 单次日志上限：再长的尾巴既没人看，也容易把内存吃满。
MAX_LOG_LINES = 2000
MAX_LOG_CHARS = 400_000
# 队列里躺太久的请求直接作废：可能是 app 重启前留下的孤儿。
QUEUE_REQUEST_TTL_SECONDS = 30
# 队列只认快照里的 12 位短 ID，任何自由字符串都进不来。
_CONTAINER_ID = re.compile(r"^[a-f0-9]{12}$")
# 环境变量里这些名字一律打码，面板上不该出现任何凭据。
_SECRET_HINTS = (
    "PASSWORD",
    "PASSWD",
    "SECRET",
    "TOKEN",
    "APIKEY",
    "API_KEY",
    "ACCESS_KEY",
    "PRIVATE_KEY",
    "CREDENTIAL",
)

_RUN_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"}


def _docker_binary() -> str | None:
    found = shutil.which("docker")
    if found:
        return found
    for candidate in ("/usr/bin/docker", "/usr/local/bin/docker", "/snap/bin/docker"):
        if Path(candidate).exists():
            return candidate
    return None


def _run_docker(args: list[str], timeout: int) -> subprocess.CompletedProcess[str]:
    binary = _docker_binary()
    if binary is None:
        raise FileNotFoundError("docker CLI not installed")
    return subprocess.run(
        [binary, *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
        env={**_RUN_ENV, "HOME": os.environ.get("HOME", "/var/lib/foxops")},
    )


def _unavailable(reason: str, hint: str | None = None) -> dict[str, Any]:
    return {
        "available": False,
        "reason": reason,
        "hint": hint,
        "stale": False,
        "containers": [],
        "counts": {"total": 0, "running": 0},
        "images": [],
        "volumes": [],
        "networks": [],
    }


def _permission_hint(stderr: str) -> str | None:
    text = stderr.lower()
    if "permission denied" in text:
        return (
            "app 用户没有 docker 权限（最小权限设计如此），容器数据由 "
            "foxops-docker.timer 以 root 采集；若面板一直空白，检查 "
            "systemctl status foxops-docker.timer（升级后需重跑 install.sh 安装该 unit）"
        )
    if "cannot connect" in text or "is the docker daemon running" in text:
        return "docker 守护进程没起来：systemctl enable --now docker"
    return None


def _parse_number(raw: Any) -> float | None:
    try:
        return round(float(str(raw).strip().rstrip("%")), 2)
    except (TypeError, ValueError):
        return None


def _parse_int(raw: Any) -> int | None:
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        return None


def _container_stats() -> dict[str, dict[str, Any]]:
    """一次性抓所有运行中容器的资源占用；失败就当没有，不影响列表。"""
    try:
        result = _run_docker(
            ["stats", "--no-stream", "--format", "{{json .}}"], DOCKER_TIMEOUT_SECONDS
        )
    except (FileNotFoundError, subprocess.SubprocessError, OSError):
        return {}
    if result.returncode != 0:
        return {}

    stats: dict[str, dict[str, Any]] = {}
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        key = str(item.get("ID") or item.get("Container") or "")[:12]
        if not key:
            continue
        stats[key] = {
            "cpu_percent": _parse_number(item.get("CPUPerc")),
            "memory_percent": _parse_number(item.get("MemPerc")),
            "memory_usage": (item.get("MemUsage") or "").strip() or None,
            "pids": _parse_int(item.get("PIDs")),
        }
    return stats


def _list_json(args: list[str]) -> list[dict[str, Any]]:
    """跑一条 `--format {{json .}}` 的列举命令；失败返回空列表，不拖垮整份快照。"""
    try:
        result = _run_docker(args, DOCKER_TIMEOUT_SECONDS)
    except (FileNotFoundError, subprocess.SubprocessError, OSError):
        return []
    if result.returncode != 0:
        return []
    rows: list[dict[str, Any]] = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(item, dict):
            rows.append(item)
    return rows


def _collect_images() -> list[dict[str, Any]]:
    images: list[dict[str, Any]] = []
    for item in _list_json(["images", "--format", "{{json .}}"]):
        repository = str(item.get("Repository") or "").strip()
        tag = str(item.get("Tag") or "").strip()
        images.append(
            {
                "id": str(item.get("ID") or "").replace("sha256:", "")[:12],
                "repository": repository,
                "tag": tag,
                "size": str(item.get("Size") or "").strip(),
                "created_since": str(item.get("CreatedSince") or "").strip(),
                "dangling": repository == "<none>" and tag == "<none>",
            }
        )
    images.sort(key=lambda row: (row["dangling"], row["repository"], row["tag"]))
    return images


def _collect_volumes() -> list[dict[str, Any]]:
    volumes: list[dict[str, Any]] = []
    for item in _list_json(["volume", "ls", "--format", "{{json .}}"]):
        name = str(item.get("Name") or "").strip()
        if not name:
            continue
        volumes.append(
            {
                "name": name,
                "driver": str(item.get("Driver") or "").strip(),
                "scope": str(item.get("Scope") or "").strip(),
            }
        )
    volumes.sort(key=lambda row: row["name"])
    return volumes


def _collect_networks() -> list[dict[str, Any]]:
    networks: list[dict[str, Any]] = []
    for item in _list_json(["network", "ls", "--format", "{{json .}}"]):
        name = str(item.get("Name") or "").strip()
        if not name:
            continue
        networks.append(
            {
                "id": str(item.get("ID") or "")[:12],
                "name": name,
                "driver": str(item.get("Driver") or "").strip(),
                "scope": str(item.get("Scope") or "").strip(),
                "internal": str(item.get("Internal") or "").strip().lower() in ("true", "1"),
            }
        )
    networks.sort(key=lambda row: row["name"])
    return networks


def collect() -> dict[str, Any]:
    """跑一次 docker CLI，返回面板直接可用的 payload。"""
    try:
        result = _run_docker(["ps", "-a", "--format", "{{json .}}"], DOCKER_TIMEOUT_SECONDS)
    except FileNotFoundError:
        return _unavailable("服务器上没有 docker 命令")
    except subprocess.TimeoutExpired:
        return _unavailable("docker ps 执行超时")
    except (subprocess.SubprocessError, OSError) as exc:
        return _unavailable(f"docker ps 执行失败：{exc}"[:300])

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        return _unavailable(stderr[:300] or "docker ps 返回非零退出码", _permission_hint(stderr))

    containers: list[dict[str, Any]] = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        container_id = str(item.get("ID") or "")
        containers.append(
            {
                "id": container_id[:12],
                "name": (item.get("Names") or "").strip(),
                "image": (item.get("Image") or "").strip(),
                "command": (item.get("Command") or "").strip(),
                "state": (item.get("State") or "").strip(),
                "status": (item.get("Status") or "").strip(),
                "ports": (item.get("Ports") or "").strip(),
                "networks": (item.get("Networks") or "").strip(),
                "running_for": (item.get("RunningFor") or "").strip(),
            }
        )

    stats = _container_stats()
    for container in containers:
        container.update(
            stats.get(
                container["id"],
                {"cpu_percent": None, "memory_percent": None, "memory_usage": None, "pids": None},
            )
        )

    # 运行中在前，其余按名字；同状态内按名字稳定排序。
    containers.sort(key=lambda item: (item["state"] != "running", item["name"]))

    return {
        "available": True,
        "reason": "",
        "hint": None,
        "stale": False,
        "containers": containers,
        "counts": {
            "total": len(containers),
            "running": sum(1 for item in containers if item["state"] == "running"),
        },
        "images": _collect_images(),
        "volumes": _collect_volumes(),
        "networks": _collect_networks(),
    }


# ---------------------------------------------------------------------------
# 请求队列：面板按需拉日志 / 详情
# ---------------------------------------------------------------------------


def _queue_dir() -> Path:
    """app(10001) 要往里写请求、也要删回执，所以目录显式给 0777。"""
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(QUEUE_DIR, 0o777)
    except OSError:
        pass
    return QUEUE_DIR


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    os.chmod(temporary, 0o644)
    os.replace(temporary, path)


def _mask_env(entries: list[str]) -> list[dict[str, str]]:
    """环境变量是凭据泄漏的第一现场：名字像密钥的一律打码。"""
    masked: list[dict[str, str]] = []
    for entry in entries:
        key, _, value = str(entry).partition("=")
        if any(hint in key.upper() for hint in _SECRET_HINTS):
            value = "***" if value else ""
        masked.append({"key": key, "value": value})
    return masked


def _summarize_inspect(raw: dict[str, Any]) -> dict[str, Any]:
    """把 docker inspect 的上千行裁剪成面板真正会用到的那些字段。"""
    config = raw.get("Config") or {}
    state = raw.get("State") or {}
    health = state.get("Health") or {}
    host_config = raw.get("HostConfig") or {}
    log_config = host_config.get("LogConfig") or {}
    restart_policy = host_config.get("RestartPolicy") or {}
    network_settings = raw.get("NetworkSettings") or {}

    mounts: list[dict[str, Any]] = []
    for mount in raw.get("Mounts") or []:
        if not isinstance(mount, dict):
            continue
        mounts.append(
            {
                "type": str(mount.get("Type") or ""),
                "source": str(mount.get("Source") or mount.get("Name") or ""),
                "destination": str(mount.get("Destination") or ""),
                "mode": str(mount.get("Mode") or ""),
                "rw": bool(mount.get("RW")),
            }
        )

    networks: list[dict[str, str]] = []
    for name, detail in (network_settings.get("Networks") or {}).items():
        detail = detail if isinstance(detail, dict) else {}
        networks.append(
            {
                "name": name,
                "ip": str(detail.get("IPAddress") or ""),
                "gateway": str(detail.get("Gateway") or ""),
                "mac": str(detail.get("MacAddress") or ""),
            }
        )

    ports: list[dict[str, str]] = []
    for container_port, bindings in (network_settings.get("Ports") or {}).items():
        for binding in bindings or []:
            if not isinstance(binding, dict):
                continue
            ports.append(
                {
                    "container": container_port,
                    "host_ip": str(binding.get("HostIp") or ""),
                    "host_port": str(binding.get("HostPort") or ""),
                }
            )

    return {
        "id": str(raw.get("Id") or "")[:12],
        "name": str(raw.get("Name") or "").lstrip("/"),
        "image": str(config.get("Image") or ""),
        "image_id": str(raw.get("Image") or "").replace("sha256:", "")[:12],
        "created": str(raw.get("Created") or ""),
        "platform": str(raw.get("Platform") or ""),
        "command": [str(part) for part in (config.get("Cmd") or [])],
        "entrypoint": [str(part) for part in (config.get("Entrypoint") or [])],
        "working_dir": str(config.get("WorkingDir") or ""),
        "user": str(config.get("User") or ""),
        "env": _mask_env(config.get("Env") or []),
        "mounts": mounts,
        "networks": networks,
        "ports": ports,
        "log_driver": str(log_config.get("Type") or ""),
        "restart_policy": str(restart_policy.get("Name") or ""),
        "state": {
            "status": str(state.get("Status") or ""),
            "running": bool(state.get("Running")),
            "started_at": str(state.get("StartedAt") or ""),
            "finished_at": str(state.get("FinishedAt") or ""),
            "exit_code": state.get("ExitCode"),
            "restart_count": raw.get("RestartCount"),
            "oom_killed": bool(state.get("OOMKilled")),
            "health": str(health.get("Status") or ""),
        },
    }


def _handle_logs(request_id: str, container_id: str, tail: int) -> dict[str, Any]:
    try:
        result = _run_docker(
            ["logs", "--timestamps", "--tail", str(tail), container_id],
            DOCKER_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        return {"id": request_id, "ok": False, "error": "docker logs 执行超时"}
    except (FileNotFoundError, subprocess.SubprocessError, OSError) as exc:
        return {"id": request_id, "ok": False, "error": f"docker logs 执行失败：{exc}"[:300]}

    text = (result.stdout or "") + (result.stderr or "")
    if result.returncode != 0 and not text.strip():
        return {
            "id": request_id,
            "ok": False,
            "error": ((result.stderr or "").strip() or "docker logs 返回非零退出码")[:300],
        }

    clipped = len(text) > MAX_LOG_CHARS
    if clipped:
        text = text[-MAX_LOG_CHARS:]
    return {
        "id": request_id,
        "ok": True,
        "data": {
            "container": container_id,
            "tail": tail,
            "text": text,
            "lines": text.count("\n"),
            "clipped": clipped,
        },
    }


def _handle_inspect(request_id: str, container_id: str) -> dict[str, Any]:
    try:
        result = _run_docker(["inspect", container_id], DOCKER_TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired:
        return {"id": request_id, "ok": False, "error": "docker inspect 执行超时"}
    except (FileNotFoundError, subprocess.SubprocessError, OSError) as exc:
        return {"id": request_id, "ok": False, "error": f"docker inspect 执行失败：{exc}"[:300]}

    if result.returncode != 0:
        return {
            "id": request_id,
            "ok": False,
            "error": ((result.stderr or "").strip() or "docker inspect 返回非零退出码")[:300],
        }
    try:
        rows = json.loads(result.stdout or "[]")
    except json.JSONDecodeError:
        return {"id": request_id, "ok": False, "error": "docker inspect 返回的不是 JSON"}
    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        return {"id": request_id, "ok": False, "error": "容器不存在或已被删除"}
    return {"id": request_id, "ok": True, "data": _summarize_inspect(rows[0])}


def _handle_request(request: dict[str, Any]) -> dict[str, Any]:
    request_id = str(request.get("id") or "")
    kind = str(request.get("kind") or "")
    container_id = str(request.get("target") or "")
    if not _CONTAINER_ID.fullmatch(container_id):
        return {"id": request_id, "ok": False, "error": "容器 ID 不合法"}
    if kind == "logs":
        raw_tail = request.get("tail")
        tail = max(1, min(raw_tail, MAX_LOG_LINES)) if isinstance(raw_tail, int) else 200
        return _handle_logs(request_id, container_id, tail)
    if kind == "inspect":
        return _handle_inspect(request_id, container_id)
    return {"id": request_id, "ok": False, "error": f"不支持的操作：{kind}"[:120]}


def _drain_queue() -> None:
    """把队列里攒下的请求逐条执行完；单条失败不影响其它请求。"""
    directory = _queue_dir()
    for request_file in sorted(directory.glob("req-*.json")):
        try:
            age = time.time() - request_file.stat().st_mtime
        except OSError:
            continue
        if age > QUEUE_REQUEST_TTL_SECONDS:
            request_file.unlink(missing_ok=True)
            continue
        try:
            request = json.loads(request_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            request_file.unlink(missing_ok=True)
            continue
        if not isinstance(request, dict):
            request_file.unlink(missing_ok=True)
            continue
        try:
            answer = _handle_request(request)
        except Exception as exc:  # noqa: BLE001 - 一条请求炸了不能拖垮整个循环
            answer = {
                "id": str(request.get("id") or ""),
                "ok": False,
                "error": f"探针执行异常：{exc}"[:300],
            }
        _write_json(directory / f"res-{request_file.name[4:]}", answer)
        request_file.unlink(missing_ok=True)


def _snapshot_fresh() -> bool:
    try:
        return time.time() - SNAPSHOT_FILE.stat().st_mtime < SNAPSHOT_INTERVAL_SECONDS
    except OSError:
        return False


def read_snapshot(max_age_seconds: float | None = SNAPSHOT_MAX_AGE_SECONDS) -> dict[str, Any] | None:
    """读探针落盘的数据；文件不存在、读坏了或过期都返回 None。"""
    try:
        modified_at = SNAPSHOT_FILE.stat().st_mtime
    except OSError:
        return None
    if max_age_seconds is not None:
        # 允许毫秒级负偏差（两次 time.time() 浮点抖动可能让 mtime 显得微在未来）。
        age = time.time() - modified_at
        if age < -1 or age > max_age_seconds:
            return None
    try:
        payload = json.loads(SNAPSHOT_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return payload if isinstance(payload, dict) else None


def main() -> None:
    # 队列每轮都处理（entrypoint 每秒醒一次），快照按 SNAPSHOT_INTERVAL_SECONDS 节流。
    try:
        _drain_queue()
    except Exception as exc:  # noqa: BLE001 - 队列坏了也不能拖停快照
        print(f"docker queue failed: {exc}", file=sys.stderr)

    if _snapshot_fresh():
        return

    payload = collect()
    payload["generated_at"] = int(time.time())
    SNAPSHOT_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = SNAPSHOT_FILE.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    os.chmod(temporary, 0o644)
    os.replace(temporary, SNAPSHOT_FILE)
    if not payload["available"]:
        # 有错就说出来，systemctl status / journal 里能看到原因。
        print(f"docker probe unavailable: {payload['reason']}", file=sys.stderr)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - probe failure must be visible
        print(f"docker probe failed: {exc}", file=sys.stderr)
        sys.exit(1)
