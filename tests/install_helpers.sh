#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=deploy/lib/config.sh
. "$PROJECT_ROOT/deploy/lib/config.sh"

fixture_root=$(mktemp -d)
trap 'rm -rf "$fixture_root" 2>/dev/null || true' EXIT
env_file=$fixture_root/foxops.env
sudoers_file=$fixture_root/foxops.sudoers

: > "$env_file"
foxops_write_env_setting "$env_file" FOXOPS_CLOUD_PROVIDER 'Amazon Web Services'
foxops_write_env_setting "$env_file" FOXOPS_SERVICES 'nginx,redis-server'
foxops_ensure_env_setting "$env_file" FOXOPS_CPU_THRESHOLD 85
foxops_ensure_env_setting "$env_file" FOXOPS_CPU_THRESHOLD 99

set -a
# shellcheck disable=SC1090
. "$env_file"
set +a
test "$FOXOPS_CLOUD_PROVIDER" = 'Amazon Web Services'
test "$FOXOPS_SERVICES" = 'nginx,redis-server'
test "$FOXOPS_CPU_THRESHOLD" = 85
test "$(grep -c '^FOXOPS_CPU_THRESHOLD=' "$env_file")" -eq 1

foxops_render_sudoers "$sudoers_file" /usr/bin/systemctl 'nginx,redis-server'
grep -Fq '/usr/bin/systemctl restart nginx, /usr/bin/systemctl restart redis-server' "$sudoers_file"
grep -Fq 'foxops ALL=(root) NOPASSWD: FOXOPS_RESTART' "$sudoers_file"

polkit_file=$fixture_root/50-foxops.rules
foxops_render_polkit "$polkit_file" 'nginx,redis-server'
grep -Fq '"nginx.service", "redis-server.service"' "$polkit_file"
grep -Fq 'org.freedesktop.systemd1.manage-units' "$polkit_file"
grep -Fq 'subject.user !== "foxops"' "$polkit_file"
if command -v visudo >/dev/null 2>&1; then
    chmod 0440 "$sudoers_file"
    if ! visudo -cf "$sudoers_file" 2>"$fixture_root/visudo.err"; then
        echo "visudo -cf failed. rendered sudoers:" >&2
        cat "$sudoers_file" >&2
        echo "--- visudo stderr ---" >&2
        cat "$fixture_root/visudo.err" >&2
        exit 1
    fi
fi

# shellcheck disable=SC2016
grep -Fq '"$FOXOPS_SYSTEMCTL_PATH" enable foxops' "$PROJECT_ROOT/deploy/install.sh"
# shellcheck disable=SC2016
grep -Fq '"$FOXOPS_SYSTEMCTL_PATH" restart foxops' "$PROJECT_ROOT/deploy/install.sh"
if grep -Fq 'enable --now foxops' "$PROJECT_ROOT/deploy/install.sh"; then
    echo "install.sh must restart an already active FoxOps service during upgrades" >&2
    exit 1
fi

service_script=deploy/verify-server.sh
grep -Fq 'read -r -a service_names' "$PROJECT_ROOT/$service_script"
# shellcheck disable=SC2016
grep -Fq '"${service_names[@]}"' "$PROJECT_ROOT/$service_script"
# shellcheck disable=SC2016
if grep -Fq 'for monitored_service in foxops,$MONITORED_SERVICES' "$PROJECT_ROOT/deploy/foxopsctl"; then
    echo "foxopsctl must split the complete service CSV instead of a literal prefix" >&2
    exit 1
fi

echo "FoxOps install helper tests passed"
