"""系统日志读取（systemd journal）。

只读 journalctl，不改任何状态。app 以 foxops 用户运行，读 journal 依赖
systemd-journal 组（见 deploy/foxops.service 的 SupplementaryGroups）——
读不到时把原因说清楚（没装 systemd / 没权限），而不是给一个空列表让管理员
自己去猜。

可查看的范围只有 FoxOps 自己与面板里受监控的服务：unit 名来自服务端白名单，
调用时以参数数组传给 subprocess，不经过 shell，也不接受任意路径。
"""

from __future__ import annotations

import logging
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import collector
from .settings import settings


logger = logging.getLogger("foxops.journal")

MAX_LINES = 1000
MAX_TEXT_BYTES = 400_000
COMMAND_TIMEOUT_SECONDS = 8
FOXOPS_UNIT = "foxops"

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
    """可选日志来源：FoxOps 面板 + 面板里正在监控的 systemd 服务。"""
    now = time.monotonic()
    cached = _sources_cache["items"]
    if cached and now - _sources_cache["at"] < _SOURCES_TTL_SECONDS:
        return cached

    items: list[dict[str, str]] = [{"unit": FOXOPS_UNIT, "label": "FoxOps 面板"}]
    seen = {FOXOPS_UNIT}
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
        items.append({"unit": name, "label": f"{name}（{label}）" if label else name})

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


def read(unit: str = FOXOPS_UNIT, lines: int = 200, level: str = "all") -> dict[str, Any]:
    """读取某个 unit 的日志尾部。

    返回结构与 docker 的日志接口保持一致（available / text / lines / clipped），
    前端可以复用同一套展示逻辑。
    """
    items = sources()
    unit = (unit or FOXOPS_UNIT).strip() or FOXOPS_UNIT
    allowed = {item["unit"] for item in items}
    if unit not in allowed:
        raise ValueError("只能查看 FoxOps 与受监控服务的日志")
    if level not in _LEVELS:
        raise ValueError("日志级别不合法")
    tail = max(20, min(int(lines), MAX_LINES))

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
