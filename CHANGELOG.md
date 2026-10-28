# 🎉 版本 0.2.2 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-10-29

### 新增

- **后台管理页（仅 Admin）**：侧栏「安全防护」下新增「后台管理」子菜单，可视化调整限流与封禁策略——防护开关、突发/持续双窗口限速、单 IP 与全局并发、请求体上限（KiB）、触发封禁的违规次数与统计窗口、首次/最长封禁时长。所有输入带服务端下发的上下界校验，越界或跨字段矛盾（持续上限低于突发、全局并发低于单 IP、最长封禁短于首次封禁）会直接返回 400 并说明原因。
- **策略热更新与持久化**：新增 `GET/PUT/DELETE /api/security/policy`。保存后立即生效（无需重启），策略以 JSON 存入数据卷 SQLite 的 `app_settings` 表，容器/服务重启后由 `defense.load_saved_policy()` 重新应用，优先级高于环境变量；「恢复环境默认」删除自定义值并回到 `FOXOPS_SECURITY_*`。修改与重置都会写审计日志。
- 新增 `tests/defense_smoke.py` 中的策略用例：权限门禁、越界/矛盾校验、热生效、模拟重启恢复与恢复默认。

### 调整

- **面板布局改版**：logo 从顶栏挪到左侧栏顶部，做成常驻品牌栏——logo、导航、版本号三者固定在左上角，内容滚动时不跟着动；原全宽顶栏收窄进右列，只保留更新时间、账户菜单、主题切换与刷新按钮。删掉旧的「顶栏 + `app-body`」双层结构，改为侧栏 + 右列 workspace 的网格布局；窄屏（≤900px）侧栏自动折成顶部横条，副标题隐藏，logo 仍在左上角。
- **侧栏分组**：「后台管理」收进「安全防护」分组，不再占用一级导航——点击安全防护展开小菜单（含后台管理），右侧箭头可单独展开/收起；进入安全防护或后台管理时自动展开，窄屏下小菜单改为横排。
- **安全防护页时钟**：原先单独显示的右上角时间并入「数据更新于 …」一行，并改为秒级走表，用 `GET /api/security/status` 返回的 `server_time` 校正客户端时钟偏移（每次刷新重新对齐，避免本机时间不准）；不再标注统计窗口。走表对齐整秒调度，`server_time` 精确到毫秒，避免「两秒跳一格」。
- **系统运维页**：移除「1 秒采样」说明文字，头部只保留主机名与系统名称。
- **标题旁徽标**：系统运维页的 `REALTIME`、安全防护页的 `GUARD` 徽标去掉，不再使用的 `.environment-badge` 样式一并删除。
- **顶栏按钮顺序**：主题切换按钮从最左侧挪到用户名右侧、「刷新」左侧，与账号操作连成一组。
- **监控首页标题**：去掉「轻量服务器监控系统」+ `FOXOPS` 徽标的两段式写法，只保留一个 `FoxOps` 大标题并用品牌紫渐变填充（日间/夜间各一套渐变，保证对比度）。
- **刷新不再"抽搐"**：轮询回来的数据与上一次完全一致时直接跳过赋值，不再白白重渲染模板；数字统一等宽（`tabular-nums`）、周期性变化的文字禁止换行、「刷新/刷新中」固定最小宽度、滚动条区域固定占位（`scrollbar-gutter`），顶栏用 `translateZ(0)` 单独合成一层，避免每次刷新时整页位移或模糊层跟着重绘。

### 说明

- 白名单（`FOXOPS_SECURITY_ALLOWLIST`）与受信反代（`FOXOPS_SECURITY_TRUSTED_PROXIES`）属于部署级配置，仍只通过环境变量设置，界面不开放修改。

### 提示

本次包含界面调整与新的策略接口；Docker 部署重建 `app` 镜像并 `docker compose --profile docker-panel up -d` 即可，`app_settings` 表随启动自动创建，数据卷无需迁移。

---

# 🎉 版本 0.2.1 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-10-25

### 新增

