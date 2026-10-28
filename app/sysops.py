"""系统运维实时面板的采样与查询。

与 collector 的分工：collector 每分钟采一次写库、跑告警，面向"历史趋势"；
这里是秒级的内存采样，面向"此刻"——不落库，重启即清空。

设计要点：
* 采样线程自建 CPU 基准（自己算 cpu_times 差值），不去碰 psutil 的
  `cpu_percent(interval=None)` 全局基准——那玩意是模块级状态，和 collector
  的 60s 采样同进程共用，互相污染。
* Docker 不在这里读：foxops 用户没有 docker 权限，也不该有（docker 组
  等于 root 级控制权）。容器数据由 root 探针 app/docker_probe.py 定时落盘，
  这里只读文件，见 containers()。
"""

from __future__ import annotations

import logging
import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any

import psutil

from . import docker_probe
from .settings import host_path, settings


logger = logging.getLogger("foxops.sysops")

SAMPLE_INTERVAL_SECONDS = 1.0
# 1s * 90 = 最近 90 秒，够画一张"刚刚发生了什么"的走势。
HISTORY_POINTS = 90
# 进程内缓存：探针 10s 一轮，这里再缓存 5s，避免 2s 一次的前端轮询反复读盘。
DOCKER_CACHE_SECONDS = 5.0

# 只认真实块设备上的文件系统；squashfs（snap）、proc、overlay 之类不是
# "磁盘用了多少"，混进来纯属噪音。
_VIRTUAL_FS = frozenset(
    {
        "autofs",
        "binfmt_misc",
        "bpf",
        "cgroup",
        "cgroup2",
        "configfs",
        "debugfs",
        "devpts",
        "devtmpfs",
        "efivarfs",
        "fusectl",
        "hugetlbfs",
        "mqueue",
        "nsfs",
        "overlay",
        "proc",
        "pstore",
        "ramfs",
        "rpc_pipefs",
        "securityfs",
        "selinuxfs",
        "squashfs",
        "sysfs",
        "tmpfs",
        "tracefs",
    }
)


def _display_mount(mountpoint: str) -> str:
    """容器模式下把 /host/boot 显示成 /boot：面板上面的应该是宿主机视角的挂载点。"""
    root = settings.host_root
    if root and (mountpoint == root or mountpoint.startswith(root + "/")):
        return mountpoint[len(root):] or "/"
    return mountpoint


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _cpu_load_percent(previous: Any, current: Any) -> float:
    """两次 cpu_times 之间的忙碌占比。iowait 算空闲——CPU 没干活。"""
    try:
        total_delta = sum(current) - sum(previous)
        idle_delta = (current.idle + getattr(current, "iowait", 0.0)) - (
            previous.idle + getattr(previous, "iowait", 0.0)
        )
    except (TypeError, AttributeError):
        return 0.0
    if total_delta <= 0:
        return 0.0
    busy = (total_delta - idle_delta) / total_delta * 100
    return round(max(0.0, min(100.0, busy)), 1)


