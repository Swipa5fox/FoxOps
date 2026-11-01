"""系统日志读取：应用日志（SQLite）与 systemd journal。

默认来源是落库的 FoxOps 应用日志（app_logs），容器部署也能用；原生部署还可
以切到 journald，读 FoxOps 与受监控服务的系统日志。journalctl 只读、不改任何
状态，读不到时把原因说清楚（没装 systemd / 没权限），而不是给一个空列表。

journald 的可查看范围只有 FoxOps 自己与面板里受监控的服务：unit 名来自服务端
白名单，调用时以参数数组传给 subprocess，不经过 shell，也不接受任意路径。
"""

from __future__ import annotations

import logging
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import collector, db
from .settings import settings


logger = logging.getLogger("foxops.journal")

MAX_LINES = 1000
MAX_TEXT_BYTES = 400_000
COMMAND_TIMEOUT_SECONDS = 8
FOXOPS_UNIT = "foxops"
# 数据库日志来源（app_logs）：不依赖 journald，容器部署的默认值。
APP_LOG_UNIT = "app-log"

# 前端只给三档：全部 / 警告及以上 / 仅错误。journalctl 的优先级名分别是
# warning 与 err（不是 error），写错会直接退出 1。
_LEVELS = {"all": None, "warning": "warning", "error": "err"}
_UNIT_NAME = re.compile(r"^[A-Za-z0-9_.@-]{1,64}$")
# 与 collector 保持一致：用服务器自己的二进制，避免 venv 的 PATH 干扰。
_RUN_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"}

# 服务发现要跑两条 systemctl，按分钟缓存；面板每 5 秒拉一次日志不该顺带扫系统。
_SOURCES_TTL_SECONDS = 60.0
_sources_cache: dict[str, Any] = {"at": 0.0, "items": []}


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sources() -> list[dict[str, str]]:
    """可选日志来源：数据库里的 FoxOps 应用日志 + journald 里的系统日志。"""
    now = time.monotonic()
    cached = _sources_cache["items"]
    if cached and now - _sources_cache["at"] < _SOURCES_TTL_SECONDS:
        return cached

    items: list[dict[str, str]] = [
        {"unit": APP_LOG_UNIT, "label": "FoxOps 应用日志（数据库）"}
    ]
    # 没有 journalctl（容器部署）时只列数据库来源，不给选不到的东西。
    if Path(settings.journalctl_path).is_file():
        items.append({"unit": FOXOPS_UNIT, "label": "FoxOps 服务日志（journald）"})
        seen = {APP_LOG_UNIT, FOXOPS_UNIT}
        try:
            discovered = collector.discovered_services()
        except Exception:  # noqa: BLE001 - 服务发现失败不该让日志页整体不可用
            logger.exception("journal: service discovery failed")
            discovered = list(settings.services)
        for name in discovered:
            if name in seen or not _UNIT_NAME.fullmatch(name):
                continue
            seen.add(name)
            label = settings.service_labels.get(name)
            items.append(
                {"unit": name, "label": f"{name}（{label}）" if label else name}
            )

    _sources_cache["at"] = now
    _sources_cache["items"] = items
    return items


def _unavailable(
    reason: str, hint: str | None, unit: str, items: list[dict[str, str]]
) -> dict[str, Any]:
    return {
        "available": False,
        "reason": reason,
        "hint": hint,
        "unit": unit,
        "sources": items,
        "level": "all",
        "tail": 0,
        "lines": 0,
        "text": "",
        "clipped": False,
        "generated_at": _iso_now(),
    }


def _permission_hint(stderr: str) -> str | None:
    text = stderr.lower()
    if "permission" in text or "not seeing messages" in text:
        return (
            "把运行用户加入 systemd-journal 组后重启服务："
            "usermod -aG systemd-journal foxops && systemctl restart foxops"
        )
    if "no journal files" in text or "failed to open" in text:
        return "systemd-journald 可能没在运行：systemctl status systemd-journald"
    return None


def _read_app_logs(
    tail: int, level: str, items: list[dict[str, str]]
) -> dict[str, Any]:
    """从 SQLite 读应用日志，格式化成与 journalctl 相近的行。"""
    rows = db.app_logs(tail, level)
    text = "\n".join(
        f"{row['ts']} {str(row['level']).upper():<8} {row['logger']} {row['message']}"
        for row in rows
    )
    clipped = len(text.encode("utf-8")) > MAX_TEXT_BYTES
    if clipped:
        text = text.encode("utf-8")[-MAX_TEXT_BYTES:].decode("utf-8", "ignore")
    return {
        "available": True,
        "reason": "",
        "hint": None,
        "unit": APP_LOG_UNIT,
        "sources": items,
        "level": level,
        "tail": tail,
        "lines": len(rows),
        "text": text,
        "clipped": clipped,
        "generated_at": _iso_now(),
    }


def read(
    unit: str | None = None, lines: int = 200, level: str = "all"
) -> dict[str, Any]:
    """读取日志尾部。

    默认读数据库里的应用日志；unit 以 journald 的服务名传入时改读 systemd
    日志。返回结构与 docker 的日志接口保持一致（available / text / lines /
    clipped），前端可以复用同一套展示逻辑。
    """
    items = sources()
    unit = (unit or APP_LOG_UNIT).strip() or APP_LOG_UNIT
    allowed = {item["unit"] for item in items}
    if unit not in allowed:
        raise ValueError("只能查看 FoxOps 与受监控服务的日志")
    if level not in _LEVELS:
        raise ValueError("日志级别不合法")
    tail = max(20, min(int(lines), MAX_LINES))

    if unit == APP_LOG_UNIT:
        return _read_app_logs(tail, level, items)

    binary = settings.journalctl_path
    if not Path(binary).is_file():
        payload = _unavailable(
            "当前环境没有 journalctl（容器部署不含 systemd）",
            "容器部署请用 docker compose logs app；原生部署在宿主机执行 journalctl -u foxops",
            unit,
            items,
        )
        payload["tail"] = tail
        payload["level"] = level
        return payload

    command = [
        binary,
        "--unit",
        unit,
        "--lines",
        str(tail),
        "--no-pager",
        "--output=short-iso",
    ]
    priority = _LEVELS[level]
    if priority:
        command.append(f"--priority={priority}")

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=COMMAND_TIMEOUT_SECONDS,
            check=False,
            env=_RUN_ENV,
        )
    except subprocess.TimeoutExpired:
        payload = _unavailable("journalctl 执行超时", None, unit, items)
    except (OSError, subprocess.SubprocessError) as exc:
        payload = _unavailable(f"journalctl 执行失败：{exc}"[:300], None, unit, items)
    else:
        stderr = (result.stderr or "").strip()
        if result.returncode != 0:
            reason = stderr.splitlines()[-1] if stderr else "journalctl 返回非零退出码"
            payload = _unavailable(reason[:300], _permission_hint(stderr), unit, items)
        else:
            text = result.stdout or ""
            clipped = len(text.encode("utf-8")) > MAX_TEXT_BYTES
            if clipped:
                # 按字节截尾再解码：中文日志在边界上可能被切半，ignore 掉半个字符。
                text = text.encode("utf-8")[-MAX_TEXT_BYTES:].decode("utf-8", "ignore")
            payload = {
                "available": True,
                "reason": "",
                "hint": None,
                "unit": unit,
                "sources": items,
                "level": level,
                "tail": tail,
                "lines": text.count("\n"),
                "text": text.strip("\n"),
                "clipped": clipped,
                "generated_at": _iso_now(),
            }

    payload["tail"] = tail
    payload["level"] = level
    return payload
