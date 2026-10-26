// Playwright smoke test for /brain/. Run: node tests/brain/smoke.mjs  (or npm run smoke)
// Serves the repo with `python3 -m http.server` on a free port, then checks:
//  - signed-out state: only the header + sign-in button, no panels, no Google/GitHub data calls
//  - sign-in degrades gracefully when the GIS script can't load
//  - ?demo=1 renders every panel from fake data with no errors and no horizontal scroll
// Screenshots go to $SCREENSHOT_DIR (default: <tmp>/brain-smoke).

import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = process.env.SCREENSHOT_DIR || path.join(tmpdir(), "brain-smoke");
mkdirSync(OUT, { recursive: true });

const WIDTHS = { desktop: 1280, mobile: 390 };
const PRIVATE_HOSTS = /googleapis\.com|api\.github\.com|mail\.google\.com/;
// The only console noise we tolerate: GIS failing to load when offline/blocked.
const EXPECTED_NOISE = /accounts\.google\.com|gsi\/client|ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|FAILED|BLOCKED|CONNECTION|TUNNEL|PROXY)/i;

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.unref();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function startServer() {
  const port = await freePort();
  const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", ROOT], {
    stdio: "ignore",
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${base}/brain/`);
      if (r.ok) return { proc, base };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error("http.server did not start");
}

/** New page that records console errors, page errors and private-data requests. */
async function openPage(browser, width, { routes } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  const privateCalls = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !EXPECTED_NOISE.test(`${m.text()} ${m.location().url || ""}`)) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => {
    if (PRIVATE_HOSTS.test(r.url())) privateCalls.push(r.url());
  });
  if (routes) await routes(page);
  return { ctx, page, errors, privateCalls };
}

async function noHorizontalScroll(page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `horizontal scroll: scrollWidth ${sw} > innerWidth ${iw}`);
}

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push(["ok", name]);
    console.log(`ok - ${name}`);
  } catch (err) {
    results.push(["FAIL", name]);
    console.log(`not ok - ${name}\n  ${String(err && err.stack ? err.stack : err).split("\n").slice(0, 4).join("\n  ")}`);
  }
}

const { proc, base } = await startServer();
const browser = await chromium.launch();
const shots = [];

try {
  for (const [label, width] of Object.entries(WIDTHS)) {
    await check(`signed-out @${width}px: sign-in button only, no panels, no private calls`, async () => {
      const { ctx, page, errors, privateCalls } = await openPage(browser, width);
      await page.goto(`${base}/brain/`, { waitUntil: "networkidle" });
      const btn = page.getByRole("button", { name: "Sign in with Google" });
      await btn.waitFor({ state: "visible" });
      assert.equal(await page.locator(".panel").count(), 0, "no panels before sign-in");
      assert.equal(await page.locator(".grid").count(), 0, "no dashboard grid before sign-in");
      assert.match(await page.locator(".signin-line").innerText(), /privately in your browser/);
      // Placeholder client ID: button stays disabled and says why.
      assert.equal(await btn.isDisabled(), true);
      assert.match(await page.locator(".signin-note").innerText(), /GOOGLE_CLIENT_ID/);
      await noHorizontalScroll(page);
      const file = path.join(OUT, label === "desktop" ? "brain-signed-out.png" : "brain-signed-out-mobile.png");
      await page.screenshot({ path: file, fullPage: true });
      shots.push(file);
      assert.deepEqual(privateCalls, []);
      assert.deepEqual(errors, []);
      await ctx.close();
    });
  }

  await check("signed-out with a client ID but GIS blocked: button visible, graceful note", async () => {
    const { ctx, page, errors, privateCalls } = await openPage(browser, 1280, {
      routes: async (p) => {
        await p.route("**/brain/config.js", async (route) => {
          const res = await route.fetch();
          const body = (await res.text()).replace("REPLACE_WITH_OAUTH_CLIENT_ID.apps.googleusercontent.com", "test-client.apps.googleusercontent.com");
          await route.fulfill({ response: res, body });
        });
        await p.route("https://accounts.google.com/**", (route) => route.abort("internetdisconnected"));
      },
    });
    await page.goto(`${base}/brain/`);
    const btn = page.getByRole("button", { name: "Sign in with Google" });
    await btn.waitFor({ state: "visible" });
    await page.getByText(/Could not load Google sign-in/).waitFor({ timeout: 15000 });
    assert.equal(await btn.isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Retry" }).count(), 1);
    assert.equal(await page.locator(".panel").count(), 0);
    assert.deepEqual(privateCalls, []);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check("signed-out with GIS stubbed: button enables, click requests a token", async () => {
    const { ctx, page, errors } = await openPage(browser, 1280, {
      routes: async (p) => {
        await p.route("**/brain/config.js", async (route) => {
          const res = await route.fetch();
          const body = (await res.text()).replace("REPLACE_WITH_OAUTH_CLIENT_ID.apps.googleusercontent.com", "test-client.apps.googleusercontent.com");
          await route.fulfill({ response: res, body });
        });
        await p.route("https://accounts.google.com/gsi/client", (route) =>
          route.fulfill({
            contentType: "text/javascript",
            body: `window.__requested = 0; window.google = { accounts: { oauth2: {
              initTokenClient: (cfg) => ({ requestAccessToken: () => { window.__requested++; window.__cfg = cfg; } }),
              hasGrantedAllScopes: () => true, revoke: (t, cb) => cb && cb() } } };`,
          }),
        );
      },
    });
    await page.goto(`${base}/brain/`);
    const btn = page.getByRole("button", { name: "Sign in with Google" });
    await page.waitForFunction(() => !document.getElementById("signin").disabled);
    await btn.click();
    assert.equal(await page.evaluate(() => window.__requested), 1);
    const scope = await page.evaluate(() => window.__cfg.scope);
    for (const s of ["drive.readonly", "spreadsheets", "calendar.readonly", "gmail.readonly"]) assert.ok(scope.includes(s), s);
    assert.equal(await page.locator(".panel").count(), 0, "still no panels until a token arrives");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  for (const [label, width] of Object.entries(WIDTHS)) {
    await check(`demo @${width}px: all panels render from fake data`, async () => {
      const { ctx, page, errors, privateCalls } = await openPage(browser, width);
      await page.goto(`${base}/brain/?demo=1`);
      await page.locator(".demo-banner").waitFor();
      await page.waitForFunction(() => document.querySelectorAll(".panel").length === 7 && !document.querySelector(".state.loading"));
      for (const id of ["today", "needs", "projects", "search", "budget", "sessions", "repos"]) {
        assert.equal(await page.locator(`#panel-${id}`).count(), 1, id);
      }
      assert.equal(await page.locator(".state.error").count(), 0, "no error cards");
      assert.equal(await page.locator(".board-group:not(.archived) .pcard").count(), 9, "9 live project/area cards");
      assert.equal(await page.locator("details.archived .pcard").count(), 1, "archived project tucked in a collapsed group");
      assert.equal(await page.locator("details.archived").getAttribute("open"), null);
      assert.equal(await page.locator(".q").count(), 3, "3 open questions");
      assert.ok((await page.locator("table.budget tbody tr").count()) >= 4, "budget rows");
      assert.equal(await page.locator("#panel-sessions .row").count(), 8);
      assert.deepEqual(privateCalls, [], "demo makes no Google/GitHub calls");
      await noHorizontalScroll(page);
      const file = path.join(OUT, `brain-demo-${label}.png`);
      await page.screenshot({ path: file, fullPage: true });
      shots.push(file);
      assert.deepEqual(errors, []);
      await ctx.close();
    });
  }

  await check("budget table fits its panel at 1280px", async () => {
    const { ctx, page } = await openPage(browser, 1280);
    await page.goto(`${base}/brain/?demo=1`);
    await page.locator("table.budget").waitFor();
    const { tw, ww } = await page.evaluate(() => ({ tw: document.querySelector("table.budget").scrollWidth, ww: document.querySelector(".table-wrap").clientWidth }));
    assert.ok(tw <= ww, `budget table ${tw}px overflows ${ww}px`);
    await ctx.close();
  });

  await check("demo: answer a question, toggle a todo, filter links, theme toggle", async () => {
    const { ctx, page, errors } = await openPage(browser, 1280);
    await page.goto(`${base}/brain/?demo=1`);
    await page.waitForFunction(() => !document.querySelector(".state.loading") && document.querySelectorAll(".q").length === 3);
    await page.locator(".q").first().getByRole("button", { name: "10% first" }).click();
    await page.getByText("Answered: b) 10% first").waitFor();
    assert.match(await page.locator("#panel-needs .panel-meta").innerText(), /2 open/);

    const box = page.locator(".todo input[type=checkbox]").first();
    await box.check();
    await page.waitForFunction(() => document.querySelector(".todo").classList.contains("is-done"));

    await page.getByRole("searchbox", { name: "Filter links" }).fill("bullseye");
    assert.equal(await page.locator("#panel-search .subgroup").first().locator(".row").count(), 1);

    await page.getByRole("searchbox", { name: "Search Drive" }).fill("chord");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.locator(".drive-results .row").first().waitFor();

    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.locator("#theme-toggle").click();
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.notEqual(before, after, "theme toggle changes background");
    assert.ok(["light", "dark"].includes(await page.evaluate(() => document.documentElement.dataset.theme)));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check("demo dark mode (system preference) renders", async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto(`${base}/brain/?demo=1`);
    await page.waitForFunction(() => document.querySelectorAll(".panel").length === 7 && !document.querySelector(".state.loading"));
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, "rgb(14, 17, 22)");
    const file = path.join(OUT, "brain-demo-dark.png");
    await page.screenshot({ path: file, fullPage: true });
    shots.push(file);
    await ctx.close();
  });
} finally {
  await browser.close();
  proc.kill();
}

console.log(`\nscreenshots:\n  ${shots.join("\n  ")}`);
const failed = results.filter(([s]) => s === "FAIL").length;
console.log(`\n${results.length - failed}/${results.length} smoke checks passed`);
process.exit(failed ? 1 : 0);
