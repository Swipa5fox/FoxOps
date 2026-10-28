"""Root-side docker probe.

Docker 的访问权限只有"全通"这一档：把服务用户塞进 docker 组，等于给它
root 级控制权（`docker run -v /:/host` 一步就能读写宿主机根目录）。所以
foxops 不碰 docker.sock，改为：

    foxops-docker.timer (root) -> app/docker_probe.py -> /var/lib/foxops/docker.json
    app (foxops 用户) 只读这份 JSON

与 foxops-inspect.{service,timer} 同一套做法，区别只是刷新更密（10s，
容器启停/占用变化远比套接字关系快）。

本模块的 collect() 也被 app/sysops.py 复用，作为开发机的直连兜底（本地
有 docker 权限时无需部署探针）。
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


# 路径常量：app/sysops.py 读同一个文件，一旦可配置就会静默错位。
SNAPSHOT_FILE = Path("/var/lib/foxops/docker.json")
DOCKER_TIMEOUT_SECONDS = 8
# 探针 10s 一轮，留三个周期余量再判定为过期。
SNAPSHOT_MAX_AGE_SECONDS = 35

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
    }


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
