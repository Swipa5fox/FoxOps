# FoxOps 运行镜像：单进程 uvicorn + 预编译前端（render.js 已提交，无需构建阶段）。
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /opt/foxops

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY docker/entrypoint.sh /usr/local/bin/foxops-entrypoint
COPY docker/healthcheck.py /usr/local/bin/foxops-healthcheck

# 强制代码目录全员可读：业务进程以 uid 10001 运行，若某个文件权限是 600/640
# （Windows 上打包或单文件上传时容易残留），容器会以 PermissionError 崩溃循环。
# 2026-10-30 线上 docker_ops.py 权限 640 导致 app 起不来、web 容器卡在 Created。
RUN chmod -R a+rX /opt/foxops/app

# 固定 uid/gid：命名卷首次创建时由 entrypoint 修正属主，业务进程永不跑 root。
RUN groupadd --system --gid 10001 foxops \
 && useradd --system --uid 10001 --gid 10001 --home-dir /var/lib/foxops \
      --shell /usr/sbin/nologin foxops \
 && chmod 0755 /usr/local/bin/foxops-entrypoint /usr/local/bin/foxops-healthcheck \
 && mkdir -p /var/lib/foxops/backups \
 && chown -R 10001:10001 /var/lib/foxops

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "/usr/local/bin/foxops-healthcheck"]

ENTRYPOINT ["/usr/local/bin/foxops-entrypoint"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
