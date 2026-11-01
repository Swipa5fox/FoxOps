from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path


temp_dir = tempfile.TemporaryDirectory()
root = Path(temp_dir.name)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["FOXOPS_DB_PATH"] = str(root / "foxops.db")
os.environ["FOXOPS_BACKUP_DIR"] = str(root / "backups")
os.environ["FOXOPS_SERVICES"] = "nginx,mysqld,redis"

from app import db  # noqa: E402


db.init_db()
metric = {
    "ts": db.utc_now(),
    "cpu_percent": 12.5,
    "memory_percent": 31.0,
    "disk_percent": 18.2,
    "load_1": 0.1,
    "load_5": 0.2,
    "load_15": 0.3,
    "net_bytes_sent": 100,
    "net_bytes_recv": 200,
}
services = [
    {"service": "nginx", "status": "active", "detail": ""},
    {"service": "mysqld", "status": "active", "detail": ""},
    {"service": "redis", "status": "active", "detail": ""},
]
db.insert_sample(metric, services)
assert db.latest_metric()["cpu_percent"] == 12.5
assert len(db.latest_services()) == 3
assert len(db.metric_history(60)) == 1
alert_id = db.create_alert("resource", "cpu", "warning", "test", 90, 85)
assert alert_id is not None
assert len(db.active_alerts()) == 1
db.resolve_alert("resource", "cpu")
assert not db.active_alerts()
backup_path = Path(db.backup_database())
assert backup_path.exists()
second_backup_path = Path(db.backup_database())
assert second_backup_path.exists()
assert second_backup_path != backup_path

# 运行日志落库：应用日志按级别查询，安全事件按 event_id upsert 计数。
stamp = db.utc_now()
db.insert_log_batch(
    [(stamp, "info", "foxops.smoke", "hello")],
    [
        (
            "evt-smoke",
            stamp,
            "block",
            "warning",
            "blocked",
            "203.0.113.7",
            "/api/health",
            429,
            "rate limit",
            "请求过于频繁",
            2,
        )
    ],
)
assert db.app_logs(10)[-1]["message"] == "hello"
assert db.app_logs(10, level="warning") == []
events = db.security_events(10)
assert len(events) == 1 and events[0]["count"] == 2
# 同一 event_id 再次写入只更新计数，不新增行。
db.insert_log_batch(
    [],
    [
        (
            "evt-smoke",
            stamp,
            "block",
            "warning",
            "blocked",
            "203.0.113.7",
            "/api/health",
            429,
            "rate limit",
            "请求过于频繁",
            5,
        )
    ],
)
events = db.security_events(10)
assert len(events) == 1 and events[0]["count"] == 5

cleanup_result = db.cleanup_old_data()
assert "alerts" in cleanup_result
assert "app_logs" in cleanup_result and "security_events" in cleanup_result
print("FoxOps smoke test passed")
