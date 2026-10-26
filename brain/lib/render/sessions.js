import { h } from "../dom.js";
import { empty } from "./common.js";

/** sessions = shapeSessions(files) */
export function renderSessions(sessions, limit = 10) {
  if (!sessions.length) return empty("No session docs yet.");
  return h(
    "ul",
    { class: "rows" },
    sessions.slice(0, limit).map((s) =>
      h(
        "li",
        { class: "row session" },
        h("span", { class: "when num", text: s.date ? s.date.slice(5) : "—" }),
        h("a", { class: "grow", href: s.url, title: s.title }, s.slug || s.title),
        s.project && h("span", { class: "tag", text: s.project }),
        s.tool && h("span", { class: `tool tool-${s.tool}`, text: s.tool }),
      ),
    ),
  );
}
