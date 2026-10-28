from __future__ import annotations

import ipaddress
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


_SERVICE_NAME = re.compile(r"^[A-Za-z0-9_.@-]+$")

# 本机回环永远不参与限速：systemd / docker 的健康检查、Nginx 的内部探活都从这里来。
# 真实客户端 IP 由 Nginx 通过 X-Real-IP 传进来，不会因此被"顺带"放行。
_DEFAULT_SECURITY_ALLOWLIST = ("127.0.0.1/32", "::1/128")
# 受信反代：回环 + 私有网段（容器网络、内网反代）。只有这些来源的
# X-Real-IP / X-Forwarded-For 才被采信，否则客户端可以伪造 IP 绕过限速。
_DEFAULT_TRUSTED_PROXIES = (
    "127.0.0.0/8",
    "::1/128",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
)

# 「后台管理」里可以在线调整的限流参数：字段名 -> (下限, 上限, 类型)。
# 环境变量校验（Settings.validate）与界面提交校验（app/defense.py）共用这份
# 边界，避免两处各写一套数字后漂移。
SECURITY_POLICY_BOUNDS: dict[str, tuple[float, float, type]] = {
    "burst_limit": (5, 100_000, int),
    "burst_window_seconds": (1, 3600, float),
    "sustained_limit": (5, 1_000_000, int),
    "sustained_window_seconds": (1, 86_400, float),
    "max_concurrent": (1, 10_000, int),
    "max_global_concurrent": (1, 100_000, int),
    "max_body_bytes": (1024, 10_485_760, int),
    "strike_limit": (1, 1_000, int),
    "strike_window_seconds": (1, 86_400, float),
    "ban_seconds": (1, 31_536_000, float),
    "max_ban_seconds": (1, 31_536_000, float),
}


