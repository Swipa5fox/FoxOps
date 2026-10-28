"""请求级 DDoS 防护：限速、并发上限与自动封禁。

这一层挡在 ASGI 最外面（见 main.py 的 RequestDefenseMiddleware），先于路由执行：

* 每个来源 IP 两个令牌桶——短窗口挡突发（默认 60 次 / 10 秒），长窗口挡持续
  刷量（默认 300 次 / 60 秒）；超限返回 429 并带 Retry-After；
* 每个来源 IP 与整个进程各有一条并发上限，避免慢请求把 worker 占满；
* 反复触发的来源自动封禁，时长按次数指数退避（默认 10 分钟起，最长 24 小时），
  封禁期内直接 403，不再进入后续处理；
* 白名单（默认回环）永不被拦；反代转发的真实 IP 只从受信来源取，避免伪造
  X-Forwarded-For 绕过限速。

定位说明：这是单机自保，不是清洗中心。它能挡住扫描器、密码暴破与单机肉鸡狂刷，
让面板被打时优先保住自己；Tbps 级流量仍然要靠云厂商的 DDoS 高防。
"""

from __future__ import annotations

import ipaddress
import json
import logging
import threading
import time
from collections import OrderedDict, deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping

from starlette.responses import JSONResponse

from . import db
from .settings import SECURITY_POLICY_BOUNDS, settings


logger = logging.getLogger("foxops.defense")

# 面板上"最近一分钟"的统计窗口与高频来源榜长度。
RECENT_WINDOW_SECONDS = 60
MAX_OFFENDERS = 5


def _normalize_ip(value: str | None) -> Any | None:
    """把字符串解析成 ip_address；非法值（含 TestClient 的 "testclient"）返回 None。"""
    if not value:
        return None
    try:
        address = ipaddress.ip_address(value.strip())
    except ValueError:
        return None
    # 反代常见 ::ffff:1.2.3.4，统一折回 IPv4，避免同一客户端算出两个 key。
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        return ipaddress.IPv4Address(address.ipv4_mapped)
    return address


def _in_networks(address: Any, networks: Iterable[Any]) -> bool:
    return any(address in network for network in networks)


@dataclass(frozen=True)
class GuardConfig:
    enabled: bool
    allowlist: tuple[Any, ...]
    trusted_proxies: tuple[Any, ...]
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
    max_tracked_ips: int


@dataclass(frozen=True)
class Decision:
    """一次请求的准入结论。tracked=True 表示并发计数需要由调用方 release。"""

    allowed: bool
    tracked: bool = False
    status_code: int = 200
    detail: str = ""
    retry_after: float = 0.0


@dataclass
class _Client:
    burst: float
    sustained: float
    updated: float
    last_seen: float
    active: int = 0
    requests: int = 0
    blocked: int = 0
    violations: int = 0
    last_violation: float = 0.0


@dataclass
class _Ban:
    until: float
    created_wall: float
    level: int
    reason: str


