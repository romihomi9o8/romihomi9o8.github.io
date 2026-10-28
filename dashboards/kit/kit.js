/* Brain dashboard kit — shared by every dashboard page.
 * Authored as an ES module so tests can import it; build.mjs strips `export`
 * and inlines it into each page as a classic script. */

export const FEEDS_FOLDER_ID = "1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h";
export const DRIVE = "Google Drive";
export const DRIVE_TOOLS = ["search_files", "download_file_content"];

/* ---------- pure helpers (tested) ---------- */

const str = (v) => (v == null ? "" : String(v)).trim();

/** Map a free-text status to a chip tone: ok | warn | bad | muted | done | info. */
export function statusTone(status) {
  const s = str(status).toLowerCase();
  if (!s) return "muted";
  if (/(block|stuck|risk|overdue|urgent|cancel)/.test(s)) return "bad";
  if (/(wait|review|pending|hold|identify|target|draft)/.test(s)) return "warn";
  if (/(done|shipped|complete|closed|answered|archived|published|paid)/.test(s)) return "done";
  if (/(later|paused|someday|idea|parked|backlog|dormant)/.test(s)) return "muted";
  if (/(active|progress|on.?track|live|ongoing|doing|now|writing|building|keep|scheduled)/.test(s)) return "ok";
  return "info";
}

/** "3h ago", "2d ago", "just now". */
export function relativeTime(date, now = new Date()) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return "";
  const s = Math.round((now - d) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 60) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

/** Feeds older than this are flagged stale (a missed 6 am run plus slack). */
export const STALE_HOURS = 30;
export function isStale(generatedAt, now = new Date()) {
  const d = new Date(generatedAt);
  return isNaN(d) || now - d > STALE_HOURS * 3600 * 1000;
}

/** Only allow http(s) URLs into href attributes. */
export function safeUrl(u) {
  const s = str(u);
  return /^https?:/i.test(s) ? s : "";
}

/** "a) Send it" -> { key: "a", label: "Send it" }. */
export function parseOption(raw) {
  const s = str(raw);
  const m = /^\(?([a-z0-9])[).:]\s+(.+)$/i.exec(s);
  return m ? { key: m[1].toLowerCase(), label: m[2].trim() } : { key: "", label: s };
}

/** Whole dollars, grouped: 4308 -> "$4,308"; negatives keep the sign. */
export function money(n, { cents = false } = {}) {
  if (n == null || n === "" || isNaN(Number(n))) return "—";
  const v = Number(n);
  const abs = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  return `${v < 0 ? "−" : ""}$${abs}`;
}

/** Fraction of target used, clamped for bars; null when there is no target. */
export function usedFraction(actual, target) {
  const t = Number(target);
  if (!t) return null;
  return Math.max(0, Number(actual || 0) / t);
}

/** Pick the newest file from a search_files payload. */
export function newestFile(payload) {
  const files = (payload && payload.files) || [];
  return files
    .slice()
    .sort((a, b) => String(b.modifiedTime || "").localeCompare(String(a.modifiedTime || "")))[0] || null;
}

