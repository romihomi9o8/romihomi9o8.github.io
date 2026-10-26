import { h } from "../dom.js";
import { relativeTime } from "../shape.js";
import { empty } from "./common.js";

/** repos = shapeRepos(...) */
export function renderRepos(repos, now = new Date()) {
  if (!repos.length) return empty("No public repos.");
  return h(
    "ul",
    { class: "rows" },
    repos.map((r) =>
      h(
        "li",
        { class: "row repo" },
        h(
          "div",
          { class: "grow" },
          h("a", { href: r.url, text: r.name }),
          r.description && h("div", { class: "small muted clamp", text: r.description }),
        ),
        r.language && h("span", { class: "tag", text: r.language }),
        h("span", { class: "num muted small", text: relativeTime(r.pushedAt, now) }),
      ),
    ),
  );
}
