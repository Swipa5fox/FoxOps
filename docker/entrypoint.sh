#!/bin/sh
# 命名卷首次创建时属主是 root：先把数据目录改成 foxops(10001)，再降权跑业务进程。
set -eu

if [ "$(id -u)" = "0" ]; then
    data_dir=$(dirname "${FOXOPS_DB_PATH:-/var/lib/foxops/foxops.db}")
    backup_dir=${FOXOPS_BACKUP_DIR:-/var/lib/foxops/backups}
    mkdir -p "$data_dir" "$backup_dir"
    chown -R 10001:10001 "$data_dir" "$backup_dir"
    exec setpriv --reuid=10001 --regid=10001 --clear-groups -- "$@"
fi

exec "$@"
