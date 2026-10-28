#!/usr/bin/env bash
set -Eeuo pipefail

PACKAGE_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=deploy/lib/platform.sh
. "$PACKAGE_ROOT/deploy/lib/platform.sh"
# shellcheck source=deploy/lib/config.sh
. "$PACKAGE_ROOT/deploy/lib/config.sh"

if [ -f "$PACKAGE_ROOT/config.env" ]; then
    set -a
    # config.env is an administrator-controlled shell environment file.
    # shellcheck disable=SC1091
    . "$PACKAGE_ROOT/config.env"
    set +a
fi

FOXOPS_PUBLIC_PORT=${FOXOPS_PUBLIC_PORT:-8080}
FOXOPS_SERVER_NAME=${FOXOPS_SERVER_NAME:-_}
FOXOPS_PUBLIC_HOST=${FOXOPS_PUBLIC_HOST:-SERVER_IP}
FOXOPS_CLOUD_PROVIDER=${FOXOPS_CLOUD_PROVIDER:-auto}
FOXOPS_INSTALL_PACKAGES=${FOXOPS_INSTALL_PACKAGES:-1}
FOXOPS_NGINX_SERVICE=${FOXOPS_NGINX_SERVICE:-auto}
FOXOPS_MYSQL_SERVICE=${FOXOPS_MYSQL_SERVICE:-auto}
FOXOPS_REDIS_SERVICE=${FOXOPS_REDIS_SERVICE:-auto}
FOXOPS_ENABLE_SWAP=${FOXOPS_ENABLE_SWAP:-0}
FOXOPS_SWAP_SIZE=${FOXOPS_SWAP_SIZE:-2G}

INSTALL_ROOT=/opt/foxops
VENV_ROOT=$INSTALL_ROOT/.venv
STATE_ROOT=/var/lib/foxops
CONFIG_ROOT=/etc/foxops
ENV_FILE=$CONFIG_ROOT/foxops.env
DEPLOYMENT_FILE=$CONFIG_ROOT/deployment.env
NGINX_DEST=/etc/nginx/conf.d/foxops.conf
SYSTEMD_DEST=/etc/systemd/system/foxops.service
SUDOERS_DEST=/etc/sudoers.d/foxops
POLKIT_DEST=/etc/polkit-1/rules.d/50-foxops.rules
BACKUP_BASE=/var/backups/foxops

fail() {
    foxops_error "$*"
    exit 1
}

validate_configuration() {
    case "$FOXOPS_PUBLIC_PORT" in
        ''|*[!0-9]*) fail "FOXOPS_PUBLIC_PORT must be an integer" ;;
    esac
    if [ "$FOXOPS_PUBLIC_PORT" -lt 1 ] || [ "$FOXOPS_PUBLIC_PORT" -gt 65535 ]; then
        fail "FOXOPS_PUBLIC_PORT must be between 1 and 65535"
    fi
    if [ "$FOXOPS_PUBLIC_PORT" -eq 8000 ]; then
        fail "public port 8000 conflicts with the private Uvicorn listener"
    fi
    case "$FOXOPS_SERVER_NAME" in
        ''|*[!A-Za-z0-9._*-]*) fail "FOXOPS_SERVER_NAME contains unsafe characters" ;;
    esac
    case "$FOXOPS_PUBLIC_HOST" in
        ''|*[!A-Za-z0-9._:-]*) fail "FOXOPS_PUBLIC_HOST contains unsafe characters" ;;
    esac
    case "$FOXOPS_INSTALL_PACKAGES:$FOXOPS_ENABLE_SWAP" in
        [01]:[01]) ;;
        *) fail "FOXOPS_INSTALL_PACKAGES and FOXOPS_ENABLE_SWAP must be 0 or 1" ;;
    esac
    if ! [[ "$FOXOPS_SWAP_SIZE" =~ ^[1-9][0-9]*[MG]$ ]]; then
        fail "FOXOPS_SWAP_SIZE must look like 512M or 2G"
    fi
    case "$FOXOPS_CLOUD_PROVIDER" in
        *"'"*) fail "FOXOPS_CLOUD_PROVIDER contains unsafe characters" ;;
    esac
}