class RequestGuard:
    def __init__(self, config: GuardConfig) -> None:
        self.config = config
        self._lock = threading.Lock()
        self._clients: OrderedDict[str, _Client] = OrderedDict()
        self._bans: dict[str, _Ban] = {}
        # 每秒一格： [秒, 放行数, 拦截数]，只留最近 RECENT_WINDOW_SECONDS 格。
        self._recent: deque[list[float]] = deque(maxlen=RECENT_WINDOW_SECONDS)
        self._active = 0
        self._pruned_at = 0.0
        self._totals = {"requests": 0, "allowed": 0, "blocked": 0}
        self._started_at = time.time()

    # ------------------------------------------------------------------
    # 真实 IP
    # ------------------------------------------------------------------
    def _trusted(self, address: Any) -> bool:
        return _in_networks(address, self.config.trusted_proxies)

    def resolve_client_ip(
        self, peer: str | None, headers: Mapping[str, str]
    ) -> str:
        """直连取 socket 地址；只有受信反代才认 X-Real-IP / X-Forwarded-For。

        生产环境里 Nginx 会用自己的 $remote_addr 覆盖 X-Real-IP，所以优先读它；
        X-Forwarded-For 从右往左取第一个非受信地址，跳过攻击者自己塞进去的前缀。
        注意：X-Real-IP 不做"是否受信"的二次判断——它代表 nginx 看到的直连来源，
        内网客户端同样要受限速约束，不能因为落在受信网段就被放过。
        """
        peer_address = _normalize_ip(peer)
        if peer_address is None:
            return (peer or "unknown")[:64]
        if not self._trusted(peer_address):
            return str(peer_address)
        real = _normalize_ip(headers.get("x-real-ip"))
        if real is not None:
            return str(real)
        forwarded = headers.get("x-forwarded-for", "")
        for part in reversed(forwarded.split(",")):
            candidate = _normalize_ip(part)
            if candidate is not None and not self._trusted(candidate):
                return str(candidate)
        return str(peer_address)

    # ------------------------------------------------------------------
    # 准入 / 释放
    # ------------------------------------------------------------------
    def begin(self, ip: str, content_length: int | None = None) -> Decision:
        config = self.config
        with self._lock:
            now = time.monotonic()
            self._totals["requests"] += 1
            self._prune(now)

            ban = self._bans.get(ip)
            if ban is not None:
                remaining = ban.until - now
                if remaining > 0:
                    self._totals["blocked"] += 1
                    self._mark(now, blocked=True)
                    client = self._client(ip, now)
                    client.blocked += 1
                    seconds = max(1, int(remaining))
                    return Decision(
                        False,
                        status_code=403,
                        detail=f"来源 IP 已被临时封禁，请 {seconds} 秒后再试",
                        retry_after=remaining,
                    )
                self._bans.pop(ip, None)

            address = _normalize_ip(ip)
            if address is not None and _in_networks(address, config.allowlist):
                self._totals["allowed"] += 1
                self._mark(now, blocked=False)
                return Decision(True)

            client = self._client(ip, now)
            if content_length is not None and content_length > config.max_body_bytes:
                return self._reject(
                    ip,
                    client,
                    now,
                    "request body too large",
                    status_code=413,
                    detail="请求体超出大小限制",
                )
            if self._active >= config.max_global_concurrent:
                return self._reject(
                    ip,
                    client,
                    now,
                    "global concurrency",
                    detail="服务器繁忙，请稍后重试",
                )
            if client.active >= config.max_concurrent:
                return self._reject(
                    ip,
                    client,
                    now,
                    "per-ip concurrency",
                    detail="并发请求过多，请稍后重试",
                )
            if not self._take(client, now):
                return self._reject(ip, client, now, "rate limit")

            client.active += 1
            client.requests += 1
            self._active += 1
            self._totals["allowed"] += 1
            self._mark(now, blocked=False)
            return Decision(True, tracked=True)

    def end(self, ip: str) -> None:
        with self._lock:
            client = self._clients.get(ip)
            if client is not None and client.active > 0:
                client.active -= 1
            if self._active > 0:
                self._active -= 1

    def apply_config(self, config: GuardConfig) -> None:
        """热更新策略：后续请求立即按新阈值判定，已发放的令牌按新上限收敛。"""
        with self._lock:
            self.config = config
            for client in self._clients.values():
                client.burst = min(client.burst, float(config.burst_limit))
                client.sustained = min(client.sustained, float(config.sustained_limit))

    def unban(self, ip: str) -> bool:
        """手工解封；同时清掉违规与拦截计数，避免刚解封就被旧账再封一次。"""
        key = (ip or "").strip()
        if not key:
            return False
        candidates = {key}
        address = _normalize_ip(key)
        if address is not None:
            candidates.add(str(address))
        removed = False
        with self._lock:
            for candidate in candidates:
                if self._bans.pop(candidate, None) is not None:
                    removed = True
                client = self._clients.get(candidate)
                if client is not None:
                    client.violations = 0
                    client.blocked = 0
        if removed:
            logger.warning("security: %s manually unbanned", key)
        return removed

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------
    def status(self) -> dict[str, Any]:
        config = self.config
        with self._lock:
            now = time.monotonic()
            self._prune(now)
            recent = self._recent_counts(now)
            banned = [
                {
                    "ip": ip,
                    "reason": ban.reason,
                    "bans": ban.level,
                    "banned_at": datetime.fromtimestamp(
                        ban.created_wall, timezone.utc
                    ).isoformat(timespec="seconds"),
                    "remaining_seconds": max(0, int(ban.until - now)),
                }
                for ip, ban in sorted(
                    self._bans.items(), key=lambda item: item[1].until
                )
                if ban.until > now
            ]
            offenders = sorted(
                (
                    {
                        "ip": ip,
                        "requests": client.requests,
                        "blocked": client.blocked,
                        "violations": client.violations,
                        "last_seen_seconds_ago": max(
                            0, int(now - client.last_seen)
                        ),
                        "banned": ip in self._bans,
                    }
                    for ip, client in self._clients.items()
                ),
                key=lambda item: (item["blocked"], item["requests"]),
                reverse=True,
            )[:MAX_OFFENDERS]
            active = self._active
            tracked = len(self._clients)
            totals = dict(self._totals)

        return {
            "enabled": config.enabled,
            # 让面板的「数据更新于」按服务器时间走：前端拿它和本机时间算偏移。
            # 必须带毫秒——只到秒时，每次刷新重算偏移会有最多 1 秒的抖动，
            # 秒表就表现为"两秒跳一格"。
            "server_time": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "limits": {
                "burst": config.burst_limit,
                "burst_window_seconds": config.burst_window_seconds,
                "sustained": config.sustained_limit,
                "sustained_window_seconds": config.sustained_window_seconds,
                "max_concurrent": config.max_concurrent,
                "max_global_concurrent": config.max_global_concurrent,
                "max_body_bytes": config.max_body_bytes,
                "strike_limit": config.strike_limit,
                "strike_window_seconds": config.strike_window_seconds,
                "ban_seconds": config.ban_seconds,
                "max_ban_seconds": config.max_ban_seconds,
                "allowlist": [str(network) for network in config.allowlist],
            },
            "recent": recent,
            "totals": totals,
            "active": {
                "tracked_ips": tracked,
                "concurrent": active,
                "banned": len(banned),
            },
            "banned": banned,
            "offenders": offenders,
            "uptime_seconds": max(0, int(time.time() - self._started_at)),
        }

    def recent(self) -> dict[str, int]:
        """给 collector 的轻量快照：最近一分钟拦截量 + 当前封禁数。"""
        with self._lock:
            now = time.monotonic()
            self._prune(now)
            counts = self._recent_counts(now)
            counts["banned"] = sum(
                1 for ban in self._bans.values() if ban.until > now
            )
        return counts

    # ------------------------------------------------------------------
    # 内部实现（调用方持锁）
    # ------------------------------------------------------------------
    def _client(self, ip: str, now: float) -> _Client:
        client = self._clients.get(ip)
        if client is None:
            if len(self._clients) >= self.config.max_tracked_ips:
                self._evict()
            client = _Client(
                burst=float(self.config.burst_limit),
                sustained=float(self.config.sustained_limit),
                updated=now,
                last_seen=now,
            )
            self._clients[ip] = client
        else:
            # OrderedDict 当 LRU 用：刚出现过的来源沉底，淘汰时先丢冷数据。
            self._clients.move_to_end(ip)
        client.last_seen = now
        return client

    def _evict(self) -> None:
        """优先淘汰没有在途请求的来源；全是活跃请求时退化为丢最久未用的。"""
        idle = next(
            (key for key, client in self._clients.items() if client.active <= 0),
            None,
        )
        if idle is not None:
            self._clients.pop(idle)
            return
        self._clients.popitem(last=False)

    def _take(self, client: _Client, now: float) -> bool:
        config = self.config
        elapsed = max(0.0, now - client.updated)
        client.updated = now
        client.burst = min(
            float(config.burst_limit),
            client.burst + elapsed * config.burst_limit / config.burst_window_seconds,
        )
        client.sustained = min(
            float(config.sustained_limit),
            client.sustained
            + elapsed * config.sustained_limit / config.sustained_window_seconds,
        )
        if client.burst < 1 or client.sustained < 1:
            return False
        client.burst -= 1
        client.sustained -= 1
        return True

    def _reject(
        self,
        ip: str,
        client: _Client,
        now: float,
        reason: str,
        status_code: int = 429,
        detail: str = "请求过于频繁，请稍后重试",
    ) -> Decision:
        self._totals["blocked"] += 1
        self._mark(now, blocked=True)
        client.blocked += 1
        self._register_violation(ip, client, now, reason)
        ban = self._bans.get(ip)
        if ban is not None and ban.until > now:
            seconds = max(1, int(ban.until - now))
            return Decision(
                False,
                status_code=403,
                detail=f"来源 IP 已被临时封禁，请 {seconds} 秒后再试",
                retry_after=ban.until - now,
            )
        return Decision(False, status_code=status_code, detail=detail, retry_after=1.0)

    def _register_violation(
        self, ip: str, client: _Client, now: float, reason: str
    ) -> None:
        config = self.config
        if now - client.last_violation > config.strike_window_seconds:
            client.violations = 0
        client.violations += 1
        client.last_violation = now
        if client.violations < config.strike_limit:
            return
        client.violations = 0
        previous = self._bans.get(ip)
        level = previous.level + 1 if previous else 1
        duration = min(
            config.ban_seconds * (2 ** (level - 1)), config.max_ban_seconds
        )
        self._bans[ip] = _Ban(
            until=now + duration,
            created_wall=time.time(),
            level=level,
            reason=reason,
        )
        logger.warning(
            "security: banned %s for %ds (level=%d, reason=%s)",
            ip,
            int(duration),
            level,
            reason,
        )
        # 封禁表也要有界：超出上限时先丢最早到期的那条。
        if len(self._bans) > config.max_tracked_ips:
            oldest = min(self._bans.items(), key=lambda item: item[1].until)
            self._bans.pop(oldest[0], None)

    def _prune(self, now: float) -> None:
        # 每 5 秒清一次过期封禁，避免每个请求都遍历整张表。
        if now - self._pruned_at < 5:
            return
        self._pruned_at = now
        expired = [ip for ip, ban in self._bans.items() if ban.until <= now]
        for ip in expired:
            self._bans.pop(ip, None)

    def _mark(self, now: float, blocked: bool) -> None:
        second = int(now)
        if not self._recent or int(self._recent[-1][0]) != second:
            self._recent.append([second, 0, 0])
        slot = self._recent[-1]
        slot[2 if blocked else 1] += 1

    def _recent_counts(self, now: float) -> dict[str, int]:
        floor = now - RECENT_WINDOW_SECONDS
        requests = allowed = blocked = 0
        for second, ok, bad in self._recent:
            if second <= floor:
                continue
            requests += int(ok + bad)
            allowed += int(ok)
            blocked += int(bad)
        return {
            "window_seconds": RECENT_WINDOW_SECONDS,
            "requests": requests,
            "allowed": allowed,
            "blocked": blocked,
        }


