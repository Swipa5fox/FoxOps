#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOYMENT_FILE=/etc/foxops/deployment.env
# shellcheck disable=SC1090,SC1091
. "$DEPLOYMENT_FILE"

PUBLIC_PORT=${FOXOPS_PUBLIC_PORT:-8080}
MONITORED_SERVICES=${FOXOPS_MONITORED_SERVICES:-nginx}
SYSTEMCTL=${FOXOPS_SYSTEMCTL_PATH:-$(command -v systemctl)}
SUDO=${FOXOPS_SUDO_PATH:-$(command -v sudo)}

echo "PLATFORM"
printf 'os_family=%s package_manager=%s public_port=%s\n' "${FOXOPS_OS_FAMILY:-unknown}" "${FOXOPS_PACKAGE_MANAGER:-unknown}" "$PUBLIC_PORT"

echo "SERVICE_STATE"
service_list="foxops,$MONITORED_SERVICES"
IFS=',' read -r -a service_names <<< "$service_list"
for service_name in "${service_names[@]}"; do
    printf '%-24s ' "$service_name"
    "$SYSTEMCTL" is-active "$service_name"
done
"$SYSTEMCTL" is-enabled foxops

echo "SERVICE_LIMITS"
"$SYSTEMCTL" show foxops -p MainPID -p MemoryCurrent -p MemoryMax -p NRestarts -p ActiveEnterTimestamp

echo "LISTENERS"
ss -ltnp | grep -E "(:8000|:$PUBLIC_PORT)([[:space:]]|$)"

echo "API_HEALTH"
curl --fail --silent --show-error http://127.0.0.1:8000/api/health
echo
curl --fail --silent --show-error "http://127.0.0.1:$PUBLIC_PORT/api/health"
echo

echo "API_SUMMARY"
curl --fail --silent --show-error "http://127.0.0.1:$PUBLIC_PORT/api/summary"
echo

echo "AUTH_GUARD"
# 管理接口只认 admin 会话：匿名 401，Guest 会话 403。
unauthorized_status=$(curl --silent --output /dev/null --write-out "%{http_code}" "http://127.0.0.1:$PUBLIC_PORT/api/audit")
guest_token=$(curl --silent --fail -X POST "http://127.0.0.1:$PUBLIC_PORT/api/login" \
    -H 'Content-Type: application/json' \
    -d '{"username":"Guest","password":"123456"}' \
    | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
guest_status=$(curl --silent --output /dev/null --write-out "%{http_code}" --header "Authorization: Bearer $guest_token" "http://127.0.0.1:$PUBLIC_PORT/api/audit")
echo "unauthorized=$unauthorized_status guest=$guest_status"
test "$unauthorized_status" = 401
test "$guest_status" = 403

# 安全防护状态同样只给管理员：匿名 401、Guest 403。
security_status=$(curl --silent --output /dev/null --write-out "%{http_code}" "http://127.0.0.1:$PUBLIC_PORT/api/security/status")
security_guest_status=$(curl --silent --output /dev/null --write-out "%{http_code}" --header "Authorization: Bearer $guest_token" "http://127.0.0.1:$PUBLIC_PORT/api/security/status")
echo "security_unauthorized=$security_status security_guest=$security_guest_status"
test "$security_status" = 401
test "$security_guest_status" = 403

echo "STATIC_ASSETS"
curl --fail --silent --show-error --head "http://127.0.0.1:$PUBLIC_PORT/vendor/vue.runtime.global.prod.js" | head -n 8
curl --fail --silent --show-error --head "http://127.0.0.1:$PUBLIC_PORT/render.js" | head -n 8

echo "PERMISSIONS"
for path in /etc/foxops/foxops.env /etc/foxops/deployment.env /var/lib/foxops /var/lib/foxops/foxops.db /opt/foxops/app; do
    if [ -e "$path" ]; then
        mode=$(stat -c %a "$path")
        owner=$(stat -c %U:%G "$path")
        echo "$mode $owner $path"
    fi
done

echo "DATABASE"
/opt/foxops/.venv/bin/python - <<'PY'
import sqlite3

connection = sqlite3.connect("/var/lib/foxops/foxops.db")
try:
    count, oldest, newest = connection.execute(
        "SELECT COUNT(*), MIN(ts), MAX(ts) FROM metrics"
    ).fetchone()
finally:
    connection.close()
print(f"metric_rows={count} oldest={oldest} newest={newest}")
PY

echo "SUDO_WHITELIST"
"$SUDO" -u foxops "$SUDO" -n -l

echo "RECENT_WARNINGS"
journalctl -u foxops --since "10 minutes ago" -p warning --no-pager
