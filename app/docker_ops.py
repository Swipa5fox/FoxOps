"""app 侧的 docker 按需查询。

app 进程没有 docker 权限，也不该有（见 app/docker_probe.py 的说明）。要看
某个容器的日志或详情时，只能把请求交给 root 探针：

    GET /api/docker/containers/<id>/logs -> 写 docker-queue/req-<id>.json
    root 探针（1s 一轮）                 -> 执行 docker 命令 -> res-<id>.json
    app 轮询拿到回执                     -> 删掉两个文件 -> 返回前端

请求体只有 kind / target（12 位容器 ID）/ tail，探针侧会再校验一次格式，
没有任何能拼进命令行的自由字符串。
"""

from __future__ import annotations

import json
import os
import re
import time
import uuid
from typing import Any

from . import docker_probe

# 探针 1s 一轮，留几个周期余量；超时通常意味着 docker-probe 容器没在跑。
REQUEST_TIMEOUT_SECONDS = 6.0
POLL_INTERVAL_SECONDS = 0.15
_CONTAINER_ID = re.compile(r"^[a-f0-9]{12}$")


class QueueError(RuntimeError):
    """队列不可写或探针没回执；调用方转成 503。"""


def _ensure_queue_dir() -> None:
    """目录由 app 和探针共用，两边都把它拉成 0777，谁先起都不影响对方。"""
    try:
        docker_probe.QUEUE_DIR.mkdir(parents=True, exist_ok=True)
        os.chmod(docker_probe.QUEUE_DIR, 0o777)
    except OSError as exc:
        raise QueueError(f"无法创建 docker 请求队列：{exc}") from exc


def run(kind: str, target: str, **extra: Any) -> dict[str, Any]:
    """提交一次按需查询并等待回执。

    返回探针的原始回执 ``{"ok": True, "data": ...}`` 或 ``{"ok": False, "error": ...}``。
    """
    if not _CONTAINER_ID.fullmatch(target):
        raise ValueError("容器 ID 不合法")
    _ensure_queue_dir()

    request_id = uuid.uuid4().hex
    request_file = docker_probe.QUEUE_DIR / f"req-{request_id}.json"
    response_file = docker_probe.QUEUE_DIR / f"res-{request_id}.json"
    body = {"id": request_id, "kind": kind, "target": target, **extra}

    temporary = request_file.with_suffix(".tmp")
    try:
        temporary.write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")
        os.chmod(temporary, 0o644)
        # 原子改名：探针只会扫到写完整的请求文件。
        os.replace(temporary, request_file)
    except OSError as exc:
        temporary.unlink(missing_ok=True)
        raise QueueError(f"无法写入 docker 请求：{exc}") from exc

    deadline = time.monotonic() + REQUEST_TIMEOUT_SECONDS
    try:
        while time.monotonic() < deadline:
            try:
                raw = response_file.read_text(encoding="utf-8")
            except FileNotFoundError:
                time.sleep(POLL_INTERVAL_SECONDS)
                continue
            except OSError as exc:
                raise QueueError(f"无法读取 docker 回执：{exc}") from exc
            try:
                answer = json.loads(raw)
            except ValueError:
                answer = None
            if isinstance(answer, dict):
                return answer
            time.sleep(POLL_INTERVAL_SECONDS)
        raise QueueError("docker 探针未响应，检查 foxops-docker-probe 容器是否在运行")
    finally:
        request_file.unlink(missing_ok=True)
        response_file.unlink(missing_ok=True)


def container_logs(container_id: str, tail: int = 200) -> dict[str, Any]:
    return run("logs", container_id, tail=tail)


def container_inspect(container_id: str) -> dict[str, Any]:
    return run("inspect", container_id)