/** Base64 (from download_file_content) -> UTF-8 string. */
export function decodeBase64Utf8(b64) {
  const bin = atob(String(b64 || ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

/** Viewer-facing copy for each connector failure code. */
export function errorCopy(err, server = DRIVE) {
  const code = (err && err.code) || "upstream_error";
  switch (code) {
    case "needs_reauth":
      return { title: `Reconnect ${server}`, body: `Your ${server} connection expired. Reconnect it in claude.ai Settings → Connectors, then reload.` };
    case "server_not_connected":
    case "selection_required":
      return { title: `Add ${server}`, body: `This dashboard reads from ${server}. Add or choose it in claude.ai Settings → Connectors, then reload.` };
    case "not_in_manifest":
    case "approval_required":
    case "consent_required":
      return { title: `Allow ${server}`, body: `This dashboard needs permission to read ${server}. Use the button to allow it.`, canAsk: true };
    case "blocked_by_policy":
      return { title: `${server} is blocked`, body: "Your organization's policy blocks this connector here." };
    case "not_granted":
    case "capability_disabled":
    case "capability_removed":
      return { title: "Open in Claude", body: "Live data loads only when this page is opened in claude.ai or the Claude app." };
    case "feed_missing":
      return { title: "No data yet", body: err.message || "The daily rollup hasn't written this feed yet. Ask Claude to “update the brain”." };
    case "feed_invalid":
      return { title: "Feed unreadable", body: err.message || "The feed file in Drive isn't valid JSON. The next rollup will rewrite it." };
    case "server_unavailable":
      return { title: `${server} didn't answer`, body: "It's usually brief. Reload in a minute." };
    default:
      return { title: "Couldn't load", body: (err && err.message) || "Something went wrong reading Drive." };
  }
}

/* ---------- Drive feed loading (browser only) ---------- */

export async function getMcp() {
  try {
    return window.claude && window.claude.use ? await window.claude.use("mcp") : null;
  } catch {
    return null;
  }
}

/** Find `<name>.json` in 00 Brain/Feeds and parse it. Rejects with {code, message}. */
export async function loadFeed(mcp, name) {
  const query = `title = '${name}.json' and parentId = '${FEEDS_FOLDER_ID}'`;
  const found = await mcp.callTool(DRIVE, "search_files", { query, excludeContentSnippets: true, pageSize: 10 });
  const file = newestFile(found.payload);
  if (!file) throw { code: "feed_missing", message: `No ${name}.json in 00 Brain/Feeds yet. Ask Claude to “update the brain”.` };
  const got = await mcp.callTool(DRIVE, "download_file_content", { fileId: file.id });
  const b64 = got.payload && (got.payload.content || got.payload.base64Content);
  let feed;
  try {
    feed = JSON.parse(decodeBase64Utf8(b64));
  } catch {
    throw { code: "feed_invalid", message: `${name}.json isn't valid JSON.` };
  }
  return { feed, file };
}

/* ---------- DOM helpers ---------- */

export function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "href") {
      const u = safeUrl(v);
      if (u) { n.href = u; n.target = "_blank"; n.rel = "noopener"; }
    } else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

export const chip = (text, tone = statusTone(text)) => el("span", { class: `chip chip-${tone}`, text: str(text) || "—" });

export function panel(title, { meta, wide, id } = {}, ...body) {
  return el("section", { class: `panel${wide ? " wide" : ""}`, id },
    el("header", { class: "panel-head" }, el("h2", { text: title }), meta ? el("span", { class: "panel-meta", text: meta }) : null),
    ...body);
}

export const empty = (text) => el("p", { class: "empty", text });

/* ---------- shared template panels ---------- */

export function headerBlock(feed, file, { kicker } = {}) {
  const d = feed.domain || {};
  const owners = (feed.owners || []).map((o) => o.name).join(" · ");
  const stale = isStale(feed.generated_at);
  return el("header", { class: "dash-head" },
    el("div", { class: "dash-title" },
      el("p", { class: "kicker", text: kicker || owners }),
      el("h1", { text: d.name || feed.feed }),
      d.status ? chip(d.status) : null),
    el("p", { class: `fresh${stale ? " stale" : ""}` },
      stale ? "Stale · " : "Updated ",
      el("time", { datetime: feed.generated_at, text: relativeTime(feed.generated_at) || "unknown" }),
      file && file.viewUrl ? el("a", { href: file.viewUrl, class: "fresh-link", text: "feed" }) : null));
}

export function statusPanel(feed) {
  const d = feed.domain || {};
  return panel("Where it stands", { wide: true },
    d.summary ? el("p", { class: "summary", text: d.summary }) : empty("No summary in this feed yet."),
    el("dl", { class: "kv" },
      el("dt", { text: "Next step" }), el("dd", { text: d.next_step || "—" }),
      el("dt", { text: "Waiting on you" }), el("dd", { class: d.waiting ? "attn" : "", text: d.waiting || "Nothing" })));
}

export function teamPanel(feed) {
  const roles = feed.roles || [];
  const byOwner = new Map();
  for (const r of roles) {
    if (!byOwner.has(r.owner)) byOwner.set(r.owner, []);
    byOwner.get(r.owner).push(r);
  }
  const ownerName = (slug) => ((feed.owners || []).find((o) => o.slug === slug) || {}).name || slug;
  return panel("Team", { meta: `${roles.length} roles` },
    roles.length
      ? [...byOwner.entries()].map(([owner, rs]) =>
          el("div", { class: "team" },
            el("h3", { text: ownerName(owner) }),
            el("ul", { class: "roles" }, rs.map((r) =>
              el("li", null,
                el("div", { class: "role-line" },
                  el("strong", { text: r.role }),
                  el("span", { class: "muted mono", text: r.last_active ? relativeTime(r.last_active) : "idle" })),
                r.purpose ? el("p", { class: "muted", text: r.purpose }) : null,
                (r.recent || []).length ? el("p", { class: "recent", text: r.recent[0] }) : null)))))
      : empty("No roles recorded yet."));
}

export function questionsPanel(questions, { title = "Waiting on you" } = {}) {
  const qs = questions || [];
  return panel(title, { meta: qs.length ? `${qs.length} open` : "clear" },
    qs.length
      ? el("ul", { class: "questions" }, qs.map((q) => {
          const opts = (q.options || []).map(parseOption);
          return el("li", null,
            el("div", { class: "q-line" }, el("span", { class: "code mono", text: q.code }), el("span", { class: "q-text", text: q.question })),
            opts.length ? el("ol", { class: "opts" }, opts.map((o) =>
              el("li", { class: o.key && o.key === str(q.default).toLowerCase().replace(/[).\s]/g, "") ? "is-default" : "" },
                el("span", { class: "mono", text: o.key ? `${o.key})` : "·" }), " ", o.label))) : null,
            q.default_date ? el("p", { class: "muted", text: `Default applies ${q.default_date}` }) : null);
        }))
      : empty("Nothing needs a decision from you."));
}

export function sessionsPanel(sessions, { title = "Recent sessions", limit = 8 } = {}) {
  const ss = (sessions || []).slice(0, limit);
  return panel(title, { meta: ss.length ? `${(sessions || []).length}` : "" },
    ss.length
      ? el("ol", { class: "sessions" }, ss.map((s) =>
          el("li", null,
            el("div", { class: "s-line" },
              el("time", { class: "mono", text: s.date }),
              el("a", { href: s.url, text: s.title || s.summary || "Session" })),
            s.summary ? el("p", { text: s.summary }) : null,
            el("p", { class: "muted" },
              [s.owner, (s.roles || []).join(", "), s.subagents].filter(Boolean).join(" · ")),
            s.next_step ? el("p", { class: "next" }, el("span", { class: "label", text: "Next " }), s.next_step) : null)))
      : empty("No sessions logged for this area yet."));
}

export function filesPanel(feed) {
  const files = feed.files || [];
  const arts = feed.artifacts || [];
  const projects = (feed.projects || []).filter((p) => safeUrl(p.drive_folder_url) || safeUrl(p.repo_url));
  return panel("Files and links", { meta: `${files.length + arts.length}` },
    projects.length ? el("p", { class: "folder-links" }, projects.map((p) => [
      safeUrl(p.drive_folder_url) ? el("a", { href: p.drive_folder_url, class: "btn", text: `${p.name} folder` }) : null,
      safeUrl(p.repo_url) ? el("a", { href: p.repo_url, class: "btn", text: "Repo" }) : null])) : null,
    files.length ? el("ul", { class: "links" }, files.slice(0, 12).map((f) =>
      el("li", null, el("a", { href: f.url, text: f.title }), el("span", { class: "muted mono", text: f.updated || f.kind || "" })))) : null,
    arts.length ? [el("h3", { text: "Artifacts" }), el("ul", { class: "links" }, arts.slice(0, 12).map((a) =>
      el("li", null, el("a", { href: a.url, text: a.title }), el("span", { class: "muted mono", text: a.updated || "" }))))] : null,
    !files.length && !arts.length && !projects.length ? empty("No files linked yet.") : null);
}

/* ---------- boot ---------- */

export function errorBlock(err, { server = DRIVE, onAsk } = {}) {
  const c = errorCopy(err, server);
  // Every failure gets one way forward: the consent ask where that's the fix, otherwise a plain retry.
  const label = c.canAsk ? `Allow ${server}` : "Try again";
  return el("div", { class: "notice", role: "status" },
    el("strong", { text: c.title }), el("p", { text: c.body }),
    onAsk ? el("button", { class: "btn", type: "button", onclick: onAsk, text: label }) : null);
}

/**
 * Render a dashboard. `render(feed, file, mcp)` returns the panel nodes for the grid.
 * The page shows a designed loading state first and an actionable error on failure.
 */
export async function boot({ feed: name, render, root = document.getElementById("app") }) {
  const status = el("p", { class: "loading", text: "Reading the latest rollup from Drive…" });
  root.replaceChildren(status);
  // Local preview builds (build.mjs --preview) inject example data; published pages never have it.
  if (typeof window !== "undefined" && window.__FIXTURE__) {
    root.replaceChildren(...(await render(window.__FIXTURE__, null, null)).flat().filter(Boolean));
    return;
  }
  const mcp = await getMcp();
  if (!mcp) {
    root.replaceChildren(errorBlock({ code: "not_granted" }));
    return;
  }
  const run = async () => {
    try {
      const { feed, file } = await loadFeed(mcp, name);
      const nodes = await render(feed, file, mcp);
      root.replaceChildren(...nodes.flat().filter(Boolean));
    } catch (err) {
      if (err && err.retryable && !run.retried) {
        run.retried = true;
        setTimeout(run, Math.min(err.retryAfterMs || 1500, 10000));
        return;
      }
      root.replaceChildren(errorBlock(err, {
        onAsk: () => { root.replaceChildren(status); run(); },
      }));
    }
  };
  run();
}
