import { el, panel, chip, empty, statusTone, parseOption, safeUrl } from "../kit/kit.js";

const GROUPS = ["Product demos", "Investor and business", "Design and research"];

/** Milestones as a horizontal status timeline (vertical on narrow screens). */
export function milestonesPanel(feed) {
  const ms = (feed.panels && feed.panels.milestones) || [];
  const done = ms.filter((m) => statusTone(m.status) === "done").length;
  return panel("Roadmap", { wide: true, meta: ms.length ? `${done} of ${ms.length} done` : "" },
    ms.length
      ? el("ol", { class: "timeline" }, ms.map((m) => {
          const tone = statusTone(m.status);
          return el("li", { class: `tl tl-${tone}` },
            el("span", { class: "tl-dot", "aria-hidden": "true" }),
            el("div", { class: "tl-name mono", text: m.name }),
            el("div", { class: "tl-title", text: m.title || "" }),
            chip(m.status, tone),
            m.due ? el("div", { class: "muted mono", text: m.due }) : null,
            m.note ? el("p", { class: "tl-note muted", text: m.note }) : null);
        }))
      : empty("No roadmap milestones in the feed."));
}

/** Artifact gallery grouped by purpose, newest first inside each group. */
export function galleryPanel(feed) {
  const arts = feed.artifacts || [];
  const groups = [...GROUPS, ...new Set(arts.map((a) => a.purpose).filter((p) => p && !GROUPS.includes(p)))];
  const cols = groups.map((g) => {
    const items = arts.filter((a) => (a.purpose || "Other") === g).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    if (!items.length) return null;
    return el("section", { class: "gal-col" },
      el("h3", null, g, el("span", { class: "panel-meta", text: ` ${items.length}` })),
      el("ul", null, items.map((a) =>
        el("li", null,
          el("a", { href: a.url, class: "gal-link", text: a.title }),
          el("span", { class: "muted mono", text: a.updated || "" })))));
  });
  const newest = arts.reduce((m, a) => (String(a.updated) > m ? String(a.updated) : m), "");
  return panel("Artifact gallery", { wide: true, meta: arts.length ? `${arts.length} artifacts · newest ${newest}` : "" },
    arts.length ? el("div", { class: "gallery" }, cols) : empty("No artifacts in the feed."));
}

/** Open asks, with held items shown separately in the warn tone. */
export function chordQuestionsPanel(questions) {
  const qs = questions || [];
  const asks = qs.filter((q) => !q.held);
  const held = qs.filter((q) => q.held);
  const opts = (q) => (q.options || []).map(parseOption);
  const asksNode = asks.length
    ? el("ul", { class: "questions" }, asks.map((q) =>
        el("li", null,
          el("div", { class: "q-line" }, el("span", { class: "code mono", text: q.code }), el("span", { class: "q-text", text: q.question })),
          el("ol", { class: "opts" }, opts(q).map((o) => el("li", null, el("span", { class: "mono", text: o.key ? `${o.key})` : "·" }), " ", o.label))),
          q.blocks ? el("p", { class: "muted", text: `Blocks: ${q.blocks}` }) : null)))
    : empty("Nothing needs a decision from you.");
  const heldNode = held.length
    ? el("div", { class: "held" },
        el("h3", null, "Held ", chip("send freeze", "warn")),
        el("ul", { class: "questions" }, held.map((q) =>
          el("li", null,
            el("div", { class: "q-line" }, el("span", { class: "code mono", text: q.code }), el("span", { class: "q-text", text: q.question })),
            q.context ? el("p", { class: "muted", text: q.context }) : null))))
    : null;
  return el("section", { class: "panel" },
    el("header", { class: "panel-head" }, el("h2", { text: "Waiting on you" }), el("span", { class: "panel-meta", text: `${asks.length} open${held.length ? ` · ${held.length} held` : ""}` })),
    asksNode, heldNode);
}