def guard_config_from_settings() -> GuardConfig:
    return GuardConfig(
        enabled=settings.security_enabled,
        allowlist=settings.security_allowlist,
        trusted_proxies=settings.security_trusted_proxies,
        burst_limit=settings.security_burst_limit,
        burst_window_seconds=settings.security_burst_window_seconds,
        sustained_limit=settings.security_sustained_limit,
        sustained_window_seconds=settings.security_sustained_window_seconds,
        max_concurrent=settings.security_max_concurrent,
        max_global_concurrent=settings.security_max_global_concurrent,
        max_body_bytes=settings.security_max_body_bytes,
        strike_limit=settings.security_strike_limit,
        strike_window_seconds=settings.security_strike_window_seconds,
        ban_seconds=settings.security_ban_seconds,
        max_ban_seconds=settings.security_max_ban_seconds,
        max_tracked_ips=settings.security_max_tracked_ips,
    )


guard = RequestGuard(guard_config_from_settings())


# ---------------------------------------------------------------------------
# 运行期策略（后台管理）
# ---------------------------------------------------------------------------

POLICY_KEY = "security_policy"

POLICY_LABELS = {
    "burst_limit": "突发上限",
    "burst_window_seconds": "突发窗口",
    "sustained_limit": "持续上限",
    "sustained_window_seconds": "持续窗口",
    "max_concurrent": "单 IP 并发",
    "max_global_concurrent": "全局并发",
    "max_body_bytes": "请求体上限",
    "strike_limit": "封禁触发次数",
    "strike_window_seconds": "违规统计窗口",
    "ban_seconds": "首次封禁时长",
    "max_ban_seconds": "最长封禁时长",
}


