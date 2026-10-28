/* FoxOps README 截图脚本（无第三方依赖）
   目标：拉真实线上数据，从 http://119.91.47.89:1224 取实现截图。
   用法：node tools/capture-readme.mjs
   输出：outputs/screenshots/ */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { screenshot, sleep, withChrome } from "./cdp.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "..", "outputs", "screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.FOXOPS_CAPTURE_BASE || "http://119.91.47.89:1224";
// 账号密码只用环境变量传入，绝不写进仓库。
const CAPTURE_USER = process.env.FOXOPS_CAPTURE_USER || "Admin";
const CAPTURE_PASS = process.env.FOXOPS_CAPTURE_PASS || "";
const PROFILE = resolve(OUT, ".chrome-profile");
const PORT = 9223; // 避开 verify-theme.mjs 的 9222

// 等待面板数据卡片就绪（CPU/内存等数值出现 %）
async function waitForDashboard(cdp) {
  for (let i = 0; i < 30; i++) {
    const ready = await cdp.evaluate(`(async () => {
      const cards = document.querySelectorAll(".metric-card").length;
      const v = (document.querySelector(".metric-card .metric-value") || {}).textContent || "";
      return cards >= 2 && v.indexOf("%") !== -1;
    })()`);
    if (ready) return true;
    await sleep(500);
  }
  return false;
}

// 等待趋势曲线至少有两个采样点（曲线会画出来）
async function waitForTrend(cdp) {
  for (let i = 0; i < 20; i++) {
    const ok = await cdp.evaluate(`(async () => {
      const paths = document.querySelectorAll("#trendChart svg path, #trendChart path").length;
      return paths >= 3; // CPU + 内存 + 磁盘 三条线
    })()`);
    if (ok) return true;
    await sleep(400);
  }
  return false;
}

withChrome({ port: PORT, profile: PROFILE, windowSize: "1440,1080" }, async (cdp) => {
  // headless 的窗口尺寸会被物理屏幕高度限制，光靠 windowSize 会把页面底部裁掉，
  // 所以统一用 Emulation 精确指定视口。登录页固定 900 高（卡片居中，留白不夸张），
  // 面板页在渲染完成后按实际内容高度再调一次。
  const setViewport = async (width, height) => {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(350);
  };
  // 面板页内容比视口高时会被裁，量一次 scrollHeight 再撑开；撑开后内容可能略微变高，取两次最大值。
  const fitViewportToContent = async () => {
    let h = 0;
    for (let i = 0; i < 3; i++) {
      const next = await cdp.evaluate(`Math.ceil(document.documentElement.scrollHeight || 0)`);
      if (!next || next <= h) break;
      h = next;
      await setViewport(1440, h);
    }
    return h;
  };
  await setViewport(1440, 900);
  // ============== 1. 登录页（日间） ==============
  // 先去登录页让 theme.js 跟随系统偏好（headless 无系统偏好 → 落夜间）
  await cdp.send("Page.navigate", { url: BASE + "/login.html" });
  await sleep(1500);
  // 切到日间
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "light";
    window.localStorage.setItem("foxops_theme", "light");
    return true;
  })()`);
  await sleep(700);
  await screenshot(cdp, resolve(OUT, "01-login-light.png"));

  // ============== 2. 登录页（夜间） ==============
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem("foxops_theme", "dark");
    return true;
  })()`);
  await sleep(700);
  await screenshot(cdp, resolve(OUT, "02-login-dark.png"));

  // ============== 3. 登录进面板 ==============
  const loginOk = await cdp.evaluate(`(async () => {
    const res = await fetch("${BASE}/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ${JSON.stringify(CAPTURE_USER)}, password: ${JSON.stringify(CAPTURE_PASS)} })
    });
    const body = await res.json();
    if (!body || !body.token) return { ok: false, status: res.status, body };
    window.sessionStorage.setItem("foxops_session", body.token);
    window.localStorage.setItem("foxops_theme", "dark");
    document.documentElement.dataset.theme = "dark";
    return { ok: true, user: body.username || null };
  })()`);
  console.log("login:", JSON.stringify(loginOk));

  await cdp.send("Page.navigate", { url: BASE + "/" });
  await sleep(2500);
  const dashOk = await waitForDashboard(cdp);
  const trendOk = await waitForTrend(cdp);
  console.log("dashboard ready:", dashOk, "trend drawn:", trendOk);

  // 强制指定夜间，确保画面干净
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "dark";
    return true;
  })()`);
  await sleep(500);

  // ============== 4. Dashboard 主视图（夜间，完整） ==============
  const fitted = await fitViewportToContent();
  console.log("viewport fitted to", fitted);
  await screenshot(cdp, resolve(OUT, "03-dashboard-dark.png"));

  // ============== 5. Dashboard 主视图（日间） ==============
  await cdp.evaluate(`(async () => {
    const btn = document.querySelector(".theme-toggle");
    if (btn) btn.click();
    return !!btn;
  })()`);
  await sleep(900);
  await screenshot(cdp, resolve(OUT, "04-dashboard-light.png"));

  // ============== 6. Admin 用户菜单（展示 RBAC + 改密） ==============
  // 切回夜间（菜单截图更明显），点用户名按钮展开菜单
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "dark";
    return true;
  })()`);
  await sleep(400);
  const menuOpened = await cdp.evaluate(`(async () => {
    const trigger = document.querySelector(".user-menu-trigger");
    if (trigger) {
      // hover 才显示下拉，先派发 mouseenter
      const menu = trigger.closest(".user-menu");
      if (menu) {
        menu.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      }
      trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      // 如果还是 display:none，则强制打开
      const dropdown = document.querySelector(".user-menu-dropdown");
      if (dropdown && getComputedStyle(dropdown).display === "none") {
        dropdown.style.display = "block";
      }
      return { hasTrigger: true, dropdownForced: !!(dropdown && getComputedStyle(dropdown).display === "block") };
    }
    return { hasTrigger: false };
  })()`);
  console.log("user-menu:", JSON.stringify(menuOpened));
  await sleep(400);
  await screenshot(cdp, resolve(OUT, "05-admin-user-menu.png"));

  console.log("done ->", OUT);
}).catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