def _env_number(name: str, default: int | float, cast: type) -> int | float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return cast(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a number") from exc


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    value = raw.strip().lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    raise RuntimeError(f"{name} must be 0 or 1")


def _networks(name: str, default: tuple[str, ...]) -> tuple[Any, ...]:
    """逗号分隔的 CIDR / IP 列表；留空时用默认值。"""
    raw = os.getenv(name, "").strip()
    values = tuple(item.strip() for item in raw.split(",") if item.strip()) or default
    networks: list[Any] = []
    for value in values:
        try:
            networks.append(ipaddress.ip_network(value, strict=False))
        except ValueError as exc:
            raise RuntimeError(f"{name} contains an invalid network: {value}") from exc
    return tuple(networks)


def _services() -> tuple[str, ...]:
    """管理员显式关注的服务（FOXOPS_SERVICES）。

    面板列表由 collector 自动扫描 systemd 得出，这份名单是补充语义：
    名字永远出现在列表里（即便已卸载也只是被标记成 not-found 后隐藏），
    且只有这里的名字可重启 —— polkit 规则按这份名单渲染。
    """
    values = tuple(
        item.strip()
        for item in os.getenv("FOXOPS_SERVICES", "nginx").split(",")
        if item.strip()
    )
    if not values or any(not _SERVICE_NAME.fullmatch(item) for item in values):
        raise RuntimeError("FOXOPS_SERVICES contains an invalid systemd unit name")
    return values


# 系统自带、跟业务无关的杂项服务：列进面板只会稀释注意力。
# 想看哪个，把它从 FOXOPS_SERVICE_IGNORE 的"减项"里去掉不现实 —— 直接写进
# FOXOPS_SERVICES 即可，白名单优先级最高。
_DEFAULT_IGNORED_SERVICES = frozenset(
    {
        "acpid",
        "auditd",
        "gssproxy",
        "iscsi",
        "iscsid",
        "iscsi-onboot",
        "iscsi-shutdown",
        "iscsiuio",
        "kdump",
        "microcode",
        "NetworkManager-dispatcher",
        "NetworkManager-wait-online",
        "nis-domainname",
        "nv_gpu_shutdown_pm",
        "polkit",
        "qemu-guest-agent",
        "rc-local",
        "rpcbind",
        "rpc-statd",
        "rpc-statd-notify",
        "selinux-autorelabel-mark",
        "sssd",
        "tuned",
    }
)


def _ignored_services() -> frozenset[str]:
    """默认杂项名单 ∪ FOXOPS_SERVICE_IGNORE 里管理员追加的名字。

    这是"少看什么"的黑名单，比"多看什么"的白名单好维护：新装的业务服务
    自动出现，系统杂项一次拉黑长期有效。
    """
    extra = {
        item.strip()
        for item in os.getenv("FOXOPS_SERVICE_IGNORE", "").split(",")
        if item.strip()
    }
    if any(not _SERVICE_NAME.fullmatch(item) for item in extra):
        raise RuntimeError("FOXOPS_SERVICE_IGNORE contains an invalid systemd unit name")
    return _DEFAULT_IGNORED_SERVICES | extra


def _service_labels() -> dict[str, str]:
    """`FOXOPS_SERVICE_LABELS='nginx:FoxOps 面板 / Zabbix Web,php-fpm:Zabbix Web'`

    自动识别（连接推导）给不出语义时的人肉补充：写在服务器配置里，不进代码。
    """
    labels: dict[str, str] = {}
    raw = os.getenv("FOXOPS_SERVICE_LABELS", "").strip()
    if not raw:
        return labels
    for entry in raw.split(","):
        name, _, label = entry.partition(":")
        name = name.strip()
        label = label.strip()
        if not name or not label:
            continue
        if not _SERVICE_NAME.fullmatch(name):
            raise RuntimeError(
                "FOXOPS_SERVICE_LABELS contains an invalid systemd unit name"
            )
        labels[name] = label
    return labels


def _optional_path(name: str) -> str:
    """可选路径型配置：留空表示原生部署；一旦设置必须是容器内的绝对路径。

    只认 POSIX 风格（容器里永远是 / 开头），不用 Path.is_absolute()——
    后者在 Windows 开发机上会把 /host/proc 判成相对路径。
    """
    raw = os.getenv(name, "").strip()
    if raw and (not raw.startswith("/") or any(ch.isspace() for ch in raw)):
        raise RuntimeError(f"{name} must be an absolute path")
    return raw.rstrip("/")


@dataclass(frozen=True)
class Settings:
    database_path: Path = Path(
        os.getenv("FOXOPS_DB_PATH", "/var/lib/foxops/foxops.db")
    )
    backup_dir: Path = Path(
        os.getenv("FOXOPS_BACKUP_DIR", "/var/lib/foxops/backups")
    )
    cloud_provider: str = os.getenv("FOXOPS_CLOUD_PROVIDER", "云服务器")
    systemctl_path: str = os.getenv(
        "FOXOPS_SYSTEMCTL_PATH", "/usr/bin/systemctl"
    )
    services: tuple[str, ...] = _services()
    ignored_services: frozenset[str] = field(default_factory=_ignored_services)
    service_labels: dict[str, str] = field(default_factory=_service_labels)
    collect_interval_seconds: int = _env_number("FOXOPS_COLLECT_INTERVAL", 60, int)
    retention_days: int = _env_number("FOXOPS_RETENTION_DAYS", 7, int)
    alert_cooldown_minutes: int = _env_number("FOXOPS_ALERT_COOLDOWN_MINUTES", 15, int)
    cpu_threshold: float = _env_number("FOXOPS_CPU_THRESHOLD", 85.0, float)
    memory_threshold: float = _env_number("FOXOPS_MEMORY_THRESHOLD", 85.0, float)
    disk_threshold: float = _env_number("FOXOPS_DISK_THRESHOLD", 80.0, float)
    weather_cache_seconds: int = _env_number("FOXOPS_WEATHER_CACHE_SECONDS", 1800, int)
    weather_request_timeout_seconds: int = _env_number(
        "FOXOPS_WEATHER_REQUEST_TIMEOUT_SECONDS", 8, int
    )
    # ---- 请求级 DDoS 防护（app/defense.py）----
    # 默认值按"单机小面板 + 浏览器一次加载十几个请求"标定：正常使用远远够用，
    # 而单 IP 每秒 6 次的突发会立刻被掐断。
    security_enabled: bool = _env_bool("FOXOPS_SECURITY_ENABLED", True)
    security_allowlist: tuple[Any, ...] = field(
        default_factory=lambda: _networks(
            "FOXOPS_SECURITY_ALLOWLIST", _DEFAULT_SECURITY_ALLOWLIST
        )
    )
    security_trusted_proxies: tuple[Any, ...] = field(
        default_factory=lambda: _networks(
            "FOXOPS_SECURITY_TRUSTED_PROXIES", _DEFAULT_TRUSTED_PROXIES
        )
    )
    security_burst_limit: int = _env_number("FOXOPS_SECURITY_BURST_LIMIT", 60, int)
    security_burst_window_seconds: float = _env_number(
        "FOXOPS_SECURITY_BURST_WINDOW_SECONDS", 10, float
    )
    security_sustained_limit: int = _env_number(
        "FOXOPS_SECURITY_SUSTAINED_LIMIT", 300, int
    )
    security_sustained_window_seconds: float = _env_number(
        "FOXOPS_SECURITY_SUSTAINED_WINDOW_SECONDS", 60, float
    )
    security_max_concurrent: int = _env_number(
        "FOXOPS_SECURITY_MAX_CONCURRENT", 24, int
    )
    security_max_global_concurrent: int = _env_number(
        "FOXOPS_SECURITY_MAX_GLOBAL_CONCURRENT", 200, int
    )
    security_max_body_bytes: int = _env_number(
        "FOXOPS_SECURITY_MAX_BODY_BYTES", 1_048_576, int
    )
    security_strike_limit: int = _env_number("FOXOPS_SECURITY_STRIKE_LIMIT", 3, int)
    security_strike_window_seconds: float = _env_number(
        "FOXOPS_SECURITY_STRIKE_WINDOW_SECONDS", 300, float
    )
    security_ban_seconds: float = _env_number("FOXOPS_SECURITY_BAN_SECONDS", 600, float)
    security_max_ban_seconds: float = _env_number(
        "FOXOPS_SECURITY_MAX_BAN_SECONDS", 86_400, float
    )
    security_max_tracked_ips: int = _env_number(
        "FOXOPS_SECURITY_MAX_TRACKED_IPS", 4_096, int
    )
    # 容器部署专用：psutil 改读宿主机 proc / 宿主机根目录的挂载点前缀。
    # 原生部署留空，行为与以前完全一致。
    procs_path: str = _optional_path("FOXOPS_PROCFS_PATH")
    host_root: str = _optional_path("FOXOPS_HOST_ROOT")

    def validate(self) -> None:
        if self.collect_interval_seconds < 15:
            raise RuntimeError("FOXOPS_COLLECT_INTERVAL must be at least 15 seconds")
        if self.retention_days < 1:
            raise RuntimeError("FOXOPS_RETENTION_DAYS must be positive")
        if self.weather_cache_seconds < 300:
            raise RuntimeError("FOXOPS_WEATHER_CACHE_SECONDS must be at least 300")
        if not 2 <= self.weather_request_timeout_seconds <= 30:
            raise RuntimeError(
                "FOXOPS_WEATHER_REQUEST_TIMEOUT_SECONDS must be between 2 and 30"
            )
        for name, (low, high, _cast) in SECURITY_POLICY_BOUNDS.items():
            value = getattr(self, f"security_{name}")
            if not low <= value <= high:
                raise RuntimeError(
                    f"FOXOPS_SECURITY_{name.upper()} must be between {low:g} and {high:g}"
                )
        if self.security_sustained_limit < self.security_burst_limit:
            raise RuntimeError(
                "FOXOPS_SECURITY_SUSTAINED_LIMIT must not be lower than the burst limit"
            )
        if self.security_max_global_concurrent < self.security_max_concurrent:
            raise RuntimeError(
                "FOXOPS_SECURITY_MAX_GLOBAL_CONCURRENT must not be lower than the per-IP limit"
            )
        if self.security_max_ban_seconds < self.security_ban_seconds:
            raise RuntimeError(
                "FOXOPS_SECURITY_MAX_BAN_SECONDS must not be lower than FOXOPS_SECURITY_BAN_SECONDS"
            )
        if self.security_max_tracked_ips < 64:
            raise RuntimeError("FOXOPS_SECURITY_MAX_TRACKED_IPS must be at least 64")
        for name, value in (
            ("FOXOPS_SYSTEMCTL_PATH", self.systemctl_path),
        ):
            if not Path(value).is_absolute() or any(char.isspace() for char in value):
                raise RuntimeError(f"{name} must be an absolute command path")


settings = Settings()


def host_path(path: str) -> str:
    """把宿主机挂载点映射成容器内可见的路径。

    容器部署时宿主机根挂在 FOXOPS_HOST_ROOT（如 /host），而 psutil 读的仍是宿主机
    的挂载表，磁盘用量得换算成容器里真实存在的路径才量得到；原生部署时原样返回。
    """
    root = settings.host_root
    if not root or not path.startswith("/"):
        return path
    if path == root or path.startswith(root + "/"):
        # 磁盘挂载点本身就挂在 FOXOPS_HOST_ROOT 下（/host/boot 之类），不能再加一层
        return path
    return root if path == "/" else root + path
