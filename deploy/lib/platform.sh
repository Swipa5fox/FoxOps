#!/usr/bin/env bash

# Shared, side-effect-free platform detection for preflight.sh and install.sh.
# Deployment strategy is selected from the distribution, package manager,
# init system and architecture. The kernel version is reported but is not
# sufficient by itself to select a package command.

foxops_log() {
    printf '[FoxOps] %s\n' "$*"
}

foxops_error() {
    printf '[FoxOps] ERROR: %s\n' "$*" >&2
}

foxops_command_path() {
    command_name=$1
    command_value=$(command -v "$command_name" 2>/dev/null || true)
    case "$command_value" in
        /*)
            if command -v readlink >/dev/null 2>&1; then
                readlink -f "$command_value" 2>/dev/null || printf '%s\n' "$command_value"
            else
                printf '%s\n' "$command_value"
            fi
            ;;
        *)
            return 1
            ;;
    esac
}

foxops_detect_cloud_provider() {
    requested=${FOXOPS_CLOUD_PROVIDER:-auto}
    if [ "$requested" != auto ] && [ -n "$requested" ]; then
        printf '%s\n' "$requested"
        return 0
    fi

    dmi_root=${FOXOPS_DMI_ROOT:-/sys/class/dmi/id}
    dmi_text=
    for dmi_name in sys_vendor product_name board_vendor; do
        if [ -r "$dmi_root/$dmi_name" ]; then
            dmi_value=$(tr '\n' ' ' < "$dmi_root/$dmi_name" 2>/dev/null || true)
            dmi_text="$dmi_text $dmi_value"
        fi
    done
    dmi_lower=$(printf '%s' "$dmi_text" | tr '[:upper:]' '[:lower:]')

    case "$dmi_lower" in
        *tencent*) printf '%s\n' '腾讯云' ;;
        *alibaba*|*aliyun*) printf '%s\n' '阿里云' ;;
        *amazon*|*ec2*) printf '%s\n' 'Amazon Web Services' ;;
        *google*) printf '%s\n' 'Google Cloud' ;;
        *microsoft*|*azure*) printf '%s\n' 'Microsoft Azure' ;;
        *digitalocean*) printf '%s\n' 'DigitalOcean' ;;
        *hetzner*) printf '%s\n' 'Hetzner Cloud' ;;
        *oracle*) printf '%s\n' 'Oracle Cloud' ;;
        *) printf '%s\n' '云服务器' ;;
    esac
}

foxops_detect_container() {
    if [ -n "${FOXOPS_CONTAINER_OVERRIDE:-}" ]; then
        printf '%s\n' "$FOXOPS_CONTAINER_OVERRIDE"
        return 0
    fi
    if [ -e /.dockerenv ] || [ -e /run/.containerenv ] || [ -s /run/systemd/container ]; then
        printf '%s\n' yes
        return 0
    fi
    if command -v systemd-detect-virt >/dev/null 2>&1; then
        container_kind=$(systemd-detect-virt --container 2>/dev/null || true)
        if [ -n "$container_kind" ] && [ "$container_kind" != none ]; then
            printf '%s\n' yes
            return 0
        fi
    fi
    printf '%s\n' no
}

foxops_detect_platform() {
    os_release_file=${FOXOPS_OS_RELEASE_FILE:-/etc/os-release}
    if [ ! -r "$os_release_file" ]; then
        foxops_error "cannot read $os_release_file"
        return 1
    fi

    ID=
    ID_LIKE=
    VERSION_ID=
    PRETTY_NAME=
    # os-release is the distribution's standard machine-readable identity file.
    # shellcheck disable=SC1090
    . "$os_release_file"

    FOXOPS_OS_ID=$(printf '%s' "${ID:-unknown}" | tr '[:upper:]' '[:lower:]')
    FOXOPS_OS_LIKE=$(printf '%s' "${ID_LIKE:-}" | tr '[:upper:]' '[:lower:]')
    FOXOPS_OS_VERSION=${VERSION_ID:-unknown}
    FOXOPS_OS_PRETTY=${PRETTY_NAME:-$FOXOPS_OS_ID}
    FOXOPS_KERNEL=${FOXOPS_KERNEL_OVERRIDE:-$(uname -r)}
    raw_arch=${FOXOPS_ARCH_OVERRIDE:-$(uname -m)}
    FOXOPS_INIT=${FOXOPS_INIT_OVERRIDE:-$(ps -p 1 -o comm= 2>/dev/null | tr -d '[:space:]')}
    FOXOPS_CONTAINER=$(foxops_detect_container)

    case "$raw_arch" in
        x86_64|amd64) FOXOPS_ARCH=x86_64 ;;
        aarch64|arm64) FOXOPS_ARCH=aarch64 ;;
        *)
            foxops_error "unsupported CPU architecture: $raw_arch (supported: x86_64, aarch64)"
            return 1
            ;;
    esac

    os_family_text="$FOXOPS_OS_ID $FOXOPS_OS_LIKE"
    case "$os_family_text" in
        *debian*|*ubuntu*)
            FOXOPS_OS_FAMILY=debian
            FOXOPS_PACKAGE_MANAGER=${FOXOPS_PACKAGE_MANAGER_OVERRIDE:-apt-get}
            ;;
        *rhel*|*fedora*|*centos*|*rocky*|*almalinux*|*amzn*|*oracle*|*" ol "*)
            FOXOPS_OS_FAMILY=rhel
            if [ -n "${FOXOPS_PACKAGE_MANAGER_OVERRIDE:-}" ]; then
                FOXOPS_PACKAGE_MANAGER=$FOXOPS_PACKAGE_MANAGER_OVERRIDE
            elif command -v dnf >/dev/null 2>&1; then
                FOXOPS_PACKAGE_MANAGER=dnf
            elif command -v yum >/dev/null 2>&1; then
                FOXOPS_PACKAGE_MANAGER=yum
            else
                foxops_error "neither dnf nor yum is available"
                return 1
            fi
            ;;
        *alpine*)
            foxops_error "Alpine/OpenRC is not supported; FoxOps requires a host systemd service manager"
            return 1
            ;;
        *)
            foxops_error "unsupported Linux distribution: $FOXOPS_OS_PRETTY"
            return 1
            ;;
    esac

    case "$FOXOPS_PACKAGE_MANAGER" in
        apt-get|dnf|yum) ;;
        *)
            foxops_error "unsupported package manager: $FOXOPS_PACKAGE_MANAGER"
            return 1
            ;;
    esac
    if [ "${FOXOPS_TEST_MODE:-0}" != 1 ] && ! command -v "$FOXOPS_PACKAGE_MANAGER" >/dev/null 2>&1; then
        foxops_error "detected package manager is not executable: $FOXOPS_PACKAGE_MANAGER"
        return 1
    fi

    if [ "${FOXOPS_TEST_MODE:-0}" != 1 ]; then
        if [ "$FOXOPS_INIT" != systemd ]; then
            foxops_error "PID 1 is '$FOXOPS_INIT', not systemd"
            return 1
        fi
        if [ "$FOXOPS_CONTAINER" = yes ]; then
            foxops_error "container deployment is refused because FoxOps manages host systemd services"
            return 1
        fi
        if [ ! -d /run/systemd/system ]; then
            foxops_error "systemd is not running on this host"
            return 1
        fi
    fi

    FOXOPS_SYSTEMCTL_PATH=${FOXOPS_SYSTEMCTL_PATH_OVERRIDE:-$(foxops_command_path systemctl || true)}
    if [ -z "$FOXOPS_SYSTEMCTL_PATH" ] && [ "${FOXOPS_TEST_MODE:-0}" != 1 ]; then
        foxops_error "systemctl was not found"
        return 1
    fi

    export FOXOPS_OS_ID FOXOPS_OS_LIKE FOXOPS_OS_VERSION FOXOPS_OS_PRETTY
    export FOXOPS_OS_FAMILY FOXOPS_PACKAGE_MANAGER FOXOPS_KERNEL FOXOPS_ARCH
    export FOXOPS_INIT FOXOPS_CONTAINER FOXOPS_SYSTEMCTL_PATH
}

foxops_python_version_ok() {
    python_command=$1
    "$python_command" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1
}

foxops_find_python() {
    for python_candidate in python3.13 python3.12 python3.11 python3.10 python3.9 python3; do
        if command -v "$python_candidate" >/dev/null 2>&1 && foxops_python_version_ok "$python_candidate"; then
            foxops_command_path "$python_candidate"
            return 0
        fi
    done
    return 1
}

foxops_unit_exists() {
    unit_name=$1
    unit_state=$("$FOXOPS_SYSTEMCTL_PATH" show "$unit_name.service" -p LoadState --value 2>/dev/null || true)
    [ "$unit_state" = loaded ]
}

foxops_first_installed_service() {
    for service_candidate in "$@"; do
        if foxops_unit_exists "$service_candidate"; then
            printf '%s\n' "$service_candidate"
            return 0
        fi
    done
    return 1
}

foxops_resolve_service() {
    requested_service=$1
    shift
    case "$requested_service" in
        auto)
            foxops_first_installed_service "$@" || true
            ;;
        none|'')
            ;;
        *[!A-Za-z0-9_.@-]*)
            foxops_error "invalid systemd service name: $requested_service"
            return 1
            ;;
        *)
            if ! foxops_unit_exists "$requested_service"; then
                foxops_error "requested systemd service is not installed: $requested_service"
                return 1
            fi
            printf '%s\n' "$requested_service"
            ;;
    esac
}

foxops_print_platform() {
    printf 'os_pretty=%s\n' "$FOXOPS_OS_PRETTY"
    printf 'os_id=%s\n' "$FOXOPS_OS_ID"
    printf 'os_family=%s\n' "$FOXOPS_OS_FAMILY"
    printf 'os_version=%s\n' "$FOXOPS_OS_VERSION"
    printf 'kernel=%s\n' "$FOXOPS_KERNEL"
    printf 'architecture=%s\n' "$FOXOPS_ARCH"
    printf 'init=%s\n' "$FOXOPS_INIT"
    printf 'container=%s\n' "$FOXOPS_CONTAINER"
    printf 'package_manager=%s\n' "$FOXOPS_PACKAGE_MANAGER"
    printf 'systemctl=%s\n' "$FOXOPS_SYSTEMCTL_PATH"
}
