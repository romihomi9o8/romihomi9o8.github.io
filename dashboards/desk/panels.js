import { el, panel, chip, empty, statusTone, safeUrl } from "../kit/kit.js";

/** Guardrail banner. Text comes from the feed, with a safe fallback. */
export function guardrailBanner(panels) {
  const text = (panels && panels.guardrail) || "Research and engineering only. Never places trades.";
  return el("div", { class: "guardrail", role: "note" }, el("strong", { text: "Guardrail" }), el("span", { text }));
}

/** Prominent link to the app artifact. */
export function appLink(feed) {
  const p = feed.panels || {};
  const url = safeUrl(p.app_url) || safeUrl(((feed.artifacts || [])[0] || {}).url);
  if (!url) return null;
  return el("a", { class: "applink", href: url },
    el("span", { class: "label", text: "The app" }),
    el("strong", { text: "Open Agentic Desk App" }),
    el("span", { class: "muted", text: "the working app itself, in a separate artifact" }));
}

const COLUMNS = [
  { key: "bad", title: "Blocked" },
  { key: "ok", title: "Building" },
  { key: "info", title: "Building" },
  { key: "warn", title: "Waiting or in review" },
  { key: "done", title: "Done" },
  { key: "muted", title: "Parked" },
];

/** Workstreams as a build board: one column per state, cards with test counts. */
export function workstreamBoard(workstreams) {
  const ws = workstreams || [];
  if (!ws.length) return panel("Build board", { wide: true }, empty("No workstreams in this feed yet."));
  const cols = [];
  for (const c of COLUMNS) {
    const items = ws.filter((w) => {
      const t = statusTone(w.status);
      return c.key === "ok" ? (t === "ok" || t === "info") : c.key === "info" ? false : t === c.key;
    });
    if (items.length) cols.push({ title: c.title, tone: c.key === "info" ? "ok" : c.key, items });
  }
  return panel("Build board", { wide: true, meta: `${ws.length} workstreams` },
    el("div", { class: "board" }, cols.map((c) =>
      el("section", { class: `bcol bcol-${c.tone}` },
        el("h3", null, c.title, el("span", { class: "mono muted", text: ` ${c.items.length}` })),
        c.items.map((w) =>
          el("article", { class: "bcard" },
            el("div", { class: "bcard-top" }, el("strong", { text: w.name }), chip(w.status)),
            w.tests ? el("p", { class: "mono tests", text: w.tests }) : el("p", { class: "muted tests", text: "tests: not recorded" }),
            w.note ? el("p", { class: "muted", text: w.note }) : null))))));
}
