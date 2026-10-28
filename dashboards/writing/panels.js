import { el, panel, chip, empty, statusTone, questionsPanel, sessionsPanel } from "../kit/kit.js";

const today = () => new Date().toISOString().slice(0, 10);

/** Publishing calendar: dated pieces upcoming-first (past dates after), undated drafts in their own group. */
export function calendarPanel(items) {
  const all = items || [];
  const dated = all.filter((p) => p.date).sort((a, b) => a.date.localeCompare(b.date));
  const undated = all.filter((p) => !p.date);
  const t = today();
  const upcoming = dated.filter((p) => p.date >= t);
  const past = dated.filter((p) => p.date < t).reverse();
  const row = (p) => el("li", { class: "cal-row" },
    el("span", { class: "cal-date mono", text: p.date || "—" }),
    el("span", { class: "cal-title", text: p.title }),
    el("span", { class: `chan chan-${p.channel}`, text: p.channel }),
    chip(p.status));
  const group = (label, rows) => rows.length
    ? el("div", { class: "cal-group" }, el("h3", { class: "label", text: `${label} (${rows.length})` }), el("ul", { class: "cal" }, rows.map(row)))
    : null;
  const count = (s) => all.filter((p) => p.status === s).length;
  return panel("Publishing calendar", { wide: true, meta: all.length ? `${count("published")} published · ${count("scheduled")} scheduled · ${count("draft")} draft` : "" },
    all.length ? [group("Upcoming", upcoming), group("No date yet", undated), group("Earlier", past)]
      : empty("Nothing on the calendar yet."));
}

/** Book progress: chapter status bar and list, plus the open consent-register count (a number only). */
export function bookPanel(book) {
  const b = book || {};
  const chapters = b.chapters || [];
  const done = chapters.filter((c) => statusTone(c.status) === "done").length;
  const consent = b.consent_open;
  return panel("Book progress", { meta: chapters.length ? `${done} of ${chapters.length} chapters done` : "" },
    el("div", { class: "tiles" },
      el("div", { class: "tile" }, el("b", { text: chapters.length ? String(chapters.length) : "—" }), el("span", { class: "label", text: "Chapters" })),
      el("div", { class: "tile" }, el("b", { class: consent ? "attn" : "", text: consent == null ? "—" : String(consent) }), el("span", { class: "label", text: "Consent items open" }))),
    chapters.length
      ? [el("div", { class: "bar", role: "img", "aria-label": `${done} of ${chapters.length} chapters done` }, el("i", { style: `width:${(100 * done) / chapters.length}%` })),
         el("ul", { class: "chapters" }, chapters.map((c) => el("li", null, el("span", { text: c.name }), chip(c.status))))]
      : empty("No chapters in Drive yet. The book has no outline or manuscript on file."),
    consent == null ? el("p", { class: "muted", text: "No consent register found in Drive, so the open count is unknown." }) : null);
}

/** Questions or sessions split by owner lane. */
export function lanes(feed, makePanel, items) {
  return (feed.owners || []).map((o) => {
    const slugs = (feed.projects || []).filter((p) => p.owner === o.slug).map((p) => p.slug);
    return makePanel(items.filter((i) => slugs.includes(i.project) || i.owner === o.slug), o);
  });
}
export const questionLanes = (feed) => lanes(feed, (qs, o) => questionsPanel(qs, { title: `Waiting on you · ${o.name.split(" ")[0]}` }), feed.questions || []);
export const sessionLanes = (feed) => lanes(feed, (ss, o) => sessionsPanel(ss, { title: `Sessions · ${o.name.split(" ")[0]}` }), feed.sessions || []);
