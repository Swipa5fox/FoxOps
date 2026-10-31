(function () {
  "use strict";

  var createApp = window.Vue.createApp;
  var DEFAULT_WEATHER_PLACE = "广州-黄埔区";
  var REQUEST_TIMEOUT_MS = 10000;
  var WEATHER_REFRESH_MS = 30 * 60 * 1000;
  var CLOCK_REFRESH_MS = 60 * 1000;
  // 系统运维页：实时快照 2s 一拉，docker 列表 6s 一拉（stats 本身有成本，
  // 服务端还有 5s 缓存兜底）。
  var SYSOPS_REFRESH_MS = 2000;
  var DOCKER_REFRESH_MS = 6000;
  // 安全防护页 5s 一拉：封禁与拦截是"刚刚发生"的事，和实时页同样的节奏。
  var SECURITY_REFRESH_MS = 5000;
  // Timers are plain closures: nothing renders off their ids.
  var refreshTimer = null;
  var weatherTimer = null;
  var clockTimer = null;
  var sysopsTimer = null;
  var dockerTimer = null;
  // 日志自动刷新单独一个表：跟着视图切走就停，不跟 docker 列表轮询绑在一起。
  var dockerLogTimer = null;
  var securityTimer = null;
  var securityClockTimer = null;
  var session = window.FoxOpsSession;
  var weatherPlaceStore = session.weatherPlace;

  // WMO 天气码 -> 和风图标码（日间档）。
  var QWEATHER_CODES = {
    0: 100, 1: 101, 2: 102, 3: 103,
    45: 501, 48: 501,
    51: 300, 53: 300, 55: 301, 56: 306, 57: 306,
    61: 305, 63: 306, 65: 308, 66: 312, 67: 312,
    71: 400, 73: 401, 75: 402, 77: 407,
    80: 305, 81: 306, 82: 308,
    85: 400, 86: 401,
    95: 302, 96: 302, 99: 302
  };
  // 只有晴 / 多云这几档有昼夜两套图标，夜间码 = 日间码 + 50。
  var QWEATHER_NIGHT_CODES = { 100: 150, 101: 151, 102: 152, 103: 153 };

  // Chart geometry: 0-100% maps to y in [0, 260] on the 1000x260 viewBox.
  function chartY(value) {
    var safe = Math.max(0, Math.min(100, Number(value) || 0));
    return 260 - safe * 2.6;
  }

  // 轮询回来的数据没变就别替换响应式对象：替换会让整块模板重渲染一次，
  // 视觉上就是"闪一下"。传入 ignoreKeys 可以放过每次都变的字段（如 server_time）。
  function payloadChanged(previous, next, ignoreKeys) {
    if (!previous) {
      return true;
    }
    var ignored = ignoreKeys || [];
    var normalize = function (payload) {
      var copy = {};
      for (var key in payload) {
        if (ignored.indexOf(key) === -1) {
          copy[key] = payload[key];
        }
      }
      return JSON.stringify(copy);
    };
    return normalize(previous) !== normalize(next);
  }

  createApp({
    render: window.FoxOpsRender,
    data: function () {
      return {
        summary: { metric: {}, services: [], alerts: [], host: {} },
        history: [],
        range: "10m",
        ranges: [
          { value: "10m", label: "10 分钟" },
          { value: "1h", label: "1 小时" },
          { value: "24h", label: "24 小时" },
          { value: "7d", label: "7 天" }
        ],
        loading: false,
        restartBusy: "",
        updatedAt: "",
        error: "",
        trendHover: null,
        refreshRequested: false,
        weather: null,
        weatherLoading: false,
        weatherError: "",
        weatherPlace: "",
        currentTime: new Date(),
        showPasswordModal: false,
        currentUser: "",
        role: "",
        passwordBusy: false,
        passwordError: "",
        passwordSuccess: "",
        passwordForm: { oldPassword: "", newPassword: "", confirmPassword: "" },
        logoutBusy: false,
        theme: "dark",
        view: "overview",
        realtime: {
          ready: false,
          cpu: {},
          memory: {},
          disks: [],
          disk_io: {},
          series: []
        },
        docker: {
          available: true,
          reason: "",
          hint: null,
          containers: [],
          counts: { total: 0, running: 0 },
          images: [],
          volumes: [],
          networks: []
        },
        sysopsError: "",
        sysopsUpdatedAt: "",
        dockerLoading: false,
        // 容器详情：一次只展开一个，日志按需走 root 探针队列拉取。
        dockerExpanded: "",
        dockerTab: "overview",
        dockerDetail: null,
        dockerDetailLoading: false,
        dockerDetailError: "",
        dockerLogs: null,
        dockerLogsLoading: false,
        dockerLogsError: "",
        dockerLogTail: 200,
        dockerLogAuto: false,
        // 安全防护页（仅管理员）：默认值是页面首次加载前的占位，不是业务假设。
        security: {
          enabled: true,
          limits: {},
          recent: { window_seconds: 60, requests: 0, allowed: 0, blocked: 0 },
          totals: { requests: 0, allowed: 0, blocked: 0 },
          active: { tracked_ips: 0, concurrent: 0, banned: 0 },
          banned: [],
          offenders: []
        },
        securityReady: false,
        securityError: "",
        securityBusy: false,
        // 数据更新时间：按服务器时间校正后的本地读数，每秒走一格。
        securityClock: "",
        securityServerOffsetMs: 0,
        // 侧栏「安全防护」分组展开状态；进入 security/admin 时自动展开。
        securityOpen: false,
        // 后台管理：限流策略（current 是生效值，defaults 是环境变量默认值）
        policy: { current: { enabled: true }, defaults: {}, bounds: {}, source: "", updated_at: "" },
        policyForm: {
          enabled: true,
          burst_limit: 60,
          burst_window_seconds: 10,
          sustained_limit: 300,
          sustained_window_seconds: 60,
          max_concurrent: 24,
          max_global_concurrent: 200,
          max_body_kib: 1024,
          strike_limit: 3,
          strike_window_seconds: 300,
          ban_seconds: 600,
          max_ban_seconds: 86400
        },
        policyLoading: false,
        policySaving: false,
        policyError: "",
        policySuccess: ""
      };
    },
    computed: {
      metric: function () {
        return this.summary.metric || {};
      },
      isAdmin: function () {
        return this.role === "admin";
      },
      themeLabel: function () {
        return this.theme === "light" ? "切换到夜间模式" : "切换到日间模式";
      },
      currentYear: function () {
        return new Date().getFullYear();
      },
      services: function () {
        return this.summary.services || [];
      },
      alerts: function () {
        return this.summary.alerts || [];
      },
      host: function () {
        return this.summary.host || {};
      },
      cpuLoadValues: function () {
        var load = this.realtime.cpu && this.realtime.cpu.load;
        return Array.isArray(load) ? load : [];
      },
      perCoreValues: function () {
        var cores = this.realtime.cpu && this.realtime.cpu.per_core;
        return Array.isArray(cores) ? cores : [];
      },
      realtimeSeries: function () {
        var series = this.realtime.series;
        return Array.isArray(series) ? series : [];
      },
      realtimeDisks: function () {
        var disks = this.realtime.disks;
        return Array.isArray(disks) ? disks : [];
      },
      dockerContainers: function () {
        var containers = this.docker && this.docker.containers;
        return Array.isArray(containers) ? containers : [];
      },
      dockerCounts: function () {
        var counts = (this.docker && this.docker.counts) || {};
        return {
          total: Number(counts.total) || 0,
          running: Number(counts.running) || 0
        };
      },
      dockerImages: function () {
        var images = this.docker && this.docker.images;
        return Array.isArray(images) ? images : [];
      },
      dockerVolumes: function () {
        var volumes = this.docker && this.docker.volumes;
        return Array.isArray(volumes) ? volumes : [];
      },
      dockerNetworks: function () {
        var networks = this.docker && this.docker.networks;
        return Array.isArray(networks) ? networks : [];
      },
      securityBans: function () {
        var bans = this.security && this.security.banned;
        return Array.isArray(bans) ? bans : [];
      },
      securityOffenders: function () {
        var offenders = this.security && this.security.offenders;
        return Array.isArray(offenders) ? offenders : [];
      },
      rootDiskLabel: function () {
        var disks = this.realtimeDisks;
        if (!disks.length) {
          return "等待磁盘数据";
        }
        // "/" 是 Linux 的系统盘；没有就退到第一个分区。
        var target = disks[0];
        for (var index = 0; index < disks.length; index += 1) {
          if (disks[index].mount === "/") {
            target = disks[index];
            break;
          }
        }
        return "系统盘 " + target.device + " · 剩余 " + this.formatGB(target.free, 1);
      },
      servicesUp: function () {
        return this.services.filter(function (item) {
          return item.status === "active";
        }).length;
      },
      cpuStatus: function () {
        return this.statusInfo(this.metric.cpu_percent, "负载上升").label;
      },
      cpuStatusClass: function () {
        return this.statusInfo(this.metric.cpu_percent, "负载上升").cls;
      },
      trendCards: function () {
        var definitions = [
          { key: "cpu", field: "cpu_percent", label: "CPU" },
          { key: "memory", field: "memory_percent", label: "内存" },
          { key: "disk", field: "disk_percent", label: "磁盘" }
        ];
        return definitions.map(function (definition) {
          var values = this.history.map(function (item) {
            return Number(item[definition.field]);
          }).filter(Number.isFinite);
          return {
            key: definition.key,
            label: definition.label,
            current: values.length ? values[values.length - 1] : null,
            minimum: values.length ? Math.min.apply(Math, values) : null,
            maximum: values.length ? Math.max.apply(Math, values) : null
          };
        }.bind(this));
      },
      trendStartLabel: function () {
        return this.history.length ? this.formatTrendTime(this.history[0].ts) : "--";
      },
      trendEndLabel: function () {
        return this.history.length
          ? this.formatTrendTime(this.history[this.history.length - 1].ts)
          : "--";
      },
      trendDescription: function () {
        if (!this.history.length) {
          return "等待趋势数据";
        }
        return this.trendCards.map(function (card) {
          return card.label + " 当前 " + this.formatPercent(card.current) +
            "，最低 " + this.formatPercent(card.minimum) +
            "，最高 " + this.formatPercent(card.maximum);
        }.bind(this)).join("；");
      },
      weatherCode: function () {
        if (!this.weather) {
          return null;
        }
        var current = this.weather.current || {};
        var today = this.weather.today || {};
        return Number.isFinite(Number(current.weather_code))
          ? Number(current.weather_code)
          : Number(today.weather_code);
      },
      weatherKind: function () {
        return this.weatherKindForCode(this.weatherCode);
      },
      qweatherCode: function () {
        var code = Number(this.weatherCode);
        var isDay = this.weather && this.weather.current ? this.weather.current.is_day !== false : true;
        if (!Number.isFinite(code)) {
          return isDay ? 100 : 150;
        }
        return this.qweatherCodeForCode(code, isDay);
      },
      weatherLabel: function () {
        var labels = {
          clear: "晴朗",
          partlyCloudy: "晴间多云",
          cloudy: "多云",
          fog: "有雾",
          drizzle: "细雨",
          rain: "有雨",
          snow: "有雪",
          storm: "雷暴"
        };
        return labels[this.weatherKind] || "天气未知";
      },
      weatherTip: function () {
        if (!this.weather) {
          return "";
        }
        var hour = this.currentTime.getHours();
        if (hour >= 23 || hour < 6) {
          var nightTips = hour < 2
            ? [
                "夜色已上线，今天辛苦啦，早点睡 zZZ",
                "23 点后的风景留给梦里，收好电脑，去和周公碰个面吧"
              ]
            : hour < 5
              ? [
                  "夜深啦，别让思绪加班到凌晨，泡杯温水就准备休息吧",
                  "月亮都在值夜班，你就别跟它抢工位啦，早点睡 zZZ"
                ]
              : [
                  "天快亮了，先别急着硬撑，能睡一会儿就把被子盖好吧",
                  "凌晨的风很轻，眼睛也该下班啦，补个好觉再出发"
                ];
          return nightTips[this.currentTime.getDate() % nightTips.length];
        }
        var tip = this.weather.tip;
        return typeof tip === "string" ? tip : "";
      },
      weatherCandidates: function () {
        if (!this.weather || !Array.isArray(this.weather.candidates)) {
          return [];
        }
        return this.weather.candidates;
      },
      activeCandidateLabel: function () {
        if (this.weather && typeof this.weather.location_label === "string") {
          return this.weather.location_label;
        }
        return "";
      },
      uptimeLabel: function () {
        var boot = Number(this.host.boot_time);
        if (!Number.isFinite(boot) || boot <= 0) {
          return "";
        }
        return this.formatUptime(Math.max(0, Math.floor(Date.now() / 1000 - boot)));
      }
    },
      mounted: async function () {
        var themeApi = window.FoxOpsTheme || {};
        var savedTheme = themeApi.read ? themeApi.read() : "";
        var initialTheme =
          savedTheme === "light" || savedTheme === "dark"
            ? savedTheme
            : themeApi.system ? themeApi.system() : "dark";
        this.theme = initialTheme;
        if (themeApi.apply) {
          themeApi.apply(initialTheme);
        }
        // 用户未手动选过主题时，跟随系统日间/夜间偏好。
        var themeMedia =
          window.matchMedia && window.matchMedia("(prefers-color-scheme: light)");
        if (themeMedia && !savedTheme) {
          var followSystemTheme = function () {
            if (themeApi.read && themeApi.read()) {
              return;
            }
            var next = themeMedia.matches ? "light" : "dark";
            this.theme = next;
            if (themeApi.apply) {
              themeApi.apply(next);
            }
          }.bind(this);
          if (themeMedia.addEventListener) {
            themeMedia.addEventListener("change", followSystemTheme);
          } else if (themeMedia.addListener) {
            themeMedia.addListener(followSystemTheme);
          }
        }
        var loggedIn = await this.restoreLogin();
        if (!loggedIn) {
          return;
        }
        this.refresh();
        this.initializeWeather();
        // 带 #sysops / #security / #admin 直接进来时落在对应页面；管理页只认管理员。
        var initialView = window.location.hash.replace("#", "");
        var adminViews = initialView === "security" || initialView === "admin";
        if (initialView === "sysops" || (adminViews && this.isAdmin)) {
          this.view = initialView;
        }
        this.securityOpen = this.view === "security" || this.view === "admin";
        this.syncViewTimers();
        refreshTimer = window.setInterval(this.refresh, 30000);
        weatherTimer = window.setInterval(this.refreshWeather, WEATHER_REFRESH_MS);
        clockTimer = window.setInterval(function () {
          this.currentTime = new Date();
        }.bind(this), CLOCK_REFRESH_MS);
      },
      beforeUnmount: function () {
        window.clearInterval(refreshTimer);
        window.clearInterval(weatherTimer);
        window.clearInterval(clockTimer);
        window.clearInterval(sysopsTimer);
        window.clearInterval(dockerTimer);
        window.clearInterval(dockerLogTimer);
        window.clearInterval(securityTimer);
        window.clearTimeout(securityClockTimer);
      },
    methods: {
      authHeaders: function () {
        var token = session.read();
        return token ? { Authorization: "Bearer " + token } : {};
      },
      restoreLogin: async function () {
        // 未持有会话一律跳转独立登录页；会话失效同样跳转。
        var sessionToken = session.read();
        if (!sessionToken) {
          window.location.replace("/login.html");
          return false;
        }
        try {
          var me = await this.fetchJson("/api/auth/me", {
            headers: this.authHeaders()
          });
          this.currentUser = me.username || "";
          this.role = me.role === "admin" ? "admin" : "guest";
          return true;
        } catch (error) {
          session.write("");
          this.currentUser = "";
          this.role = "";
          window.location.replace("/login.html");
          return false;
        }
      },
      handleUserClick: function () {
        // 已登录：hover 即可预览账户菜单；未登录：跳转登录页。
        if (!this.currentUser) {
          window.location.replace("/login.html");
        }
      },
      toggleTheme: function (event) {
        var next = this.theme === "light" ? "dark" : "light";
        var themeApi = window.FoxOpsTheme || {};
        var origin = event && event.currentTarget ? event.currentTarget : null;
        var self = this;
        if (themeApi.save) {
          themeApi.save(next);
        }
        // 扩散切换：快照提交时再改响应式状态，避免图标先于动画跳变。
        if (themeApi.reveal) {
          themeApi.reveal(next, origin, function () {
            self.theme = next;
          });
          return;
        }
        this.theme = next;
        if (themeApi.apply) {
          themeApi.apply(next);
        }
      },
      openPasswordModal: function () {
        this.passwordError = "";
        this.passwordSuccess = "";
        this.passwordForm = { oldPassword: "", newPassword: "", confirmPassword: "" };
        this.showPasswordModal = true;
      },
      closePasswordModal: function () {
        this.showPasswordModal = false;
      },
      logout: async function () {
        this.logoutBusy = true;
        try {
          await this.fetchJson("/api/logout", {
            method: "POST",
            headers: this.authHeaders()
          });
        } catch (error) {
          // 即使服务端失败，本地会话也清除。
        } finally {
          session.write("");
          this.currentUser = "";
          this.role = "";
          this.showPasswordModal = false;
          this.logoutBusy = false;
          window.location.replace("/login.html");
        }
      },
      submitChangePassword: async function () {
        var oldPassword = this.passwordForm.oldPassword;
        var newPassword = this.passwordForm.newPassword;
        var confirmPassword = this.passwordForm.confirmPassword;
        this.passwordError = "";
        this.passwordSuccess = "";
        if (!oldPassword || !newPassword) {
          this.passwordError = "请填写原密码和新密码";
          return;
        }
        if (newPassword.length < 6) {
          this.passwordError = "新密码至少 6 位";
          return;
        }
        if (newPassword !== confirmPassword) {
          this.passwordError = "两次输入的新密码不一致";
          return;
        }
        this.passwordBusy = true;
        try {
          await this.fetchJson("/api/change-password", {
            method: "POST",
            headers: Object.assign({ "Content-Type": "application/json" }, this.authHeaders()),
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
          });
          this.passwordSuccess = "密码已更新，请重新登录";
          this.passwordForm = { oldPassword: "", newPassword: "", confirmPassword: "" };
          // 服务端已使旧会话失效，本地立即退出登录态并回到登录页。
          session.write("");
          this.currentUser = "";
          this.role = "";
          this.showPasswordModal = false;
          window.setTimeout(function () {
            window.location.replace("/login.html");
          }, 600);
        } catch (error) {
          this.passwordError = error.message || "密码修改失败";
        } finally {
          this.passwordBusy = false;
        }
      },
      initializeWeather: function () {
        this.weatherPlace = weatherPlaceStore.read() || DEFAULT_WEATHER_PLACE;
        this.refreshWeather();
      },
      pickDistrict: async function (candidate) {
        if (!candidate || this.weatherLoading) {
          return;
        }
        this.weatherLoading = true;
        this.weatherError = "";
        try {
          var lat = candidate.latitude;
          var lon = candidate.longitude;
          // The lat/lon endpoint returns no district candidates; cache the
          // city-wide list so the district picker stays visible after refining.
          var previousCandidates = this.weather && Array.isArray(this.weather.candidates)
            ? this.weather.candidates
            : [];
          var response = await this.fetchJson(
            "/api/weather?latitude=" + lat + "&longitude=" + lon
          );
          if (
            previousCandidates.length > 1 &&
            (!Array.isArray(response.candidates) ||
              response.candidates.length < previousCandidates.length)
          ) {
            response.candidates = previousCandidates;
          }
          // The lat/lon endpoint labels the location "当前位置"; substitute the
          // picked district's label so the picker and emblem show e.g.
          // "广州-海珠区".
          if (candidate.label) {
            response.location_label = candidate.label;
          }
          this.weather = response;
        } catch (error) {
          this.weatherError = error.message || "天气数据暂时不可用";
        } finally {
          this.weatherLoading = false;
        }
      },
      searchWeather: function () {
        var place = (this.weatherPlace || "").trim();
        if (!place) {
          this.weatherError = "请输入城市名称";
          return;
        }
        weatherPlaceStore.write(place);
        this.refreshWeather();
      },
      refreshWeather: async function () {
        var place = (this.weatherPlace || "").trim();
        if (!place || this.weatherLoading) {
          return;
        }
        this.weatherLoading = true;
        this.weatherError = "";
        try {
          this.weather = await this.fetchJson(
            "/api/weather?place=" + encodeURIComponent(place)
          );
        } catch (error) {
          this.weatherError = error.message || "天气数据暂时不可用";
        } finally {
          this.weatherLoading = false;
        }
      },
      weatherKindForCode: function (value) {
        var code = Number(value);
        if (!Number.isFinite(code)) {
          return "unknown";
        }
        if (code === 0) return "clear";
        if (code === 1 || code === 2) return "partlyCloudy";
        if (code === 3) return "cloudy";
        if (code === 45 || code === 48) return "fog";
        if (code >= 51 && code <= 57) return "drizzle";
        if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
        if (code >= 95) return "storm";
        return "unknown";
      },
      qweatherCodeForCode: function (value, isDay) {
        var code = Number(value);
        var day = isDay !== false;
        if (!Number.isFinite(code)) {
          return day ? 100 : 150;
        }
        var dayCode = QWEATHER_CODES[code] || 103;
        return day ? dayCode : (QWEATHER_NIGHT_CODES[dayCode] || dayCode);
      },
      formatTemperature: function (value) {
        return Number.isFinite(Number(value)) ? Math.round(Number(value)) + "°" : "--";
      },
      fetchJson: async function (url, options) {
        var controller = new AbortController();
        var timeout = window.setTimeout(function () {
          controller.abort();
        }, REQUEST_TIMEOUT_MS);
        var requestOptions = Object.assign({}, options || {}, {
          signal: controller.signal
        });
        try {
          var response = await window.fetch(url, requestOptions);
          var body = await response.json().catch(function () {
            return {};
          });
          if (!response.ok) {
            var requestError = new Error(
              body.detail || "请求失败（" + response.status + "）"
            );
            requestError.status = response.status;
            throw requestError;
          }
          return body;
        } catch (error) {
          if (error && error.name === "AbortError") {
            throw new Error("请求超时，请稍后重试");
          }
          throw error;
        } finally {
          window.clearTimeout(timeout);
        }
      },
      refresh: async function () {
        if (this.loading) {
          this.refreshRequested = true;
          return;
        }
        this.loading = true;
        this.error = "";
        var requestedRange = this.range;
        try {
          var results = await Promise.all([
            this.fetchJson("/api/summary"),
            this.fetchJson("/api/metrics?range=" + encodeURIComponent(requestedRange))
          ]);
          this.summary = results[0];
          if (this.range === requestedRange) {
            this.history = results[1].points || [];
          } else {
            this.refreshRequested = true;
          }
          this.trendHover = null;
          this.updatedAt = this.formatCurrentDate();
        } catch (error) {
          this.error = error.message || "无法加载监控数据";
        } finally {
          this.loading = false;
          if (this.refreshRequested) {
            this.refreshRequested = false;
            window.setTimeout(this.refresh, 0);
          }
        }
      },
      setRange: function (value) {
        if (this.range === value) {
          return;
        }
        this.range = value;
        this.trendHover = null;
        this.refresh();
      },
      setView: function (next) {
        if (this.view === next) {
          return;
        }
        // 安全防护 / 后台管理只对管理员开放；访客即便手改 hash 也留在原页。
        if ((next === "security" || next === "admin") && !this.isAdmin) {
          return;
        }
        this.view = next;
        if (next === "security" || next === "admin") {
          this.securityOpen = true;
        }
        if ("#" + next !== window.location.hash) {
          window.history.replaceState(null, "", "#" + next);
        }
        this.syncViewTimers();
      },
      openSecurityGroup: function () {
        this.securityOpen = true;
        this.setView("security");
      },
      toggleSecurityGroup: function () {
        this.securityOpen = !this.securityOpen;
      },
      syncViewTimers: function () {
        // 切走就停表：看不见的页面不该继续定时敲服务器。
        window.clearInterval(sysopsTimer);
        window.clearInterval(dockerTimer);
        // 日志自动刷新只在展开容器的那一屏有意义，切视图立刻收掉。
        this.stopDockerLogTimer();
        window.clearInterval(securityTimer);
        window.clearTimeout(securityClockTimer);
        sysopsTimer = null;
        dockerTimer = null;
        securityTimer = null;
        securityClockTimer = null;
        if (this.view === "sysops") {
          this.refreshSysops();
          this.refreshDocker();
          sysopsTimer = window.setInterval(this.refreshSysops, SYSOPS_REFRESH_MS);
          dockerTimer = window.setInterval(this.refreshDocker, DOCKER_REFRESH_MS);
          return;
        }
        if (this.view === "security" && this.isAdmin) {
          this.tickSecurityClock();
          this.refreshSecurity();
          securityTimer = window.setInterval(
            this.refreshSecurity,
            SECURITY_REFRESH_MS
          );
          this.scheduleSecurityClockTick();
        }
        if (this.view === "admin" && this.isAdmin) {
          this.refreshPolicy();
        }
      },
      // 每秒只排下一次整秒，而不是用 setInterval(1000)：定时器的回调会被 5 秒
      // 刷新、图表重绘推迟，固定间隔一旦累计到跨过整秒，秒表就会"两秒跳一格"。
      scheduleSecurityClockTick: function () {
        var vm = this;
        // 按服务器时间算到下一个整秒的间隔，跳秒点才和显示值对齐。
        var corrected = Date.now() + this.securityServerOffsetMs;
        var toNextSecond = 1000 - (((corrected % 1000) + 1000) % 1000) + 20;
        securityClockTimer = window.setTimeout(function () {
          if (vm.view !== "security") {
            securityClockTimer = null;
            return;
          }
          vm.tickSecurityClock();
          vm.scheduleSecurityClockTick();
        }, toNextSecond);
      },
      tickSecurityClock: function () {
        this.securityClock = this.formatClock(
          new Date(Date.now() + this.securityServerOffsetMs)
        );
      },
      refreshSysops: async function () {
        if (this.view !== "sysops") {
          return;
        }
        try {
          var realtime = await this.fetchJson("/api/sysops/realtime");
          if (payloadChanged(this.realtime, realtime)) {
            this.realtime = realtime;
          }
          this.sysopsError = "";
          this.sysopsUpdatedAt = this.formatClock();
        } catch (error) {
          this.sysopsError = error.message || "无法加载实时监控数据";
        }
      },
      refreshDocker: async function () {
        if (this.dockerLoading) {
          return;
        }
        this.dockerLoading = true;
        try {
          var docker = await this.fetchJson("/api/sysops/docker");
          if (payloadChanged(this.docker, docker)) {
            this.docker = docker;
          }
        } catch (error) {
          this.docker = {
            available: false,
            reason: error.message || "docker 数据加载失败",
            hint: null,
            containers: [],
            counts: { total: 0, running: 0 },
            images: [],
            volumes: [],
            networks: []
          };
        } finally {
          this.dockerLoading = false;
        }
      },
      toggleDockerDetail: function (item) {
        if (!item || !item.id) {
          return;
        }
        if (this.dockerExpanded === item.id) {
          this.closeDockerDetail();
          return;
        }
        this.stopDockerLogTimer();
        this.dockerExpanded = item.id;
        this.dockerTab = "overview";
        this.dockerDetail = null;
        this.dockerDetailError = "";
        this.dockerLogs = null;
        this.dockerLogsError = "";
        this.loadDockerDetail();
      },
      closeDockerDetail: function () {
        this.stopDockerLogTimer();
        this.dockerExpanded = "";
        this.dockerDetail = null;
        this.dockerDetailError = "";
        this.dockerLogs = null;
        this.dockerLogsError = "";
      },
      setDockerTab: function (tab) {
        if (this.dockerTab === tab) {
          return;
        }
        this.dockerTab = tab;
        if (tab === "logs") {
          if (!this.dockerLogs && !this.dockerLogsLoading) {
            this.loadDockerLogs();
          }
        } else {
          this.stopDockerLogTimer();
        }
      },
      loadDockerDetail: async function () {
        var containerId = this.dockerExpanded;
        if (!containerId) {
          return;
        }
        this.dockerDetailLoading = true;
        this.dockerDetailError = "";
        try {
          var detail = await this.fetchJson(
            "/api/docker/containers/" + encodeURIComponent(containerId) + "/inspect",
            { headers: this.authHeaders() }
          );
          // 等待期间可能已经切到别的容器，回填前再确认一次。
          if (this.dockerExpanded === containerId) {
            this.dockerDetail = detail;
          }
        } catch (error) {
          if (this.dockerExpanded === containerId) {
            this.dockerDetailError = error.message || "读取容器详情失败";
          }
        } finally {
          this.dockerDetailLoading = false;
        }
      },
      loadDockerLogs: async function () {
        var containerId = this.dockerExpanded;
        if (!containerId || this.dockerLogsLoading) {
          return;
        }
        this.dockerLogsLoading = true;
        this.dockerLogsError = "";
        try {
          var logs = await this.fetchJson(
            "/api/docker/containers/" +
              encodeURIComponent(containerId) +
              "/logs?tail=" +
              this.dockerLogTail,
            { headers: this.authHeaders() }
          );
          if (this.dockerExpanded === containerId) {
            this.dockerLogs = logs;
            this.scrollDockerLog();
          }
        } catch (error) {
          if (this.dockerExpanded === containerId) {
            this.dockerLogsError = error.message || "读取容器日志失败";
          }
        } finally {
          this.dockerLogsLoading = false;
        }
      },
      setDockerLogTail: function (tail) {
        var next = Number(tail) || 200;
        if (this.dockerLogTail === next) {
          return;
        }
        this.dockerLogTail = next;
        this.dockerLogs = null;
        this.loadDockerLogs();
      },
      toggleDockerLogAuto: function (event) {
        this.stopDockerLogTimer();
        var checked = !!(event && event.target && event.target.checked);
        this.dockerLogAuto = checked;
        if (!checked) {
          return;
        }
        var self = this;
        dockerLogTimer = window.setInterval(function () {
          self.loadDockerLogs();
        }, 3000);
      },
      stopDockerLogTimer: function () {
        if (dockerLogTimer) {
          window.clearInterval(dockerLogTimer);
          dockerLogTimer = null;
        }
        this.dockerLogAuto = false;
      },
      scrollDockerLog: function () {
        this.$nextTick(function () {
          var body = document.querySelector(".docker-log-body");
          if (body) {
            body.scrollTop = body.scrollHeight;
          }
        });
      },
      dockerStateLabel: function (detail) {
        var state = (detail && detail.state) || {};
        var parts = [state.status || "unknown"];
        if (state.health) {
          parts.push("健康检查 " + state.health);
        }
        if (state.oom_killed) {
          parts.push("曾因 OOM 被杀");
        }
        return parts.join(" · ");
      },
      formatDockerTime: function (value) {
        if (!value || String(value).indexOf("0001-01-01") === 0) {
          return "--";
        }
        var date = new Date(value);
        if (!Number.isFinite(date.getTime())) {
          return String(value);
        }
        return date.toLocaleString();
      },
      refreshSecurity: async function () {
        if (this.view !== "security" || !this.isAdmin || this.securityBusy) {
          return;
        }
        this.securityBusy = true;
        try {
          var next = await this.fetchJson("/api/security/status", {
            headers: this.authHeaders()
          });
          // 每次拿到状态就校正一次客户端时钟偏移，数据更新时间跟服务器对齐。
          var serverTime = Date.parse(next.server_time || "");
          this.securityServerOffsetMs = Number.isFinite(serverTime)
            ? serverTime - Date.now()
            : 0;
          this.tickSecurityClock();
          // server_time 每次都变，比对时忽略；其余字段一样就不重渲染。
          if (payloadChanged(this.security, next, ["server_time"])) {
            this.security = next;
          }
          this.securityReady = true;
          this.securityError = "";
        } catch (error) {
          this.securityError = error.message || "无法读取安全防护数据";
        } finally {
          this.securityBusy = false;
        }
      },
      unbanIp: async function (ip) {
        if (!window.confirm("确认解封 " + ip + "？解封后该来源可以立即继续访问。")) {
          return;
        }
        try {
          await this.fetchJson("/api/security/unban", {
            method: "POST",
            headers: Object.assign(
              { "Content-Type": "application/json" },
              this.authHeaders()
            ),
            body: JSON.stringify({ ip: ip })
          });
          await this.refreshSecurity();
        } catch (error) {
          window.alert("解封失败：" + error.message);
        }
      },
      refreshPolicy: async function () {
        if (this.view !== "admin" || !this.isAdmin || this.policyLoading) {
          return;
        }
        this.policyLoading = true;
        try {
          this.policy = await this.fetchJson("/api/security/policy", {
            headers: this.authHeaders()
          });
          this.fillPolicyForm(this.policy.current || {});
          this.policyError = "";
        } catch (error) {
          this.policyError = error.message || "无法读取限流策略";
        } finally {
          this.policyLoading = false;
        }
      },
      fillPolicyForm: function (current) {
        this.policyForm = {
          enabled: current.enabled !== false,
          burst_limit: Number(current.burst_limit) || 60,
          burst_window_seconds: Number(current.burst_window_seconds) || 10,
          sustained_limit: Number(current.sustained_limit) || 300,
          sustained_window_seconds: Number(current.sustained_window_seconds) || 60,
          max_concurrent: Number(current.max_concurrent) || 24,
          max_global_concurrent: Number(current.max_global_concurrent) || 200,
          max_body_kib: Math.max(
            1,
            Math.round((Number(current.max_body_bytes) || 1048576) / 1024)
          ),
          strike_limit: Number(current.strike_limit) || 3,
          strike_window_seconds: Number(current.strike_window_seconds) || 300,
          ban_seconds: Number(current.ban_seconds) || 600,
          max_ban_seconds: Number(current.max_ban_seconds) || 86400
        };
      },
      policyMin: function (name) {
        var bound = (this.policy.bounds || {})[name];
        return bound && bound.min !== undefined ? bound.min : null;
      },
      policyMax: function (name) {
        var bound = (this.policy.bounds || {})[name];
        return bound && bound.max !== undefined ? bound.max : null;
      },
      policyRequestPayload: function () {
        var form = this.policyForm;
        return {
          enabled: !!form.enabled,
          burst_limit: Number(form.burst_limit),
          burst_window_seconds: Number(form.burst_window_seconds),
          sustained_limit: Number(form.sustained_limit),
          sustained_window_seconds: Number(form.sustained_window_seconds),
          max_concurrent: Number(form.max_concurrent),
          max_global_concurrent: Number(form.max_global_concurrent),
          max_body_bytes: Math.max(1024, Math.round(Number(form.max_body_kib) * 1024)),
          strike_limit: Number(form.strike_limit),
          strike_window_seconds: Number(form.strike_window_seconds),
          ban_seconds: Number(form.ban_seconds),
          max_ban_seconds: Number(form.max_ban_seconds)
        };
      },
      flashPolicySuccess: function (message) {
        this.policySuccess = message;
        var self = this;
        window.setTimeout(function () {
          self.policySuccess = "";
        }, 4000);
      },
      savePolicy: async function () {
        if (this.policySaving) {
          return;
        }
        this.policySaving = true;
        this.policyError = "";
        this.policySuccess = "";
        try {
          this.policy = await this.fetchJson("/api/security/policy", {
            method: "PUT",
            headers: Object.assign(
              { "Content-Type": "application/json" },
              this.authHeaders()
            ),
            body: JSON.stringify(this.policyRequestPayload())
          });
          this.fillPolicyForm(this.policy.current || {});
          this.flashPolicySuccess("策略已保存并立即生效");
        } catch (error) {
          this.policyError = error.message || "保存策略失败";
        } finally {
          this.policySaving = false;
        }
      },
      resetPolicy: async function () {
        if (!window.confirm("恢复环境变量中的默认限流策略？当前自定义值会被删除。")) {
          return;
        }
        if (this.policySaving) {
          return;
        }
        this.policySaving = true;
        this.policyError = "";
        this.policySuccess = "";
        try {
          this.policy = await this.fetchJson("/api/security/policy", {
            method: "DELETE",
            headers: this.authHeaders()
          });
          this.fillPolicyForm(this.policy.current || {});
          this.flashPolicySuccess("已恢复环境默认策略");
        } catch (error) {
          this.policyError = error.message || "恢复默认策略失败";
        } finally {
          this.policySaving = false;
        }
      },
      realtimePoints: function (key) {
        var series = this.realtimeSeries;
        if (!series.length) {
          return "";
        }
        var lastIndex = Math.max(1, series.length - 1);
        return series.map(function (point, index) {
          return (index / lastIndex * 1000).toFixed(2) + "," + chartY(point[key]).toFixed(2);
        }).join(" ");
      },
      coreBarHeight: function (value) {
        return Math.max(6, this.clampNumber(value)) + "%";
      },
      formatUptime: function (seconds) {
        var total = Number(seconds);
        if (!Number.isFinite(total) || total <= 0) {
          return "";
        }
        total = Math.floor(total);
        if (total < 60) {
          return total + " 秒";
        }
        var days = Math.floor(total / 86400);
        var hours = Math.floor((total % 86400) / 3600);
        var minutes = Math.floor((total % 3600) / 60);
        if (days > 0) {
          return days + " 天 " + hours + " 小时 " + minutes + " 分";
        }
        if (hours > 0) {
          return hours + " 小时 " + minutes + " 分";
        }
        return minutes + " 分";
      },
      // 安全防护页的时长一律走这里：前端展示精度到秒/分/时/天，后端只给秒数。
      formatDuration: function (seconds) {
        var total = Math.round(Number(seconds));
        if (!Number.isFinite(total) || total <= 0) {
          return "0 秒";
        }
        if (total < 60) {
          return total + " 秒";
        }
        var minutes = Math.floor(total / 60);
        if (minutes < 60) {
          return minutes + " 分钟";
        }
        var hours = Math.floor(minutes / 60);
        var restMinutes = minutes % 60;
        if (hours < 24) {
          return restMinutes
            ? hours + " 小时 " + restMinutes + " 分"
            : hours + " 小时";
        }
        var days = Math.floor(hours / 24);
        var restHours = hours % 24;
        return restHours ? days + " 天 " + restHours + " 小时" : days + " 天";
      },
      formatRate: function (value) {
        var bytes = Number(value);
        if (!Number.isFinite(bytes) || bytes <= 0) {
          return "0 B/s";
        }
        var units = ["B/s", "KB/s", "MB/s", "GB/s"];
        var index = 0;
        var size = bytes;
        while (size >= 1024 && index < units.length - 1) {
          size = size / 1024;
          index += 1;
        }
        return (index === 0 ? size.toFixed(0) : size.toFixed(1)) + " " + units[index];
      },
      formatClock: function (value) {
        var now = value instanceof Date ? value : new Date();
        return [now.getHours(), now.getMinutes(), now.getSeconds()].map(function (part) {
          return String(part).padStart(2, "0");
        }).join(":");
      },
      chartPoints: function (key) {
        if (!this.history.length) {
          return "";
        }
        var lastIndex = Math.max(1, this.history.length - 1);
        return this.history.map(function (item, index) {
          var x = index / lastIndex * 1000;
          return x.toFixed(2) + "," + chartY(item[key]).toFixed(2);
        }).join(" ");
      },
      updateTrendHover: function (event) {
        var svg = this.$refs.trendSvg;
        if (!svg || !this.history.length) {
          this.trendHover = null;
          return;
        }

        var svgRect = svg.getBoundingClientRect();
        var shellRect = event.currentTarget.getBoundingClientRect();
        if (!svgRect.width || !shellRect.width) {
          return;
        }

        var ratio = Math.max(0, Math.min(1, (event.clientX - svgRect.left) / svgRect.width));
        var index = Math.round(ratio * Math.max(0, this.history.length - 1));
        var point = this.history[index];
        var x = this.history.length > 1
          ? index / (this.history.length - 1) * 1000
          : 0;
        var screenX = svgRect.left - shellRect.left + x / 1000 * svgRect.width;
        var tooltipLeft = Math.max(92, Math.min(shellRect.width - 92, screenX));

        this.trendHover = {
          x: x,
          tooltipLeft: tooltipLeft,
          ts: point.ts,
          cpu: Number(point.cpu_percent),
          memory: Number(point.memory_percent),
          disk: Number(point.disk_percent),
          cpuY: chartY(point.cpu_percent),
          memoryY: chartY(point.memory_percent),
          diskY: chartY(point.disk_percent)
        };
      },
      clearTrendHover: function () {
        this.trendHover = null;
      },
      formatDate: function (value, options) {
        return value
          ? new Date(value).toLocaleString(
              "zh-CN",
              Object.assign({ hour12: false }, options)
            )
          : "--";
      },
      formatTrendTime: function (value) {
        return this.formatDate(value, { hour: "2-digit", minute: "2-digit" });
      },
      formatHoverTime: function (value) {
        return this.formatDate(value, {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
      },
      restartService: async function (service) {
        if (!window.confirm("确认重启服务 " + service + "？")) {
          return;
        }
        this.restartBusy = service;
        try {
          await this.fetchJson("/api/services/" + encodeURIComponent(service) + "/restart", {
            method: "POST",
            headers: this.authHeaders()
          });
          window.alert(service + " 已完成重启");
          await this.refresh();
        } catch (error) {
          window.alert("重启失败：" + error.message);
        } finally {
          this.restartBusy = "";
        }
      },
      runMaintenance: async function () {
        try {
          var result = await this.fetchJson("/api/maintenance/run", {
            method: "POST",
            headers: this.authHeaders()
          });
          window.alert("备份已完成：" + result.backup);
        } catch (error) {
          window.alert("备份失败：" + error.message);
        }
      },
      formatPercent: function (value) {
        return typeof value === "number" ? value.toFixed(1) + "%" : "--";
      },
      // 容器 CPU 常在 0.0x% 量级，1 位小数会全变成 0.0%。
      formatCpuShare: function (value) {
        if (value === null || value === undefined || value === "") {
          return "--";
        }
        var number = Number(value);
        return Number.isFinite(number) ? number.toFixed(2) + "%" : "--";
      },
      formatLoad: function (value) {
        var n = Number(value);
        return Number.isFinite(n) ? n.toFixed(2) : "--";
      },
      clampPercent: function (value) {
        return this.clampNumber(value) + "%";
      },
      clampNumber: function (value) {
        return Math.max(0, Math.min(100, Number(value) || 0));
      },
      statusInfo: function (value, risingLabel) {
        var safe = Number(value);
        if (!Number.isFinite(safe)) {
          return { label: "等待数据", cls: "waiting" };
        }
        if (safe < 50) {
          return { label: "运行平稳", cls: "normal" };
        }
        if (safe < 80) {
          return { label: risingLabel, cls: "elevated" };
        }
        return { label: "需要关注", cls: "critical" };
      },
      statusLabel: function (value) {
        return this.statusInfo(value, "使用偏高").label;
      },
      statusClass: function (value) {
        return this.statusInfo(value, "使用偏高").cls;
      },
      formatGB: function (value, decimals) {
        var bytes = Number(value);
        if (!Number.isFinite(bytes) || bytes <= 0) {
          return "--";
        }
        return (bytes / 1073741824).toFixed(decimals) + " GB";
      },
      formatTime: function (value) {
        return this.formatDate(value);
      },
      formatCurrentDate: function () {
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, "0");
        var day = String(now.getDate()).padStart(2, "0");
        var hour = String(now.getHours()).padStart(2, "0");
        var minute = String(now.getMinutes()).padStart(2, "0");
        var second = String(now.getSeconds()).padStart(2, "0");
        return year + "年" + month + "月" + day + "日 " + hour + ":" + minute + ":" + second;
      }
    }
  }).mount("#app");
})();