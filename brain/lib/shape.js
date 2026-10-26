// Pure data shaping: Google API payloads -> view models.
// No DOM, no fetch, no globals. Everything here is unit-tested in tests/brain/.

export const REGISTRY_TABS = ["Projects", "Team", "Questions", "Todos", "Links"];

/* ---------- generic helpers ---------- */

const str = (v) => (v === undefined || v === null ? "" : String(v)).trim();

/** Normalise a header cell: lowercased, trimmed, inner whitespace -> "_". */
export function normalizeHeader(h) {
  return str(h).toLowerCase().replace(/\s+/g, "_");
}

/** 0-based column index -> A1 column letters (0 -> A, 25 -> Z, 26 -> AA). */
export function columnLetter(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Sheet-ish truthiness: TRUE, yes, y, 1, x, ✓, done. */
export function isTrue(v) {
  return /^(true|yes|y|1|x|✓|✔|done)$/i.test(str(v));
}

/**
 * Convert Sheets `values` (header row + data rows) into objects keyed by
 * normalised header. Blank rows are skipped. Each object gets `_row`, the
 * 1-based sheet row number, so it can be written back.
 * Returns { headers, rows }.
 */
export function rowsToObjects(values) {
  const all = Array.isArray(values) ? values : [];
  if (all.length === 0) return { headers: [], rows: [] };
  const headers = all[0].map(normalizeHeader);
  const rows = [];
  for (let i = 1; i < all.length; i++) {
    const cells = all[i] || [];
    if (!cells.some((c) => str(c) !== "")) continue;
    const obj = { _row: i + 1 };
    headers.forEach((h, col) => {
      if (h) obj[h] = str(cells[col]);
    });
    rows.push(obj);
  }
  return { headers, rows };
}

/** Pull the tab name out of an A1 range like "'Links'!A1:Z200". */
export function tabFromRange(range) {
  const m = /^'?(.*?)'?!/.exec(str(range));
  return m ? m[1].replace(/''/g, "'") : str(range);
}

/**
 * Parse a values:batchGet response into { projects, team, questions, todos, links, headers }.
 * `headers` maps tab key -> header list (used to find columns for write-back).
 */
export function parseRegistry(batchGetResponse) {
  const out = { projects: [], team: [], questions: [], todos: [], links: [], headers: {} };
  for (const vr of (batchGetResponse && batchGetResponse.valueRanges) || []) {
    const key = tabFromRange(vr.range).toLowerCase();
    if (!(key in out) || key === "headers") continue;
    const { headers, rows } = rowsToObjects(vr.values);
    out[key] = rows;
    out.headers[key] = headers;
  }
  return out;
}

/** A1 cell address for a given tab/header/row, or null if the header is missing. */
export function cellAddress(tab, headers, headerName, row) {
  const idx = (headers || []).indexOf(normalizeHeader(headerName));
  if (idx < 0) return null;
  return `${tab}!${columnLetter(idx)}${row}`;
}

/* ---------- dates ---------- */

/** Parse "YYYY-MM-DD" (or anything Date can parse) into a local-midnight Date; null if invalid. */
export function parseDay(v) {
  const s = str(v);
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (us) return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfDay(d) {
  const x = d instanceof Date ? d : parseDay(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

export function addDays(d, n) {
  const x = startOfDay(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
}

export function isoDay(d) {
  const x = startOfDay(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}

const DAY_MS = 86400000;

/** Whole days from `today` to `day` (negative = in the past). */
export function dayDiff(day, today) {
  return Math.round((startOfDay(day) - startOfDay(today)) / DAY_MS);
}

/* ---------- status ---------- */

/** Map a free-text status to a chip tone: ok | warn | bad | muted | done | info. */
export function statusTone(status) {
  const s = str(status).toLowerCase();
  if (!s) return "muted";
  if (/(block|stuck|risk|overdue|urgent)/.test(s)) return "bad";
  if (/(wait|review|pending|hold)/.test(s)) return "warn";
  if (/(done|shipped|complete|closed|answered|archived)/.test(s)) return "done";
  if (/(later|paused|someday|idea|parked|backlog|dormant)/.test(s)) return "muted";
  if (/(active|progress|on.?track|live|ongoing|doing|now|writing|building)/.test(s)) return "ok";
  return "info";
}

/* ---------- team / projects ---------- */

export function teamBySlug(team) {
  const map = new Map();
  for (const t of team || []) {
    if (t.slug) map.set(t.slug.toLowerCase(), t);
    if (t.name) map.set(t.name.toLowerCase(), t);
  }
  return map;
}

/** Does `projectRef` (a slug or name from another tab) refer to `project`? */
export function matchesProject(projectRef, project) {
  const ref = str(projectRef).toLowerCase();
  if (!ref || !project) return false;
  return ref === str(project.slug).toLowerCase() || ref === str(project.name).toLowerCase();
}

/** Links rows that belong to a project (by slug or name, case-insensitive). */
export function linksForProject(links, project) {
  return (links || []).filter((l) => matchesProject(l.project, project));
}

/**
 * Session doc titles: "YYYY-MM-DD <project> <tool> <slug>".
 * Known tools let a project be several words ("2026-10-26 leland ventures codex intro").
 */
const TOOLS = "claude|codex|chatgpt|cursor|gemini|manual";
export function parseSessionTitle(name) {
  const s = str(name);
  const known = new RegExp(`^(\\d{4}-\\d{2}-\\d{2})\\s+(.+?)\\s+(${TOOLS})\\b\\s*(.*)$`, "i").exec(s);
  if (known) {
    return { date: known[1], project: known[2], tool: known[3].toLowerCase(), slug: known[4] || "", title: s };
  }
  const generic = /^(\d{4}-\d{2}-\d{2})\s+(\S+)\s+(\S+)\s+(.+)$/.exec(s);
  if (generic) {
    return { date: generic[1], project: generic[2], tool: generic[3].toLowerCase(), slug: generic[4], title: s };
  }
  const dated = /^(\d{4}-\d{2}-\d{2})\s*(.*)$/.exec(s);
  if (dated) return { date: dated[1], project: "", tool: "", slug: dated[2], title: s };
  return { date: "", project: "", tool: "", slug: s, title: s };
}

/** Drive files -> session view models, newest first. */
export function shapeSessions(files) {
  return (files || [])
    .map((f) => {
      const p = parseSessionTitle(f.name);
      return {
        ...p,
        id: f.id,
        url: f.webViewLink || (f.id ? `https://docs.google.com/document/d/${f.id}/edit` : ""),
        // Undated titles sort after dated ones; ties break on Drive timestamps.
        sortKey: `${p.date || "0000-00-00"}|${f.createdTime || f.modifiedTime || ""}`,
      };
    })
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));
}

export function latestSessionFor(project, sessions) {
  return (sessions || []).find((s) => matchesProject(s.project, project)) || null;
}

function linkLabel(kind) {
  const k = str(kind).toLowerCase();
  return { artifact: "artifact", repo: "repo", doc: "doc", site: "site" }[k] || "link";
}

/**
 * Projects tab (+ Team, Links, sessions) -> { projects: [card], areas: [card] }.
 * Cards are sorted by `sort` (numeric, blanks last) then name.
 */
export function buildProjectBoard({ projects = [], team = [], links = [], sessions = [] } = {}) {
  const people = teamBySlug(team);
  const cards = projects
    .filter((p) => p.slug || p.name)
    .map((p) => {
      const ownerKey = str(p.owner).toLowerCase();
      const person = ownerKey ? people.get(ownerKey) : null;
      const chips = [];
      if (p.drive_folder_url) chips.push({ label: "Drive", url: p.drive_folder_url, kind: "drive" });
      if (p.repo_url) chips.push({ label: "Repo", url: p.repo_url, kind: "repo" });
      for (const l of linksForProject(links, p)) {
        if (!l.url || chips.some((c) => c.url === l.url)) continue;
        chips.push({ label: l.title || linkLabel(l.kind), url: l.url, kind: linkLabel(l.kind) });
      }
      const session = latestSessionFor(p, sessions);
      const sortNum = Number.parseFloat(p.sort);
      return {
        slug: p.slug,
        name: p.name || p.slug,
        type: str(p.type).toLowerCase() === "area" ? "area" : "project",
        status: p.status || "",
        tone: statusTone(p.status),
        archived: /^archived?$/i.test(str(p.status)),
        owner: person ? person.name : p.owner || "",
        ownerRole: person ? person.role || "" : "",
        nextStep: p.next_step || "",
        waiting: p.waiting || "",
        prefix: p.prefix || "",
        links: chips,
        latestSession: session,
        _sort: Number.isFinite(sortNum) ? sortNum : Infinity,
      };
    })
    .sort((a, b) => a._sort - b._sort || a.name.localeCompare(b.name));
  const live = cards.filter((c) => !c.archived);
  return {
    projects: live.filter((c) => c.type === "project"),
    areas: live.filter((c) => c.type === "area"),
    archived: cards.filter((c) => c.archived),
  };
}

/* ---------- questions ---------- */

/**
 * Split an options cell. The Registry uses "a) Send it / b) Shelve it";
 * "|", ";" and newlines are also accepted, then "," as a last resort.
 */
export function splitOptions(v) {
  const s = str(v);
  if (!s) return [];
  let parts;
  if (/\s\/\s/.test(s)) parts = s.split(/\s+\/\s+/);
  else if (/[|;\n]/.test(s)) parts = s.split(/[|;\n]/);
  else parts = s.split(",");
  return parts.map((x) => x.trim()).filter(Boolean);
}

/** "a) Send it" -> { key: "a", label: "Send it", raw: "a) Send it" }. */
export function parseOption(raw) {
  const s = str(raw);
  const m = /^\(?([a-z0-9])[).:]\s+(.+)$/i.exec(s);
  return m ? { key: m[1].toLowerCase(), label: m[2].trim(), raw: s } : { key: "", label: s, raw: s };
}

/** Does a `default` cell ("a", "a)", "Send it", "a) Send it") refer to this option? */
export function isDefaultOption(opt, def) {
  const d = str(def).toLowerCase();
  if (!d) return false;
  const p = parseOption(d);
  if (opt.key && (d === opt.key || d.replace(/[).:\s]+$/, "") === opt.key || p.key === opt.key)) return true;
  return d === opt.raw.toLowerCase() || d === opt.label.toLowerCase() || p.label.toLowerCase() === opt.label.toLowerCase();
}

const OPEN_STATUSES = new Set(["", "open", "pending", "waiting", "asked", "new"]);

/** Open questions: no answer yet and status is open-ish (closed/defaulted/answered are not). */
export function openQuestions(questions, projects = []) {
  return (questions || [])
    .filter((q) => q.question && !q.answer && OPEN_STATUSES.has(str(q.status).toLowerCase()))
    .map((q) => {
      const project = projects.find((p) => matchesProject(q.project, p));
      const options = splitOptions(q.options).map(parseOption);
      options.forEach((o) => (o.isDefault = isDefaultOption(o, q.default)));
      const def = options.find((o) => o.isDefault);
      return {
        row: q._row,
        code: q.code || "",
        project: project ? project.name : q.project || "",
        question: q.question,
        context: q.context || "",
        options,
        default: def ? def.label : q.default || "",
        defaultDate: q.default_date || "",
        blocks: q.blocks || "",
      };
    })
    .sort((a, b) => (a.defaultDate || "9999").localeCompare(b.defaultDate || "9999"));
}

/* ---------- todos ---------- */

/** Not-done todos due on or before today + `days` (overdue included), soonest first. */
export function todosDue(todos, today, days = 2) {
  const limit = addDays(today, days);
  return (todos || [])
    .filter((t) => t.todo && !isTrue(t.done))
    .map((t) => ({ t, due: parseDay(t.due) }))
    .filter(({ due }) => due && due <= limit)
    .sort((a, b) => a.due - b.due)
    .map(({ t, due }) => {
      const diff = dayDiff(due, today);
      return {
        row: t._row,
        todo: t.todo,
        project: t.project || "",
        source: t.source || "",
        due: isoDay(due),
        diff,
        when: diff < 0 ? `${-diff}d overdue` : diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff}d`,
        overdue: diff < 0,
        done: false,
      };
    });
}

/* ---------- links / search ---------- */

/** Every whitespace-separated term must appear in title/url/kind/project. */
export function filterLinks(links, query) {
  const terms = str(query).toLowerCase().split(/\s+/).filter(Boolean);
  const list = (links || []).filter((l) => l.url || l.title);
  if (terms.length === 0) return list;
  return list.filter((l) => {
    const hay = [l.title, l.url, l.kind, l.project].map(str).join(" ").toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/** Escape a user string for a Drive `q` literal. */
export function driveQueryLiteral(s) {
  return str(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/* ---------- calendar ---------- */

/** Calendar events -> { today: [...], tomorrow: [...] }. */
export function shapeEvents(items, today) {
  const t0 = startOfDay(today);
  const out = { today: [], tomorrow: [] };
  for (const e of items || []) {
    if (e.status === "cancelled") continue;
    const allDay = Boolean(e.start && e.start.date && !e.start.dateTime);
    const start = allDay ? parseDay(e.start.date) : new Date(e.start && e.start.dateTime);
    if (!start || Number.isNaN(start.getTime())) continue;
    const end = e.end ? (allDay ? parseDay(e.end.date) : new Date(e.end.dateTime)) : null;
    const ev = {
      id: e.id,
      title: e.summary || "(no title)",
      allDay,
      start,
      end,
      url: e.htmlLink || "",
      location: e.location || "",
      meet: e.hangoutLink || "",
    };
    // An all-day/multi-day event counts for every day it covers.
    for (const [key, offset] of [["today", 0], ["tomorrow", 1]]) {
      const dayStart = addDays(t0, offset);
      const dayEnd = addDays(t0, offset + 1);
      const evEnd = end && end > start ? end : new Date(start.getTime() + 1);
      if (start < dayEnd && evEnd > dayStart) out[key].push(ev);
    }
  }
  const byStart = (a, b) => (a.allDay === b.allDay ? a.start - b.start : a.allDay ? -1 : 1);
  out.today.sort(byStart);
  out.tomorrow.sort(byStart);
  return out;
}

/* ---------- gmail ---------- */

/** '"Jane Doe" <jane@x.com>' -> 'Jane Doe'; 'jane@x.com' -> 'jane@x.com'. */
export function parseFromHeader(v) {
  const s = str(v);
  const m = /^"?([^"<]*?)"?\s*<([^>]+)>/.exec(s);
  if (m) return m[1].trim() || m[2].trim();
  return s;
}

/** threads.get(format=metadata) payloads -> mail rows. */
export function shapeThreads(threads) {
  return (threads || []).map((th) => {
    const msgs = th.messages || [];
    const first = msgs[0] || {};
    const last = msgs[msgs.length - 1] || first;
    const header = (msg, name) => {
      const h = ((msg.payload && msg.payload.headers) || []).find((x) => x.name.toLowerCase() === name);
      return h ? h.value : "";
    };
    return {
      id: th.id,
      from: parseFromHeader(header(last, "from") || header(first, "from")),
      subject: header(first, "subject") || "(no subject)",
      snippet: decodeEntities(last.snippet || th.snippet || ""),
      count: msgs.length,
      date: last.internalDate ? new Date(Number(last.internalDate)) : null,
      starred: msgs.some((m) => (m.labelIds || []).includes("STARRED")),
      url: `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(th.id)}`,
    };
  });
}

/** Gmail snippets arrive HTML-entity-encoded. Decode the common ones to plain text. */
export function decodeEntities(s) {
  return str(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/* ---------- budget ---------- */

/** Prefer a summary-like tab; otherwise the first tab. */
export function pickBudgetTab(titles) {
  const list = (titles || []).filter(Boolean);
  for (const re of [/^summary$/i, /summary/i, /dashboard/i, /overview/i]) {
    const hit = list.find((t) => re.test(t));
    if (hit) return hit;
  }
  return list[0] || null;
}

const NUMERIC = /^\(?[-+−]?\s?[$€£¥]?\s?\d[\d,]*(\.\d+)?\)?\s?%?$/;
export function isNumericCell(v) {
  return NUMERIC.test(str(v));
}

/** Trim a sheet range to its first `maxRows` non-blank rows and used columns. */
export function budgetTable(values, maxRows = 12, maxCols = 8) {
  const rows = (values || []).filter((r) => (r || []).some((c) => str(c) !== "")).slice(0, maxRows);
  let width = 0;
  for (const r of rows) {
    for (let i = r.length - 1; i >= 0; i--) {
      if (str(r[i]) !== "") {
        width = Math.max(width, i + 1);
        break;
      }
    }
  }
  width = Math.min(width, maxCols);
  return rows.map((r) =>
    Array.from({ length: width }, (_, i) => {
      const text = str(r[i]);
      return { text, numeric: text !== "" && isNumericCell(text) };
    }),
  );
}

/* ---------- github ---------- */

export function shapeRepos(repos) {
  return (repos || [])
    .filter((r) => r && r.name)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description || "",
      language: r.language || "",
      stars: r.stargazers_count || 0,
      pushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
      fork: Boolean(r.fork),
      archived: Boolean(r.archived),
    }));
}

/** "3h ago", "2d ago", "just now". */
export function relativeTime(date, now = new Date()) {
  if (!date) return "";
  const s = Math.round((now - date) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 60) return `${d}d ago`;
  return `${Math.round(d / 30)}mo ago`;
}

/** Only allow http(s)/mailto URLs into href attributes. */
export function safeUrl(u) {
  const s = str(u);
  return /^(https?:|mailto:)/i.test(s) ? s : "";
}