class _Sampler(threading.Thread):
    def __init__(self) -> None:
        super().__init__(name="foxops-sysops", daemon=True)
        self._stop_event = threading.Event()
        self.lock = threading.Lock()
        self.snapshot: dict[str, Any] = {}
        self.history: deque[dict[str, Any]] = deque(maxlen=HISTORY_POINTS)
        self._partitions: list[Any] = []
        self._partitions_at = 0.0
        self._prev_cpu = psutil.cpu_times()
        self._prev_percpu = psutil.cpu_times(percpu=True)
        self._prev_io = psutil.disk_io_counters()
        self._prev_at = time.monotonic()

    def stop(self) -> None:
        self._stop_event.set()

    def run(self) -> None:
        # 先等一个间隔再采：首个读数必须有基准，否则恒为 0。
        while not self._stop_event.wait(SAMPLE_INTERVAL_SECONDS):
            try:
                sample = self._sample()
            except Exception:  # noqa: BLE001 - 采样线程不能因为一次性错误退出
                logger.exception("sysops sampling failed")
                continue
            with self.lock:
                self.snapshot = sample
                self.history.append(
                    {
                        "ts": sample["ts"],
                        "cpu": sample["cpu"]["percent"],
                        "memory": sample["memory"]["percent"],
                        "disk": sample["disk_percent"],
                    }
                )

    def _disk_list(self) -> list[Any]:
        now = time.monotonic()
        if self._partitions and now - self._partitions_at < 30:
            return self._partitions
        candidates: list[Any] = []
        host_root = settings.host_root
        try:
            for part in psutil.disk_partitions(all=False):
                if (part.fstype or "").lower() in _VIRTUAL_FS:
                    continue
                # 容器模式：只认 FOXOPS_HOST_ROOT 下的宿主机分区，
                # 容器自己的 /etc/hosts 之类 bind mount 不上面板。
                if host_root and not (
                    part.mountpoint == host_root
                    or part.mountpoint.startswith(host_root + "/")
                ):
                    continue
                candidates.append(part)
        except OSError as exc:
            logger.warning("disk partition scan failed: %s", exc)
        # 线上只认真实块设备；一个都挑不出来（容器 / 开发机）时退回全量，
        # 否则面板上永远是空的。
        block_devices = [part for part in candidates if part.device.startswith("/dev/")]
        self._partitions = block_devices or candidates
        self._partitions_at = now
        return self._partitions

    def _sample(self) -> dict[str, Any]:
        started_at = time.monotonic()
        elapsed = max(started_at - self._prev_at, 1e-6)

        cpu_times = psutil.cpu_times()
        percpu_times = psutil.cpu_times(percpu=True)
        cpu_percent = _cpu_load_percent(self._prev_cpu, cpu_times)
        per_core = [
            _cpu_load_percent(before, after)
            for before, after in zip(self._prev_percpu, percpu_times)
        ]
        self._prev_cpu = cpu_times
        self._prev_percpu = percpu_times

        io_counters = psutil.disk_io_counters()
        read_bps = write_bps = 0
        if io_counters is not None and self._prev_io is not None:
            read_bps = max(0, int((io_counters.read_bytes - self._prev_io.read_bytes) / elapsed))
            write_bps = max(0, int((io_counters.write_bytes - self._prev_io.write_bytes) / elapsed))
        self._prev_io = io_counters
        self._prev_at = started_at

        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()

        disks: list[dict[str, Any]] = []
        for part in self._disk_list():
            try:
                usage = psutil.disk_usage(host_path(part.mountpoint))
            except OSError:
                continue
            disks.append(
                {
                    "mount": _display_mount(part.mountpoint),
                    "device": part.device,
                    "fstype": part.fstype,
                    "total": usage.total,
                    "used": usage.used,
                    "free": usage.free,
                    "percent": round(usage.percent, 1),
                }
            )
        # systemd 的 ProtectSystem=strict / ReadWritePaths / PrivateTmp 会给服务
        # 进程额外造出一串 bind mount（/tmp、/var/tmp、/var/lib/foxops 都指向
        # 同一块 dev），全列出来就是同一块盘刷四五遍。按设备去重，"/" 优先。
        unique_disks: dict[str, dict[str, Any]] = {}
        for disk in disks:
            existing = unique_disks.get(disk["device"])
            if existing is None or disk["mount"] == "/":
                unique_disks[disk["device"]] = disk
        # "/" 永远排第一，其余按挂载点字典序，面板不会每次刷新跳位置。
        disks = sorted(
            unique_disks.values(),
            key=lambda item: (item["mount"] != "/", item["mount"]),
        )

        try:
            load = psutil.getloadavg()
        except (AttributeError, OSError):
            load = (0.0, 0.0, 0.0)
        frequency = psutil.cpu_freq()
        # 没有 "/" 就退到第一个分区（容器 / 非 Linux 环境），别让大盘显示 0%。
        root_usage = next(
            (item for item in disks if item["mount"] == "/"),
            disks[0] if disks else None,
        )

        return {
            "ts": _iso_now(),
            "uptime_seconds": max(0, int(time.time() - psutil.boot_time())),
            "cpu": {
                "percent": cpu_percent,
                "per_core": per_core,
                "count": psutil.cpu_count() or len(per_core),
                "physical": psutil.cpu_count(logical=False) or len(per_core),
                "frequency_mhz": round(frequency.current) if frequency else None,
                "load": [round(value, 2) for value in load],
            },
            "memory": {
                "total": memory.total,
                "used": memory.used,
                "available": memory.available,
                "percent": round(memory.percent, 1),
                "cached": int(getattr(memory, "cached", 0) or 0),
                "buffers": int(getattr(memory, "buffers", 0) or 0),
                "swap_total": swap.total,
                "swap_used": swap.used,
                "swap_percent": round(swap.percent, 1),
            },
            "disk_percent": root_usage["percent"] if root_usage else 0.0,
            "disks": disks,
            "disk_io": {
                "read_bps": read_bps,
                "write_bps": write_bps,
            },
        }


_sampler = _Sampler()


def start() -> None:
    if _sampler.is_alive():
        return
    _sampler.start()
    logger.info("sysops sampler started (%.0fs interval)", SAMPLE_INTERVAL_SECONDS)


def stop() -> None:
    _sampler.stop()


def realtime() -> dict[str, Any]:
    """当前快照 + 最近 90s 序列。未采到第一点时 ready=False。"""
    with _sampler.lock:
        snapshot = dict(_sampler.snapshot)
        series = list(_sampler.history)
    if not snapshot:
        return {
            "ready": False,
            "series": [],
            "interval_seconds": SAMPLE_INTERVAL_SECONDS,
        }
    snapshot["ready"] = True
    snapshot["series"] = series
    snapshot["interval_seconds"] = SAMPLE_INTERVAL_SECONDS
    return snapshot


# ---------------------------------------------------------------------------
# Docker：读 root 探针的落盘结果（见 app/docker_probe.py）
# ---------------------------------------------------------------------------

_docker_lock = threading.Lock()
_docker_cache: dict[str, Any] = {"at": 0.0, "payload": None}


def containers() -> dict[str, Any]:
    """容器清单。

    首选 root 探针落的 /var/lib/foxops/docker.json —— foxops 用户没有
    docker 权限，也不该有（见 app/docker_probe.py 的说明）。探针缺席或未
    部署（开发机）时，退化为自己直连跑一次 docker CLI。
    """
    with _docker_lock:
        cached = _docker_cache["payload"]
        if cached is not None and time.monotonic() - _docker_cache["at"] < DOCKER_CACHE_SECONDS:
            return cached
        payload = docker_probe.read_snapshot()
        if payload is None:
            direct = docker_probe.collect()
            stale = docker_probe.read_snapshot(None)
            if stale is not None:
                # 探针停了但文件还在：旧数据比空面板有用，但要标出来。
                payload = {**stale, "stale": True}
                if not payload.get("available"):
                    payload["reason"] = "root 探针数据已过期，检查 systemctl status foxops-docker.timer"
            else:
                payload = direct
        _docker_cache["at"] = time.monotonic()
        _docker_cache["payload"] = payload
        return payload