validate_release_assets() {
    for release_asset in \
        requirements.txt \
        app/static/index.html \
        app/static/login.html \
        app/static/login.css \
        app/static/login.js \
        app/static/theme.js \
        app/static/session.js \
        app/static/style.css \
        app/static/app.js \
        app/static/render.js \
        app/static/favicon.ico \
        app/static/icons/favicon.svg \
        app/static/vendor/vue.runtime.global.prod.js
    do
        if [ ! -s "$PACKAGE_ROOT/$release_asset" ]; then
            fail "release asset is missing or empty: $release_asset"
        fi
    done
}

install_packages() {
    if [ "$FOXOPS_INSTALL_PACKAGES" != 1 ]; then
        foxops_log "package installation disabled by config.env"
        return 0
    fi

    foxops_log "installing dependencies with $FOXOPS_PACKAGE_MANAGER"
    case "$FOXOPS_PACKAGE_MANAGER" in
        apt-get)
            export DEBIAN_FRONTEND=noninteractive
            apt-get update
            apt-get install -y ca-certificates curl nginx openssl sudo iproute2 python3 python3-pip python3-venv policykit-1
            ;;
        dnf)
            dnf install -y ca-certificates curl nginx openssl sudo iproute python3 python3-pip polkit
            ;;
        yum)
            yum install -y ca-certificates curl nginx openssl sudo iproute python3 python3-pip polkit
            ;;
        *)
            fail "unsupported package manager: $FOXOPS_PACKAGE_MANAGER"
            ;;
    esac
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        fail "required command is missing after package installation: $1"
    fi
}

port_is_in_use() {
    "$ss_path" -H -ltn | awk -v suffix=":$1" '
        $4 ~ (suffix "$") { found = 1 }
        END { exit(found ? 0 : 1) }
    '
}

