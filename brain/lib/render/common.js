import { h, replace } from "../dom.js";
import { NotConfiguredError } from "../source.js";

/**
 * A panel: <section class="panel"> with a header (title, meta, actions) and a body.
 * Returns { el, body, setMeta(text), setBusy(bool) }.
 */
export function panel({ id, title, actions = [], className = "" }) {
  const meta = h("span", { class: "panel-meta num" });
  const body = h("div", { class: "panel-body", "aria-live": "polite", "aria-busy": "true" });
  const el = h(
    "section",
    { class: `panel ${className}`.trim(), id: `panel-${id}`, "aria-labelledby": `panel-${id}-title` },
    h("header", { class: "panel-head" }, h("h2", { id: `panel-${id}-title`, text: title }), meta, h("div", { class: "panel-actions" }, actions)),
    body,
  );
  return {
    el,
    body,
    setMeta: (t) => (meta.textContent = t || ""),
    setBusy: (b) => body.setAttribute("aria-busy", b ? "true" : "false"),
  };
}

export function loading(label = "Loading…") {
  return h("div", { class: "state loading", role: "status" }, h("span", { class: "spinner", "aria-hidden": "true" }), label);
}

export function empty(text) {
  return h("div", { class: "state empty", text });
}

/** Inline error card; shows the HTTP status when there is one. */
export function errorCard(err, onRetry) {
  if (err instanceof NotConfiguredError) return notConfigured(err.setting);
  const status = err && typeof err.status === "number" ? (err.status === 0 ? "network" : `HTTP ${err.status}`) : "error";
  const hint =
    err && err.status === 403
      ? "Permission denied: check the API is enabled and the scope was granted."
      : err && err.status === 404
        ? "Not found: check the ID in brain/config.js and that this account can open it."
        : err && err.status === 429
          ? "Rate limited: wait a minute, then refresh."
          : "";
  return h(
    "div",
    { class: "state error", role: "alert" },
    h("div", { class: "error-line" }, h("span", { class: "chip tone-bad num", text: status }), h("span", { text: (err && err.detail) || (err && err.message) || "Something went wrong" })),
    hint && h("div", { class: "hint", text: hint }),
    onRetry && h("button", { type: "button", class: "btn btn-small", onClick: onRetry, text: "Retry" }),
  );
}

export function notConfigured(setting) {
  return h(
    "div",
    { class: "state notconf" },
    h("strong", { text: "Not configured yet. " }),
    "Set ",
    h("code", { text: setting }),
    " in ",
    h("code", { text: "brain/config.js" }),
    " (see brain/README.md).",
  );
}

/**
 * Run `load()` into `target`, showing loading, then `render(data)` or an error card.
 * Returns the loaded data (or undefined on error) so callers can chain.
 */
export async function fill(target, load, render, { setBusy } = {}) {
  replace(target, loading());
  setBusy && setBusy(true);
  try {
    const data = await load();
    replace(target, render(data));
    return data;
  } catch (err) {
    console.warn("[brain]", err);
    replace(target, errorCard(err, () => fill(target, load, render, { setBusy })));
    return undefined;
  } finally {
    setBusy && setBusy(false);
  }
}

export function chip(text, tone = "info", extra = "") {
  return h("span", { class: `chip tone-${tone} ${extra}`.trim(), text });
}

export function ext(href, text, cls = "") {
  return h("a", { href, class: cls, text });
}

export function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
