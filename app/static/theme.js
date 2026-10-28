/* FoxOps 主题模块 —— 在样式渲染前同步初始化（防闪烁），并提供读写接口。
   与面板、登录页共享 localStorage 键 foxops_theme。
   写入操作集中在此文件，保证 app.js 不触碰 localStorage（安全铁律）。 */
(function () {
  "use strict";
  var THEME_KEY = "foxops_theme";
  var REVEAL_MS = 560;
  var REVEAL_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
  var SWITCHING_CLASS = "is-theme-switching";

  function read() {
    try {
      return window.localStorage.getItem(THEME_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function save(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // 存储被禁用时主题仍可在当前页面生效，只是不做持久化。
    }
  }

  function system() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* 从按钮中心向四周扩散切换：View Transitions 冻结旧画面，再用圆形裁剪逐帧露出新画面。
     浏览器不支持或用户要求减少动效时退回普通切换（CSS 过渡兜底）。
     commit 在快照提交时执行，供调用方同步自己的主题状态（如 Vue 的 theme）。 */
  function reveal(theme, origin, commit) {
    var root = document.documentElement;
    var swap = function () {
      apply(theme);
      if (commit) {
        commit();
      }
    };

    if (!origin || typeof document.startViewTransition !== "function" || reducedMotion()) {
      swap();
      return;
    }

    var box = origin.getBoundingClientRect();
    var x = Math.round(box.left + box.width / 2);
    var y = Math.round(box.top + box.height / 2);
    var radius = Math.ceil(
      Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    );

    // 快照会拍到颜色过渡的中间色：先压掉常规过渡，保证新旧画面都是终态。
    root.classList.add(SWITCHING_CLASS);
    var transition = document.startViewTransition(swap);
    transition.ready
      .then(function () {
        root.animate(
          {
            clipPath: [
              "circle(0px at " + x + "px " + y + "px)",
              "circle(" + radius + "px at " + x + "px " + y + "px)"
            ]
          },
          {
            duration: REVEAL_MS,
            easing: REVEAL_EASING,
            pseudoElement: "::view-transition-new(root)"
          }
        );
      })
      .catch(function () {
        // 浏览器跳过过渡（页面隐藏等）时主题已切换，无需额外处理。
      });
    var cleanup = function () {
      root.classList.remove(SWITCHING_CLASS);
    };
    if (transition.finished && transition.finished.then) {
      transition.finished.then(cleanup, cleanup);
    } else {
      window.setTimeout(cleanup, REVEAL_MS + 80);
    }
  }

  window.FoxOpsTheme = {
    read: read,
    save: save,
    system: system,
    apply: apply,
    reveal: reveal
  };

  // 首帧同步初始化：localStorage 优先，其次跟随系统偏好，避免主题闪烁。
  var initial = read();
  if (initial !== "light" && initial !== "dark") {
    initial = system();
  }
  apply(initial);
})();