class PolicyError(ValueError):
    """策略取值非法：API 层转成 400 并原样展示原因。"""


def default_policy() -> dict[str, Any]:
    values: dict[str, Any] = {"enabled": settings.security_enabled}
    for name in SECURITY_POLICY_BOUNDS:
        values[name] = getattr(settings, f"security_{name}")
    return values


def normalize_policy(values: Mapping[str, Any]) -> dict[str, Any]:
    enabled = values.get("enabled", True)
    if not isinstance(enabled, bool):
        raise PolicyError("启用开关必须是布尔值")
    policy: dict[str, Any] = {"enabled": enabled}
    for name, (low, high, cast) in SECURITY_POLICY_BOUNDS.items():
        raw = values.get(name)
        if raw is None or isinstance(raw, bool):
            raise PolicyError(f"{POLICY_LABELS[name]}不能为空")
        try:
            number = float(raw)
        except (TypeError, ValueError) as exc:
            raise PolicyError(f"{POLICY_LABELS[name]}必须是数字") from exc
        if cast is int and not number.is_integer():
            raise PolicyError(f"{POLICY_LABELS[name]}必须是整数")
        number = cast(number)
        if not low <= number <= high:
            raise PolicyError(f"{POLICY_LABELS[name]}需在 {low:g} 到 {high:g} 之间")
        policy[name] = number
    if policy["sustained_limit"] < policy["burst_limit"]:
        raise PolicyError("持续上限不能低于突发上限")
    if policy["max_global_concurrent"] < policy["max_concurrent"]:
        raise PolicyError("全局并发不能低于单 IP 并发")
    if policy["max_ban_seconds"] < policy["ban_seconds"]:
        raise PolicyError("最长封禁时长不能低于首次封禁时长")
    return policy


