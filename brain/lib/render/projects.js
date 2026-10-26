import { h } from "../dom.js";
import { chip, empty } from "./common.js";

function card(c) {
  return h(
    "article",
    { class: `pcard tone-edge-${c.tone}`, "aria-label": c.name },
    h(
      "header",
      { class: "pcard-head" },
      h("h3", { text: c.name }),
      c.prefix && h("span", { class: "num muted small", text: c.prefix }),
      h("span", { class: "spacer" }),
      chip(c.status || "no status", c.tone),
    ),
    c.owner && h("div", { class: "owner small" }, h("span", { class: "avatar", "aria-hidden": "true", text: c.owner.slice(0, 1).toUpperCase() }), h("span", { text: c.owner }), c.ownerRole && h("span", { class: "muted", text: ` · ${c.ownerRole}` })),
    c.nextStep && h("p", { class: "next" }, h("span", { class: "label", text: "Next" }), c.nextStep),
    c.waiting && h("p", { class: "waiting" }, h("span", { class: "label", text: "Waiting" }), c.waiting),
    (c.links.length > 0 || c.latestSession) &&
      h(
        "div",
        { class: "links" },
        c.links.map((l) => h("a", { class: `lchip kind-${l.kind}`, href: l.url, text: l.label, title: l.label })),
        c.latestSession &&
          h("a", { class: "lchip kind-session", href: c.latestSession.url, title: c.latestSession.title }, h("span", { class: "num", text: c.latestSession.date.slice(5) }), ` ${c.latestSession.tool}`),
      ),
  );
}

/** board = buildProjectBoard(...) */
export function renderBoard(board) {
  if (!board.projects.length && !board.areas.length && !(board.archived || []).length) return empty("No rows in the Projects tab yet.");
  const section = (label, list) =>
    list.length > 0 &&
    h("div", { class: "board-group" }, h("h4", { class: "sublabel" }, label, h("span", { class: "count num", text: String(list.length) })), h("div", { class: "cards" }, list.map(card)));
  const archived = board.archived || [];
  return [
    section("Projects", board.projects),
    section("Areas", board.areas),
    archived.length > 0 &&
      h(
        "details",
        { class: "board-group archived" },
        h("summary", { class: "sublabel" }, "Archived", h("span", { class: "count num", text: String(archived.length) })),
        h("div", { class: "cards" }, archived.map(card)),
      ),
  ];
}