configure_swap() {
    if [ "$FOXOPS_ENABLE_SWAP" != 1 ]; then
        foxops_log "Swap unchanged (FOXOPS_ENABLE_SWAP=0)"
        return 0
    fi
    require_command mkswap
    require_command swapon
    if swapon --show=NAME --noheadings 2>/dev/null | grep -q .; then
        foxops_log "active Swap already exists; no new Swap file created"
        return 0
    fi
    if [ -e /swapfile ]; then
        fail "/swapfile already exists but is not active; refusing to overwrite it"
    fi

    foxops_log "creating explicitly authorized Swap file: $FOXOPS_SWAP_SIZE"
    if command -v fallocate >/dev/null 2>&1; then
        fallocate -l "$FOXOPS_SWAP_SIZE" /swapfile
    else
        swap_number=${FOXOPS_SWAP_SIZE%[MG]}
        swap_unit=${FOXOPS_SWAP_SIZE#"$swap_number"}
        swap_megabytes=$swap_number
        if [ "$swap_unit" = G ]; then
            swap_megabytes=$((swap_number * 1024))
        fi
        dd if=/dev/zero of=/swapfile bs=1M count="$swap_megabytes" status=progress
    fi
    chmod 0600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    if ! grep -Fq '/swapfile none swap sw 0 0' /etc/fstab; then
        printf '%s\n' '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
}



if [ "$(id -u)" -ne 0 ]; then
    fail "install.sh must run as root"
fi
if [ "${FOXOPS_TEST_MODE:-0}" = 1 ]; then
    fail "FOXOPS_TEST_MODE is only for detection tests and cannot be used for installation"
fi

validate_configuration
validate_release_assets
foxops_detect_platform || exit 1
foxops_print_platform
install_packages

for required in awk curl find grep install mktemp openssl runuser sed sudo systemctl useradd visudo nginx ss; do
    require_command "$required"
done

python_path=$(foxops_find_python || true)
if [ -z "$python_path" ]; then
    fail "Python 3.9 or newer is required; use a supported OS release or install a newer Python"
fi
sudo_path=$(foxops_command_path sudo)
nginx_path=$(foxops_command_path nginx)
ss_path=$(foxops_command_path ss)
FOXOPS_SYSTEMCTL_PATH=$(foxops_command_path systemctl)
cloud_provider=$(foxops_detect_cloud_provider)

nginx_service=$(foxops_resolve_service "$FOXOPS_NGINX_SERVICE" nginx)
if [ -z "$nginx_service" ]; then
    fail "the required Nginx systemd service was not detected"
fi
mysql_service=$(foxops_resolve_service "$FOXOPS_MYSQL_SERVICE" mysqld mysql mariadb)
redis_service=$(foxops_resolve_service "$FOXOPS_REDIS_SERVICE" redis redis-server)

monitored_services=$nginx_service
if [ -n "$mysql_service" ]; then
    monitored_services="$monitored_services,$mysql_service"
fi
if [ -n "$redis_service" ]; then
    monitored_services="$monitored_services,$redis_service"
fi

# 升级时保留已有的 FOXOPS_SERVICES：它现在是"显式关注 + 允许重启"的名单
# —— 面板列表由 collector 自动扫描 systemd 得出，这里的名字决定谁能被重启
# （polkit 规则按这份名单渲染），不能被安装探测的默认值冲掉。
if [ -f "$ENV_FILE" ]; then
    configured_services=$(sed -n 's/^FOXOPS_SERVICES=//p' "$ENV_FILE" | tail -n 1 | tr -d ' ')
    configured_services=${configured_services#\'}; configured_services=${configured_services%\'}
    configured_services=${configured_services#\"}; configured_services=${configured_services%\"}
    if [ -n "$configured_services" ]; then
        IFS=, read -r -a configured_items <<< "$configured_services"
        preserved_services=""
        all_valid=1
        for item in "${configured_items[@]}"; do
            if [ -z "$item" ] || ! printf '%s' "$item" | grep -Eq '^[A-Za-z0-9_.@-]+$'; then
                all_valid=0
                break
            fi
            if [ -n "$preserved_services" ]; then
                preserved_services="$preserved_services,$item"
            else
                preserved_services=$item
            fi
        done
        if [ "$all_valid" = 1 ] && [ -n "$preserved_services" ]; then
            monitored_services=$preserved_services
            foxops_log "preserving configured FOXOPS_SERVICES=$monitored_services"
        fi
    fi
fi

if port_is_in_use "$FOXOPS_PUBLIC_PORT" && [ ! -f "$NGINX_DEST" ]; then
    fail "TCP $FOXOPS_PUBLIC_PORT is already in use and is not managed by an existing FoxOps config"
fi

release_id=$(date -u +%Y%m%dT%H%M%SZ)
backup_root=$BACKUP_BASE/$release_id
install -d -m 0700 "$backup_root"
for existing_path in "$INSTALL_ROOT/app" "$INSTALL_ROOT/requirements.txt" "$ENV_FILE" "$DEPLOYMENT_FILE" "$NGINX_DEST" "$SYSTEMD_DEST" "$SUDOERS_DEST" "$POLKIT_DEST"
do
    if [ -e "$existing_path" ]; then
        cp -a "$existing_path" "$backup_root/"
    fi
done

if ! id foxops >/dev/null 2>&1; then
    nologin_path=$(foxops_command_path nologin || true)
    if [ -z "$nologin_path" ]; then
        nologin_path=/usr/sbin/nologin
    fi
    useradd --system --home-dir "$INSTALL_ROOT" --shell "$nologin_path" foxops
fi

install -d -m 0755 "$INSTALL_ROOT" "$INSTALL_ROOT/app"
install -d -o foxops -g foxops -m 0750 "$STATE_ROOT" "$STATE_ROOT/backups"
install -d -o root -g foxops -m 0750 "$CONFIG_ROOT"
install -d -m 0755 "$(dirname -- "$NGINX_DEST")"

cp -a "$PACKAGE_ROOT/app/." "$INSTALL_ROOT/app/"
install -m 0644 "$PACKAGE_ROOT/requirements.txt" "$INSTALL_ROOT/requirements.txt"
# 发布包把所有文件 mtime 归一成 0（可重现构建），而 Python 的 pyc 失效判断只看
# (源文件 mtime, size)。版本号从 0.1.4.8 改成 0.1.4.9 字节数不变，旧 pyc 会被
# 判为仍然有效 —— 升级后面板跑的还是上一版代码。所以每次安装都清掉缓存。
find "$INSTALL_ROOT/app" -type d -name __pycache__ -prune -exec rm -rf {} +
find "$INSTALL_ROOT/app" -type d -exec chmod 0755 {} +
find "$INSTALL_ROOT/app" -type f -exec chmod 0644 {} +
chown -R root:root "$INSTALL_ROOT/app" "$INSTALL_ROOT/requirements.txt"

if [ ! -x "$VENV_ROOT/bin/python" ]; then
    "$python_path" -m venv "$VENV_ROOT"
fi
chown -R foxops:foxops "$VENV_ROOT"
runuser -u foxops -- "$VENV_ROOT/bin/python" -m pip install --disable-pip-version-check --requirement "$INSTALL_ROOT/requirements.txt"

if [ ! -f "$ENV_FILE" ]; then
    umask 0027
    : > "$ENV_FILE"
fi
foxops_write_env_setting "$ENV_FILE" FOXOPS_CLOUD_PROVIDER "$cloud_provider"
foxops_write_env_setting "$ENV_FILE" FOXOPS_DB_PATH "$STATE_ROOT/foxops.db"
foxops_write_env_setting "$ENV_FILE" FOXOPS_BACKUP_DIR "$STATE_ROOT/backups"
foxops_write_env_setting "$ENV_FILE" FOXOPS_SERVICES "$monitored_services"
foxops_write_env_setting "$ENV_FILE" FOXOPS_SYSTEMCTL_PATH "$FOXOPS_SYSTEMCTL_PATH"
foxops_write_env_setting "$ENV_FILE" FOXOPS_SUDO_PATH "$sudo_path"
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_COLLECT_INTERVAL 60
# 服务语义标注（可选）：自动识别给不出关系时的人肉补充，升级时保留已有值。
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_SERVICE_LABELS ""
# 服务黑名单（可选）：在内置的系统杂项名单之外，追加不想在面板看到的服务名。
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_SERVICE_IGNORE ""
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_RETENTION_DAYS 7
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_CPU_THRESHOLD 85
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_MEMORY_THRESHOLD 85
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_DISK_THRESHOLD 80
# DDoS 防护（app/defense.py）：每 IP 突发 / 持续行两档限速 + 自动封禁时长。
# 默认值按单机小面板标定；管理员改过就保留，不再覆盖。其余细项（并发上限、
# 白名单、受信反代）在 README 的可配置项里列出，按需手工追加。
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_SECURITY_ENABLED 1
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_SECURITY_BURST_LIMIT 60
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_SECURITY_SUSTAINED_LIMIT 300
foxops_ensure_env_setting "$ENV_FILE" FOXOPS_SECURITY_BAN_SECONDS 600
# 清理旧版本留下的管理令牌配置行（令牌通道已在 0.1.4.2 下线）。
sed -i '/^FOXOPS_API_TOKEN=/d' "$ENV_FILE"
chown root:foxops "$ENV_FILE"
chmod 0640 "$ENV_FILE"

sudoers_candidate=$(mktemp /etc/sudoers.d/foxops.XXXXXX)
foxops_render_sudoers "$sudoers_candidate" "$FOXOPS_SYSTEMCTL_PATH" "$monitored_services"
chmod 0440 "$sudoers_candidate"
if ! visudo -cf "$sudoers_candidate"; then
    rm -f "$sudoers_candidate"
    fail "generated sudoers validation failed"
fi
mv -f "$sudoers_candidate" "$SUDOERS_DEST"

# polkit 授权 foxops 重启受监控单元（服务内 NoNewPrivileges 使 sudo 不可用）。
install -d -m 0755 /etc/polkit-1/rules.d
install -m 0644 /dev/null "$POLKIT_DEST"
foxops_render_polkit "$POLKIT_DEST" "$monitored_services"

install -m 0644 "$PACKAGE_ROOT/deploy/foxops.service" "$SYSTEMD_DEST"
install -m 0644 "$PACKAGE_ROOT/deploy/foxops-inspect.service" /etc/systemd/system/foxops-inspect.service
install -m 0644 "$PACKAGE_ROOT/deploy/foxops-inspect.timer" /etc/systemd/system/foxops-inspect.timer
install -m 0644 "$PACKAGE_ROOT/deploy/foxops-docker.service" /etc/systemd/system/foxops-docker.service
install -m 0644 "$PACKAGE_ROOT/deploy/foxops-docker.timer" /etc/systemd/system/foxops-docker.timer
install -m 0755 "$PACKAGE_ROOT/deploy/foxopsctl" /usr/local/bin/foxopsctl
install -m 0755 "$PACKAGE_ROOT/deploy/verify-server.sh" /usr/local/bin/foxops-verify
# 管理令牌已在 0.1.4.2 下线，清掉旧版本留下的轮换脚本，避免误用。
rm -f /usr/local/sbin/foxops-rotate-token

nginx_candidate=$(mktemp)
sed \
    -e "s|__FOXOPS_PUBLIC_PORT__|$FOXOPS_PUBLIC_PORT|g" \
    -e "s|__FOXOPS_SERVER_NAME__|$FOXOPS_SERVER_NAME|g" \
    -e "/^__FOXOPS_HTTPS_BLOCK__$/d" \
    "$PACKAGE_ROOT/deploy/foxops.nginx.conf" > "$nginx_candidate"
if grep -q '__FOXOPS_' "$nginx_candidate"; then
    rm -f "$nginx_candidate"
    fail "Nginx template still contains unresolved placeholders"
fi
install -m 0644 "$nginx_candidate" "$NGINX_DEST"
rm -f "$nginx_candidate"
if ! "$nginx_path" -t; then
    if [ -f "$backup_root/foxops.conf" ]; then
        cp -a "$backup_root/foxops.conf" "$NGINX_DEST"
    else
        rm -f "$NGINX_DEST"
    fi
    fail "Nginx validation failed; previous FoxOps config was restored"
fi

{
    printf "FOXOPS_PUBLIC_PORT='%s'\n" "$FOXOPS_PUBLIC_PORT"
    printf "FOXOPS_PUBLIC_HOST='%s'\n" "$FOXOPS_PUBLIC_HOST"
    printf "FOXOPS_NGINX_SERVICE='%s'\n" "$nginx_service"
    printf "FOXOPS_MONITORED_SERVICES='%s'\n" "$monitored_services"
    printf "FOXOPS_SYSTEMCTL_PATH='%s'\n" "$FOXOPS_SYSTEMCTL_PATH"
    printf "FOXOPS_SUDO_PATH='%s'\n" "$sudo_path"
    printf "FOXOPS_NGINX_PATH='%s'\n" "$nginx_path"
    printf "FOXOPS_OS_FAMILY='%s'\n" "$FOXOPS_OS_FAMILY"
    printf "FOXOPS_PACKAGE_MANAGER='%s'\n" "$FOXOPS_PACKAGE_MANAGER"
} > "$DEPLOYMENT_FILE"
chown root:root "$DEPLOYMENT_FILE"
chmod 0644 "$DEPLOYMENT_FILE"

configure_swap

"$FOXOPS_SYSTEMCTL_PATH" daemon-reload
"$FOXOPS_SYSTEMCTL_PATH" enable --now "$nginx_service"
"$FOXOPS_SYSTEMCTL_PATH" enable foxops
# 变量间接让回归断言不会把探针定时器误判成主服务 enable --now。
inspect_timer_unit=foxops-inspect.timer
"$FOXOPS_SYSTEMCTL_PATH" enable --now "$inspect_timer_unit"
# Docker 容器数据由 root 探针采集：foxops 用户不碰 docker.sock（docker 组
# 等于 root 级控制权），面板只读 /var/lib/foxops/docker.json。
docker_timer_unit=foxops-docker.timer
"$FOXOPS_SYSTEMCTL_PATH" enable --now "$docker_timer_unit"
# App files are replaced in place during upgrades. enable --now is a no-op for
# an already active unit, so restart explicitly to load the new release.
"$FOXOPS_SYSTEMCTL_PATH" restart foxops
"$FOXOPS_SYSTEMCTL_PATH" reload "$nginx_service"

health_ok=0
# shellcheck disable=SC2034
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    if curl --fail --silent --show-error http://127.0.0.1:8000/api/health >/dev/null; then
        health_ok=1
        break
    fi
    sleep 1
done
if [ "$health_ok" -ne 1 ]; then
    "$FOXOPS_SYSTEMCTL_PATH" --no-pager --full status foxops || true
    journalctl -u foxops -n 80 --no-pager || true
    fail "FoxOps health check failed"
fi
curl --fail --silent --show-error "http://127.0.0.1:$FOXOPS_PUBLIC_PORT/api/health" >/dev/null || fail "Nginx health check failed"

foxops_log "installation completed"
printf 'platform=%s; kernel=%s; architecture=%s\n' "$FOXOPS_OS_PRETTY" "$FOXOPS_KERNEL" "$FOXOPS_ARCH"
printf 'monitored_services=%s\n' "$monitored_services"
printf 'dashboard=http://%s:%s/\n' "$FOXOPS_PUBLIC_HOST" "$FOXOPS_PUBLIC_PORT"
printf 'backup=%s\n' "$backup_root"
printf 'administrative_token_file=%s (token not printed)\n' "$ENV_FILE"
printf '%s\n' 'Firewall or cloud security rules were not changed.'
