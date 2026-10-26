// Second Brain dashboard entry point.
// Signed out: header + sign-in button only. Signed in: panels load independently.
// `?demo=1` skips auth and renders obviously fake fixtures through the same code.

import * as cfg from "./config.js";
import * as auth from "./lib/auth.js";
import { liveSource, demoSource } from "./lib/source.js";
import { h, replace, clear } from "./lib/dom.js";
import {
  shapeEvents,
  shapeThreads,
  todosDue,
  openQuestions,
  buildProjectBoard,
  shapeSessions,
  shapeRepos,
} from "./lib/shape.js";
import { panel, fill } from "./lib/render/common.js";
import { renderEvents, renderMail, renderTodos } from "./lib/render/today.js";
import { renderQuestions } from "./lib/render/needs.js";
import { renderBoard } from "./lib/render/projects.js";
import { renderLinkSearch, renderDriveSearch } from "./lib/render/search.js";
import { renderBudget } from "./lib/render/budget.js";
import { renderSessions } from "./lib/render/sessions.js";
import { renderRepos } from "./lib/render/repos.js";

const DEMO = new URLSearchParams(location.search).get("demo") === "1";
const app = document.getElementById("app");
const actions = document.getElementById("header-actions");

let source = null;
let signedOutShown = false;

/* ---------- theme ---------- */

function currentTheme() {
  const set = document.documentElement.getAttribute("data-theme");
  if (set) return set;
  return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initTheme() {
  const btn = document.getElementById("theme-toggle");
  const sync = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    btn.setAttribute("aria-label", `Switch to ${next} mode`);
    btn.title = `Switch to ${next} mode`;
  };
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("brain.theme", next);
    } catch {
      /* not persisted */
    }
    sync();
  });
  sync();
}

/* ---------- signed out ---------- */

function renderSignedOut(message) {
  signedOutShown = true;
  source = null;
  clear(actions);
  const note = h("p", { class: "signin-note small", role: "status", "aria-live": "polite" });
  const button = h("button", { type: "button", class: "btn btn-primary btn-signin", id: "signin", disabled: true }, h("span", { class: "g", "aria-hidden": "true", text: "G" }), "Sign in with Google");
  replace(
    app,
    h(
      "section",
      { class: "signin", "aria-labelledby": "signin-title" },
      h("h1", { id: "signin-title", class: "signin-title", text: "Your second brain" }),
      message && h("p", { class: "signin-msg small", role: "alert", text: message }),
      button,
      h("p", { class: "signin-line muted", text: "Data loads privately in your browser, straight from Google. Nothing is stored on a server." }),
      note,
    ),
  );

  if (cfg.isPlaceholder(cfg.GOOGLE_CLIENT_ID)) {
    replace(note, "Sign-in isn't configured yet: set ", h("code", { text: "GOOGLE_CLIENT_ID" }), " in brain/config.js. ", h("a", { href: "?demo=1", text: "Preview with demo data" }));
    return;
  }

  replace(note, "Loading Google sign-in…");
  auth
    .loadGis()
    .then(() => {
      auth.initAuth({
        clientId: cfg.GOOGLE_CLIENT_ID,
        scope: cfg.SCOPES,
        onToken: ({ missingScopes }) => startDashboard(missingScopes),
        onError: (msg) => {
          button.disabled = false;
          replace(note, `Sign-in didn't finish: ${msg}`);
        },
      });
      button.disabled = false;
      replace(note);
      button.addEventListener("click", () => {
        replace(note, "Waiting for Google…");
        try {
          auth.requestToken();
        } catch (err) {
          replace(note, err.message);
        }
      });
    })
    .catch((err) => {
      const retry = h("button", { type: "button", class: "btn btn-small", text: "Retry" });
      retry.addEventListener("click", () => renderSignedOut(message));
      replace(note, `${err.message}. `, retry);
    });
}

/* ---------- signed in ---------- */