- **DDoS 防护（请求限速 + 自动封禁）**：新增 `app/defense.py`，在 ASGI 最外层按来源 IP 做双窗口令牌桶限速（默认突发 60 次 / 10 秒、持续 300 次 / 60 秒）、每 IP 与进程级并发上限（默认 24 / 200）、请求体大小上限（默认 1 MiB），超限返回 429 并带 `Retry-After`；反复触发的来源自动封禁（默认 3 次违规触发，首次 10 分钟，逐次翻倍，最长 24 小时），封禁期返回 403。回环与白名单永不被拦，真实 IP 只从受信反代（回环 / 内网网段）的 `X-Real-IP`、`X-Forwarded-For` 取，伪造头无效。
- **Nginx 层限速兜底**：原生配置按 API 20 次/秒、静态 50 次/秒分档限速，Docker 内置代理统一 30 次/秒；两套配置都新增单 IP 32 条并发连接上限、1 MiB 请求体上限与 slowloris 相关超时，超限统一 429/503，并新增 429 错误页（`app/static/429.html`）。
- **「安全防护」管理页**：左侧导航新增仅 Admin 可见的入口，展示最近一分钟请求/拦截量、封禁来源与解封按钮、高频来源榜、当前限流策略，5 秒刷新一次；新增 `GET /api/security/status`（管理员）与 `POST /api/security/unban`（管理员，操作写入审计日志）。
- **拦截告警**：跟随 60 秒采集节奏把限速拦截汇总成 `security/ddos` 活动告警，攻击可见、恢复自动解除，不在请求路径上写数据库。
- 新增 `tests/defense_smoke.py` 覆盖限速、超限并发、超大请求、自动封禁、手工解封与真实 IP 解析。

### 修复

- **标签页图标与当前 Logo 不一致、换了也不生效**：`icons/favicon.svg` 改为与顶栏 `.brand-mark` 完全一致的样式（深色圆角底 + 紫色描边 + 纯色狐狸剪影），并新增 16/32/48 三尺寸的 `app/static/favicon.ico` 兼容不认 SVG 图标的浏览器；首页、登录页与 404/429/500 统一声明两个图标并带 `?v=2` 版本号。同时 `app/main.py` 与 `deploy/foxops.nginx.conf` 对 `/favicon.ico`、`/icons/favicon.svg` 下发 `Cache-Control: no-cache`，避免浏览器启发式缓存把旧图标长期留在标签页（本次升级前收藏过本站的浏览器也会拿到新图标）。

### 配置

- 新增运行时配置：`FOXOPS_SECURITY_ENABLED`、`FOXOPS_SECURITY_BURST_LIMIT`、`FOXOPS_SECURITY_SUSTAINED_LIMIT`、`FOXOPS_SECURITY_BAN_SECONDS`（安装器写入 `/etc/foxops/foxops.env`），以及并发、封禁上限、白名单与受信反代等细项，见 README「可配置项」。
- Docker Compose 同步暴露上述四个环境变量。

### 提示

升级请重跑 `deploy/install.sh`（会刷新 Nginx 配置与 `/etc/foxops/foxops.env` 的默认项），完成后核对 `/api/health` 的 version 为 `0.2.1`。

---

# 🎉 版本 0.2.0 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-10-25

### 改名

- **LightOps → FoxOps**：项目名、系统用户、安装路径、systemd 单元、前端文案与包名统一改为 FoxOps；本文件历史条目里的旧名也已同步替换（指的是同一个项目）。

### 不兼容变更

- **环境变量前缀 `LIGHTOPS_*` → `FOXOPS_*`**：服务器上的旧配置文件不再生效，升级后需按 `config.env.example` 重新生成 `/etc/foxops/foxops.env`。
- **系统用户与目录**：服务用户 `lightops` → `foxops`；`/opt/lightops` → `/opt/foxops`，数据目录 `/var/lib/lightops` → `/var/lib/foxops`，配置目录 `/etc/lightops` → `/etc/foxops`。
- **systemd 单元**：`lightops.service` → `foxops.service`，`lightops-inspect.*` 与 `lightops-docker.*` → `foxops-*`。旧单元需先 `systemctl disable --now` 再删掉，不要两套并存。
- **前端存储键**：`lightops_theme` / `lightops_session` / `lightops_weather_place` → `foxops_*`，升级后需重新登录，主题回落为跟随系统。
- **历史数据不自动迁移**：旧库 `/var/lib/lightops/lightops.db` 不会搬到新路径，趋势与审计从新库重新开始。

