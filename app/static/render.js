/* Generated from index.html by @vue/compiler-dom 3.5.17. */
window.FoxOpsRender = (function (Vue) {
const { createElementVNode: _createElementVNode, openBlock: _openBlock, createElementBlock: _createElementBlock, normalizeClass: _normalizeClass, withModifiers: _withModifiers, createCommentVNode: _createCommentVNode, vShow: _vShow, withDirectives: _withDirectives, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, vModelText: _vModelText, normalizeStyle: _normalizeStyle, renderList: _renderList, Fragment: _Fragment, withKeys: _withKeys, vModelCheckbox: _vModelCheckbox, createStaticVNode: _createStaticVNode } = Vue

const _hoisted_1 = {
  class: "sidebar",
  "aria-label": "模块导航"
}
const _hoisted_2 = { class: "sidebar-nav" }
const _hoisted_3 = ["aria-current"]
const _hoisted_4 = ["aria-current"]
const _hoisted_5 = ["aria-current"]
const _hoisted_6 = ["aria-expanded"]
const _hoisted_7 = {
  key: 1,
  id: "security-submenu",
  class: "sidebar-submenu"
}
const _hoisted_8 = ["aria-current"]
const _hoisted_9 = { class: "sidebar-foot" }
const _hoisted_10 = { class: "workspace" }
const _hoisted_11 = { class: "topbar" }
const _hoisted_12 = { class: "header-actions" }
const _hoisted_13 = {
  class: "muted",
  "aria-live": "polite"
}
const _hoisted_14 = { class: "user-menu" }
const _hoisted_15 = {
  key: 0,
  class: "user-menu-caret",
  "aria-hidden": "true"
}
const _hoisted_16 = {
  key: 0,
  class: "user-menu-dropdown",
  role: "menu",
  "aria-label": "账户菜单"
}
const _hoisted_17 = { class: "user-menu-account" }
const _hoisted_18 = ["disabled"]
const _hoisted_19 = ["aria-label", "title"]
const _hoisted_20 = ["disabled", "aria-busy"]
const _hoisted_21 = {
  class: "modal",
  role: "dialog",
  "aria-modal": "true",
  "aria-labelledby": "password-title"
}
const _hoisted_22 = { class: "modal-head" }
const _hoisted_23 = { class: "modal-field" }
const _hoisted_24 = { class: "modal-field" }
const _hoisted_25 = { class: "modal-field" }
const _hoisted_26 = {
  key: 0,
  class: "modal-error",
  role: "alert"
}
const _hoisted_27 = {
  key: 1,
  class: "modal-success",
  role: "status"
}
const _hoisted_28 = { class: "modal-actions" }
const _hoisted_29 = ["disabled"]
const _hoisted_30 = { class: "page-shell" }
const _hoisted_31 = {
  class: "hero",
  "aria-labelledby": "page-title"
}
const _hoisted_32 = { class: "host-summary" }
const _hoisted_33 = {
  class: "hero-weather",
  "aria-label": "每日天气"
}
const _hoisted_34 = ["title"]
const _hoisted_35 = {
  key: 0,
  class: "weather-emblem-readout"
}
const _hoisted_36 = {
  key: 0,
  class: "weather-emblem-tip"
}
const _hoisted_37 = {
  key: 1,
  class: "weather-emblem-readout"
}
const _hoisted_38 = {
  key: 2,
  class: "weather-district-list",
  role: "listbox",
  "aria-label": "细化到区"
}
const _hoisted_39 = ["disabled", "onClick"]
const _hoisted_40 = { class: "weather-picker" }
const _hoisted_41 = { class: "weather-picker-place" }
const _hoisted_42 = { class: "weather-picker-row" }
const _hoisted_43 = ["disabled"]
const _hoisted_44 = ["disabled"]
const _hoisted_45 = { class: "hero-status" }
const _hoisted_46 = { class: "hero-status-row" }
const _hoisted_47 = { class: "muted" }
const _hoisted_48 = {
  class: "hero-status-uptime muted",
  "aria-label": "服务器运行时间"
}
const _hoisted_49 = {
  key: 0,
  class: "error-banner",
  role: "alert"
}
const _hoisted_50 = {
  class: "metric-grid",
  "aria-label": "资源概览"
}
const _hoisted_51 = { class: "metric-card cpu-card" }
const _hoisted_52 = { class: "metric-card-head" }
const _hoisted_53 = { class: "processor-spec" }
const _hoisted_54 = { class: "metric-body" }
const _hoisted_55 = { class: "metric-value" }
const _hoisted_56 = {
  class: "load-average",
  "aria-label": "平均负载（1 分钟 / 5 分钟 / 15 分钟）"
}
const _hoisted_57 = { class: "load-average-item" }
const _hoisted_58 = { class: "load-average-item" }
const _hoisted_59 = { class: "load-average-item" }
const _hoisted_60 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_61 = { class: "metric-card" }
const _hoisted_62 = { class: "metric-card-head" }
const _hoisted_63 = { class: "metric-body" }
const _hoisted_64 = { class: "metric-value" }
const _hoisted_65 = { class: "capacity-details" }
const _hoisted_66 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_67 = { class: "metric-foot" }
const _hoisted_68 = { class: "metric-card" }
const _hoisted_69 = { class: "metric-card-head" }
const _hoisted_70 = { class: "metric-body" }
const _hoisted_71 = { class: "metric-value" }
const _hoisted_72 = { class: "capacity-details" }
const _hoisted_73 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_74 = { class: "metric-foot" }
const _hoisted_75 = { class: "metric-card" }
const _hoisted_76 = { class: "metric-card-head" }
const _hoisted_77 = { class: "metric-body" }
const _hoisted_78 = { class: "metric-value" }
const _hoisted_79 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_80 = { class: "metric-foot" }
const _hoisted_81 = {
  class: "panel trend-panel",
  "aria-labelledby": "trend-title"
}
const _hoisted_82 = { class: "panel-head" }
const _hoisted_83 = {
  class: "segment-control",
  "aria-label": "趋势时间范围"
}
const _hoisted_84 = ["aria-pressed", "onClick"]
const _hoisted_85 = { class: "trend-summary" }
const _hoisted_86 = {
  key: 0,
  class: "trend-stats"
}
const _hoisted_87 = { class: "trend-stat-name" }
const _hoisted_88 = {
  ref: "trendSvg",
  class: "trend-svg",
  viewBox: "0 0 1000 260",
  preserveAspectRatio: "none",
  role: "img",
  "aria-label": "CPU、内存和磁盘使用率趋势",
  "aria-describedby": "trend-description",
  tabindex: "0"
}
const _hoisted_89 = ["points"]
const _hoisted_90 = ["points"]
const _hoisted_91 = ["points"]
const _hoisted_92 = {
  key: 0,
  class: "trend-hover-layer"
}
const _hoisted_93 = ["x1", "x2"]
const _hoisted_94 = ["cx", "cy"]
const _hoisted_95 = ["cx", "cy"]
const _hoisted_96 = ["cx", "cy"]
const _hoisted_97 = { class: "chart-time-axis" }
const _hoisted_98 = {
  key: 2,
  class: "chart-empty"
}
const _hoisted_99 = {
  id: "trend-description",
  class: "sr-only",
  "aria-live": "polite"
}
const _hoisted_100 = { class: "two-column" }
const _hoisted_101 = {
  class: "panel",
  "aria-labelledby": "services-title"
}
const _hoisted_102 = { class: "service-list" }
const _hoisted_103 = { class: "service-name" }
const _hoisted_104 = ["title"]
const _hoisted_105 = {
  key: 1,
  class: "service-owner"
}
const _hoisted_106 = ["disabled", "onClick"]
const _hoisted_107 = {
  key: 0,
  class: "empty-state"
}
const _hoisted_108 = {
  class: "panel",
  "aria-labelledby": "alerts-title"
}
const _hoisted_109 = { class: "panel-head compact" }
const _hoisted_110 = { class: "alert-list" }
const _hoisted_111 = {
  key: 0,
  class: "empty-state success"
}
const _hoisted_112 = {
  class: "hero sysops-hero",
  "aria-labelledby": "sysops-title"
}
const _hoisted_113 = { class: "host-summary" }
const _hoisted_114 = { class: "hero-status" }
const _hoisted_115 = { class: "hero-status-row" }
const _hoisted_116 = {
  class: "muted",
  "aria-live": "polite"
}
const _hoisted_117 = {
  class: "hero-status-uptime muted",
  "aria-label": "服务器运行时间"
}
const _hoisted_118 = {
  key: 0,
  class: "error-banner",
  role: "alert"
}
const _hoisted_119 = {
  class: "metric-grid sysops-grid",
  "aria-label": "实时资源概览"
}
const _hoisted_120 = { class: "metric-card" }
const _hoisted_121 = { class: "metric-card-head" }
const _hoisted_122 = { class: "processor-spec" }
const _hoisted_123 = { class: "metric-body" }
const _hoisted_124 = { class: "metric-value" }
const _hoisted_125 = {
  class: "load-average",
  "aria-label": "平均负载（1 分钟 / 5 分钟 / 15 分钟）"
}
const _hoisted_126 = { class: "load-average-item" }
const _hoisted_127 = { class: "load-average-item" }
const _hoisted_128 = { class: "load-average-item" }
const _hoisted_129 = {
  class: "core-bars",
  "aria-label": "各核心占用"
}
const _hoisted_130 = ["title"]
const _hoisted_131 = {
  key: 0,
  class: "core-bars-empty"
}
const _hoisted_132 = { class: "metric-card" }
const _hoisted_133 = { class: "metric-card-head" }
const _hoisted_134 = { class: "metric-body" }
const _hoisted_135 = { class: "metric-value" }
const _hoisted_136 = { class: "capacity-details" }
const _hoisted_137 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_138 = { class: "metric-foot" }
const _hoisted_139 = { class: "metric-card" }
const _hoisted_140 = { class: "metric-card-head" }
const _hoisted_141 = { class: "metric-body" }
const _hoisted_142 = { class: "metric-value" }
const _hoisted_143 = { class: "capacity-details" }
const _hoisted_144 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_145 = { class: "metric-foot" }
const _hoisted_146 = {
  class: "panel pulse-panel",
  "aria-labelledby": "pulse-title"
}
const _hoisted_147 = {
  key: 0,
  class: "svg-chart-shell"
}
const _hoisted_148 = {
  class: "trend-svg",
  viewBox: "0 0 1000 260",
  preserveAspectRatio: "none",
  role: "img",
  "aria-label": "CPU、内存和磁盘最近 90 秒实时走势"
}
const _hoisted_149 = ["points"]
const _hoisted_150 = ["points"]
const _hoisted_151 = ["points"]
const _hoisted_152 = {
  key: 1,
  class: "chart-empty"
}
const _hoisted_153 = {
  class: "panel",
  "aria-labelledby": "disks-title"
}
const _hoisted_154 = { class: "panel-head compact" }
const _hoisted_155 = { class: "muted" }
const _hoisted_156 = { class: "disk-list" }
const _hoisted_157 = { class: "disk-ident" }
const _hoisted_158 = { class: "disk-meter" }
const _hoisted_159 = ["aria-label", "aria-valuenow", "aria-valuetext"]
const _hoisted_160 = { class: "disk-capacity" }
const _hoisted_161 = {
  key: 0,
  class: "empty-state"
}
const _hoisted_162 = {
  class: "panel docker-panel",
  "aria-labelledby": "docker-title"
}
const _hoisted_163 = { class: "panel-head compact" }
const _hoisted_164 = { class: "docker-counts" }
const _hoisted_165 = { class: "docker-pill running" }
const _hoisted_166 = { class: "docker-pill" }
const _hoisted_167 = {
  key: 0,
  class: "docker-pill stale",
  title: "root 探针最近一次采集失败或已停止"
}
const _hoisted_168 = ["disabled"]
const _hoisted_169 = {
  key: 0,
  class: "docker-list"
}
const _hoisted_170 = ["aria-expanded", "onClick"]
const _hoisted_171 = ["title"]
const _hoisted_172 = { class: "docker-ident" }
const _hoisted_173 = { class: "docker-cell docker-status" }
const _hoisted_174 = ["title"]
const _hoisted_175 = { class: "docker-cell docker-load" }
const _hoisted_176 = {
  key: 0,
  class: "docker-detail"
}
const _hoisted_177 = {
  class: "docker-tabs",
  role: "tablist"
}
const _hoisted_178 = ["aria-selected"]
const _hoisted_179 = ["aria-selected"]
const _hoisted_180 = { class: "docker-detail-id" }
const _hoisted_181 = {
  key: 0,
  class: "docker-tabpanel"
}
const _hoisted_182 = {
  key: 0,
  class: "docker-note"
}
const _hoisted_183 = {
  key: 1,
  class: "docker-note error"
}
const _hoisted_184 = { class: "docker-kv" }
const _hoisted_185 = {
  key: 0,
  class: "docker-subtable"
}
const _hoisted_186 = {
  key: 1,
  class: "docker-subtable"
}
const _hoisted_187 = { class: "docker-badge" }
const _hoisted_188 = ["title"]
const _hoisted_189 = { class: "mono" }
const _hoisted_190 = { class: "muted" }
const _hoisted_191 = {
  key: 2,
  class: "docker-subtable"
}
const _hoisted_192 = { class: "mono" }
const _hoisted_193 = { class: "muted" }
const _hoisted_194 = {
  key: 3,
  class: "docker-env"
}
const _hoisted_195 = { class: "mono" }
const _hoisted_196 = { class: "mono muted" }
const _hoisted_197 = {
  key: 1,
  class: "docker-tabpanel"
}
const _hoisted_198 = { class: "docker-log-toolbar" }
const _hoisted_199 = {
  class: "docker-seg",
  role: "group",
  "aria-label": "日志行数"
}
const _hoisted_200 = ["disabled"]
const _hoisted_201 = { class: "docker-auto" }
const _hoisted_202 = ["checked"]
const _hoisted_203 = {
  key: 0,
  class: "docker-log-meta"
}
const _hoisted_204 = {
  key: 0,
  class: "docker-note error"
}
const _hoisted_205 = {
  key: 1,
  class: "docker-log-body"
}
const _hoisted_206 = {
  key: 2,
  class: "docker-note"
}
const _hoisted_207 = {
  key: 0,
  class: "empty-state success"
}
const _hoisted_208 = {
  key: 1,
  class: "docker-offline"
}
const _hoisted_209 = { key: 0 }
const _hoisted_210 = {
  key: 2,
  class: "docker-blocks"
}
const _hoisted_211 = { class: "docker-block" }
const _hoisted_212 = { class: "docker-table" }
const _hoisted_213 = ["title"]
const _hoisted_214 = { class: "muted" }
const _hoisted_215 = {
  key: 0,
  class: "docker-note"
}
const _hoisted_216 = { class: "docker-block" }
const _hoisted_217 = { class: "docker-table" }
const _hoisted_218 = { class: "mono" }
const _hoisted_219 = { class: "muted" }
const _hoisted_220 = {
  key: 0,
  class: "docker-note"
}
const _hoisted_221 = { class: "docker-block" }
const _hoisted_222 = { class: "docker-table" }
const _hoisted_223 = { class: "mono" }
const _hoisted_224 = { class: "muted" }
const _hoisted_225 = { class: "muted" }
const _hoisted_226 = {
  key: 0,
  class: "docker-note"
}
const _hoisted_227 = {
  class: "hero sysops-hero",
  "aria-labelledby": "security-title"
}
const _hoisted_228 = { class: "host-summary" }
const _hoisted_229 = { class: "hero-status" }
const _hoisted_230 = { class: "hero-status-row" }
const _hoisted_231 = {
  class: "hero-status-uptime muted",
  title: "与服务器时间同步，每秒更新"
}
const _hoisted_232 = {
  key: 0,
  class: "error-banner",
  role: "alert"
}
const _hoisted_233 = {
  class: "metric-grid security-grid",
  "aria-label": "防护概览"
}
const _hoisted_234 = { class: "metric-card" }
const _hoisted_235 = { class: "metric-body" }
const _hoisted_236 = { class: "metric-value" }
const _hoisted_237 = { class: "capacity-details" }
const _hoisted_238 = { class: "metric-foot" }
const _hoisted_239 = { class: "metric-card" }
const _hoisted_240 = { class: "metric-card-head" }
const _hoisted_241 = { class: "metric-body" }
const _hoisted_242 = { class: "metric-value" }
const _hoisted_243 = { class: "capacity-details" }
const _hoisted_244 = { class: "metric-card" }
const _hoisted_245 = { class: "metric-card-head" }
const _hoisted_246 = { class: "metric-body" }
const _hoisted_247 = { class: "metric-value" }
const _hoisted_248 = { class: "capacity-details" }
const _hoisted_249 = { class: "metric-foot" }
const _hoisted_250 = { class: "metric-card" }
const _hoisted_251 = { class: "metric-body" }
const _hoisted_252 = { class: "metric-value" }
const _hoisted_253 = { class: "capacity-details" }
const _hoisted_254 = { class: "metric-foot" }
const _hoisted_255 = {
  class: "panel",
  "aria-labelledby": "security-policy-title"
}
const _hoisted_256 = { class: "security-policy" }
const _hoisted_257 = { class: "security-policy-item" }
const _hoisted_258 = { class: "security-policy-item" }
const _hoisted_259 = { class: "security-policy-item" }
const _hoisted_260 = { class: "security-policy-item" }
const _hoisted_261 = { class: "security-policy-item" }
const _hoisted_262 = { class: "security-policy-item" }
const _hoisted_263 = {
  class: "panel security-panel",
  "aria-labelledby": "security-bans-title"
}
const _hoisted_264 = { class: "panel-head compact" }
const _hoisted_265 = { class: "muted" }
const _hoisted_266 = { class: "security-list" }
const _hoisted_267 = { class: "security-ident" }
const _hoisted_268 = { class: "security-cell" }
const _hoisted_269 = ["onClick"]
const _hoisted_270 = {
  key: 0,
  class: "empty-state success"
}
const _hoisted_271 = {
  class: "panel security-panel",
  "aria-labelledby": "security-offenders-title"
}
const _hoisted_272 = { class: "security-list" }
const _hoisted_273 = { class: "security-ident" }
const _hoisted_274 = { class: "security-cell" }
const _hoisted_275 = { class: "security-cell security-tally" }
const _hoisted_276 = {
  key: 0,
  class: "empty-state"
}
const _hoisted_277 = {
  class: "hero sysops-hero",
  "aria-labelledby": "admin-title"
}
const _hoisted_278 = { class: "host-summary" }
const _hoisted_279 = { key: 0 }
const _hoisted_280 = { class: "hero-status" }
const _hoisted_281 = { class: "hero-status-row" }
const _hoisted_282 = ["disabled"]
const _hoisted_283 = {
  key: 0,
  class: "error-banner",
  role: "alert"
}
const _hoisted_284 = {
  key: 1,
  class: "policy-success",
  role: "status"
}
const _hoisted_285 = {
  class: "panel",
  "aria-labelledby": "policy-toggle-title"
}
const _hoisted_286 = {
  class: "policy-toggle",
  for: "policy-enabled"
}
const _hoisted_287 = {
  class: "panel",
  "aria-labelledby": "policy-limit-title"
}
const _hoisted_288 = { class: "policy-grid" }
const _hoisted_289 = {
  class: "policy-field",
  for: "policy-burst"
}
const _hoisted_290 = ["min", "max"]
const _hoisted_291 = {
  class: "policy-field",
  for: "policy-burst-window"
}
const _hoisted_292 = ["min", "max"]
const _hoisted_293 = {
  class: "policy-field",
  for: "policy-sustained"
}
const _hoisted_294 = ["min", "max"]
const _hoisted_295 = {
  class: "policy-field",
  for: "policy-sustained-window"
}
const _hoisted_296 = ["min", "max"]
const _hoisted_297 = {
  class: "policy-field",
  for: "policy-max-concurrent"
}
const _hoisted_298 = ["min", "max"]
const _hoisted_299 = {
  class: "policy-field",
  for: "policy-max-global"
}
const _hoisted_300 = ["min", "max"]
const _hoisted_301 = {
  class: "policy-field",
  for: "policy-body-kib"
}
const _hoisted_302 = {
  class: "panel",
  "aria-labelledby": "policy-ban-title"
}
const _hoisted_303 = { class: "policy-grid" }
const _hoisted_304 = {
  class: "policy-field",
  for: "policy-strike"
}
const _hoisted_305 = ["min", "max"]
const _hoisted_306 = {
  class: "policy-field",
  for: "policy-strike-window"
}
const _hoisted_307 = ["min", "max"]
const _hoisted_308 = {
  class: "policy-field",
  for: "policy-ban"
}
const _hoisted_309 = ["min", "max"]
const _hoisted_310 = {
  class: "policy-field",
  for: "policy-max-ban"
}
const _hoisted_311 = ["min", "max"]
const _hoisted_312 = { class: "policy-actions" }
const _hoisted_313 = ["disabled"]
const _hoisted_314 = ["disabled"]
const _hoisted_315 = {
  class: "footer-brand",
  href: "https://github.com/Swipa5fox/FoxOps",
  target: "_blank",
  rel: "noopener noreferrer"
}
const _hoisted_316 = { class: "footer-copyright" }

return function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock(_Fragment, null, [
    _createElementVNode("aside", _hoisted_1, [
      _cache[52] || (_cache[52] = _createElementVNode("div", { class: "sidebar-brand" }, [
        _createElementVNode("div", { class: "brand" }, [
          _createElementVNode("div", {
            class: "brand-mark",
            "aria-hidden": "true"
          }, [
            _createElementVNode("svg", {
              class: "brand-fox",
              viewBox: "0 0 32 32",
              "aria-hidden": "true",
              focusable: "false"
            }, [
              _createElementVNode("path", { d: "M16 28.6 4.1 14.6 7.1 3.2 12.6 12.3 16 9.2 19.4 12.3 24.9 3.2 27.9 14.6Z" })
            ])
          ]),
          _createElementVNode("div", { class: "brand-text" }, [
            _createElementVNode("div", { class: "brand-title" }, "FoxOps"),
            _createElementVNode("div", { class: "brand-subtitle" }, "轻量运维控制台")
          ])
        ])
      ], -1 /* CACHED */)),
      _createElementVNode("nav", _hoisted_2, [
        _createElementVNode("button", {
          type: "button",
          class: _normalizeClass(["sidebar-item", { active: _ctx.view === 'overview' }]),
          "aria-current": _ctx.view === 'overview' ? 'page' : null,
          onClick: _cache[0] || (_cache[0] = $event => (_ctx.setView('overview')))
        }, _cache[46] || (_cache[46] = [
          _createElementVNode("svg", {
            class: "sidebar-icon",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            focusable: "false"
          }, [
            _createElementVNode("rect", {
              x: "3.2",
              y: "3.2",
              width: "7.6",
              height: "7.6",
              rx: "2"
            }),
            _createElementVNode("rect", {
              x: "13.2",
              y: "3.2",
              width: "7.6",
              height: "4.8",
              rx: "2"
            }),
            _createElementVNode("rect", {
              x: "13.2",
              y: "10.4",
              width: "7.6",
              height: "10.4",
              rx: "2"
            }),
            _createElementVNode("rect", {
              x: "3.2",
              y: "13.2",
              width: "7.6",
              height: "7.6",
              rx: "2"
            })
          ], -1 /* CACHED */),
          _createElementVNode("span", null, "总览", -1 /* CACHED */)
        ]), 10 /* CLASS, PROPS */, _hoisted_3),
        _createElementVNode("button", {
          type: "button",
          class: _normalizeClass(["sidebar-item", { active: _ctx.view === 'sysops' }]),
          "aria-current": _ctx.view === 'sysops' ? 'page' : null,
          onClick: _cache[1] || (_cache[1] = $event => (_ctx.setView('sysops')))
        }, _cache[47] || (_cache[47] = [
          _createElementVNode("svg", {
            class: "sidebar-icon",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            focusable: "false"
          }, [
            _createElementVNode("path", { d: "M12 3.1 4.6 6.4v5.2c0 4.4 3.1 7.8 7.4 9.3 4.3-1.5 7.4-4.9 7.4-9.3V6.4Z" }),
            _createElementVNode("path", { d: "M8.9 8.4h6.2M8.9 12h6.2M8.9 15.6h3.6" })
          ], -1 /* CACHED */),
          _createElementVNode("span", null, "系统运维", -1 /* CACHED */)
        ]), 10 /* CLASS, PROPS */, _hoisted_4),
        (_ctx.isAdmin)
          ? (_openBlock(), _createElementBlock("div", {
              key: 0,
              class: _normalizeClass(["sidebar-group", { open: _ctx.securityOpen, active: _ctx.view === 'security' }])
            }, [
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["sidebar-item sidebar-parent", { active: _ctx.view === 'security' }]),
                "aria-current": _ctx.view === 'security' ? 'page' : null,
                onClick: _cache[2] || (_cache[2] = (...args) => (_ctx.openSecurityGroup && _ctx.openSecurityGroup(...args)))
              }, _cache[48] || (_cache[48] = [
                _createElementVNode("svg", {
                  class: "sidebar-icon",
                  viewBox: "0 0 24 24",
                  "aria-hidden": "true",
                  focusable: "false"
                }, [
                  _createElementVNode("path", { d: "M12 3.1 4.6 6.4v5.2c0 4.4 3.1 7.8 7.4 9.3 4.3-1.5 7.4-4.9 7.4-9.3V6.4Z" }),
                  _createElementVNode("path", { d: "M8.7 11.9 11 14.2l4.3-4.4" })
                ], -1 /* CACHED */),
                _createElementVNode("span", null, "安全防护", -1 /* CACHED */)
              ]), 10 /* CLASS, PROPS */, _hoisted_5),
              _createElementVNode("button", {
                type: "button",
                class: "sidebar-caret-button",
                "aria-expanded": _ctx.securityOpen ? 'true' : 'false',
                "aria-controls": "security-submenu",
                "aria-label": "展开或收起安全防护菜单",
                onClick: _cache[3] || (_cache[3] = _withModifiers((...args) => (_ctx.toggleSecurityGroup && _ctx.toggleSecurityGroup(...args)), ["stop"]))
              }, _cache[49] || (_cache[49] = [
                _createElementVNode("svg", {
                  class: "sidebar-caret",
                  viewBox: "0 0 24 24",
                  "aria-hidden": "true",
                  focusable: "false"
                }, [
                  _createElementVNode("path", { d: "M8 10l4 4 4-4" })
                ], -1 /* CACHED */)
              ]), 8 /* PROPS */, _hoisted_6)
            ], 2 /* CLASS */))
          : _createCommentVNode("v-if", true),
        (_ctx.isAdmin)
          ? _withDirectives((_openBlock(), _createElementBlock("div", _hoisted_7, [
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["sidebar-subitem", { active: _ctx.view === 'admin' }]),
                "aria-current": _ctx.view === 'admin' ? 'page' : null,
                onClick: _cache[4] || (_cache[4] = $event => (_ctx.setView('admin')))
              }, _cache[50] || (_cache[50] = [
                _createElementVNode("span", null, "后台管理", -1 /* CACHED */)
              ]), 10 /* CLASS, PROPS */, _hoisted_8)
            ], 512 /* NEED_PATCH */)), [
              [_vShow, _ctx.securityOpen]
            ])
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_9, [
        _cache[51] || (_cache[51] = _createElementVNode("span", {
          class: "sidebar-dot",
          "aria-hidden": "true"
        }, null, -1 /* CACHED */)),
        _createElementVNode("small", null, _toDisplayString(_ctx.summary.version ? "v" + _ctx.summary.version : "连接中"), 1 /* TEXT */)
      ])
    ]),
    _createElementVNode("div", _hoisted_10, [
      _createElementVNode("header", _hoisted_11, [
        _createElementVNode("div", _hoisted_12, [
          _cache[55] || (_cache[55] = _createElementVNode("span", {
            class: "live-dot",
            "aria-hidden": "true"
          }, null, -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_13, "最后更新 " + _toDisplayString(_ctx.updatedAt || "等待数据"), 1 /* TEXT */),
          _createElementVNode("div", _hoisted_14, [
            _createElementVNode("button", {
              type: "button",
              class: "ghost-button user-menu-trigger",
              onClick: _cache[5] || (_cache[5] = (...args) => (_ctx.handleUserClick && _ctx.handleUserClick(...args)))
            }, [
              _createTextVNode(_toDisplayString(_ctx.currentUser ? _ctx.currentUser : "登录") + " ", 1 /* TEXT */),
              (_ctx.currentUser)
                ? (_openBlock(), _createElementBlock("span", _hoisted_15, "▾"))
                : _createCommentVNode("v-if", true)
            ]),
            (_ctx.currentUser)
              ? (_openBlock(), _createElementBlock("div", _hoisted_16, [
                  _createElementVNode("div", _hoisted_17, [
                    _cache[53] || (_cache[53] = _createElementVNode("span", null, "我的账户", -1 /* CACHED */)),
                    _createElementVNode("strong", null, _toDisplayString(_ctx.currentUser), 1 /* TEXT */),
                    _createElementVNode("em", {
                      class: _normalizeClass(["user-menu-role", _ctx.isAdmin ? 'role-admin' : 'role-guest'])
                    }, _toDisplayString(_ctx.isAdmin ? "管理员" : "访客（只读）"), 3 /* TEXT, CLASS */)
                  ]),
                  _createElementVNode("button", {
                    type: "button",
                    class: "user-menu-item",
                    role: "menuitem",
                    onClick: _cache[6] || (_cache[6] = (...args) => (_ctx.openPasswordModal && _ctx.openPasswordModal(...args)))
                  }, " 修改密码 "),
                  _createElementVNode("button", {
                    type: "button",
                    class: "user-menu-item user-menu-item-danger",
                    role: "menuitem",
                    disabled: _ctx.logoutBusy,
                    onClick: _cache[7] || (_cache[7] = (...args) => (_ctx.logout && _ctx.logout(...args)))
                  }, _toDisplayString(_ctx.logoutBusy ? "退出中…" : "退出登录"), 9 /* TEXT, PROPS */, _hoisted_18)
                ]))
              : _createCommentVNode("v-if", true)
          ]),
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["theme-toggle", { 'is-light': _ctx.theme === 'light' }]),
            "aria-label": _ctx.themeLabel,
            title: _ctx.themeLabel,
            onClick: _cache[8] || (_cache[8] = (...args) => (_ctx.toggleTheme && _ctx.toggleTheme(...args)))
          }, _cache[54] || (_cache[54] = [
            _createElementVNode("svg", {
              class: "theme-toggle-sun",
              viewBox: "0 0 24 24",
              "aria-hidden": "true",
              focusable: "false"
            }, [
              _createElementVNode("circle", {
                cx: "12",
                cy: "12",
                r: "4.2"
              }),
              _createElementVNode("path", { d: "M12 2.6v2.5M12 18.9v2.5M2.6 12h2.5M18.9 12h2.5M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8" })
            ], -1 /* CACHED */),
            _createElementVNode("svg", {
              class: "theme-toggle-moon",
              viewBox: "0 0 24 24",
              "aria-hidden": "true",
              focusable: "false"
            }, [
              _createElementVNode("path", { d: "M20.3 14.4A8.5 8.5 0 0 1 9.6 3.7a8.5 8.5 0 1 0 10.7 10.7Z" })
            ], -1 /* CACHED */)
          ]), 10 /* CLASS, PROPS */, _hoisted_19),
          _createElementVNode("button", {
            type: "button",
            class: "primary-button",
            disabled: _ctx.loading,
            "aria-busy": _ctx.loading,
            onClick: _cache[9] || (_cache[9] = (...args) => (_ctx.refresh && _ctx.refresh(...args)))
          }, _toDisplayString(_ctx.loading ? "刷新中" : "刷新"), 9 /* TEXT, PROPS */, _hoisted_20)
        ])
      ]),
      _createCommentVNode(" 修改密码弹窗 "),
      (_ctx.showPasswordModal)
        ? (_openBlock(), _createElementBlock("div", {
            key: 0,
            class: "modal-mask",
            onClick: _cache[16] || (_cache[16] = _withModifiers((...args) => (_ctx.closePasswordModal && _ctx.closePasswordModal(...args)), ["self"]))
          }, [
            _createElementVNode("div", _hoisted_21, [
              _createElementVNode("div", _hoisted_22, [
                _cache[56] || (_cache[56] = _createElementVNode("h2", { id: "password-title" }, "修改密码", -1 /* CACHED */)),
                _createElementVNode("button", {
                  type: "button",
                  class: "modal-close",
                  "aria-label": "关闭",
                  onClick: _cache[10] || (_cache[10] = (...args) => (_ctx.closePasswordModal && _ctx.closePasswordModal(...args)))
                }, "×")
              ]),
              _createElementVNode("form", {
                class: "modal-body",
                onSubmit: _cache[15] || (_cache[15] = _withModifiers((...args) => (_ctx.submitChangePassword && _ctx.submitChangePassword(...args)), ["prevent"]))
              }, [
                _createElementVNode("label", _hoisted_23, [
                  _cache[57] || (_cache[57] = _createElementVNode("span", null, "原密码", -1 /* CACHED */)),
                  _withDirectives(_createElementVNode("input", {
                    "onUpdate:modelValue": _cache[11] || (_cache[11] = $event => ((_ctx.passwordForm.oldPassword) = $event)),
                    type: "password",
                    autocomplete: "current-password",
                    required: ""
                  }, null, 512 /* NEED_PATCH */), [
                    [_vModelText, _ctx.passwordForm.oldPassword]
                  ])
                ]),
                _createElementVNode("label", _hoisted_24, [
                  _cache[58] || (_cache[58] = _createElementVNode("span", null, "新密码（至少 6 位）", -1 /* CACHED */)),
                  _withDirectives(_createElementVNode("input", {
                    "onUpdate:modelValue": _cache[12] || (_cache[12] = $event => ((_ctx.passwordForm.newPassword) = $event)),
                    type: "password",
                    autocomplete: "new-password",
                    minlength: "6",
                    required: ""
                  }, null, 512 /* NEED_PATCH */), [
                    [_vModelText, _ctx.passwordForm.newPassword]
                  ])
                ]),
                _createElementVNode("label", _hoisted_25, [
                  _cache[59] || (_cache[59] = _createElementVNode("span", null, "确认新密码", -1 /* CACHED */)),
                  _withDirectives(_createElementVNode("input", {
                    "onUpdate:modelValue": _cache[13] || (_cache[13] = $event => ((_ctx.passwordForm.confirmPassword) = $event)),
                    type: "password",
                    autocomplete: "new-password",
                    minlength: "6",
                    required: ""
                  }, null, 512 /* NEED_PATCH */), [
                    [_vModelText, _ctx.passwordForm.confirmPassword]
                  ])
                ]),
                (_ctx.passwordError)
                  ? (_openBlock(), _createElementBlock("p", _hoisted_26, _toDisplayString(_ctx.passwordError), 1 /* TEXT */))
                  : _createCommentVNode("v-if", true),
                (_ctx.passwordSuccess)
                  ? (_openBlock(), _createElementBlock("p", _hoisted_27, _toDisplayString(_ctx.passwordSuccess), 1 /* TEXT */))
                  : _createCommentVNode("v-if", true),
                _createElementVNode("div", _hoisted_28, [
                  _createElementVNode("button", {
                    type: "button",
                    class: "ghost-button",
                    onClick: _cache[14] || (_cache[14] = (...args) => (_ctx.closePasswordModal && _ctx.closePasswordModal(...args)))
                  }, "取消"),
                  _createElementVNode("button", {
                    type: "submit",
                    class: "primary-button",
                    disabled: _ctx.passwordBusy
                  }, _toDisplayString(_ctx.passwordBusy ? "保存中…" : "更改密码"), 9 /* TEXT, PROPS */, _hoisted_29)
                ])
              ], 32 /* NEED_HYDRATION */)
            ])
          ]))
        : _createCommentVNode("v-if", true),
      _createElementVNode("main", _hoisted_30, [
        (_ctx.view === 'overview')
          ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
              _createElementVNode("section", _hoisted_31, [
                _createElementVNode("div", null, [
                  _cache[60] || (_cache[60] = _createElementVNode("div", { class: "eyebrow" }, "SYSTEM OVERVIEW", -1 /* CACHED */)),
                  _cache[61] || (_cache[61] = _createElementVNode("div", { class: "hero-heading" }, [
                    _createElementVNode("h1", {
                      id: "page-title",
                      class: "hero-title"
                    }, "FoxOps")
                  ], -1 /* CACHED */)),
                  _createElementVNode("p", _hoisted_32, [
                    _createElementVNode("span", null, _toDisplayString(_ctx.host.cloud_provider || "云服务器"), 1 /* TEXT */),
                    _createElementVNode("span", null, _toDisplayString(_ctx.host.cpu_count || "--") + " 核 CPU", 1 /* TEXT */),
                    _createElementVNode("span", null, _toDisplayString(_ctx.formatGB(_ctx.host.memory_total, 0)) + " 内存", 1 /* TEXT */),
                    _createElementVNode("span", null, _toDisplayString(_ctx.formatGB(_ctx.host.disk_total, 0)) + " 系统盘", 1 /* TEXT */),
                    _createElementVNode("span", null, _toDisplayString(_ctx.host.os_name || "Linux"), 1 /* TEXT */)
                  ])
                ]),
                _createElementVNode("div", _hoisted_33, [
                  _createElementVNode("div", {
                    class: _normalizeClass(["weather-emblem", 'weather-' + (_ctx.weatherKind || 'idle')])
                  }, [
                    _createElementVNode("div", {
                      class: "weather-emblem-icon",
                      style: _normalizeStyle({ '--qi-url': 'url(/icons/weather-' + (_ctx.qweatherCode || 150) + '.svg)' }),
                      title: _ctx.weather ? (_ctx.weather.location_label || _ctx.weatherLabel) : '每日天气',
                      "aria-hidden": "true"
                    }, null, 12 /* STYLE, PROPS */, _hoisted_34),
                    (_ctx.weather)
                      ? (_openBlock(), _createElementBlock("div", _hoisted_35, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.formatTemperature(_ctx.weather.current.temperature)), 1 /* TEXT */),
                          _createElementVNode("span", null, _toDisplayString(_ctx.weatherLabel), 1 /* TEXT */),
                          (_ctx.weatherTip)
                            ? (_openBlock(), _createElementBlock("span", _hoisted_36, _toDisplayString(_ctx.weatherTip), 1 /* TEXT */))
                            : _createCommentVNode("v-if", true)
                        ]))
                      : (_openBlock(), _createElementBlock("div", _hoisted_37, [
                          _cache[62] || (_cache[62] = _createElementVNode("strong", null, "--°", -1 /* CACHED */)),
                          _createElementVNode("span", null, _toDisplayString(_ctx.weatherLoading ? "查询中" : (_ctx.weatherError || "选择城市查看天气")), 1 /* TEXT */)
                        ])),
                    (_ctx.weather && _ctx.weatherCandidates.length > 1)
                      ? (_openBlock(), _createElementBlock("div", _hoisted_38, [
                          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.weatherCandidates, (candidate) => {
                            return (_openBlock(), _createElementBlock("button", {
                              key: candidate.label,
                              type: "button",
                              class: _normalizeClass(["weather-district-tag", { active: candidate.label === _ctx.activeCandidateLabel }]),
                              disabled: _ctx.weatherLoading,
                              onClick: $event => (_ctx.pickDistrict(candidate))
                            }, _toDisplayString(candidate.label.split("-").slice(-1)[0]), 11 /* TEXT, CLASS, PROPS */, _hoisted_39))
                          }), 128 /* KEYED_FRAGMENT */))
                        ]))
                      : _createCommentVNode("v-if", true)
                  ], 2 /* CLASS */),
                  _createElementVNode("div", _hoisted_40, [
                    _createElementVNode("div", _hoisted_41, _toDisplayString(_ctx.weather ? _ctx.weather.location_label : "选择城市查看天气"), 1 /* TEXT */),
                    _createElementVNode("div", _hoisted_42, [
                      _withDirectives(_createElementVNode("input", {
                        class: "weather-picker-input",
                        type: "text",
                        "onUpdate:modelValue": _cache[17] || (_cache[17] = $event => ((_ctx.weatherPlace) = $event)),
                        onKeyup: _cache[18] || (_cache[18] = _withKeys((...args) => (_ctx.searchWeather && _ctx.searchWeather(...args)), ["enter"])),
                        disabled: _ctx.weatherLoading,
                        placeholder: "输入城市名，如 北京",
                        "aria-label": "城市名称"
                      }, null, 40 /* PROPS, NEED_HYDRATION */, _hoisted_43), [
                        [_vModelText, _ctx.weatherPlace]
                      ]),
                      _createElementVNode("button", {
                        type: "button",
                        class: "weather-picker-btn",
                        disabled: _ctx.weatherLoading,
                        onClick: _cache[19] || (_cache[19] = (...args) => (_ctx.searchWeather && _ctx.searchWeather(...args)))
                      }, "查询", 8 /* PROPS */, _hoisted_44)
                    ])
                  ])
                ]),
                _createElementVNode("div", _hoisted_45, [
                  _createElementVNode("div", _hoisted_46, [
                    _createElementVNode("span", {
                      class: _normalizeClass(["status-badge", { error: !!_ctx.error, pending: !_ctx.updatedAt && !_ctx.error }]),
                      role: "status",
                      "aria-live": "polite"
                    }, _toDisplayString(_ctx.error ? "数据异常" : (_ctx.updatedAt ? "系统运行中" : "正在连接")), 3 /* TEXT, CLASS */),
                    _createElementVNode("span", _hoisted_47, _toDisplayString(_ctx.summary.version ? "v" + _ctx.summary.version : "版本加载中"), 1 /* TEXT */)
                  ]),
                  _createElementVNode("span", _hoisted_48, [
                    _cache[63] || (_cache[63] = _createElementVNode("svg", {
                      class: "uptime-glyph",
                      width: "12",
                      height: "12",
                      viewBox: "0 0 16 16",
                      fill: "none",
                      "aria-hidden": "true"
                    }, [
                      _createElementVNode("circle", {
                        cx: "8",
                        cy: "8",
                        r: "6.5",
                        stroke: "currentColor",
                        "stroke-width": "1.4"
                      }),
                      _createElementVNode("path", {
                        d: "M8 4.5 V8 L10.4 9.6",
                        stroke: "currentColor",
                        "stroke-width": "1.4",
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round"
                      })
                    ], -1 /* CACHED */)),
                    _createTextVNode(" 已运行 " + _toDisplayString(_ctx.uptimeLabel || "加载中"), 1 /* TEXT */)
                  ])
                ])
              ]),
              (_ctx.error)
                ? (_openBlock(), _createElementBlock("div", _hoisted_49, _toDisplayString(_ctx.error), 1 /* TEXT */))
                : _createCommentVNode("v-if", true),
              _createElementVNode("section", _hoisted_50, [
                _createElementVNode("article", _hoisted_51, [
                  _createElementVNode("div", _hoisted_52, [
                    _cache[64] || (_cache[64] = _createElementVNode("div", { class: "metric-label" }, "处理器负载", -1 /* CACHED */)),
                    _createElementVNode("span", _hoisted_53, _toDisplayString(_ctx.host.cpu_count || "--") + " 核 CPU", 1 /* TEXT */),
                    _createElementVNode("span", {
                      class: _normalizeClass(["metric-state", _ctx.cpuStatusClass])
                    }, _toDisplayString(_ctx.cpuStatus), 3 /* TEXT, CLASS */)
                  ]),
                  _createElementVNode("div", _hoisted_54, [
                    _createElementVNode("div", _hoisted_55, _toDisplayString(_ctx.formatPercent(_ctx.metric.cpu_percent)), 1 /* TEXT */),
                    _createElementVNode("div", _hoisted_56, [
                      _createElementVNode("div", _hoisted_57, [
                        _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.metric.load_1)), 1 /* TEXT */),
                        _cache[65] || (_cache[65] = _createElementVNode("small", null, "1分", -1 /* CACHED */))
                      ]),
                      _cache[68] || (_cache[68] = _createElementVNode("span", {
                        class: "load-average-sep",
                        "aria-hidden": "true"
                      }, "·", -1 /* CACHED */)),
                      _createElementVNode("div", _hoisted_58, [
                        _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.metric.load_5)), 1 /* TEXT */),
                        _cache[66] || (_cache[66] = _createElementVNode("small", null, "5分", -1 /* CACHED */))
                      ]),
                      _cache[69] || (_cache[69] = _createElementVNode("span", {
                        class: "load-average-sep",
                        "aria-hidden": "true"
                      }, "·", -1 /* CACHED */)),
                      _createElementVNode("div", _hoisted_59, [
                        _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.metric.load_15)), 1 /* TEXT */),
                        _cache[67] || (_cache[67] = _createElementVNode("small", null, "15分", -1 /* CACHED */))
                      ])
                    ])
                  ]),
                  _createElementVNode("div", {
                    class: "progress-track",
                    role: "progressbar",
                    "aria-label": "CPU 使用率",
                    "aria-valuemin": "0",
                    "aria-valuemax": "100",
                    "aria-valuenow": Number.isFinite(Number(_ctx.metric.cpu_percent)) ? _ctx.clampNumber(_ctx.metric.cpu_percent) : undefined,
                    "aria-valuetext": _ctx.formatPercent(_ctx.metric.cpu_percent)
                  }, [
                    _createElementVNode("span", {
                      style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.metric.cpu_percent) })
                    }, null, 4 /* STYLE */)
                  ], 8 /* PROPS */, _hoisted_60),
                  _cache[70] || (_cache[70] = _createElementVNode("div", { class: "metric-foot" }, "当前整体 CPU 占用", -1 /* CACHED */))
                ]),
                _createElementVNode("article", _hoisted_61, [
                  _createElementVNode("div", _hoisted_62, [
                    _cache[71] || (_cache[71] = _createElementVNode("div", { class: "metric-label" }, "内存使用情况", -1 /* CACHED */)),
                    _createElementVNode("span", {
                      class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.metric.memory_percent)])
                    }, _toDisplayString(_ctx.statusLabel(_ctx.metric.memory_percent)), 3 /* TEXT, CLASS */)
                  ]),
                  _createElementVNode("div", _hoisted_63, [
                    _createElementVNode("div", _hoisted_64, _toDisplayString(_ctx.formatPercent(_ctx.metric.memory_percent)), 1 /* TEXT */),
                    _createElementVNode("div", _hoisted_65, [
                      _createElementVNode("strong", null, _toDisplayString(_ctx.formatGB(_ctx.host.memory_used, 1)), 1 /* TEXT */),
                      _createElementVNode("span", null, "/ " + _toDisplayString(_ctx.formatGB(_ctx.host.memory_total, 1)), 1 /* TEXT */)
                    ])
                  ]),
                  _createElementVNode("div", {
                    class: "progress-track violet",
                    role: "progressbar",
                    "aria-label": "内存使用率",
                    "aria-valuemin": "0",
                    "aria-valuemax": "100",
                    "aria-valuenow": Number.isFinite(Number(_ctx.metric.memory_percent)) ? _ctx.clampNumber(_ctx.metric.memory_percent) : undefined,
                    "aria-valuetext": _ctx.formatPercent(_ctx.metric.memory_percent)
                  }, [
                    _createElementVNode("span", {
                      style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.metric.memory_percent) })
                    }, null, 4 /* STYLE */)
                  ], 8 /* PROPS */, _hoisted_66),
                  _createElementVNode("div", _hoisted_67, "当前可用 " + _toDisplayString(_ctx.formatGB(_ctx.host.memory_available, 1)), 1 /* TEXT */)
                ]),
                _createElementVNode("article", _hoisted_68, [
                  _createElementVNode("div", _hoisted_69, [
                    _cache[72] || (_cache[72] = _createElementVNode("div", { class: "metric-label" }, "系统盘使用情况", -1 /* CACHED */)),
                    _createElementVNode("span", {
                      class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.metric.disk_percent)])
                    }, _toDisplayString(_ctx.statusLabel(_ctx.metric.disk_percent)), 3 /* TEXT, CLASS */)
                  ]),
                  _createElementVNode("div", _hoisted_70, [
                    _createElementVNode("div", _hoisted_71, _toDisplayString(_ctx.formatPercent(_ctx.metric.disk_percent)), 1 /* TEXT */),
                    _createElementVNode("div", _hoisted_72, [
                      _createElementVNode("strong", null, _toDisplayString(_ctx.formatGB(_ctx.host.disk_used, 1)), 1 /* TEXT */),
                      _createElementVNode("span", null, "/ " + _toDisplayString(_ctx.formatGB(_ctx.host.disk_total, 1)), 1 /* TEXT */)
                    ])
                  ]),
                  _createElementVNode("div", {
                    class: "progress-track amber",
                    role: "progressbar",
                    "aria-label": "磁盘使用率",
                    "aria-valuemin": "0",
                    "aria-valuemax": "100",
                    "aria-valuenow": Number.isFinite(Number(_ctx.metric.disk_percent)) ? _ctx.clampNumber(_ctx.metric.disk_percent) : undefined,
                    "aria-valuetext": _ctx.formatPercent(_ctx.metric.disk_percent)
                  }, [
                    _createElementVNode("span", {
                      style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.metric.disk_percent) })
                    }, null, 4 /* STYLE */)
                  ], 8 /* PROPS */, _hoisted_73),
                  _createElementVNode("div", _hoisted_74, "剩余空间 " + _toDisplayString(_ctx.formatGB(_ctx.host.disk_free, 1)), 1 /* TEXT */)
                ]),
                _createElementVNode("article", _hoisted_75, [
                  _createElementVNode("div", _hoisted_76, [
                    _cache[73] || (_cache[73] = _createElementVNode("div", { class: "metric-label" }, "活动告警", -1 /* CACHED */)),
                    _createElementVNode("span", {
                      class: _normalizeClass(["alert-summary", { error: _ctx.alerts.length > 0 }])
                    }, _toDisplayString(_ctx.alerts.length ? "需要关注" : "当前无异常"), 3 /* TEXT, CLASS */)
                  ]),
                  _createElementVNode("div", _hoisted_77, [
                    _createElementVNode("div", _hoisted_78, _toDisplayString(_ctx.alerts.length), 1 /* TEXT */)
                  ]),
                  _createElementVNode("div", {
                    class: "progress-track",
                    role: "progressbar",
                    "aria-label": "服务健康率",
                    "aria-valuemin": "0",
                    "aria-valuemax": "100",
                    "aria-valuenow": _ctx.services.length ? Math.round(_ctx.servicesUp / _ctx.services.length * 100) : 0,
                    "aria-valuetext": (_ctx.services.length ? Math.round(_ctx.servicesUp / _ctx.services.length * 100) : 0) + '%'
                  }, [
                    _createElementVNode("span", {
                      style: _normalizeStyle({ width: _ctx.services.length ? (_ctx.servicesUp / _ctx.services.length * 100) + '%' : '0%' })
                    }, null, 4 /* STYLE */)
                  ], 8 /* PROPS */, _hoisted_79),
                  _createElementVNode("div", _hoisted_80, _toDisplayString(_ctx.servicesUp) + " / " + _toDisplayString(_ctx.services.length) + " 服务正常", 1 /* TEXT */)
                ])
              ]),
              _createElementVNode("section", _hoisted_81, [
                _createElementVNode("div", _hoisted_82, [
                  _cache[74] || (_cache[74] = _createElementVNode("div", null, [
                    _createElementVNode("div", { class: "eyebrow" }, "RESOURCE TREND"),
                    _createElementVNode("h2", { id: "trend-title" }, "资源趋势")
                  ], -1 /* CACHED */)),
                  _createElementVNode("div", _hoisted_83, [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.ranges, (item) => {
                      return (_openBlock(), _createElementBlock("button", {
                        type: "button",
                        key: item.value,
                        class: _normalizeClass({ active: _ctx.range === item.value }),
                        "aria-pressed": _ctx.range === item.value,
                        onClick: $event => (_ctx.setRange(item.value))
                      }, _toDisplayString(item.label), 11 /* TEXT, CLASS, PROPS */, _hoisted_84))
                    }), 128 /* KEYED_FRAGMENT */))
                  ])
                ]),
                _createElementVNode("div", _hoisted_85, [
                  _createElementVNode("span", null, [
                    _createElementVNode("strong", null, _toDisplayString(_ctx.history.length), 1 /* TEXT */),
                    _cache[75] || (_cache[75] = _createTextVNode(" 个采样点"))
                  ]),
                  _cache[76] || (_cache[76] = _createElementVNode("span", null, "每 60 秒采集一次", -1 /* CACHED */)),
                  _cache[77] || (_cache[77] = _createElementVNode("span", { class: "trend-legend" }, [
                    _createElementVNode("i", { class: "cpu" }),
                    _createTextVNode("CPU "),
                    _createElementVNode("i", { class: "memory" }),
                    _createTextVNode("内存 "),
                    _createElementVNode("i", { class: "disk" }),
                    _createTextVNode("磁盘 ")
                  ], -1 /* CACHED */))
                ]),
                (_ctx.history.length)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_86, [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.trendCards, (card) => {
                        return (_openBlock(), _createElementBlock("div", {
                          key: card.key,
                          class: "trend-stat-card"
                        }, [
                          _createElementVNode("div", _hoisted_87, [
                            _createElementVNode("span", {
                              class: _normalizeClass(["trend-dot", card.key])
                            }, null, 2 /* CLASS */),
                            _createTextVNode(" " + _toDisplayString(card.label), 1 /* TEXT */)
                          ]),
                          _createElementVNode("strong", null, _toDisplayString(_ctx.formatPercent(card.current)), 1 /* TEXT */),
                          _createElementVNode("small", null, "最低 " + _toDisplayString(_ctx.formatPercent(card.minimum)) + " · 最高 " + _toDisplayString(_ctx.formatPercent(card.maximum)), 1 /* TEXT */)
                        ]))
                      }), 128 /* KEYED_FRAGMENT */))
                    ]))
                  : _createCommentVNode("v-if", true),
                (_ctx.history.length)
                  ? (_openBlock(), _createElementBlock("div", {
                      key: 1,
                      class: "svg-chart-shell",
                      onMousemove: _cache[20] || (_cache[20] = (...args) => (_ctx.updateTrendHover && _ctx.updateTrendHover(...args))),
                      onMouseleave: _cache[21] || (_cache[21] = (...args) => (_ctx.clearTrendHover && _ctx.clearTrendHover(...args)))
                    }, [
                      _cache[82] || (_cache[82] = _createElementVNode("div", { class: "chart-y-axis" }, [
                        _createElementVNode("span", null, "100%"),
                        _createElementVNode("span", null, "75%"),
                        _createElementVNode("span", null, "50%"),
                        _createElementVNode("span", null, "25%"),
                        _createElementVNode("span", null, "0%")
                      ], -1 /* CACHED */)),
                      (_openBlock(), _createElementBlock("svg", _hoisted_88, [
                        _cache[78] || (_cache[78] = _createStaticVNode("<g class=\"trend-grid\"><line x1=\"0\" y1=\"0\" x2=\"1000\" y2=\"0\"></line><line x1=\"0\" y1=\"65\" x2=\"1000\" y2=\"65\"></line><line x1=\"0\" y1=\"130\" x2=\"1000\" y2=\"130\"></line><line x1=\"0\" y1=\"195\" x2=\"1000\" y2=\"195\"></line><line x1=\"0\" y1=\"260\" x2=\"1000\" y2=\"260\"></line></g>", 1)),
                        _createElementVNode("polyline", {
                          points: _ctx.chartPoints('cpu_percent'),
                          class: "trend-line cpu"
                        }, null, 8 /* PROPS */, _hoisted_89),
                        _createElementVNode("polyline", {
                          points: _ctx.chartPoints('memory_percent'),
                          class: "trend-line memory"
                        }, null, 8 /* PROPS */, _hoisted_90),
                        _createElementVNode("polyline", {
                          points: _ctx.chartPoints('disk_percent'),
                          class: "trend-line disk"
                        }, null, 8 /* PROPS */, _hoisted_91),
                        (_ctx.trendHover)
                          ? (_openBlock(), _createElementBlock("g", _hoisted_92, [
                              _createElementVNode("line", {
                                x1: _ctx.trendHover.x,
                                y1: "0",
                                x2: _ctx.trendHover.x,
                                y2: "260",
                                class: "trend-hover-line"
                              }, null, 8 /* PROPS */, _hoisted_93),
                              _createElementVNode("circle", {
                                cx: _ctx.trendHover.x,
                                cy: _ctx.trendHover.cpuY,
                                r: "5",
                                class: "trend-hover-point cpu"
                              }, null, 8 /* PROPS */, _hoisted_94),
                              _createElementVNode("circle", {
                                cx: _ctx.trendHover.x,
                                cy: _ctx.trendHover.memoryY,
                                r: "5",
                                class: "trend-hover-point memory"
                              }, null, 8 /* PROPS */, _hoisted_95),
                              _createElementVNode("circle", {
                                cx: _ctx.trendHover.x,
                                cy: _ctx.trendHover.diskY,
                                r: "5",
                                class: "trend-hover-point disk"
                              }, null, 8 /* PROPS */, _hoisted_96)
                            ]))
                          : _createCommentVNode("v-if", true)
                      ], 512 /* NEED_PATCH */)),
                      (_ctx.trendHover)
                        ? (_openBlock(), _createElementBlock("div", {
                            key: 0,
                            class: "trend-tooltip",
                            style: _normalizeStyle({ left: _ctx.trendHover.tooltipLeft + 'px' }),
                            "aria-hidden": "true"
                          }, [
                            _createElementVNode("strong", null, _toDisplayString(_ctx.formatHoverTime(_ctx.trendHover.ts)), 1 /* TEXT */),
                            _createElementVNode("span", null, [
                              _cache[79] || (_cache[79] = _createElementVNode("i", { class: "cpu" }, null, -1 /* CACHED */)),
                              _createTextVNode("CPU " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.cpu)), 1 /* TEXT */)
                            ]),
                            _createElementVNode("span", null, [
                              _cache[80] || (_cache[80] = _createElementVNode("i", { class: "memory" }, null, -1 /* CACHED */)),
                              _createTextVNode("内存 " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.memory)), 1 /* TEXT */)
                            ]),
                            _createElementVNode("span", null, [
                              _cache[81] || (_cache[81] = _createElementVNode("i", { class: "disk" }, null, -1 /* CACHED */)),
                              _createTextVNode("磁盘 " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.disk)), 1 /* TEXT */)
                            ])
                          ], 4 /* STYLE */))
                        : _createCommentVNode("v-if", true),
                      _createElementVNode("div", _hoisted_97, [
                        _createElementVNode("span", null, _toDisplayString(_ctx.trendStartLabel), 1 /* TEXT */),
                        _createElementVNode("span", null, _toDisplayString(_ctx.trendEndLabel), 1 /* TEXT */)
                      ])
                    ], 32 /* NEED_HYDRATION */))
                  : (_openBlock(), _createElementBlock("div", _hoisted_98, " 正在等待这个时间范围内的监控数据 ")),
                _createElementVNode("p", _hoisted_99, _toDisplayString(_ctx.trendDescription), 1 /* TEXT */)
              ]),
              _createElementVNode("section", _hoisted_100, [
                _createElementVNode("article", _hoisted_101, [
                  _cache[83] || (_cache[83] = _createElementVNode("div", { class: "panel-head compact" }, [
                    _createElementVNode("div", null, [
                      _createElementVNode("div", { class: "eyebrow" }, "SERVICE HEALTH"),
                      _createElementVNode("h2", { id: "services-title" }, "服务状态")
                    ])
                  ], -1 /* CACHED */)),
                  _createElementVNode("div", _hoisted_102, [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.services, (service) => {
                      return (_openBlock(), _createElementBlock("div", {
                        key: service.service,
                        class: "service-row"
                      }, [
                        _createElementVNode("div", _hoisted_103, [
                          _createElementVNode("span", {
                            class: _normalizeClass(["service-dot", { up: service.status === 'active' }])
                          }, null, 2 /* CLASS */),
                          _createElementVNode("div", null, [
                            _createElementVNode("strong", null, [
                              _createTextVNode(_toDisplayString(service.service), 1 /* TEXT */),
                              (service.buckets && service.buckets.length)
                                ? (_openBlock(), _createElementBlock("span", {
                                    key: 0,
                                    class: "service-bucket",
                                    title: service.buckets.join('\n')
                                  }, " [" + _toDisplayString(service.buckets.join(', ')) + "]", 9 /* TEXT, PROPS */, _hoisted_104))
                                : _createCommentVNode("v-if", true),
                              (service.used_by)
                                ? (_openBlock(), _createElementBlock("span", _hoisted_105, "（" + _toDisplayString(service.used_by) + "）", 1 /* TEXT */))
                                : _createCommentVNode("v-if", true)
                            ]),
                            _createElementVNode("small", null, _toDisplayString(service.status), 1 /* TEXT */)
                          ])
                        ]),
                        (_ctx.isAdmin && service.managed)
                          ? (_openBlock(), _createElementBlock("button", {
                              key: 0,
                              type: "button",
                              class: "small-button",
                              disabled: _ctx.restartBusy === service.service,
                              onClick: $event => (_ctx.restartService(service.service))
                            }, _toDisplayString(_ctx.restartBusy === service.service ? "处理中" : "重启"), 9 /* TEXT, PROPS */, _hoisted_106))
                          : _createCommentVNode("v-if", true)
                      ]))
                    }), 128 /* KEYED_FRAGMENT */)),
                    (!_ctx.services.length)
                      ? (_openBlock(), _createElementBlock("div", _hoisted_107, "等待服务采样"))
                      : _createCommentVNode("v-if", true)
                  ])
                ]),
                _createElementVNode("article", _hoisted_108, [
                  _createElementVNode("div", _hoisted_109, [
                    _cache[84] || (_cache[84] = _createElementVNode("div", null, [
                      _createElementVNode("div", { class: "eyebrow" }, "ACTIVE ALERTS"),
                      _createElementVNode("h2", { id: "alerts-title" }, "当前告警")
                    ], -1 /* CACHED */)),
                    (_ctx.isAdmin)
                      ? (_openBlock(), _createElementBlock("button", {
                          key: 0,
                          type: "button",
                          class: "text-button",
                          onClick: _cache[22] || (_cache[22] = (...args) => (_ctx.runMaintenance && _ctx.runMaintenance(...args)))
                        }, "立即备份"))
                      : _createCommentVNode("v-if", true)
                  ]),
                  _createElementVNode("div", _hoisted_110, [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.alerts, (alert) => {
                      return (_openBlock(), _createElementBlock("div", {
                        key: alert.id,
                        class: "alert-row"
                      }, [
                        _cache[85] || (_cache[85] = _createElementVNode("span", { class: "alert-icon" }, "!", -1 /* CACHED */)),
                        _createElementVNode("div", null, [
                          _createElementVNode("strong", null, _toDisplayString(alert.message), 1 /* TEXT */),
                          _createElementVNode("small", null, _toDisplayString(_ctx.formatTime(alert.created_at)), 1 /* TEXT */)
                        ])
                      ]))
                    }), 128 /* KEYED_FRAGMENT */)),
                    (!_ctx.alerts.length)
                      ? (_openBlock(), _createElementBlock("div", _hoisted_111, _cache[86] || (_cache[86] = [
                          _createElementVNode("span", null, "✓", -1 /* CACHED */),
                          _createTextVNode(" 当前没有活动告警 ")
                        ])))
                      : _createCommentVNode("v-if", true)
                  ])
                ])
              ])
            ], 64 /* STABLE_FRAGMENT */))
          : (_ctx.view === 'sysops')
            ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                _createElementVNode("section", _hoisted_112, [
                  _createElementVNode("div", null, [
                    _cache[87] || (_cache[87] = _createElementVNode("div", { class: "eyebrow" }, "SYSTEM OPERATIONS", -1 /* CACHED */)),
                    _cache[88] || (_cache[88] = _createElementVNode("div", { class: "hero-heading" }, [
                      _createElementVNode("h1", { id: "sysops-title" }, "系统运维")
                    ], -1 /* CACHED */)),
                    _createElementVNode("p", _hoisted_113, [
                      _createElementVNode("span", null, _toDisplayString(_ctx.host.hostname || "--"), 1 /* TEXT */),
                      _createElementVNode("span", null, _toDisplayString(_ctx.host.os_name || "Linux"), 1 /* TEXT */)
                    ])
                  ]),
                  _createElementVNode("div", _hoisted_114, [
                    _createElementVNode("div", _hoisted_115, [
                      _createElementVNode("span", {
                        class: _normalizeClass(["status-badge", { error: !!_ctx.sysopsError, pending: !_ctx.realtime.ready && !_ctx.sysopsError }]),
                        role: "status",
                        "aria-live": "polite"
                      }, _toDisplayString(_ctx.sysopsError ? "采集异常" : (_ctx.realtime.ready ? "实时采集中" : "正在连接")), 3 /* TEXT, CLASS */),
                      _createElementVNode("span", _hoisted_116, _toDisplayString(_ctx.sysopsUpdatedAt || "等待数据"), 1 /* TEXT */)
                    ]),
                    _createElementVNode("span", _hoisted_117, [
                      _cache[89] || (_cache[89] = _createElementVNode("svg", {
                        class: "uptime-glyph",
                        width: "12",
                        height: "12",
                        viewBox: "0 0 16 16",
                        fill: "none",
                        "aria-hidden": "true"
                      }, [
                        _createElementVNode("circle", {
                          cx: "8",
                          cy: "8",
                          r: "6.5",
                          stroke: "currentColor",
                          "stroke-width": "1.4"
                        }),
                        _createElementVNode("path", {
                          d: "M8 4.5 V8 L10.4 9.6",
                          stroke: "currentColor",
                          "stroke-width": "1.4",
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round"
                        })
                      ], -1 /* CACHED */)),
                      _createTextVNode(" 已运行 " + _toDisplayString(_ctx.formatUptime(_ctx.realtime.uptime_seconds) || "加载中"), 1 /* TEXT */)
                    ])
                  ])
                ]),
                (_ctx.sysopsError)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_118, _toDisplayString(_ctx.sysopsError), 1 /* TEXT */))
                  : _createCommentVNode("v-if", true),
                _createElementVNode("section", _hoisted_119, [
                  _createElementVNode("article", _hoisted_120, [
                    _createElementVNode("div", _hoisted_121, [
                      _cache[90] || (_cache[90] = _createElementVNode("div", { class: "metric-label" }, "CPU 实时占用", -1 /* CACHED */)),
                      _createElementVNode("span", _hoisted_122, _toDisplayString(_ctx.realtime.cpu.count || _ctx.host.cpu_count || "--") + " 核", 1 /* TEXT */),
                      _createElementVNode("span", {
                        class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.realtime.cpu.percent)])
                      }, _toDisplayString(_ctx.statusLabel(_ctx.realtime.cpu.percent)), 3 /* TEXT, CLASS */)
                    ]),
                    _createElementVNode("div", _hoisted_123, [
                      _createElementVNode("div", _hoisted_124, _toDisplayString(_ctx.formatPercent(_ctx.realtime.cpu.percent)), 1 /* TEXT */),
                      _createElementVNode("div", _hoisted_125, [
                        _createElementVNode("div", _hoisted_126, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.cpuLoadValues[0])), 1 /* TEXT */),
                          _cache[91] || (_cache[91] = _createElementVNode("small", null, "1分", -1 /* CACHED */))
                        ]),
                        _cache[94] || (_cache[94] = _createElementVNode("span", {
                          class: "load-average-sep",
                          "aria-hidden": "true"
                        }, "·", -1 /* CACHED */)),
                        _createElementVNode("div", _hoisted_127, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.cpuLoadValues[1])), 1 /* TEXT */),
                          _cache[92] || (_cache[92] = _createElementVNode("small", null, "5分", -1 /* CACHED */))
                        ]),
                        _cache[95] || (_cache[95] = _createElementVNode("span", {
                          class: "load-average-sep",
                          "aria-hidden": "true"
                        }, "·", -1 /* CACHED */)),
                        _createElementVNode("div", _hoisted_128, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.cpuLoadValues[2])), 1 /* TEXT */),
                          _cache[93] || (_cache[93] = _createElementVNode("small", null, "15分", -1 /* CACHED */))
                        ])
                      ])
                    ]),
                    _createElementVNode("div", _hoisted_129, [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.perCoreValues, (core, index) => {
                        return (_openBlock(), _createElementBlock("span", {
                          key: index,
                          class: "core-bar",
                          style: _normalizeStyle({ height: _ctx.coreBarHeight(core) }),
                          title: '核心 ' + index + '：' + _ctx.formatPercent(core)
                        }, null, 12 /* STYLE, PROPS */, _hoisted_130))
                      }), 128 /* KEYED_FRAGMENT */)),
                      (!_ctx.perCoreValues.length)
                        ? (_openBlock(), _createElementBlock("span", _hoisted_131, "等待核心采样"))
                        : _createCommentVNode("v-if", true)
                    ])
                  ]),
                  _createElementVNode("article", _hoisted_132, [
                    _createElementVNode("div", _hoisted_133, [
                      _cache[96] || (_cache[96] = _createElementVNode("div", { class: "metric-label" }, "内存实时占用", -1 /* CACHED */)),
                      _createElementVNode("span", {
                        class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.realtime.memory.percent)])
                      }, _toDisplayString(_ctx.statusLabel(_ctx.realtime.memory.percent)), 3 /* TEXT, CLASS */)
                    ]),
                    _createElementVNode("div", _hoisted_134, [
                      _createElementVNode("div", _hoisted_135, _toDisplayString(_ctx.formatPercent(_ctx.realtime.memory.percent)), 1 /* TEXT */),
                      _createElementVNode("div", _hoisted_136, [
                        _createElementVNode("strong", null, _toDisplayString(_ctx.formatGB(_ctx.realtime.memory.used, 1)), 1 /* TEXT */),
                        _createElementVNode("span", null, "/ " + _toDisplayString(_ctx.formatGB(_ctx.realtime.memory.total, 1)), 1 /* TEXT */)
                      ])
                    ]),
                    _createElementVNode("div", {
                      class: "progress-track violet",
                      role: "progressbar",
                      "aria-label": "内存使用率",
                      "aria-valuemin": "0",
                      "aria-valuemax": "100",
                      "aria-valuenow": _ctx.clampNumber(_ctx.realtime.memory.percent),
                      "aria-valuetext": _ctx.formatPercent(_ctx.realtime.memory.percent)
                    }, [
                      _createElementVNode("span", {
                        style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.realtime.memory.percent) })
                      }, null, 4 /* STYLE */)
                    ], 8 /* PROPS */, _hoisted_137),
                    _createElementVNode("div", _hoisted_138, "可用 " + _toDisplayString(_ctx.formatGB(_ctx.realtime.memory.available, 1)) + " · Swap " + _toDisplayString(_ctx.formatPercent(_ctx.realtime.memory.swap_percent)), 1 /* TEXT */)
                  ]),
                  _createElementVNode("article", _hoisted_139, [
                    _createElementVNode("div", _hoisted_140, [
                      _cache[97] || (_cache[97] = _createElementVNode("div", { class: "metric-label" }, "磁盘实时占用", -1 /* CACHED */)),
                      _createElementVNode("span", {
                        class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.realtime.disk_percent)])
                      }, _toDisplayString(_ctx.statusLabel(_ctx.realtime.disk_percent)), 3 /* TEXT, CLASS */)
                    ]),
                    _createElementVNode("div", _hoisted_141, [
                      _createElementVNode("div", _hoisted_142, _toDisplayString(_ctx.formatPercent(_ctx.realtime.disk_percent)), 1 /* TEXT */),
                      _createElementVNode("div", _hoisted_143, [
                        _createElementVNode("strong", null, _toDisplayString(_ctx.formatRate(_ctx.realtime.disk_io.read_bps)), 1 /* TEXT */),
                        _cache[98] || (_cache[98] = _createElementVNode("span", null, "读", -1 /* CACHED */)),
                        _createElementVNode("strong", null, _toDisplayString(_ctx.formatRate(_ctx.realtime.disk_io.write_bps)), 1 /* TEXT */),
                        _cache[99] || (_cache[99] = _createElementVNode("span", null, "写", -1 /* CACHED */))
                      ])
                    ]),
                    _createElementVNode("div", {
                      class: "progress-track amber",
                      role: "progressbar",
                      "aria-label": "系统盘使用率",
                      "aria-valuemin": "0",
                      "aria-valuemax": "100",
                      "aria-valuenow": _ctx.clampNumber(_ctx.realtime.disk_percent),
                      "aria-valuetext": _ctx.formatPercent(_ctx.realtime.disk_percent)
                    }, [
                      _createElementVNode("span", {
                        style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.realtime.disk_percent) })
                      }, null, 4 /* STYLE */)
                    ], 8 /* PROPS */, _hoisted_144),
                    _createElementVNode("div", _hoisted_145, _toDisplayString(_ctx.rootDiskLabel), 1 /* TEXT */)
                  ])
                ]),
                _createElementVNode("section", _hoisted_146, [
                  _cache[103] || (_cache[103] = _createStaticVNode("<div class=\"panel-head compact\"><div><div class=\"eyebrow\">REALTIME PULSE</div><h2 id=\"pulse-title\">最近 90 秒实时走势</h2></div><span class=\"pulse-legend\"><i class=\"cpu\"></i>CPU <i class=\"memory\"></i>内存 <i class=\"disk\"></i>磁盘 </span></div>", 1)),
                  (_ctx.realtimeSeries.length)
                    ? (_openBlock(), _createElementBlock("div", _hoisted_147, [
                        _cache[101] || (_cache[101] = _createElementVNode("div", { class: "chart-y-axis" }, [
                          _createElementVNode("span", null, "100%"),
                          _createElementVNode("span", null, "75%"),
                          _createElementVNode("span", null, "50%"),
                          _createElementVNode("span", null, "25%"),
                          _createElementVNode("span", null, "0%")
                        ], -1 /* CACHED */)),
                        (_openBlock(), _createElementBlock("svg", _hoisted_148, [
                          _cache[100] || (_cache[100] = _createStaticVNode("<g class=\"trend-grid\"><line x1=\"0\" y1=\"0\" x2=\"1000\" y2=\"0\"></line><line x1=\"0\" y1=\"65\" x2=\"1000\" y2=\"65\"></line><line x1=\"0\" y1=\"130\" x2=\"1000\" y2=\"130\"></line><line x1=\"0\" y1=\"195\" x2=\"1000\" y2=\"195\"></line><line x1=\"0\" y1=\"260\" x2=\"1000\" y2=\"260\"></line></g>", 1)),
                          _createElementVNode("polyline", {
                            points: _ctx.realtimePoints('cpu'),
                            class: "trend-line cpu"
                          }, null, 8 /* PROPS */, _hoisted_149),
                          _createElementVNode("polyline", {
                            points: _ctx.realtimePoints('memory'),
                            class: "trend-line memory"
                          }, null, 8 /* PROPS */, _hoisted_150),
                          _createElementVNode("polyline", {
                            points: _ctx.realtimePoints('disk'),
                            class: "trend-line disk"
                          }, null, 8 /* PROPS */, _hoisted_151)
                        ])),
                        _cache[102] || (_cache[102] = _createElementVNode("div", { class: "chart-time-axis" }, [
                          _createElementVNode("span", null, "90 秒前"),
                          _createElementVNode("span", null, "现在")
                        ], -1 /* CACHED */))
                      ]))
                    : (_openBlock(), _createElementBlock("div", _hoisted_152, "正在采集实时样本…"))
                ]),
                _createElementVNode("section", _hoisted_153, [
                  _createElementVNode("div", _hoisted_154, [
                    _cache[104] || (_cache[104] = _createElementVNode("div", null, [
                      _createElementVNode("div", { class: "eyebrow" }, "FILESYSTEMS"),
                      _createElementVNode("h2", { id: "disks-title" }, "磁盘分区")
                    ], -1 /* CACHED */)),
                    _createElementVNode("span", _hoisted_155, _toDisplayString(_ctx.realtimeDisks.length) + " 个挂载点 · 每秒刷新", 1 /* TEXT */)
                  ]),
                  _createElementVNode("div", _hoisted_156, [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.realtimeDisks, (disk) => {
                      return (_openBlock(), _createElementBlock("div", {
                        key: disk.mount,
                        class: "disk-row"
                      }, [
                        _createElementVNode("div", _hoisted_157, [
                          _createElementVNode("strong", null, _toDisplayString(disk.mount), 1 /* TEXT */),
                          _createElementVNode("small", null, _toDisplayString(disk.device) + " · " + _toDisplayString(disk.fstype), 1 /* TEXT */)
                        ]),
                        _createElementVNode("div", _hoisted_158, [
                          _createElementVNode("div", {
                            class: "progress-track",
                            role: "progressbar",
                            "aria-label": disk.mount + ' 使用率',
                            "aria-valuemin": "0",
                            "aria-valuemax": "100",
                            "aria-valuenow": _ctx.clampNumber(disk.percent),
                            "aria-valuetext": _ctx.formatPercent(disk.percent)
                          }, [
                            _createElementVNode("span", {
                              style: _normalizeStyle({ width: _ctx.clampPercent(disk.percent) })
                            }, null, 4 /* STYLE */)
                          ], 8 /* PROPS */, _hoisted_159)
                        ]),
                        _createElementVNode("div", _hoisted_160, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.formatPercent(disk.percent)), 1 /* TEXT */),
                          _createElementVNode("small", null, _toDisplayString(_ctx.formatGB(disk.used, 1)) + " / " + _toDisplayString(_ctx.formatGB(disk.total, 1)) + " · 剩余 " + _toDisplayString(_ctx.formatGB(disk.free, 1)), 1 /* TEXT */)
                        ])
                      ]))
                    }), 128 /* KEYED_FRAGMENT */)),
                    (!_ctx.realtimeDisks.length)
                      ? (_openBlock(), _createElementBlock("div", _hoisted_161, "等待磁盘采样"))
                      : _createCommentVNode("v-if", true)
                  ])
                ]),
                _createElementVNode("section", _hoisted_162, [
                  _createElementVNode("div", _hoisted_163, [
                    _cache[106] || (_cache[106] = _createElementVNode("div", null, [
                      _createElementVNode("div", { class: "eyebrow" }, "CONTAINERS"),
                      _createElementVNode("h2", { id: "docker-title" }, "Docker 容器")
                    ], -1 /* CACHED */)),
                    _createElementVNode("div", _hoisted_164, [
                      _createElementVNode("span", _hoisted_165, [
                        _cache[105] || (_cache[105] = _createElementVNode("i", { "aria-hidden": "true" }, null, -1 /* CACHED */)),
                        _createTextVNode(_toDisplayString(_ctx.dockerCounts.running) + " 运行中 ", 1 /* TEXT */)
                      ]),
                      _createElementVNode("span", _hoisted_166, "共 " + _toDisplayString(_ctx.dockerCounts.total) + " 个", 1 /* TEXT */),
                      (_ctx.docker.stale)
                        ? (_openBlock(), _createElementBlock("span", _hoisted_167, " 数据已过期 "))
                        : _createCommentVNode("v-if", true),
                      _createElementVNode("button", {
                        type: "button",
                        class: "text-button",
                        disabled: _ctx.dockerLoading,
                        onClick: _cache[23] || (_cache[23] = (...args) => (_ctx.refreshDocker && _ctx.refreshDocker(...args)))
                      }, _toDisplayString(_ctx.dockerLoading ? "刷新中" : "刷新"), 9 /* TEXT, PROPS */, _hoisted_168)
                    ])
                  ]),
                  (_ctx.docker.available)
                    ? (_openBlock(), _createElementBlock("div", _hoisted_169, [
                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerContainers, (item) => {
                          return (_openBlock(), _createElementBlock("div", {
                            key: item.id,
                            class: "docker-entry"
                          }, [
                            _createElementVNode("button", {
                              type: "button",
                              class: _normalizeClass(["docker-row docker-row-button", { expanded: _ctx.dockerExpanded === item.id }]),
                              "aria-expanded": _ctx.dockerExpanded === item.id ? 'true' : 'false',
                              onClick: $event => (_ctx.toggleDockerDetail(item))
                            }, [
                              _createElementVNode("span", {
                                class: _normalizeClass(["docker-dot", item.state]),
                                title: item.state
                              }, null, 10 /* CLASS, PROPS */, _hoisted_171),
                              _createElementVNode("span", _hoisted_172, [
                                _createElementVNode("strong", null, _toDisplayString(item.name || item.id), 1 /* TEXT */),
                                _createElementVNode("small", null, _toDisplayString(item.image), 1 /* TEXT */)
                              ]),
                              _createElementVNode("span", _hoisted_173, _toDisplayString(item.status || item.state), 1 /* TEXT */),
                              _createElementVNode("span", {
                                class: "docker-cell docker-ports",
                                title: item.ports || ''
                              }, _toDisplayString(item.ports || "未映射端口"), 9 /* TEXT, PROPS */, _hoisted_174),
                              _createElementVNode("span", _hoisted_175, [
                                _createElementVNode("span", null, [
                                  _cache[107] || (_cache[107] = _createTextVNode("CPU ")),
                                  _createElementVNode("strong", null, _toDisplayString(_ctx.formatCpuShare(item.cpu_percent)), 1 /* TEXT */)
                                ]),
                                _createElementVNode("span", null, [
                                  _cache[108] || (_cache[108] = _createTextVNode("内存 ")),
                                  _createElementVNode("strong", null, _toDisplayString(item.memory_usage || "--"), 1 /* TEXT */)
                                ])
                              ]),
                              _cache[109] || (_cache[109] = _createElementVNode("span", {
                                class: "docker-chevron",
                                "aria-hidden": "true"
                              }, null, -1 /* CACHED */))
                            ], 10 /* CLASS, PROPS */, _hoisted_170),
                            (_ctx.dockerExpanded === item.id)
                              ? (_openBlock(), _createElementBlock("div", _hoisted_176, [
                                  _createElementVNode("div", _hoisted_177, [
                                    _createElementVNode("button", {
                                      type: "button",
                                      class: _normalizeClass(["docker-tab", { active: _ctx.dockerTab === 'overview' }]),
                                      role: "tab",
                                      "aria-selected": _ctx.dockerTab === 'overview' ? 'true' : 'false',
                                      onClick: _cache[24] || (_cache[24] = $event => (_ctx.setDockerTab('overview')))
                                    }, "概览", 10 /* CLASS, PROPS */, _hoisted_178),
                                    _createElementVNode("button", {
                                      type: "button",
                                      class: _normalizeClass(["docker-tab", { active: _ctx.dockerTab === 'logs' }]),
                                      role: "tab",
                                      "aria-selected": _ctx.dockerTab === 'logs' ? 'true' : 'false',
                                      onClick: _cache[25] || (_cache[25] = $event => (_ctx.setDockerTab('logs')))
                                    }, "日志", 10 /* CLASS, PROPS */, _hoisted_179),
                                    _createElementVNode("code", _hoisted_180, _toDisplayString(item.id), 1 /* TEXT */)
                                  ]),
                                  (_ctx.dockerTab === 'overview')
                                    ? (_openBlock(), _createElementBlock("div", _hoisted_181, [
                                        (_ctx.dockerDetailLoading)
                                          ? (_openBlock(), _createElementBlock("p", _hoisted_182, "正在读取容器详情…"))
                                          : (_ctx.dockerDetailError)
                                            ? (_openBlock(), _createElementBlock("p", _hoisted_183, _toDisplayString(_ctx.dockerDetailError), 1 /* TEXT */))
                                            : (_ctx.dockerDetail)
                                              ? (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
                                                  _createElementVNode("dl", _hoisted_184, [
                                                    _createElementVNode("div", null, [
                                                      _cache[110] || (_cache[110] = _createElementVNode("dt", null, "镜像", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, [
                                                        _createElementVNode("code", null, _toDisplayString(_ctx.dockerDetail.image || "--"), 1 /* TEXT */)
                                                      ])
                                                    ]),
                                                    _createElementVNode("div", null, [
                                                      _cache[111] || (_cache[111] = _createElementVNode("dt", null, "状态", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, _toDisplayString(_ctx.dockerStateLabel(_ctx.dockerDetail)), 1 /* TEXT */)
                                                    ]),
                                                    _createElementVNode("div", null, [
                                                      _cache[112] || (_cache[112] = _createElementVNode("dt", null, "启动时间", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, _toDisplayString(_ctx.formatDockerTime(_ctx.dockerDetail.state.started_at)), 1 /* TEXT */)
                                                    ]),
                                                    _createElementVNode("div", null, [
                                                      _cache[113] || (_cache[113] = _createElementVNode("dt", null, "重启次数", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, _toDisplayString(_ctx.dockerDetail.state.restart_count === null ? "--" : _ctx.dockerDetail.state.restart_count), 1 /* TEXT */)
                                                    ]),
                                                    _createElementVNode("div", null, [
                                                      _cache[114] || (_cache[114] = _createElementVNode("dt", null, "退出码", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, _toDisplayString(_ctx.dockerDetail.state.exit_code === null ? "--" : _ctx.dockerDetail.state.exit_code), 1 /* TEXT */)
                                                    ]),
                                                    _createElementVNode("div", null, [
                                                      _cache[115] || (_cache[115] = _createElementVNode("dt", null, "重启策略", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, _toDisplayString(_ctx.dockerDetail.restart_policy || "no"), 1 /* TEXT */)
                                                    ]),
                                                    _createElementVNode("div", null, [
                                                      _cache[116] || (_cache[116] = _createElementVNode("dt", null, "日志驱动", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, _toDisplayString(_ctx.dockerDetail.log_driver || "--"), 1 /* TEXT */)
                                                    ]),
                                                    _createElementVNode("div", null, [
                                                      _cache[117] || (_cache[117] = _createElementVNode("dt", null, "运行用户", -1 /* CACHED */)),
                                                      _createElementVNode("dd", null, _toDisplayString(_ctx.dockerDetail.user || "镜像默认"), 1 /* TEXT */)
                                                    ])
                                                  ]),
                                                  (_ctx.dockerDetail.ports.length)
                                                    ? (_openBlock(), _createElementBlock("div", _hoisted_185, [
                                                        _cache[119] || (_cache[119] = _createElementVNode("h4", null, "端口映射", -1 /* CACHED */)),
                                                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerDetail.ports, (port, index) => {
                                                          return (_openBlock(), _createElementBlock("div", {
                                                            key: 'port' + index,
                                                            class: "docker-subrow"
                                                          }, [
                                                            _createElementVNode("span", null, _toDisplayString(port.host_ip || "0.0.0.0") + ":" + _toDisplayString(port.host_port), 1 /* TEXT */),
                                                            _cache[118] || (_cache[118] = _createElementVNode("span", { class: "muted" }, "映射到", -1 /* CACHED */)),
                                                            _createElementVNode("span", null, _toDisplayString(port.container), 1 /* TEXT */)
                                                          ]))
                                                        }), 128 /* KEYED_FRAGMENT */))
                                                      ]))
                                                    : _createCommentVNode("v-if", true),
                                                  (_ctx.dockerDetail.mounts.length)
                                                    ? (_openBlock(), _createElementBlock("div", _hoisted_186, [
                                                        _cache[121] || (_cache[121] = _createElementVNode("h4", null, "挂载", -1 /* CACHED */)),
                                                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerDetail.mounts, (mount, index) => {
                                                          return (_openBlock(), _createElementBlock("div", {
                                                            key: 'mount' + index,
                                                            class: "docker-subrow"
                                                          }, [
                                                            _createElementVNode("span", _hoisted_187, _toDisplayString(mount.type), 1 /* TEXT */),
                                                            _createElementVNode("span", {
                                                              class: "mono",
                                                              title: mount.source
                                                            }, _toDisplayString(mount.source), 9 /* TEXT, PROPS */, _hoisted_188),
                                                            _cache[120] || (_cache[120] = _createElementVNode("span", { class: "muted" }, "→", -1 /* CACHED */)),
                                                            _createElementVNode("span", _hoisted_189, _toDisplayString(mount.destination), 1 /* TEXT */),
                                                            _createElementVNode("span", _hoisted_190, _toDisplayString(mount.rw ? "读写" : "只读"), 1 /* TEXT */)
                                                          ]))
                                                        }), 128 /* KEYED_FRAGMENT */))
                                                      ]))
                                                    : _createCommentVNode("v-if", true),
                                                  (_ctx.dockerDetail.networks.length)
                                                    ? (_openBlock(), _createElementBlock("div", _hoisted_191, [
                                                        _cache[122] || (_cache[122] = _createElementVNode("h4", null, "网络", -1 /* CACHED */)),
                                                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerDetail.networks, (network, index) => {
                                                          return (_openBlock(), _createElementBlock("div", {
                                                            key: 'net' + index,
                                                            class: "docker-subrow"
                                                          }, [
                                                            _createElementVNode("span", null, _toDisplayString(network.name), 1 /* TEXT */),
                                                            _createElementVNode("span", _hoisted_192, _toDisplayString(network.ip || "无 IP"), 1 /* TEXT */),
                                                            _createElementVNode("span", _hoisted_193, _toDisplayString(network.gateway), 1 /* TEXT */)
                                                          ]))
                                                        }), 128 /* KEYED_FRAGMENT */))
                                                      ]))
                                                    : _createCommentVNode("v-if", true),
                                                  (_ctx.dockerDetail.env.length)
                                                    ? (_openBlock(), _createElementBlock("details", _hoisted_194, [
                                                        _createElementVNode("summary", null, [
                                                          _createTextVNode(" 环境变量 " + _toDisplayString(_ctx.dockerDetail.env.length) + " 项 ", 1 /* TEXT */),
                                                          _cache[123] || (_cache[123] = _createElementVNode("span", { class: "muted" }, "（名字像密钥的值已打码）", -1 /* CACHED */))
                                                        ]),
                                                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerDetail.env, (env, index) => {
                                                          return (_openBlock(), _createElementBlock("div", {
                                                            key: 'env' + index,
                                                            class: "docker-subrow"
                                                          }, [
                                                            _createElementVNode("span", _hoisted_195, _toDisplayString(env.key), 1 /* TEXT */),
                                                            _createElementVNode("span", _hoisted_196, _toDisplayString(env.value || "（空）"), 1 /* TEXT */)
                                                          ]))
                                                        }), 128 /* KEYED_FRAGMENT */))
                                                      ]))
                                                    : _createCommentVNode("v-if", true)
                                                ], 64 /* STABLE_FRAGMENT */))
                                              : _createCommentVNode("v-if", true)
                                      ]))
                                    : (_openBlock(), _createElementBlock("div", _hoisted_197, [
                                        _createElementVNode("div", _hoisted_198, [
                                          _createElementVNode("div", _hoisted_199, [
                                            _createElementVNode("button", {
                                              type: "button",
                                              class: _normalizeClass(["docker-seg-btn", { active: _ctx.dockerLogTail === 200 }]),
                                              onClick: _cache[26] || (_cache[26] = $event => (_ctx.setDockerLogTail(200)))
                                            }, "200", 2 /* CLASS */),
                                            _createElementVNode("button", {
                                              type: "button",
                                              class: _normalizeClass(["docker-seg-btn", { active: _ctx.dockerLogTail === 500 }]),
                                              onClick: _cache[27] || (_cache[27] = $event => (_ctx.setDockerLogTail(500)))
                                            }, "500", 2 /* CLASS */),
                                            _createElementVNode("button", {
                                              type: "button",
                                              class: _normalizeClass(["docker-seg-btn", { active: _ctx.dockerLogTail === 1000 }]),
                                              onClick: _cache[28] || (_cache[28] = $event => (_ctx.setDockerLogTail(1000)))
                                            }, "1000", 2 /* CLASS */)
                                          ]),
                                          _createElementVNode("button", {
                                            type: "button",
                                            class: "text-button",
                                            disabled: _ctx.dockerLogsLoading,
                                            onClick: _cache[29] || (_cache[29] = (...args) => (_ctx.loadDockerLogs && _ctx.loadDockerLogs(...args)))
                                          }, _toDisplayString(_ctx.dockerLogsLoading ? "读取中" : "刷新"), 9 /* TEXT, PROPS */, _hoisted_200),
                                          _createElementVNode("label", _hoisted_201, [
                                            _createElementVNode("input", {
                                              type: "checkbox",
                                              checked: _ctx.dockerLogAuto,
                                              onChange: _cache[30] || (_cache[30] = (...args) => (_ctx.toggleDockerLogAuto && _ctx.toggleDockerLogAuto(...args)))
                                            }, null, 40 /* PROPS, NEED_HYDRATION */, _hoisted_202),
                                            _cache[124] || (_cache[124] = _createElementVNode("span", null, "自动刷新", -1 /* CACHED */))
                                          ]),
                                          (_ctx.dockerLogs)
                                            ? (_openBlock(), _createElementBlock("span", _hoisted_203, _toDisplayString(_ctx.dockerLogs.lines) + " 行", 1 /* TEXT */))
                                            : _createCommentVNode("v-if", true)
                                        ]),
                                        (_ctx.dockerLogsError)
                                          ? (_openBlock(), _createElementBlock("p", _hoisted_204, _toDisplayString(_ctx.dockerLogsError), 1 /* TEXT */))
                                          : (_openBlock(), _createElementBlock("pre", _hoisted_205, _toDisplayString(_ctx.dockerLogs ? (_ctx.dockerLogs.text || "（这个容器还没有输出）") : "正在读取日志…"), 1 /* TEXT */)),
                                        (_ctx.dockerLogs && _ctx.dockerLogs.clipped)
                                          ? (_openBlock(), _createElementBlock("p", _hoisted_206, "日志过长，仅保留最后 400KB"))
                                          : _createCommentVNode("v-if", true)
                                      ]))
                                ]))
                              : _createCommentVNode("v-if", true)
                          ]))
                        }), 128 /* KEYED_FRAGMENT */)),
                        (!_ctx.dockerContainers.length)
                          ? (_openBlock(), _createElementBlock("div", _hoisted_207, _cache[125] || (_cache[125] = [
                              _createElementVNode("span", null, "✓", -1 /* CACHED */),
                              _createTextVNode(" 这台服务器上没有 docker 容器 ")
                            ])))
                          : _createCommentVNode("v-if", true)
                      ]))
                    : (_openBlock(), _createElementBlock("div", _hoisted_208, [
                        _cache[126] || (_cache[126] = _createElementVNode("strong", null, "读取不到 docker 容器", -1 /* CACHED */)),
                        _createElementVNode("p", null, _toDisplayString(_ctx.docker.reason || "docker 不可用"), 1 /* TEXT */),
                        (_ctx.docker.hint)
                          ? (_openBlock(), _createElementBlock("code", _hoisted_209, _toDisplayString(_ctx.docker.hint), 1 /* TEXT */))
                          : _createCommentVNode("v-if", true)
                      ])),
                  (_ctx.docker.available)
                    ? (_openBlock(), _createElementBlock("div", _hoisted_210, [
                        _createElementVNode("details", _hoisted_211, [
                          _createElementVNode("summary", null, [
                            _cache[127] || (_cache[127] = _createElementVNode("span", null, "镜像", -1 /* CACHED */)),
                            _createElementVNode("small", null, _toDisplayString(_ctx.dockerImages.length) + " 个", 1 /* TEXT */)
                          ]),
                          _createElementVNode("div", _hoisted_212, [
                            _cache[128] || (_cache[128] = _createElementVNode("div", { class: "docker-table-head" }, [
                              _createElementVNode("span", null, "仓库"),
                              _createElementVNode("span", null, "标签"),
                              _createElementVNode("span", null, "大小"),
                              _createElementVNode("span", null, "创建")
                            ], -1 /* CACHED */)),
                            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerImages, (image) => {
                              return (_openBlock(), _createElementBlock("div", {
                                key: image.id + image.repository + image.tag,
                                class: "docker-table-row"
                              }, [
                                _createElementVNode("span", {
                                  class: "mono",
                                  title: image.id
                                }, _toDisplayString(image.repository), 9 /* TEXT, PROPS */, _hoisted_213),
                                _createElementVNode("span", null, _toDisplayString(image.tag), 1 /* TEXT */),
                                _createElementVNode("span", null, _toDisplayString(image.size), 1 /* TEXT */),
                                _createElementVNode("span", _hoisted_214, _toDisplayString(image.created_since), 1 /* TEXT */)
                              ]))
                            }), 128 /* KEYED_FRAGMENT */)),
                            (!_ctx.dockerImages.length)
                              ? (_openBlock(), _createElementBlock("p", _hoisted_215, "没有镜像"))
                              : _createCommentVNode("v-if", true)
                          ])
                        ]),
                        _createElementVNode("details", _hoisted_216, [
                          _createElementVNode("summary", null, [
                            _cache[129] || (_cache[129] = _createElementVNode("span", null, "数据卷", -1 /* CACHED */)),
                            _createElementVNode("small", null, _toDisplayString(_ctx.dockerVolumes.length) + " 个", 1 /* TEXT */)
                          ]),
                          _createElementVNode("div", _hoisted_217, [
                            _cache[130] || (_cache[130] = _createElementVNode("div", { class: "docker-table-head three" }, [
                              _createElementVNode("span", null, "名称"),
                              _createElementVNode("span", null, "驱动"),
                              _createElementVNode("span", null, "范围")
                            ], -1 /* CACHED */)),
                            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerVolumes, (volume) => {
                              return (_openBlock(), _createElementBlock("div", {
                                key: volume.name,
                                class: "docker-table-row three"
                              }, [
                                _createElementVNode("span", _hoisted_218, _toDisplayString(volume.name), 1 /* TEXT */),
                                _createElementVNode("span", null, _toDisplayString(volume.driver), 1 /* TEXT */),
                                _createElementVNode("span", _hoisted_219, _toDisplayString(volume.scope), 1 /* TEXT */)
                              ]))
                            }), 128 /* KEYED_FRAGMENT */)),
                            (!_ctx.dockerVolumes.length)
                              ? (_openBlock(), _createElementBlock("p", _hoisted_220, "没有数据卷"))
                              : _createCommentVNode("v-if", true)
                          ])
                        ]),
                        _createElementVNode("details", _hoisted_221, [
                          _createElementVNode("summary", null, [
                            _cache[131] || (_cache[131] = _createElementVNode("span", null, "网络", -1 /* CACHED */)),
                            _createElementVNode("small", null, _toDisplayString(_ctx.dockerNetworks.length) + " 个", 1 /* TEXT */)
                          ]),
                          _createElementVNode("div", _hoisted_222, [
                            _cache[132] || (_cache[132] = _createElementVNode("div", { class: "docker-table-head" }, [
                              _createElementVNode("span", null, "名称"),
                              _createElementVNode("span", null, "驱动"),
                              _createElementVNode("span", null, "范围"),
                              _createElementVNode("span", null, "内部")
                            ], -1 /* CACHED */)),
                            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.dockerNetworks, (network) => {
                              return (_openBlock(), _createElementBlock("div", {
                                key: network.name,
                                class: "docker-table-row"
                              }, [
                                _createElementVNode("span", _hoisted_223, _toDisplayString(network.name), 1 /* TEXT */),
                                _createElementVNode("span", null, _toDisplayString(network.driver), 1 /* TEXT */),
                                _createElementVNode("span", _hoisted_224, _toDisplayString(network.scope), 1 /* TEXT */),
                                _createElementVNode("span", _hoisted_225, _toDisplayString(network.internal ? "是" : "否"), 1 /* TEXT */)
                              ]))
                            }), 128 /* KEYED_FRAGMENT */)),
                            (!_ctx.dockerNetworks.length)
                              ? (_openBlock(), _createElementBlock("p", _hoisted_226, "没有网络"))
                              : _createCommentVNode("v-if", true)
                          ])
                        ])
                      ]))
                    : _createCommentVNode("v-if", true)
                ])
              ], 64 /* STABLE_FRAGMENT */))
            : (_ctx.view === 'security')
              ? (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
                  _createElementVNode("section", _hoisted_227, [
                    _createElementVNode("div", null, [
                      _cache[133] || (_cache[133] = _createElementVNode("div", { class: "eyebrow" }, "DDOS DEFENSE", -1 /* CACHED */)),
                      _cache[134] || (_cache[134] = _createElementVNode("div", { class: "hero-heading" }, [
                        _createElementVNode("h1", { id: "security-title" }, "安全防护")
                      ], -1 /* CACHED */)),
                      _createElementVNode("p", _hoisted_228, [
                        _createElementVNode("span", null, _toDisplayString(_ctx.security.enabled ? "请求限速已开启" : "请求限速已关闭"), 1 /* TEXT */),
                        _createElementVNode("span", null, "单 IP 并发 " + _toDisplayString(_ctx.security.limits.max_concurrent || "--"), 1 /* TEXT */),
                        _createElementVNode("span", null, _toDisplayString(_ctx.security.active.tracked_ips || 0) + " 个来源 IP 在跟踪", 1 /* TEXT */)
                      ])
                    ]),
                    _createElementVNode("div", _hoisted_229, [
                      _createElementVNode("div", _hoisted_230, [
                        _createElementVNode("span", {
                          class: _normalizeClass(["status-badge", { error: !!_ctx.securityError, pending: !_ctx.securityReady && !_ctx.securityError }]),
                          role: "status",
                          "aria-live": "polite"
                        }, _toDisplayString(_ctx.securityError ? "读取异常" : (_ctx.securityReady ? (_ctx.security.recent.blocked ? "正在拦截异常请求" : "防护运行中") : "正在连接")), 3 /* TEXT, CLASS */)
                      ]),
                      _createElementVNode("span", _hoisted_231, "数据更新于 " + _toDisplayString(_ctx.securityClock || "--"), 1 /* TEXT */)
                    ])
                  ]),
                  (_ctx.securityError)
                    ? (_openBlock(), _createElementBlock("div", _hoisted_232, _toDisplayString(_ctx.securityError), 1 /* TEXT */))
                    : _createCommentVNode("v-if", true),
                  _createElementVNode("section", _hoisted_233, [
                    _createElementVNode("article", _hoisted_234, [
                      _cache[136] || (_cache[136] = _createElementVNode("div", { class: "metric-card-head" }, [
                        _createElementVNode("div", { class: "metric-label" }, "最近一分钟请求"),
                        _createElementVNode("span", { class: "metric-state normal" }, "实时")
                      ], -1 /* CACHED */)),
                      _createElementVNode("div", _hoisted_235, [
                        _createElementVNode("div", _hoisted_236, _toDisplayString(_ctx.security.recent.requests || 0), 1 /* TEXT */),
                        _createElementVNode("div", _hoisted_237, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.security.recent.allowed || 0), 1 /* TEXT */),
                          _cache[135] || (_cache[135] = _createElementVNode("span", null, "次放行", -1 /* CACHED */))
                        ])
                      ]),
                      _createElementVNode("div", _hoisted_238, "累计 " + _toDisplayString(_ctx.security.totals.requests || 0) + " 次请求", 1 /* TEXT */)
                    ]),
                    _createElementVNode("article", _hoisted_239, [
                      _createElementVNode("div", _hoisted_240, [
                        _cache[137] || (_cache[137] = _createElementVNode("div", { class: "metric-label" }, "最近一分钟拦截", -1 /* CACHED */)),
                        _createElementVNode("span", {
                          class: _normalizeClass(["metric-state", _ctx.security.recent.blocked ? 'critical' : 'normal'])
                        }, _toDisplayString(_ctx.security.recent.blocked ? "拦截中" : "无异常"), 3 /* TEXT, CLASS */)
                      ]),
                      _createElementVNode("div", _hoisted_241, [
                        _createElementVNode("div", _hoisted_242, _toDisplayString(_ctx.security.recent.blocked || 0), 1 /* TEXT */),
                        _createElementVNode("div", _hoisted_243, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.security.totals.blocked || 0), 1 /* TEXT */),
                          _cache[138] || (_cache[138] = _createElementVNode("span", null, "次累计拦截", -1 /* CACHED */))
                        ])
                      ]),
                      _cache[139] || (_cache[139] = _createElementVNode("div", { class: "metric-foot" }, "限速、超限并发与超大请求都计为拦截", -1 /* CACHED */))
                    ]),
                    _createElementVNode("article", _hoisted_244, [
                      _createElementVNode("div", _hoisted_245, [
                        _cache[140] || (_cache[140] = _createElementVNode("div", { class: "metric-label" }, "当前封禁来源", -1 /* CACHED */)),
                        _createElementVNode("span", {
                          class: _normalizeClass(["metric-state", _ctx.securityBans.length ? 'critical' : 'normal'])
                        }, _toDisplayString(_ctx.securityBans.length ? "已封禁" : "无封禁"), 3 /* TEXT, CLASS */)
                      ]),
                      _createElementVNode("div", _hoisted_246, [
                        _createElementVNode("div", _hoisted_247, _toDisplayString(_ctx.securityBans.length), 1 /* TEXT */),
                        _createElementVNode("div", _hoisted_248, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.security.limits.strike_limit || "--"), 1 /* TEXT */),
                          _cache[141] || (_cache[141] = _createElementVNode("span", null, "次违规触发封禁", -1 /* CACHED */))
                        ])
                      ]),
                      _createElementVNode("div", _hoisted_249, "首次 " + _toDisplayString(_ctx.formatDuration(_ctx.security.limits.ban_seconds)) + "，逐次翻倍", 1 /* TEXT */)
                    ]),
                    _createElementVNode("article", _hoisted_250, [
                      _cache[143] || (_cache[143] = _createElementVNode("div", { class: "metric-card-head" }, [
                        _createElementVNode("div", { class: "metric-label" }, "在途并发请求"),
                        _createElementVNode("span", { class: "metric-state normal" }, "实时")
                      ], -1 /* CACHED */)),
                      _createElementVNode("div", _hoisted_251, [
                        _createElementVNode("div", _hoisted_252, _toDisplayString(_ctx.security.active.concurrent || 0), 1 /* TEXT */),
                        _createElementVNode("div", _hoisted_253, [
                          _createElementVNode("strong", null, _toDisplayString(_ctx.security.limits.max_global_concurrent || "--"), 1 /* TEXT */),
                          _cache[142] || (_cache[142] = _createElementVNode("span", null, "进程级上限", -1 /* CACHED */))
                        ])
                      ]),
                      _createElementVNode("div", _hoisted_254, "单 IP 上限 " + _toDisplayString(_ctx.security.limits.max_concurrent || "--") + " 个", 1 /* TEXT */)
                    ])
                  ]),
                  _createElementVNode("section", _hoisted_255, [
                    _cache[150] || (_cache[150] = _createElementVNode("div", { class: "panel-head compact" }, [
                      _createElementVNode("div", null, [
                        _createElementVNode("div", { class: "eyebrow" }, "POLICY"),
                        _createElementVNode("h2", { id: "security-policy-title" }, "当前限流策略")
                      ]),
                      _createElementVNode("span", { class: "muted" }, "限流参数来自 FOXOPS_SECURITY_* 环境变量，改完重启服务生效")
                    ], -1 /* CACHED */)),
                    _createElementVNode("div", _hoisted_256, [
                      _createElementVNode("div", _hoisted_257, [
                        _cache[144] || (_cache[144] = _createElementVNode("span", null, "突发窗口", -1 /* CACHED */)),
                        _createElementVNode("strong", null, _toDisplayString(_ctx.security.limits.burst || "--") + " 次 / " + _toDisplayString(_ctx.security.limits.burst_window_seconds || "--") + " 秒", 1 /* TEXT */)
                      ]),
                      _createElementVNode("div", _hoisted_258, [
                        _cache[145] || (_cache[145] = _createElementVNode("span", null, "持续窗口", -1 /* CACHED */)),
                        _createElementVNode("strong", null, _toDisplayString(_ctx.security.limits.sustained || "--") + " 次 / " + _toDisplayString(_ctx.security.limits.sustained_window_seconds || "--") + " 秒", 1 /* TEXT */)
                      ]),
                      _createElementVNode("div", _hoisted_259, [
                        _cache[146] || (_cache[146] = _createElementVNode("span", null, "单 IP 并发", -1 /* CACHED */)),
                        _createElementVNode("strong", null, _toDisplayString(_ctx.security.limits.max_concurrent || "--") + " 个", 1 /* TEXT */)
                      ]),
                      _createElementVNode("div", _hoisted_260, [
                        _cache[147] || (_cache[147] = _createElementVNode("span", null, "全局并发", -1 /* CACHED */)),
                        _createElementVNode("strong", null, _toDisplayString(_ctx.security.limits.max_global_concurrent || "--") + " 个", 1 /* TEXT */)
                      ]),
                      _createElementVNode("div", _hoisted_261, [
                        _cache[148] || (_cache[148] = _createElementVNode("span", null, "封禁触发", -1 /* CACHED */)),
                        _createElementVNode("strong", null, _toDisplayString(_ctx.security.limits.strike_limit || "--") + " 次违规 / " + _toDisplayString(_ctx.security.limits.strike_window_seconds || "--") + " 秒", 1 /* TEXT */)
                      ]),
                      _createElementVNode("div", _hoisted_262, [
                        _cache[149] || (_cache[149] = _createElementVNode("span", null, "封禁时长", -1 /* CACHED */)),
                        _createElementVNode("strong", null, _toDisplayString(_ctx.formatDuration(_ctx.security.limits.ban_seconds)) + " 起，最长 " + _toDisplayString(_ctx.formatDuration(_ctx.security.limits.max_ban_seconds)), 1 /* TEXT */)
                      ])
                    ])
                  ]),
                  _createElementVNode("section", _hoisted_263, [
                    _createElementVNode("div", _hoisted_264, [
                      _cache[151] || (_cache[151] = _createElementVNode("div", null, [
                        _createElementVNode("div", { class: "eyebrow" }, "BLOCKED SOURCES"),
                        _createElementVNode("h2", { id: "security-bans-title" }, "当前封禁")
                      ], -1 /* CACHED */)),
                      _createElementVNode("span", _hoisted_265, _toDisplayString(_ctx.securityBans.length) + " 个来源 IP", 1 /* TEXT */)
                    ]),
                    _createElementVNode("div", _hoisted_266, [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.securityBans, (item) => {
                        return (_openBlock(), _createElementBlock("div", {
                          key: item.ip,
                          class: "security-row"
                        }, [
                          _createElementVNode("div", _hoisted_267, [
                            _createElementVNode("strong", null, _toDisplayString(item.ip), 1 /* TEXT */),
                            _createElementVNode("small", null, _toDisplayString(item.reason) + " · 第 " + _toDisplayString(item.bans) + " 次封禁 · " + _toDisplayString(_ctx.formatTime(item.banned_at)), 1 /* TEXT */)
                          ]),
                          _createElementVNode("div", _hoisted_268, "剩余 " + _toDisplayString(_ctx.formatDuration(item.remaining_seconds)), 1 /* TEXT */),
                          _createElementVNode("button", {
                            type: "button",
                            class: "text-button",
                            onClick: $event => (_ctx.unbanIp(item.ip))
                          }, "解封", 8 /* PROPS */, _hoisted_269)
                        ]))
                      }), 128 /* KEYED_FRAGMENT */)),
                      (!_ctx.securityBans.length)
                        ? (_openBlock(), _createElementBlock("div", _hoisted_270, _cache[152] || (_cache[152] = [
                            _createElementVNode("span", null, "✓", -1 /* CACHED */),
                            _createTextVNode(" 当前没有封禁来源，流量正常 ")
                          ])))
                        : _createCommentVNode("v-if", true)
                    ])
                  ]),
                  _createElementVNode("section", _hoisted_271, [
                    _cache[153] || (_cache[153] = _createElementVNode("div", { class: "panel-head compact" }, [
                      _createElementVNode("div", null, [
                        _createElementVNode("div", { class: "eyebrow" }, "TOP SOURCES"),
                        _createElementVNode("h2", { id: "security-offenders-title" }, "高频来源")
                      ]),
                      _createElementVNode("span", { class: "muted" }, "按拦截次数排序")
                    ], -1 /* CACHED */)),
                    _createElementVNode("div", _hoisted_272, [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.securityOffenders, (item) => {
                        return (_openBlock(), _createElementBlock("div", {
                          key: item.ip,
                          class: "security-row"
                        }, [
                          _createElementVNode("div", _hoisted_273, [
                            _createElementVNode("strong", null, _toDisplayString(item.ip), 1 /* TEXT */),
                            _createElementVNode("small", null, "最近活跃 " + _toDisplayString(_ctx.formatDuration(item.last_seen_seconds_ago)) + "前", 1 /* TEXT */)
                          ]),
                          _createElementVNode("div", _hoisted_274, [
                            _createTextVNode(" 请求 " + _toDisplayString(item.requests) + " 次 · 拦截 " + _toDisplayString(item.blocked) + " 次 ", 1 /* TEXT */),
                            (item.banned)
                              ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                                  _createTextVNode(" · 已封禁")
                                ], 64 /* STABLE_FRAGMENT */))
                              : _createCommentVNode("v-if", true)
                          ]),
                          _createElementVNode("div", _hoisted_275, _toDisplayString(item.violations) + " 次待触发违规", 1 /* TEXT */)
                        ]))
                      }), 128 /* KEYED_FRAGMENT */)),
                      (!_ctx.securityOffenders.length)
                        ? (_openBlock(), _createElementBlock("div", _hoisted_276, " 还没有来源 IP 触发限速 "))
                        : _createCommentVNode("v-if", true)
                    ])
                  ])
                ], 64 /* STABLE_FRAGMENT */))
              : (_openBlock(), _createElementBlock(_Fragment, { key: 3 }, [
                  _createElementVNode("section", _hoisted_277, [
                    _createElementVNode("div", null, [
                      _cache[154] || (_cache[154] = _createElementVNode("div", { class: "eyebrow" }, "SECURITY POLICY", -1 /* CACHED */)),
                      _cache[155] || (_cache[155] = _createElementVNode("div", { class: "hero-heading" }, [
                        _createElementVNode("h1", { id: "admin-title" }, "后台管理"),
                        _createElementVNode("span", { class: "environment-badge" }, "ADMIN")
                      ], -1 /* CACHED */)),
                      _createElementVNode("p", _hoisted_278, [
                        _createElementVNode("span", null, _toDisplayString(_ctx.policy.current.enabled ? "防护已启用" : "防护已停用"), 1 /* TEXT */),
                        _createElementVNode("span", null, _toDisplayString(_ctx.policy.source === "runtime" ? "当前为自定义策略" : "当前为环境默认值"), 1 /* TEXT */),
                        (_ctx.policy.updated_at)
                          ? (_openBlock(), _createElementBlock("span", _hoisted_279, "更新于 " + _toDisplayString(_ctx.formatTime(_ctx.policy.updated_at)), 1 /* TEXT */))
                          : _createCommentVNode("v-if", true)
                      ])
                    ]),
                    _createElementVNode("div", _hoisted_280, [
                      _createElementVNode("div", _hoisted_281, [
                        _createElementVNode("span", {
                          class: _normalizeClass(["status-badge", { error: !!_ctx.policyError, pending: _ctx.policyLoading }]),
                          role: "status",
                          "aria-live": "polite"
                        }, _toDisplayString(_ctx.policyError ? "读取异常" : (_ctx.policyLoading ? "正在读取" : "策略可编辑")), 3 /* TEXT, CLASS */),
                        _createElementVNode("button", {
                          type: "button",
                          class: "text-button",
                          disabled: _ctx.policyLoading,
                          onClick: _cache[31] || (_cache[31] = (...args) => (_ctx.refreshPolicy && _ctx.refreshPolicy(...args)))
                        }, _toDisplayString(_ctx.policyLoading ? "刷新中" : "重新读取"), 9 /* TEXT, PROPS */, _hoisted_282)
                      ]),
                      _cache[156] || (_cache[156] = _createElementVNode("span", { class: "hero-status-uptime muted" }, "保存后立即生效，无需重启", -1 /* CACHED */))
                    ])
                  ]),
                  (_ctx.policyError)
                    ? (_openBlock(), _createElementBlock("div", _hoisted_283, _toDisplayString(_ctx.policyError), 1 /* TEXT */))
                    : _createCommentVNode("v-if", true),
                  (_ctx.policySuccess)
                    ? (_openBlock(), _createElementBlock("div", _hoisted_284, _toDisplayString(_ctx.policySuccess), 1 /* TEXT */))
                    : _createCommentVNode("v-if", true),
                  _createElementVNode("section", _hoisted_285, [
                    _cache[158] || (_cache[158] = _createElementVNode("div", { class: "panel-head compact" }, [
                      _createElementVNode("div", null, [
                        _createElementVNode("div", { class: "eyebrow" }, "SWITCH"),
                        _createElementVNode("h2", { id: "policy-toggle-title" }, "防护开关")
                      ]),
                      _createElementVNode("span", { class: "muted" }, "关闭后所有请求直接放行")
                    ], -1 /* CACHED */)),
                    _createElementVNode("label", _hoisted_286, [
                      _withDirectives(_createElementVNode("input", {
                        id: "policy-enabled",
                        type: "checkbox",
                        "onUpdate:modelValue": _cache[32] || (_cache[32] = $event => ((_ctx.policyForm.enabled) = $event))
                      }, null, 512 /* NEED_PATCH */), [
                        [_vModelCheckbox, _ctx.policyForm.enabled]
                      ]),
                      _cache[157] || (_cache[157] = _createElementVNode("span", null, "启用请求级限速、并发上限与自动封禁", -1 /* CACHED */))
                    ])
                  ]),
                  _createElementVNode("section", _hoisted_287, [
                    _cache[166] || (_cache[166] = _createElementVNode("div", { class: "panel-head compact" }, [
                      _createElementVNode("div", null, [
                        _createElementVNode("div", { class: "eyebrow" }, "RATE LIMIT"),
                        _createElementVNode("h2", { id: "policy-limit-title" }, "限速与并发")
                      ]),
                      _createElementVNode("span", { class: "muted" }, "按来源 IP 统计")
                    ], -1 /* CACHED */)),
                    _createElementVNode("div", _hoisted_288, [
                      _createElementVNode("label", _hoisted_289, [
                        _cache[159] || (_cache[159] = _createElementVNode("span", null, "突发上限（次）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-burst",
                          type: "number",
                          "onUpdate:modelValue": _cache[33] || (_cache[33] = $event => ((_ctx.policyForm.burst_limit) = $event)),
                          min: _ctx.policyMin('burst_limit'),
                          max: _ctx.policyMax('burst_limit'),
                          step: "1"
                        }, null, 8 /* PROPS */, _hoisted_290), [
                          [
                            _vModelText,
                            _ctx.policyForm.burst_limit,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_291, [
                        _cache[160] || (_cache[160] = _createElementVNode("span", null, "突发窗口（秒）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-burst-window",
                          type: "number",
                          "onUpdate:modelValue": _cache[34] || (_cache[34] = $event => ((_ctx.policyForm.burst_window_seconds) = $event)),
                          min: _ctx.policyMin('burst_window_seconds'),
                          max: _ctx.policyMax('burst_window_seconds'),
                          step: "any"
                        }, null, 8 /* PROPS */, _hoisted_292), [
                          [
                            _vModelText,
                            _ctx.policyForm.burst_window_seconds,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_293, [
                        _cache[161] || (_cache[161] = _createElementVNode("span", null, "持续上限（次）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-sustained",
                          type: "number",
                          "onUpdate:modelValue": _cache[35] || (_cache[35] = $event => ((_ctx.policyForm.sustained_limit) = $event)),
                          min: _ctx.policyMin('sustained_limit'),
                          max: _ctx.policyMax('sustained_limit'),
                          step: "1"
                        }, null, 8 /* PROPS */, _hoisted_294), [
                          [
                            _vModelText,
                            _ctx.policyForm.sustained_limit,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_295, [
                        _cache[162] || (_cache[162] = _createElementVNode("span", null, "持续窗口（秒）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-sustained-window",
                          type: "number",
                          "onUpdate:modelValue": _cache[36] || (_cache[36] = $event => ((_ctx.policyForm.sustained_window_seconds) = $event)),
                          min: _ctx.policyMin('sustained_window_seconds'),
                          max: _ctx.policyMax('sustained_window_seconds'),
                          step: "any"
                        }, null, 8 /* PROPS */, _hoisted_296), [
                          [
                            _vModelText,
                            _ctx.policyForm.sustained_window_seconds,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_297, [
                        _cache[163] || (_cache[163] = _createElementVNode("span", null, "单 IP 并发（个）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-max-concurrent",
                          type: "number",
                          "onUpdate:modelValue": _cache[37] || (_cache[37] = $event => ((_ctx.policyForm.max_concurrent) = $event)),
                          min: _ctx.policyMin('max_concurrent'),
                          max: _ctx.policyMax('max_concurrent'),
                          step: "1"
                        }, null, 8 /* PROPS */, _hoisted_298), [
                          [
                            _vModelText,
                            _ctx.policyForm.max_concurrent,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_299, [
                        _cache[164] || (_cache[164] = _createElementVNode("span", null, "全局并发（个）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-max-global",
                          type: "number",
                          "onUpdate:modelValue": _cache[38] || (_cache[38] = $event => ((_ctx.policyForm.max_global_concurrent) = $event)),
                          min: _ctx.policyMin('max_global_concurrent'),
                          max: _ctx.policyMax('max_global_concurrent'),
                          step: "1"
                        }, null, 8 /* PROPS */, _hoisted_300), [
                          [
                            _vModelText,
                            _ctx.policyForm.max_global_concurrent,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_301, [
                        _cache[165] || (_cache[165] = _createElementVNode("span", null, "请求体上限（KiB）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-body-kib",
                          type: "number",
                          "onUpdate:modelValue": _cache[39] || (_cache[39] = $event => ((_ctx.policyForm.max_body_kib) = $event)),
                          min: "1",
                          max: "10240",
                          step: "1"
                        }, null, 512 /* NEED_PATCH */), [
                          [
                            _vModelText,
                            _ctx.policyForm.max_body_kib,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ])
                    ]),
                    _cache[167] || (_cache[167] = _createElementVNode("p", { class: "policy-note" }, "持续上限不能低于突发上限；全局并发不能低于单 IP 并发。", -1 /* CACHED */))
                  ]),
                  _createElementVNode("section", _hoisted_302, [
                    _cache[172] || (_cache[172] = _createElementVNode("div", { class: "panel-head compact" }, [
                      _createElementVNode("div", null, [
                        _createElementVNode("div", { class: "eyebrow" }, "AUTO BAN"),
                        _createElementVNode("h2", { id: "policy-ban-title" }, "封禁策略")
                      ]),
                      _createElementVNode("span", { class: "muted" }, "重复违规逐次翻倍")
                    ], -1 /* CACHED */)),
                    _createElementVNode("div", _hoisted_303, [
                      _createElementVNode("label", _hoisted_304, [
                        _cache[168] || (_cache[168] = _createElementVNode("span", null, "触发封禁的违规次数", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-strike",
                          type: "number",
                          "onUpdate:modelValue": _cache[40] || (_cache[40] = $event => ((_ctx.policyForm.strike_limit) = $event)),
                          min: _ctx.policyMin('strike_limit'),
                          max: _ctx.policyMax('strike_limit'),
                          step: "1"
                        }, null, 8 /* PROPS */, _hoisted_305), [
                          [
                            _vModelText,
                            _ctx.policyForm.strike_limit,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_306, [
                        _cache[169] || (_cache[169] = _createElementVNode("span", null, "违规统计窗口（秒）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-strike-window",
                          type: "number",
                          "onUpdate:modelValue": _cache[41] || (_cache[41] = $event => ((_ctx.policyForm.strike_window_seconds) = $event)),
                          min: _ctx.policyMin('strike_window_seconds'),
                          max: _ctx.policyMax('strike_window_seconds'),
                          step: "any"
                        }, null, 8 /* PROPS */, _hoisted_307), [
                          [
                            _vModelText,
                            _ctx.policyForm.strike_window_seconds,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_308, [
                        _cache[170] || (_cache[170] = _createElementVNode("span", null, "首次封禁时长（秒）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-ban",
                          type: "number",
                          "onUpdate:modelValue": _cache[42] || (_cache[42] = $event => ((_ctx.policyForm.ban_seconds) = $event)),
                          min: _ctx.policyMin('ban_seconds'),
                          max: _ctx.policyMax('ban_seconds'),
                          step: "any"
                        }, null, 8 /* PROPS */, _hoisted_309), [
                          [
                            _vModelText,
                            _ctx.policyForm.ban_seconds,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      _createElementVNode("label", _hoisted_310, [
                        _cache[171] || (_cache[171] = _createElementVNode("span", null, "最长封禁时长（秒）", -1 /* CACHED */)),
                        _withDirectives(_createElementVNode("input", {
                          id: "policy-max-ban",
                          type: "number",
                          "onUpdate:modelValue": _cache[43] || (_cache[43] = $event => ((_ctx.policyForm.max_ban_seconds) = $event)),
                          min: _ctx.policyMin('max_ban_seconds'),
                          max: _ctx.policyMax('max_ban_seconds'),
                          step: "any"
                        }, null, 8 /* PROPS */, _hoisted_311), [
                          [
                            _vModelText,
                            _ctx.policyForm.max_ban_seconds,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ])
                    ]),
                    _cache[173] || (_cache[173] = _createElementVNode("p", { class: "policy-note" }, "最长封禁时长不能低于首次封禁时长；封禁只会影响单个来源 IP。", -1 /* CACHED */))
                  ]),
                  _createElementVNode("div", _hoisted_312, [
                    _createElementVNode("button", {
                      type: "button",
                      class: "primary-button",
                      disabled: _ctx.policySaving,
                      onClick: _cache[44] || (_cache[44] = (...args) => (_ctx.savePolicy && _ctx.savePolicy(...args)))
                    }, _toDisplayString(_ctx.policySaving ? "保存中…" : "保存策略"), 9 /* TEXT, PROPS */, _hoisted_313),
                    _createElementVNode("button", {
                      type: "button",
                      class: "ghost-button",
                      disabled: _ctx.policySaving,
                      onClick: _cache[45] || (_cache[45] = (...args) => (_ctx.resetPolicy && _ctx.resetPolicy(...args)))
                    }, " 恢复环境默认 ", 8 /* PROPS */, _hoisted_314),
                    _cache[174] || (_cache[174] = _createElementVNode("span", { class: "muted" }, "策略保存在数据卷 SQLite，重启后仍生效；恢复默认会删除自定义值。", -1 /* CACHED */))
                  ])
                ], 64 /* STABLE_FRAGMENT */)),
        _createElementVNode("footer", null, [
          _createElementVNode("a", _hoisted_315, "FoxOps " + _toDisplayString(_ctx.summary.version || "?.?"), 1 /* TEXT */),
          _createElementVNode("span", _hoisted_316, " · © " + _toDisplayString(_ctx.currentYear), 1 /* TEXT */)
        ])
      ])
    ])
  ], 64 /* STABLE_FRAGMENT */))
}
})(window.Vue);
