import { el, panel, chip, empty, safeUrl } from "../kit/kit.js";

const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || ""));

export function appointmentsPanel(items) {
  const rows = [...(items || [])];
  const today = new Date().toISOString().slice(0, 10);
  const up = rows.filter((r) => !r.date || r.date >= today).sort(byDate);
  const past = rows.filter((r) => r.date && r.date < today).sort(byDate).reverse();
  const list = [...up, ...past];
  return panel("Appointments", { meta: rows.length ? `${up.length} upcoming` : "" },
    list.length
      ? el("ul", { class: "h-rows" }, list.map((r) =>
          el("li", { class: r.date && r.date < today ? "is-past" : "" },
            el("time", { class: "mono", text: r.date || "undated" }),
            el("span", { text: r.what }), r.status ? chip(r.status) : null)))
      : empty("No appointments logged. Nadia adds them to the 01 — Health doc."));
}

export function claimsPanel(items) {
  const rows = [...(items || [])].sort(byDate).reverse();
  return panel("Claims", { meta: rows.length ? `${rows.length}` : "" },
    rows.length
      ? el("ul", { class: "h-rows" }, rows.map((r) =>
          el("li", null,
            el("time", { class: "mono", text: r.date || "undated" }),
            el("span", { text: r.what }),
            typeof r.amount === "number" ? el("span", { class: "mono", text: r.amount.toLocaleString("en-US", { style: "currency", currency: "USD" }) }) : null,
            r.status ? chip(r.status) : null)))
      : empty("No claims logged. Add them to the 01 — Health doc once an EOB arrives."));
}

export function resultsPanel(items) {
  const rows = [...(items || [])].sort(byDate).reverse();
  return panel("Results", { meta: rows.length ? `${rows.length}` : "" },
    rows.length
      ? el("ul", { class: "h-rows" }, rows.map((r) =>
          el("li", null,
            el("time", { class: "mono", text: r.date || "undated" }),
            el("span", null, r.what, r.note ? el("span", { class: "muted", text: ` — ${r.note}` }) : null))))
      : empty("No results logged. Nadia adds dates and a one-line note to the 01 — Health doc."));
}

export function trainingPanel(t) {
  const x = t || {};
  const sheets = (x.sheets || []).filter((s) => safeUrl(s.url));
  return panel("Training", { meta: x.status || "" },
    x.headline ? el("p", { class: "summary", text: x.headline }) : empty("No training plan headline yet. Nadia sets it in the 03 — Training & Mobility doc."),
    sheets.length ? el("p", { class: "folder-links" }, sheets.map((s) => el("a", { class: "btn", href: s.url, text: s.title }))) : null,
    safeUrl(x.plan_url) ? el("p", null, el("a", { href: x.plan_url, text: "Open the training plan" })) : null);
}