### 新增

- **主题切换改为从按钮向四周扩散**：基于 View Transitions，把新主题画面按圆形裁剪从按钮中心揭示（`theme.js` 的 `reveal()`）；浏览器不支持或用户开了「减少动效」时退回普通过渡。
- **Docker 部署**：新增 `docker-compose.yml` 与 `docker/Dockerfile`（非 root 运行、只读根文件系统、内置健康检查）。容器内用 `FOXOPS_PROCFS_PATH` / `FOXOPS_HOST_ROOT` 让 psutil 读宿主机 `/proc` 与磁盘挂载点；nginx 侧保留同一套 CSP；systemd 相关功能在容器内自动降级。
- **紫灰配色 + 原创狐狸图标**：favicon 与页头品牌标记改成几何狐狸头，背景统一为紫 + 灰（暗色 `#14111c` / 日间 `#f2eff8`）。

### 修复

- **登录失败整张卡片跳动**：错误提示行改为固定占位，提示出现/消失不再挤压按钮；失败反馈换成一次性的轻微左右摇动，提交期间也不再清空上一条提示。
- **登录页静态资源不再被猜测缓存**：nginx 的 `expires -1` 从 `app.js / style.css / render.js` 扩展到 `login.* / theme.js / session.js`，避免升级后浏览器继续跑旧 JS。

### 提示

- 升级请重跑 `deploy/install.sh`（会创建新的 `foxops` 用户、目录与单元），完成后核对 `/api/health` 的 version 为 `0.2.0`。

---

# 🎉 版本 0.1.4.9 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-10-24

### 新增

- **左侧导航 +「系统运维」栏目**：面板从一整页长滚动改成左侧栏切页（总览 / 系统运维），窄屏自动折成顶部横条；切页写入 `#sysops`，刷新和分享都停在同一页。
- **秒级实时监控**：新增独立采样线程，每秒采一次、不落库（与 60 秒落库的 collector 完全分开）。系统运维页展示 CPU 总占用 + 每核占用柱、内存（含 Swap、可用）、磁盘各分区用量与读写速率，以及最近 90 秒的三线实时走势。
- **Docker 容器总览**：列出容器名称、镜像、状态、端口映射、CPU / 内存占用，运行中的排前面。
- **Docker 走 root 侧探针，不给服务提权**：docker 组等价于 root 级控制权（`docker run -v /:/host` 一步就能读写宿主机），所以 `foxops` 用户不碰 `docker.sock`。新增 `foxops-docker.timer`（10 秒一轮，root 运行）把容器清单写到 `/var/lib/foxops/docker.json`，面板只读文件；探针停摆时页面标「数据已过期」，而不是假装没数据。
- 新增 `/api/sysops/realtime`、`/api/sysops/docker` 两个只读接口，访客账号同样可见。

### 提示

- 升级后需重跑一次 `deploy/install.sh` 才会装上 `foxops-docker.{service,timer}`；没装之前 Docker 面板显示"读取不到容器"并给出对应的排查提示。

---

# 🎉 版本 0.1.4.8 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-09-09

### 调整

- **服务列表精简**：自动发现会连 acpid / auditd / polkit / rpcbind / sssd / qemu-guest-agent 这类系统杂项一起列出来，稀释注意力。现在内置一份杂项黑名单，默认只留真正有业务意义的服务（本机从 21 个减到 11 个：nginx、foxops、NetworkManager、chronyd、containerd、crond、docker、firewalld、rsyslog、sshd、tat_agent）。
- **新增 `FOXOPS_SERVICE_IGNORE`**：在内置黑名单之外追加不想看到的服务名，写在服务器配置里，升级时保留。想"反悔"看某个被拉黑的服务，把它写进 `FOXOPS_SERVICES` 即可——白名单优先级最高。

