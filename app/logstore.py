"""运行日志落库：应用日志与安全事件写入 SQLite。

为什么不在请求路径直接写库：拦截风暴时每个被拒请求都写一次，SQLite 会先成为
限速器的瓶颈。这里统一进一个有界队列，由后台线程每 0.5 秒批量落库；队列满时
丢最旧的记录并计数——宁可丢日志，也不能让防护失效。

* 应用日志：给 `foxops` logger 挂 Handler，子 logger 自动冒泡上来；uvicorn /
  httpx 等三方 logger 不落库，避免把访问日志灌进 SQLite。
* 安全事件：defense 的内存环形缓冲负责实时视图，同时把每条事件投递到这里；
  合并计数后再次投递会按 event_id 覆盖，不新增行。
"""

from __future__ import annotations

import logging
import queue
import sys
import threading
from datetime import datetime, timezone
from typing import Any

from . import db


FLUSH_INTERVAL_SECONDS = 0.5
BATCH_SIZE = 200
QUEUE_MAX = 5000
MESSAGE_LIMIT = 4000

# 用独立的 logger 名，避免落库失败的错误日志又被自己的 Handler 捕获形成递归。
internal_logger = logging.getLogger("foxops-logstore")

_queue: "queue.Queue[tuple[str, Any]]" = queue.Queue(maxsize=QUEUE_MAX)
_state_lock = threading.Lock()
_stop_event = threading.Event()
_writer: threading.Thread | None = None
_handler: logging.Handler | None = None
_dropped = 0


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _event_row(event: dict[str, Any]) -> tuple:
    return (
        str(event.get("id") or ""),
        str(event.get("ts") or _now_iso()),
        str(event.get("category") or "block"),
        str(event.get("level") or "info"),
        str(event.get("action") or ""),
        str(event.get("ip") or ""),
        str(event.get("path") or ""),
        int(event.get("status") or 0),
        str(event.get("reason") or ""),
        str(event.get("detail") or ""),
        int(event.get("count") or 1),
    )


def _enqueue(kind: str, payload: Any) -> None:
    global _dropped
    try:
        _queue.put_nowait((kind, payload))
        return
    except queue.Full:
        pass
    # 队列满：丢最旧的一条再放新记录，保证防护路径永不阻塞。
    try:
        _queue.get_nowait()
        _queue.put_nowait((kind, payload))
    except (queue.Empty, queue.Full):
        pass
    _dropped += 1
    if _dropped == 1:
        sys.stderr.write("foxops-logstore: queue full, dropping oldest log records\n")


def _write_batch(items: list[tuple[str, Any]]) -> None:
    logs: list[tuple[str, str, str, str]] = []
    events: dict[str, tuple] = {}
    for kind, payload in items:
        if kind == "log":
            logs.append(payload)
        elif kind == "event" and payload[0]:
            # 同一事件在一批里可能因合并计数被投递多次，只保留最后一份。
            events[payload[0]] = payload
    db.insert_log_batch(logs, list(events.values()))


def _drain() -> None:
    items: list[tuple[str, Any]] = []
    while len(items) < BATCH_SIZE:
        try:
            items.append(_queue.get_nowait())
        except queue.Empty:
            break
    if not items:
        return
    try:
        _write_batch(items)
    except Exception as exc:  # noqa: BLE001 - 落库失败不能拖垮业务进程
        internal_logger.error("log persistence failed: %s", exc)


def _writer_loop() -> None:
    while not _stop_event.wait(FLUSH_INTERVAL_SECONDS):
        _drain()
    _drain()


class _DBLogHandler(logging.Handler):
    """把 foxops.* 的日志投进队列，真正的写入在后台线程。"""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            message = record.getMessage()
            if record.exc_info:
                message += "\n" + logging.Formatter().formatException(record.exc_info)
            _enqueue(
                "log",
                (
                    datetime.fromtimestamp(
                        record.created, timezone.utc
                    ).isoformat(timespec="seconds"),
                    record.levelname.lower(),
                    record.name,
                    message[:MESSAGE_LIMIT],
                ),
            )
        except Exception:  # noqa: BLE001 - 日志失败不能影响业务
            self.handleError(record)


def record_security(event: dict[str, Any]) -> None:
    """投递一条安全事件（拦截/封禁）。"""
    _enqueue("event", _event_row(event))


def start() -> None:
    """挂上 Handler 并启动写线程；重复调用无副作用。"""
    global _writer, _handler
    with _state_lock:
        if _writer is not None:
            return
        _stop_event.clear()
        _handler = _DBLogHandler(level=logging.INFO)
        logging.getLogger("foxops").addHandler(_handler)
        _writer = threading.Thread(
            target=_writer_loop, name="foxops-logstore", daemon=True
        )
        _writer.start()


def stop() -> None:
    """停止写线程并尽量把队列里剩下的记录刷完。"""
    global _writer, _handler
    with _state_lock:
        writer = _writer
        handler = _handler
        _writer = None
        _handler = None
        _stop_event.set()
    if handler is not None:
        logging.getLogger("foxops").removeHandler(handler)
    if writer is not None:
        writer.join(timeout=3)
    _drain()


def flush() -> None:
    """同步刷空队列（测试与退出时用）。"""
    _drain()