function onUnauthorized() {
  if (signedOutShown) return;
  auth.dropToken();
  renderSignedOut("Your Google session expired. Sign in again.");
}

function startDashboard(missingScopes = []) {
  signedOutShown = false;
  source = DEMO ? demoSource(new Date()) : liveSource({ getToken: auth.getToken, onUnauthorized });
  renderDashboard(missingScopes);
}

/** Cache a promise; forget it if it rejects so Retry refetches. */
function memo(fn) {
  let p = null;
  return () => {
    if (!p) {
      p = fn();
      p.catch(() => (p = null));
    }
    return p;
  };
}

function renderDashboard(missingScopes = []) {
  const lastLoaded = h("span", { class: "last-loaded num small muted", "aria-live": "polite" });
  const refresh = h("button", { type: "button", class: "btn", text: "Refresh" });
  refresh.addEventListener("click", () => renderDashboard());
  const out = DEMO
    ? h("a", { class: "btn btn-ghost", href: location.pathname, text: "Exit demo" })
    : h("button", { type: "button", class: "btn btn-ghost", text: "Sign out" });
  if (!DEMO) {
    out.addEventListener("click", async () => {
      out.disabled = true;
      await auth.signOut();
      renderSignedOut("Signed out.");
    });
  }
  replace(actions, refresh, out);

  const today = new Date();
  const stats = {};
  const pulse = h("div", { class: "pulse", role: "status", "aria-label": "Summary" }, lastLoaded);
  const setStat = (key, label, n, tone) => {
    stats[key] = { label, n, tone };
    replace(
      pulse,
      ["events", "mail", "todos", "questions", "projects"]
        .filter((k) => stats[k])
        .map((k) => h("span", { class: `pulse-item ${stats[k].n && stats[k].tone ? `tone-text-${stats[k].tone}` : ""}` }, h("strong", { class: "num", text: String(stats[k].n) }), ` ${stats[k].label}`)),
      lastLoaded,
    );
  };

  // Shared loads.
  let registry = null;
  const getRegistry = memo(() => source.registry().then((r) => (registry = r)));
  const getSessions = memo(() => source.sessionFiles().then(shapeSessions));

  // Panels.
  const pToday = panel({ id: "today", title: "Today" });
  const eventsBox = h("div");
  const mailBox = h("div");
  const todosBox = h("div");
  pToday.body.append(
    h("div", { class: "subgroup" }, eventsBox),
    h("div", { class: "subgroup" }, h("h4", { class: "sublabel", text: "Mail · unread important / starred" }), mailBox),
    h("div", { class: "subgroup" }, h("h4", { class: "sublabel", text: "Todos due" }), todosBox),
  );
  const pNeeds = panel({ id: "needs", title: "Needs you", className: "panel-needs" });
  const pProjects = panel({ id: "projects", title: "Projects" });
  const pSearch = panel({ id: "search", title: "Search" });
  const linksBox = h("div");
  pSearch.body.append(linksBox, renderDriveSearch((q) => source.searchDrive(q)));
  const pBudget = panel({ id: "budget", title: "Budget" });
  const pSessions = panel({ id: "sessions", title: "Recent sessions" });
  const pRepos = panel({ id: "repos", title: "Repos" });

  const sessionsUrl = source.sessionsUrl();
  if (sessionsUrl) pSessions.el.querySelector(".panel-actions").append(h("a", { class: "small", href: sessionsUrl, text: "Folder" }));
  const registryUrl = source.registryUrl();
  if (registryUrl) pProjects.el.querySelector(".panel-actions").append(h("a", { class: "small", href: registryUrl, text: "Registry" }));

  replace(
    app,
    DEMO && h("div", { class: "demo-banner", role: "note" }, h("strong", { text: "Demo mode" }), " — all data on this page is fake. Nothing is loaded from Google."),
    missingScopes.length > 0 &&
      h("div", { class: "state error", role: "alert", text: `Some permissions weren't granted (${missingScopes.map((s) => s.split("/").pop()).join(", ")}). Related panels will show errors; sign out and in again to grant them.` }),
    pulse,
    h(
      "div",
      { class: "grid" },
      h("div", { class: "col col-left" }, pToday.el, pNeeds.el),
      h("div", { class: "col col-mid" }, pProjects.el),
      h("div", { class: "col col-right" }, pSearch.el, pBudget.el, pSessions.el, pRepos.el),
    ),
  );

  const jobs = [
    fill(eventsBox, () => source.events(today).then((items) => shapeEvents(items, today)), (s) => {
      setStat("events", "events today", s.today.length);
      pToday.setMeta(`${s.today.length} today · ${s.tomorrow.length} tomorrow`);
      return renderEvents(s);
    }),
    fill(mailBox, () => source.threads().then(shapeThreads), (rows) => {
      setStat("mail", "mail", rows.length, "warn");
      return renderMail(rows);
    }),
    fill(todosBox, () => getRegistry().then((r) => todosDue(r.todos, today, 2)), (todos) => {
      const n = todos.length;
      setStat("todos", "todos due", n, todos.some((t) => t.overdue) ? "bad" : "warn");
      return renderTodos(todos, (t, done) =>
        source.setTodoDone(t, done, registry.headers.todos || []).then(() => {
          const open = todos.filter((x) => (x === t ? !done : !x.done)).length;
          setStat("todos", "todos due", open, "warn");
        }),
      );
    }),
    fill(pNeeds.body, () => getRegistry().then((r) => openQuestions(r.questions, r.projects)), (qs) => {
      let open = qs.length;
      setStat("questions", "need you", open, "bad");
      pNeeds.setMeta(`${open} open`);
      return renderQuestions(
        qs,
        (q, answer) =>
          source.answerQuestion(q, answer, registry.headers.questions || []).then(() => {
            open -= 1;
            setStat("questions", "need you", open, "bad");
            pNeeds.setMeta(`${open} open`);
          }),
        today,
      );
    }, { setBusy: pNeeds.setBusy }),
    fill(
      pProjects.body,
      async () => {
        const r = await getRegistry();
        const sessions = await getSessions().catch(() => []);
        return buildProjectBoard({ ...r, sessions });
      },
      (board) => {
        setStat("projects", "active", board.projects.filter((p) => p.tone === "ok").length);
        pProjects.setMeta(`${board.projects.length} projects · ${board.areas.length} areas${board.archived.length ? ` · ${board.archived.length} archived` : ""}`);
        return renderBoard(board);
      },
      { setBusy: pProjects.setBusy },
    ),
    fill(linksBox, () => getRegistry().then((r) => r.links), renderLinkSearch),
    fill(pBudget.body, () => source.budget(), renderBudget, { setBusy: pBudget.setBusy }),
    fill(pSessions.body, () => getSessions(), (s) => {
      pSessions.setMeta(s.length ? `latest ${Math.min(10, s.length)}` : "");
      return renderSessions(s, 10);
    }, { setBusy: pSessions.setBusy }),
    fill(pRepos.body, () => source.repos().then(shapeRepos), (r) => {
      pRepos.setMeta(cfg.GITHUB_USER);
      return renderRepos(r);
    }, { setBusy: pRepos.setBusy }),
  ];
  pToday.setBusy(true);
  Promise.allSettled(jobs).then(() => {
    pToday.setBusy(false);
    lastLoaded.textContent = `loaded ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  });
}

/* ---------- boot ---------- */

initTheme();
if (DEMO) {
  startDashboard();
} else if (auth.restoreToken()) {
  startDashboard();
  // Load GIS in the background so Sign out can revoke and re-auth works.
  if (!cfg.isPlaceholder(cfg.GOOGLE_CLIENT_ID)) auth.loadGis().catch(() => {});
} else {
  renderSignedOut();
}