---

# 🎉 版本 0.1.4.7 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-09-09

### 新增

- **服务列表自动发现**：面板不再依赖写死的 `FOXOPS_SERVICES`。每轮采集扫描 systemd（`list-units --all` + `list-unit-files`），把"正在运行"或"开机自启"的服务纳入监控——新装的自动出现，卸载的自动消失。systemd 内部件（`systemd-*` / `dbus` / `getty@` / `dracut-*` / `user@` 等）自动剔除，不污染面板。

### 修复

- **已卸载的服务被当成故障**：unit 删除后 `systemctl is-active` 返回 not-found，旧逻辑一律按"非 active"处理，面板显示挂了并每轮刷一条 critical 告警。现在按 `LoadState` 识别为"未安装"，从面板列表移除并清理其历史告警。

### 调整

- **`FOXOPS_SERVICES` 语义降级为白名单**：它不再是服务列表，而是"显式关注 + 允许重启"名单（polkit 规则仍按它渲染）。名单里的名字永远出现在面板上，且只有它们带重启按钮；自动发现出来但不在名单里的服务为只读，点了也不会有权限。

---

# 🎉 版本 0.1.4.6 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-08-29

### 新增

- **服务使用方识别增强**：探针补两条信号——systemd 声明式依赖（`list-dependencies --reverse`，能抓到 Requires/Wants 关系如 nginx → php-fpm，运行时连接看不到）与**入站连接统计**（按监听端口 / Unix 路径统计入站连接，区分外部与本机）。无本地调用方的服务标注升级为"对外端口 · N 外部 / M 本机连接"。
- **服务语义标注配置**：`FOXOPS_SERVICE_LABELS`（如 `nginx:FoxOps 面板 / Zabbix Web`）。调用方是外部浏览器 / 远程探针时自动识别给不出关系，可在服务器配置里补语义，升级时保留；标注优先级：探针识别的调用方 → 配置标注 → 对外端口与连接数。标注写在配置而非代码，换服务器仍可维护。

---

# 🎉 版本 0.1.4.5 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-08-29

### 新增

- **服务使用方自动识别**：`used_by` 标注完全自动推导（新增 `app/ownership_probe.py` + `deploy/foxops-inspect.{service,timer}` + 精简后的 `app/ownership.py`）。root 侧探针每 60s 用 ss 抓套接字表，通过 `/proc/<pid>/cgroup` 把进程归属到 systemd 单元，推导调用关系——TCP 已建立连接的客户端单元即监听端口服务的使用方；Unix 已建立连接仅一端持有监听套接字时定向（fastcgi / mysql.sock 场景），两端都有监听时不猜方向；无本地调用方的监听型服务标注"对外端口"。结果写入 `/run/foxops/ownership.json`，App 只读文件、零特权；任何服务器部署开箱即用，无需维护映射。

### 修复

- **面板"重启服务"按钮从未生效**：unit 加固项（ProtectKernel*、RestrictAddressFamilies、SystemCallArchitectures、LockPersonality）会隐式开启内核 NoNewPrivs 标志，服务内 sudo 必然失败。改为安装器渲染 `/etc/polkit-1/rules.d/50-foxops.rules`（仅允许 foxops 用户 restart 受监控单元），`collector.restart_service` 直接调 systemctl 走 polkit 授权。

### 调整

- **权限模型理顺**：检测与重启都不再依赖 sudo（RHEL9 的 `kernel.yama.ptrace_scope=2` 也让非 root 的 CAP_SYS_PTRACE 失效，故检测走 root 探针 + 文件交接）。安装器 dnf/yum 包清单加入 `polkit`（apt 为 `policykit-1`），安装并启用探针 systemd 单元；移除 App 侧 `FOXOPS_SS_PATH` / `FOXOPS_SUDO_PATH` 依赖（foxopsctl / verify-server 仍用后者，不受影响）。
- **升级保留自定义服务清单**：install.sh 升级时保留已有 `FOXOPS_SERVICES`，管理员手工加入的监控服务（如 Zabbix 三件套）不再被自动探测默认值冲掉。

