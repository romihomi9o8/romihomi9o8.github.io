import { h } from "../dom.js";
import { budgetTable } from "../shape.js";
import { empty } from "./common.js";

/** b = { title, tabs, tab, values, url } */
export function renderBudget(b) {
  const rows = budgetTable(b.values, 12, 8);
  const head = h(
    "div",
    { class: "budget-head small muted" },
    h("span", { text: b.tab ? `Tab: ${b.tab}` : "No tabs" }),
    b.tabs && b.tabs.length > 1 && h("span", { class: "num", text: ` · ${b.tabs.length} tabs` }),
    h("span", { class: "spacer" }),
    b.url && h("a", { href: b.url, text: "Open sheet" }),
  );
  if (!rows.length) return [head, empty("That tab is empty.")];
  const [first, ...rest] = rows;
  const headerLike = first.every((c) => !c.numeric);
  const body = headerLike ? rest : rows;
  return [
    head,
    h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        { class: "budget" },
        headerLike && h("thead", {}, h("tr", {}, first.map((c) => h("th", { scope: "col", text: c.text })))),
        h(
          "tbody",
          {},
          body.map((r) =>
            h(
              "tr",
              { class: /^total/i.test(r[0] && r[0].text) ? "total" : "" },
              r.map((c, i) =>
                i === 0 && !c.numeric
                  ? h("th", { scope: "row", text: c.text })
                  : h("td", { class: c.numeric ? `num${/^\(|^[-−]/.test(c.text) ? " tone-text-bad" : ""}` : "", text: c.text }),
              ),
            ),
          ),
        ),
      ),
    ),
  ];
}
