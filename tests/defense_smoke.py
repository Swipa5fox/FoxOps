"""DDoS 防护冒烟测试：限速、自动封禁、解封与真实 IP 解析。

阈值故意压到很小（20 次突发 / 2 次违规封禁），否则测试要打几十次请求才触发。
"""

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
os.environ["FOXOPS_SERVICES"] = "nginx"
os.environ["FOXOPS_SECURITY_ENABLED"] = "1"
os.environ["FOXOPS_SECURITY_BURST_LIMIT"] = "20"
os.environ["FOXOPS_SECURITY_BURST_WINDOW_SECONDS"] = "60"
os.environ["FOXOPS_SECURITY_SUSTAINED_LIMIT"] = "40"
os.environ["FOXOPS_SECURITY_SUSTAINED_WINDOW_SECONDS"] = "60"
os.environ["FOXOPS_SECURITY_STRIKE_LIMIT"] = "2"
os.environ["FOXOPS_SECURITY_STRIKE_WINDOW_SECONDS"] = "600"
os.environ["FOXOPS_SECURITY_BAN_SECONDS"] = "300"
os.environ["FOXOPS_SECURITY_MAX_BODY_BYTES"] = "2048"
if os.name == "nt":
    harmless_command = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "where.exe"
    os.environ["FOXOPS_SYSTEMCTL_PATH"] = str(harmless_command)

from fastapi.testclient import TestClient  # noqa: E402

from app import collector, db, defense  # noqa: E402
from app.main import app  # noqa: E402


guard = defense.guard


def force_ban(ip: str) -> None:
    """绕过 HTTP 直接灌请求，把某个 IP 打到封禁。"""
    for _ in range(guard.config.burst_limit + guard.config.strike_limit + 2):
        decision = guard.begin(ip)
        if decision.tracked:
            guard.end(ip)
        if not decision.allowed and decision.status_code == 403:
            return
    raise AssertionError("guard did not ban " + ip)


# ---- 真实 IP 解析：只信受信反代 -------------------------------------------
assert guard.resolve_client_ip("127.0.0.1", {"x-real-ip": "203.0.113.5"}) == "203.0.113.5"
assert guard.resolve_client_ip("198.51.100.7", {"x-real-ip": "203.0.113.5"}) == "198.51.100.7"
assert (
    guard.resolve_client_ip(
        "127.0.0.1", {"x-forwarded-for": "203.0.113.9, 10.0.0.5"}
    )
    == "203.0.113.9"
)
assert guard.resolve_client_ip("::ffff:198.51.100.7", {}) == "198.51.100.7"
# 回环白名单：本机健康检查永远不参与限速。
for _ in range(guard.config.burst_limit * 2):
    assert guard.begin("127.0.0.1").allowed


