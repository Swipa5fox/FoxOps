#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=deploy/lib/platform.sh
. "$PROJECT_ROOT/deploy/lib/platform.sh"

fixture_root=$(mktemp -d)
trap 'rm -rf "$fixture_root" 2>/dev/null || true' EXIT

assert_equal() {
    expected=$1
    actual=$2
    label=$3
    if [ "$expected" != "$actual" ]; then
        printf 'FAIL %s expected=%s actual=%s\n' "$label" "$expected" "$actual" >&2
        exit 1
    fi
}

run_supported_case() {
    case_name=$1
    os_id=$2
    os_like=$3
    expected_family=$4
    package_manager=$5
    architecture=$6

    case_dir=$fixture_root/$case_name
    mkdir -p "$case_dir/dmi"
    {
        printf 'ID=%s\n' "$os_id"
        printf 'ID_LIKE="%s"\n' "$os_like"
        printf 'VERSION_ID="test"\n'
        printf 'PRETTY_NAME="%s fixture"\n' "$case_name"
    } > "$case_dir/os-release"

    FOXOPS_TEST_MODE=1
    FOXOPS_OS_RELEASE_FILE=$case_dir/os-release
    FOXOPS_INIT_OVERRIDE=systemd
    FOXOPS_CONTAINER_OVERRIDE=no
    FOXOPS_ARCH_OVERRIDE=$architecture
    FOXOPS_KERNEL_OVERRIDE=6.8.0-fixture
    FOXOPS_PACKAGE_MANAGER_OVERRIDE=$package_manager
    FOXOPS_SYSTEMCTL_PATH_OVERRIDE=/usr/bin/systemctl
    export FOXOPS_TEST_MODE FOXOPS_OS_RELEASE_FILE FOXOPS_INIT_OVERRIDE
    export FOXOPS_CONTAINER_OVERRIDE FOXOPS_ARCH_OVERRIDE FOXOPS_KERNEL_OVERRIDE
    export FOXOPS_PACKAGE_MANAGER_OVERRIDE FOXOPS_SYSTEMCTL_PATH_OVERRIDE

    foxops_detect_platform
    assert_equal "$expected_family" "$FOXOPS_OS_FAMILY" "$case_name family"
    assert_equal "$package_manager" "$FOXOPS_PACKAGE_MANAGER" "$case_name package manager"
    case "$architecture" in
        amd64) expected_arch=x86_64 ;;
        arm64) expected_arch=aarch64 ;;
        *) expected_arch=$architecture ;;
    esac
    assert_equal "$expected_arch" "$FOXOPS_ARCH" "$case_name architecture"
}

run_supported_case ubuntu-22 ubuntu debian debian apt-get amd64
run_supported_case debian-12 debian '' debian apt-get arm64
run_supported_case rocky-9 rocky 'rhel centos fedora' rhel dnf x86_64
run_supported_case amazon-2023 amzn fedora rhel dnf aarch64
run_supported_case oracle-9 ol fedora rhel yum x86_64

alpine_dir=$fixture_root/alpine
mkdir -p "$alpine_dir"
printf 'ID=alpine\nPRETTY_NAME="Alpine fixture"\n' > "$alpine_dir/os-release"
FOXOPS_OS_RELEASE_FILE=$alpine_dir/os-release
FOXOPS_PACKAGE_MANAGER_OVERRIDE=apk
FOXOPS_ARCH_OVERRIDE=x86_64
export FOXOPS_OS_RELEASE_FILE FOXOPS_PACKAGE_MANAGER_OVERRIDE FOXOPS_ARCH_OVERRIDE
if foxops_detect_platform >/dev/null 2>&1; then
    echo "FAIL Alpine must be rejected" >&2
    exit 1
fi

unsupported_arch_dir=$fixture_root/unsupported-arch
mkdir -p "$unsupported_arch_dir"
printf 'ID=ubuntu\nID_LIKE=debian\n' > "$unsupported_arch_dir/os-release"
FOXOPS_OS_RELEASE_FILE=$unsupported_arch_dir/os-release
FOXOPS_PACKAGE_MANAGER_OVERRIDE=apt-get
FOXOPS_ARCH_OVERRIDE=riscv64
export FOXOPS_OS_RELEASE_FILE FOXOPS_PACKAGE_MANAGER_OVERRIDE FOXOPS_ARCH_OVERRIDE
if foxops_detect_platform >/dev/null 2>&1; then
    echo "FAIL unsupported architecture must be rejected" >&2
    exit 1
fi

cloud_dir=$fixture_root/cloud
mkdir -p "$cloud_dir"
printf '%s\n' 'Amazon EC2' > "$cloud_dir/sys_vendor"
FOXOPS_DMI_ROOT=$cloud_dir
FOXOPS_CLOUD_PROVIDER=auto
export FOXOPS_DMI_ROOT FOXOPS_CLOUD_PROVIDER
assert_equal 'Amazon Web Services' "$(foxops_detect_cloud_provider)" 'cloud provider'

echo "FoxOps platform detection fixtures passed"
