import { el, panel, chip, empty, safeUrl, parseOption, relativeTime, isStale, sessionsPanel } from "../kit/kit.js";

const s = (v) => (v == null ? "" : String(v)).trim();

export function isHeld(q) {
  return /HELD/.test(s(q.context)) || /HELD/.test(s(q.blocks));
}

/** Group questions by project; groups ordered by soonest default_date (undated last), held items last in each group. */
export function groupWaiting(waiting) {
  const groups = new Map();
  for (const q of waiting || []) {
    const k = s(q.project) || "other";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(q);
  }
  const date = (q) => s(q.default_date) || "9999-99-99";
  const out = [...groups.entries()].map(([project, items]) => {
    items.sort((a, b) => (isHeld(a) - isHeld(b)) || date(a).localeCompare(date(b)));
    const live = items.filter((q) => !isHeld(q));
    const soonest = live.length ? live.map(date).sort()[0] : "9999-99-99";
    return { project, items, soonest, allHeld: !live.length };
  });
  out.sort((a, b) => (a.allHeld - b.allHeld) || a.soonest.localeCompare(b.soonest) || a.project.localeCompare(b.project));
  return out;
}

export function projectNames(feed) {
  const m = new Map();
  for (const d of feed.domains || []) m.set(d.feed, d.name);
  for (const a of feed.areas || []) m.set(a.slug, a.name);
  return m;
}

export function hqHeader(feed) {
  const stale = isStale(feed.generated_at);
  const waiting = (feed.waiting || []).filter((q) => !isHeld(q)).length;
  return el("header", { class: "dash-head" },
    el("div", { class: "dash-title" },
      el("p", { class: "kicker", text: "Everything, one screen" }),
      el("h1", { text: "Brain HQ" }),
      waiting ? chip(`${waiting} waiting on you`, "warn") : chip("all clear", "ok")),
    el("p", { class: `fresh${stale ? " stale" : ""}` },
      stale ? "Stale · " : "Updated ",
      el("time", { datetime: feed.generated_at, text: relativeTime(feed.generated_at) || "unknown" })));
}

function questionItem(q) {
  const opts = (q.options || []).map(parseOption);
  const def = s(q.default).toLowerCase().replace(/[).\s]/g, "");
  return el("li", { class: isHeld(q) ? "held" : "" },
    el("div", { class: "q-line" },
      el("span", { class: "code mono", text: q.code }),
      el("span", { class: "q-text", text: q.question }),
      isHeld(q) ? chip("held", "muted") : null),
    opts.length ? el("ol", { class: "opts" }, opts.map((o) =>
      el("li", { class: o.key && o.key === def ? "is-default" : "" }, el("span", { class: "mono", text: o.key ? `${o.key})` : "·" }), " ", o.label))) : null,
    q.default_date ? el("p", { class: "muted", text: `Default applies ${q.default_date}` }) : null,
    q.blocks ? el("p", { class: "muted", text: `Blocks: ${q.blocks}` }) : null);
}

export function waitingPanel(feed) {
  const names = projectNames(feed);
  const groups = groupWaiting(feed.waiting);
  const total = (feed.waiting || []).length;
  return panel("Waiting on you", { wide: true, meta: total ? `${total} open` : "clear", id: "waiting" },
    groups.length
      ? el("div", { class: "wait-groups" }, groups.map((g) =>
          el("section", { class: `wait-group${g.allHeld ? " held" : ""}` },
            el("div", { class: "wait-head" },
              el("h3", { text: names.get(g.project) || g.project }),
              el("span", { class: "muted mono", text: `${g.items.length}` }),
              g.soonest < "9999" ? chip(`default ${g.soonest}`, "warn") : null),
            el("ul", { class: "questions" }, g.items.map(questionItem)))))
      : empty("Nothing needs a decision from you."));
}

export function domainCards(feed) {
  const ds = feed.domains || [];
  return panel("Dashboards", { wide: true, meta: `${ds.length}`, id: "domains" },
    ds.length
      ? el("div", { class: "cards" }, ds.map((d) => {
          const url = safeUrl(d.dashboard_url);
          return el("article", { class: "card" },
            el("div", { class: "card-top" }, el("h3", { text: d.name }), chip(d.status)),
            el("p", { class: "muted", text: (d.owners || []).join(" · ") || "No owner" }),
            el("p", { class: "card-next", text: d.next_step || "No next step recorded." }),
            el("p", { class: "card-meta mono muted" },
              el("span", { class: d.open_questions ? "attn" : "", text: `${d.open_questions || 0} open` }),
              el("span", { text: d.last_session ? `last session ${d.last_session}` : "no sessions yet" })),
            url ? el("a", { href: url, class: "card-open", text: `Open ${d.name}` }) : el("span", { class: "card-open off", text: "Dashboard not published" }));
        }))
      : empty("No dashboards listed yet."));
}

export function areasPanel(feed) {
  const as = feed.areas || [];
  return panel("Other areas", { wide: true, meta: `${as.length}`, id: "areas" },
    as.length
      ? el("div", { class: "table-wrap" }, el("table", null,
          el("thead", null, el("tr", null, ["Area", "Owner", "Status", "Next step", "Open", "Last session"].map((h, i) => el("th", { class: i === 4 ? "num" : "", text: h })))),
          el("tbody", null, as.map((a) => el("tr", null,
            el("td", null, el("strong", { text: a.name })),
            el("td", { text: a.owner || "—" }),
            el("td", null, chip(a.status)),
            el("td", { text: a.next_step || "—" }),
            el("td", { class: `num${a.open_questions ? " attn" : ""}`, text: String(a.open_questions || 0) }),
            el("td", { class: "mono", text: a.last_session || "—" }))))))
      : empty("No other areas listed."));
}

export function teamsPanel(feed) {
  const rs = feed.rosters || [];
  return panel("Teams", { wide: true, meta: `${rs.length} owners`, id: "teams" },
    el("p", { class: "muted", text: "Tell any session to change a roster; it files a change request in 00 Brain/Inbox." }),
    rs.length
      ? el("div", { class: "rosters" }, rs.map((o) =>
          el("div", { class: "team" },
            el("h3", { text: o.name || o.owner }),
            el("ul", { class: "roles" }, (o.roles || []).map((r) =>
              el("li", null,
                el("div", { class: "role-line" },
                  el("strong", { text: r.role }),
                  el("span", { class: "muted mono", text: r.last_active ? `active ${r.last_active}` : "idle" })),
                r.purpose ? el("p", { class: "muted", text: r.purpose }) : null))))))
      : empty("No rosters recorded yet."));
}

export const sessions24 = (feed) => sessionsPanel(feed.sessions_24h, { title: "Last 24 hours", limit: 10 });