def policy_from_config(config: GuardConfig) -> dict[str, Any]:
    return {
        "enabled": config.enabled,
        "burst_limit": config.burst_limit,
        "burst_window_seconds": config.burst_window_seconds,
        "sustained_limit": config.sustained_limit,
        "sustained_window_seconds": config.sustained_window_seconds,
        "max_concurrent": config.max_concurrent,
        "max_global_concurrent": config.max_global_concurrent,
        "max_body_bytes": config.max_body_bytes,
        "strike_limit": config.strike_limit,
        "strike_window_seconds": config.strike_window_seconds,
        "ban_seconds": config.ban_seconds,
        "max_ban_seconds": config.max_ban_seconds,
    }


def config_from_policy(policy: Mapping[str, Any], base: GuardConfig) -> GuardConfig:
    """白名单 / 受信反代属于部署级配置，界面不可改，沿用当前值。"""
    return GuardConfig(
        enabled=bool(policy["enabled"]),
        allowlist=base.allowlist,
        trusted_proxies=base.trusted_proxies,
        burst_limit=int(policy["burst_limit"]),
        burst_window_seconds=float(policy["burst_window_seconds"]),
        sustained_limit=int(policy["sustained_limit"]),
        sustained_window_seconds=float(policy["sustained_window_seconds"]),
        max_concurrent=int(policy["max_concurrent"]),
        max_global_concurrent=int(policy["max_global_concurrent"]),
        max_body_bytes=int(policy["max_body_bytes"]),
        strike_limit=int(policy["strike_limit"]),
        strike_window_seconds=float(policy["strike_window_seconds"]),
        ban_seconds=float(policy["ban_seconds"]),
        max_ban_seconds=float(policy["max_ban_seconds"]),
        max_tracked_ips=base.max_tracked_ips,
    )