---

# 🎉 版本 0.1.4.3 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-08-29

### 新增

- **服务使用方标注**：服务状态列表在每个服务名后用小括号标注实际调用方（nginx → FoxOps / Zabbix Web，mysqld → Zabbix 数据库，php-fpm → Zabbix Web，zabbix-server / zabbix-agent2 → Zabbix），一眼看清各服务归属。

---

# 🎉 版本 0.1.4.2 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-08-29

### 移除

- **下线管理令牌**：管理操作（重启服务、立即备份、审计日志）改为只认 Admin 登录会话，删掉管理令牌这条第二套鉴权通道。令牌是全局凭证、无法区分使用者，Guest 拿到即可绕过 RBAC；现在匿名 401、Guest 403、Admin 200。配套删除 `deploy/rotate-token.sh`、`FOXOPS_API_TOKEN` 环境变量与前端「管理令牌」按钮。
- **清理死代码**：`style.css` 删除 175 行失效样式（旧天气内联图标、浏览器定位按钮、登录 modal 残留）；`weather.py` 删除 `geocode_place` 与 `_candidate_label_match` 两个零调用者函数。

### 调整

- **共享会话模块**：新增 `app/static/session.js`，面板与登录页共用同一份 sessionStorage 读写，不再各写一遍。
- **发布清单单一真相**：`tools/build-release.py` 删掉与 `deploy/install.sh` 重复的必需文件清单，只保留安装器侧的校验。
- **截图脚本去重**：`tools/verify-theme.mjs` 与 `tools/capture-readme.mjs` 抽公共 CDP 模块 `tools/cdp.mjs`，两者各省约 70 行胶水代码。
- **前端小项**：容量换算合并为 `formatGB(value, decimals)`，趋势图 Y 轴换算提取为 `chartY()`，三个定时器从 Vue `data` 挪到闭包。

### 修复

- **主题值错位**：截图脚本此前写入 `data-theme="night"`，而主题模块只认 `light` / `dark`，已统一为 `dark`。

---

# 🎉 版本 0.1.4.1 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-08-20

### 修复

- **修了显示 bug**：状态徽章默认即为健康（绿色），只有数据异常时才显示红色，避免「无异常却显示红色」的误导；日间主题下徽章配色同步适配。

### 调整

- **页脚品牌外链**：品牌文字带版本年份，合并为单个 GitHub 外链，去掉单独版本号链接。
- **天气默认城市**：天气模块默认显示广州-黄埔区。
- **注释中文化**：weather.py 注释统一为中文（无逻辑变更）。

---

# 🎉 版本 0.1.4 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-08-17

### 新增

- **日间/夜间主题一键切换**：顶栏新增日/夜切换按钮，太阳与月亮图标带旋转缩放动画，点击有涟漪反馈；偏好写入 localStorage，下次访问自动记忆。
- **日间主题背景**：浅色模式下使用晨光渐变背景（暖阳 + 蓝天 + 淡紫余韵），面板与卡片改为半透明白 + 柔和投影，所有语义色同步加深保证对比度。
- **跟随系统偏好**：首次访问时若未手动选择，自动跟随操作系统日间/夜间设置；主题切换过程全局平滑过渡。
- **登录页同步主题**：`/login.html` 与面板共享同一套主题偏好，进入控制台前后视觉一致。

---

# 🎉 版本 0.1.3 更新日志

## FoxOps 轻量服务器监控系统版本更新

发布日期：2026-08-16

### 新增

- **独立登录页**：全新 `/login.html` 登录界面，与监控面板完全分离；未登录访问面板自动跳转登录页。
- **会话认证**：PBKDF2（12 万次迭代）密码哈希，修改密码后旧会话全部失效。
- **角色权限**：用户分为 `admin`（管理员）与 `guest`（访客）；管理操作（重启、备份、维护、审计）仅管理员可用，访客只能查看面板。
- **账户管理**：用户菜单新增「我的账户 / 修改密码 / 退出登录」，并显示角色徽标。
- **访客账号**：新增种子账号 `Guest / 123456`（guest 角色），供只读演示。