with TestClient(app) as client:
    guest_login = client.post(
        "/api/login", json={"username": "Guest", "password": "123456"}
    )
    assert guest_login.status_code == 200, guest_login.text
    guest_headers = {"Authorization": "Bearer " + guest_login.json()["token"]}
    admin_login = client.post(
        "/api/login", json={"username": "Admin", "password": "123456"}
    )
    assert admin_login.status_code == 200, admin_login.text
    admin_headers = {"Authorization": "Bearer " + admin_login.json()["token"]}

    # 门禁：匿名 401、访客 403、管理员可读。
    assert client.get("/api/security/status").status_code == 401
    assert (
        client.get("/api/security/status", headers=guest_headers).status_code == 403
    )
    status = client.get("/api/security/status", headers=admin_headers)
    assert status.status_code == 200, status.text
    payload = status.json()
    assert payload["enabled"] is True
    assert payload["limits"]["burst"] == 20
    assert payload["limits"]["strike_limit"] == 2
    assert payload["recent"]["window_seconds"] == 60
    # 前端右上角秒表靠它校时。
    assert payload["server_time"].endswith("+00:00")
    for key in ("recent", "totals", "active", "banned", "offenders"):
        assert key in payload, key

    # 后台管理：策略读取、校验、热更新、持久化与恢复默认。
    assert client.get("/api/security/policy").status_code == 401
    assert client.get("/api/security/policy", headers=guest_headers).status_code == 403
    policy_view = client.get("/api/security/policy", headers=admin_headers)
    assert policy_view.status_code == 200, policy_view.text
    policy_view = policy_view.json()
    assert policy_view["source"] == "default"
    assert policy_view["current"]["burst_limit"] == 20
    assert policy_view["bounds"]["burst_limit"]["min"] == 5

    policy_payload = {
        "enabled": True,
        "burst_limit": 25,
        "burst_window_seconds": 10,
        "sustained_limit": 120,
        "sustained_window_seconds": 60,
        "max_concurrent": 10,
        "max_global_concurrent": 80,
        "max_body_bytes": 4096,
        "strike_limit": 4,
        "strike_window_seconds": 300,
        "ban_seconds": 120,
        "max_ban_seconds": 3600,
    }
    updated = client.put(
        "/api/security/policy", headers=admin_headers, json=policy_payload
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["source"] == "runtime"
    assert updated.json()["current"]["burst_limit"] == 25
    assert defense.guard.config.burst_limit == 25
    assert (
        client.get("/api/security/status", headers=admin_headers).json()["limits"][
            "burst"
        ]
        == 25
    )

    # 越界值与跨字段矛盾都会被后端拒绝。
    assert (
        client.put(
            "/api/security/policy",
            headers=admin_headers,
            json=dict(policy_payload, burst_limit=1),
        ).status_code
        == 400
    )
    assert (
        client.put(
            "/api/security/policy",
            headers=admin_headers,
            json=dict(policy_payload, sustained_limit=1),
        ).status_code
        == 400
    )
    assert any(
        entry["action"] == "update_security_policy"
        for entry in db.audit_logs(20)
    )

    # 模拟重启：先用环境默认覆盖内存，再从数据库恢复自定义策略。
    defense.guard.apply_config(defense.guard_config_from_settings())
    assert defense.load_saved_policy() is True
    assert defense.guard.config.burst_limit == 25

    # 恢复默认：删除自定义值，回到环境变量（测试里是 20）。
    reset = client.delete("/api/security/policy", headers=admin_headers)
    assert reset.status_code == 200, reset.text
    assert reset.json()["source"] == "default"
    assert defense.guard.config.burst_limit == 20

    # 手工解封：先造一个封禁，再通过管理接口放行。
    force_ban("203.0.113.9")
    banned_ips = [
        item["ip"]
        for item in client.get(
            "/api/security/status", headers=admin_headers
        ).json()["banned"]
    ]
    assert "203.0.113.9" in banned_ips, banned_ips
    unban = client.post(
        "/api/security/unban",
        headers=admin_headers,
        json={"ip": "203.0.113.9"},
    )
    assert unban.status_code == 200, unban.text
    assert unban.json()["removed"] is True
    # 重复解封不是错误，只是没东西可解。
    assert (
        client.post(
            "/api/security/unban",
            headers=admin_headers,
            json={"ip": "203.0.113.9"},
        ).json()["removed"]
        is False
    )

    # 超大请求体：在读正文之前就被拒。
    oversize = client.post(
        "/api/login",
        headers={"Content-Type": "application/json"},
        content=b"x" * 4096,
    )
    assert oversize.status_code == 413, oversize.text

    # 清掉上一步留下的违规计数，单独验证"限速 429 → 反复违规升级 403"的完整路径。
    assert guard.unban("testclient") is False  # 还没封禁，只是清计数

    # 持续刷同一个地址：先 429，再因反复违规升级成 403 封禁。
    codes = [
        client.get("/api/health").status_code for _ in range(40)
    ]
    assert 429 in codes, codes
    assert 403 in codes, codes
    assert codes[-1] == 403, codes

    blocked = client.get("/api/health")
    assert blocked.status_code == 403
    assert int(blocked.headers.get("Retry-After", "0")) > 0

    snapshot = guard.status()
    assert snapshot["active"]["banned"] >= 1
    assert any(item["ip"] == "testclient" for item in snapshot["banned"])
    assert snapshot["offenders"][0]["blocked"] >= 1

    # 拦截会汇总成一条活动告警，面板上看得见。
    collector.evaluate_security()
    assert any(item["kind"] == "security" for item in db.active_alerts())

    # 解封后立刻不再是 403（令牌还没回满，429 是预期）。
    assert guard.unban("testclient") is True
    assert client.get("/api/health").status_code in (200, 429, 503)

print("FoxOps defense smoke test passed")