def load_saved_policy() -> bool:
    """启动时把数据库里的策略盖回环境默认值之上；没有或损坏则维持默认。"""
    stored = db.get_setting(POLICY_KEY)
    if not stored:
        return False
    try:
        policy = normalize_policy(json.loads(stored["value"]))
    except (PolicyError, ValueError, TypeError) as exc:
        logger.warning("security: ignoring invalid saved policy: %s", exc)
        return False
    guard.apply_config(config_from_policy(policy, guard.config))
    logger.info("security: loaded saved policy from database")
    return True


def policy_state() -> dict[str, Any]:
    stored = db.get_setting(POLICY_KEY)
    return {
        "current": policy_from_config(guard.config),
        "defaults": default_policy(),
        "bounds": {
            name: {"min": low, "max": high, "integer": cast is int}
            for name, (low, high, cast) in SECURITY_POLICY_BOUNDS.items()
        },
        "source": "runtime" if stored else "default",
        "updated_at": stored["updated_at"] if stored else None,
    }


def save_policy(values: Mapping[str, Any]) -> dict[str, Any]:
    policy = normalize_policy(values)
    db.set_setting(
        POLICY_KEY, json.dumps(policy, ensure_ascii=False, sort_keys=True)
    )
    guard.apply_config(config_from_policy(policy, guard.config))
    return policy


def reset_policy() -> dict[str, Any]:
    db.delete_setting(POLICY_KEY)
    policy = default_policy()
    guard.apply_config(config_from_policy(policy, guard.config))
    return policy


class RequestDefenseMiddleware:
    """ASGI 中间件：只处理 http，websocket 等原样放行。"""

    def __init__(
        self, app: Any, guard: RequestGuard | None = None
    ) -> None:
        self.app = app
        self.guard = guard or globals()["guard"]

    async def __call__(self, scope: Any, receive: Any, send: Any) -> None:
        guard = self.guard
        if scope["type"] != "http" or not guard.config.enabled:
            await self.app(scope, receive, send)
            return

        # 只解出限速需要的三个头，避免每个请求构造完整 Header 映射。
        headers: dict[str, str] = {}
        for key, value in scope.get("headers", []):
            name = key.lower()
            if name in (b"x-real-ip", b"x-forwarded-for", b"content-length"):
                headers[name.decode("latin-1")] = value.decode("latin-1")

        peer = scope.get("client")
        ip = guard.resolve_client_ip(peer[0] if peer else None, headers)
        raw_length = headers.get("content-length", "")
        content_length = int(raw_length) if raw_length.isdigit() else None

        decision = guard.begin(ip, content_length)
        if not decision.allowed:
            response = JSONResponse(
                {"detail": decision.detail},
                status_code=decision.status_code,
            )
            if decision.retry_after > 0 and decision.status_code in (403, 429):
                response.headers["Retry-After"] = str(
                    max(1, int(decision.retry_after))
                )
            await response(scope, receive, send)
            return

        try:
            await self.app(scope, receive, send)
        finally:
            if decision.tracked:
                guard.end(ip)
