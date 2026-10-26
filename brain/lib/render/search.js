import { h, replace } from "../dom.js";
import { filterLinks } from "../shape.js";
import { empty, fill } from "./common.js";

const MAX = 12;

function linkRow(l) {
  return h(
    "li",
    { class: "row" },
    h("span", { class: `kind kind-${(l.kind || "other").toLowerCase()}`, text: (l.kind || "link").toLowerCase() }),
    h("a", { class: "grow", href: l.url, text: l.title || l.url }),
    l.project && h("span", { class: "tag", text: l.project }),
  );
}

/** Client-side filter over Links. */
export function renderLinkSearch(links) {
  const input = h("input", { type: "search", class: "input", placeholder: "Filter links…", "aria-label": "Filter links", autocomplete: "off" });
  const list = h("div", { "aria-live": "polite" });
  const update = () => {
    const hits = filterLinks(links, input.value);
    replace(
      list,
      hits.length ? h("ul", { class: "rows" }, hits.slice(0, MAX).map(linkRow)) : empty("No matching links."),
      hits.length > MAX && h("div", { class: "small muted more num", text: `+${hits.length - MAX} more, keep typing` }),
    );
  };
  input.addEventListener("input", update);
  update();
  return h("div", { class: "subgroup" }, h("h4", { class: "sublabel" }, "Links", h("span", { class: "count num", text: String(links.length) })), input, list);
}

/** Drive full-text search form; search(text) -> Promise<files[]> */
export function renderDriveSearch(search) {
  const input = h("input", { type: "search", class: "input", name: "q", placeholder: "Search Drive full text…", "aria-label": "Search Drive", autocomplete: "off", required: true });
  const out = h("div", { class: "drive-results" });
  const form = h(
    "form",
    { class: "inline-form", role: "search" },
    input,
    h("button", { type: "submit", class: "btn", text: "Search" }),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    fill(out, () => search(q), (files) =>
      files.length
        ? h(
            "ul",
            { class: "rows" },
            files.map((f) =>
              h(
                "li",
                { class: "row" },
                h("span", { class: "kind", text: mimeLabel(f.mimeType) }),
                h("a", { class: "grow", href: f.webViewLink, text: f.name }),
                f.modifiedTime && h("span", { class: "num muted small", text: f.modifiedTime.slice(0, 10) }),
              ),
            ),
          )
        : empty(`No Drive files contain “${q}”.`),
    );
  });
  return h("div", { class: "subgroup" }, h("h4", { class: "sublabel", text: "Drive" }), form, out);
}

export function mimeLabel(m) {
  const s = String(m || "");
  if (s.includes("folder")) return "folder";
  if (s.includes("spreadsheet")) return "sheet";
  if (s.includes("document")) return "doc";
  if (s.includes("presentation")) return "slides";
  if (s.includes("pdf")) return "pdf";
  if (s.startsWith("image/")) return "image";
  return "file";
}
