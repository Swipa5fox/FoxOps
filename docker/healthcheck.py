"""容器健康检查：/api/health 返回 ok 才算健康（uvicorn 还活着但采集挂了也算不健康）。"""
from __future__ import annotations

import json
import sys
import urllib.request

URL = "http://127.0.0.1:8000/api/health"

try:
    with urllib.request.urlopen(URL, timeout=4) as response:
        payload = json.load(response)
except Exception as exc:  # noqa: BLE001 - 健康检查只关心成败，不区分异常类型
    print(f"unhealthy: {exc}")
    sys.exit(1)

if payload.get("status") != "ok":
    print(f"unhealthy: {payload}")
    sys.exit(1)

print(
    "healthy: v%s database=%s collector=%s"
    % (payload.get("version"), payload.get("database"), payload.get("collector"))
)
