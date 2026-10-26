import { h, replace } from "../dom.js";
import { dayDiff, parseDay } from "../shape.js";
import { chip, empty, errorCard } from "./common.js";

function defaultLine(q, today) {
  if (!q.default) return null;
  const d = parseDay(q.defaultDate);
  let when = "";
  let tone = "muted";
  if (d) {
    const diff = dayDiff(d, today);
    when = diff < 0 ? `${-diff}d ago` : diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff}d`;
    tone = diff <= 0 ? "tone-text-bad" : diff <= 2 ? "tone-text-warn" : "muted";
  }
  return h(
    "div",
    { class: "default-line small" },
    "Default ",
    h("strong", { text: q.default }),
    q.defaultDate && [" on ", h("span", { class: "num", text: q.defaultDate }), when && h("span", { class: `num ${tone}`, text: ` (${when})` })],
  );
}

/** questions = openQuestions(...); onAnswer(q, answer) -> Promise */
export function renderQuestions(questions, onAnswer, today = new Date()) {
  if (!questions.length) return empty("Nothing needs you right now.");
  return h(
    "ol",
    { class: "qlist" },
    questions.map((q) => {
      const status = h("div", { class: "q-status", "aria-live": "polite" });
      const opts = q.options.length ? q.options : q.default ? [{ key: "", label: q.default, raw: q.default, isDefault: true }] : [];
      const buttons = opts.map((opt) => {
        const b = h(
          "button",
          { type: "button", class: `btn btn-option${opt.isDefault ? " is-default" : ""}`, title: opt.isDefault ? "Default answer" : undefined },
          opt.key && h("span", { class: "opt-key num", "aria-hidden": "true", text: opt.key }),
          opt.label,
        );
        b.dataset.answer = opt.raw;
        return b;
      });
      const card = h(
        "li",
        { class: "q" },
        h("div", { class: "q-head" }, q.code && chip(q.code, "info", "num"), q.project && h("span", { class: "tag", text: q.project }), q.blocks && h("span", { class: "small muted", text: `blocks: ${q.blocks}` })),
        h("p", { class: "q-text", text: q.question }),
        q.context && h("p", { class: "q-context small muted", text: q.context }),
        h("div", { class: "q-options", role: "group", "aria-label": `Answer ${q.code || "question"}` }, buttons),
        defaultLine(q, today),
        status,
      );
      buttons.forEach((b) =>
        b.addEventListener("click", async () => {
          const answer = b.dataset.answer;
          buttons.forEach((x) => (x.disabled = true));
          replace(status, h("span", { class: "small muted", text: "Saving…" }));
          try {
            await onAnswer(q, answer);
            card.classList.add("is-answered");
            b.classList.add("is-chosen");
            replace(status, h("span", { class: "small tone-text-ok", text: `Answered: ${answer}` }));
          } catch (err) {
            buttons.forEach((x) => (x.disabled = false));
            replace(status, errorCard(err));
          }
        }),
      );
      return card;
    }),
  );
}