### 修改与优化

- 默认账号调整为 `Admin / 123456`（admin 角色）。
- 前端按角色动态隐藏管理入口（管理令牌、重启、立即备份等按钮仅管理员可见）。
- 管理令牌机制兼容保留，与管理员会话并行生效。
- 发布产物（`releases/` 打包文件）移出 Git 跟踪，仓库仅保留源码与文档。

---

## 历史版本

## [0.1.2] - 2026-07-30

### 新增

- **首页天气模块**：在首页中部新增天气卡片，支持直接输入城市名查询天气，无需配置 API Key。
- **天气图标与提示语**：新增 QWeather Icons 天气图标、白天/夜间样式切换，以及晴、雨、雪、雷暴、雾等天气对应的暖心提示语。
- **区级天气选择**：支持北京、上海、广州、深圳、成都、杭州、武汉、西安、南京、重庆等城市的区级候选切换。
- **自定义错误页面**：新增统一风格的 404 和 500 错误页，未知地址会返回明确的错误提示。
- **自动化测试流程**：新增 GitHub Actions CI，在提交代码时自动执行 Python、API、前端安全、Shell 脚本和发布包检查。
- **内存运维工具**：新增内存诊断与优化脚本，可检查进程占用、MySQL、Redis、Swap 和系统日志，并支持回滚优化配置。

---

### 修改与优化

- **Nginx 访问性能**：开启 gzip 静态压缩，`app.js` 和 `style.css` 的网络传输体积下降约 75%。
- **Nginx 安全设置**：隐藏 Nginx 版本号，减少服务信息泄露。
- **错误路由处理**：未知路径不再返回 200 空页面，改为返回真实 404 并展示自定义错误页。
- **趋势图图例**：CPU、内存、磁盘增加对应颜色标识，与曲线及悬停提示保持一致。
- **HTTPS 配置**：暂时移除自签名证书方案，当前统一使用 HTTP 8080；配置真实域名证书后可恢复 HTTPS。
- **服务器内存占用**：限制系统日志空间、停止无用 Docker 服务并优化 MySQL 配置，降低生产服务器内存占用。
- **部署脚本兼容性**：优化 Windows 与 Linux 间的 UTF-8、换行符和中文日志处理，降低脚本上传后执行失败的概率。
- **前端模板构建**：修复 CRLF 模板边界问题，修改 `index.html` 后可以稳定重新生成 `render.js`。
- **版本信息一致性**：项目说明文档、应用接口、前端展示、测试与打包配置统一更新为 `0.1.2`。
- **项目文档**：更新 README、开发交接总览、生产部署报告和开发入口，明确当前版本与历史部署记录的区别。

---

## 历史版本

## [0.1.1] - 2026-07

首个公开迭代版本，奠定监控核心能力。

### 新增

- 服务存储桶自动识别：从 systemd unit 文件自动探测 s3 / cos / oss / gs 桶并在服务名后展示。
- 顶部「最后更新时间」显示为本地化日期 + 时间（YYYY年MM月DD日 HH:mm:ss）。

### 修复

- `collector` 的 `load_15` 取错数组索引（误取 `[1]`）。
- `clampPercent` 缺少 value 参数导致首屏白屏。
- `fetchJson` 丢失 `requestOptions`，且更新时间标签缺失时间部分。
- `service_samples` 未持久化返回服务桶信息。

---

## 版本号约定

- **主版本.次版本.修订号**：不兼容改动 / 新功能（默认向上兼容）/ 兼容性修复。
- 生产服务器 systemd `MemoryMax=400M`，Uvicorn 单 worker 仅监听 `127.0.0.1:8000`，Nginx 对外 `1224`。
- 升级前在临时目录完成全套测试 + 自动备份，远端 `upgrade=PASS` 才算成功；失败自动回滚。
