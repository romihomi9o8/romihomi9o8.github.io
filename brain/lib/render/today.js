import { h, replace } from "../dom.js";
import { relativeTime } from "../shape.js";
import { chip, empty, errorCard, fmtTime } from "./common.js";

/** shaped = shapeEvents(...) -> { today, tomorrow } */
export function renderEvents(shaped) {
  const group = (label, list) =>
    h(
      "div",
      { class: "subgroup" },
      h("h4", { class: "sublabel" }, label, h("span", { class: "count num", text: String(list.length) })),
      list.length
        ? h(
            "ul",
            { class: "rows" },
            list.map((e) =>
              h(
                "li",
                { class: "row event" },
                h("span", { class: "when num", text: e.allDay ? "all day" : fmtTime(e.start) }),
                h("a", { class: "grow", href: e.url, text: e.title }),
                e.meet && h("a", { class: "chip tone-info", href: e.meet, text: "Meet" }),
              ),
            ),
          )
        : h("div", { class: "row muted", text: "Nothing scheduled" }),
    );
  return [group("Today", shaped.today), group("Tomorrow", shaped.tomorrow)];
}

export function renderMail(rows, now = new Date()) {
  if (!rows.length) return empty("Inbox zero for starred/important unread (last 3 days).");
  return h(
    "ul",
    { class: "rows" },
    rows.map((m) =>
      h(
        "li",
        { class: "row mail" },
        h(
          "a",
          { class: "grow mail-link", href: m.url },
          h(
            "span",
            { class: "mail-top" },
            m.starred && h("span", { class: "star", "aria-label": "starred", text: "★" }),
            h("span", { class: "from", text: m.from }),
            m.count > 1 && h("span", { class: "num muted", text: `(${m.count})` }),
            h("span", { class: "spacer" }),
            h("span", { class: "num muted small", text: relativeTime(m.date, now) }),
          ),
          h("span", { class: "subject", text: m.subject }),
          h("span", { class: "snippet", text: m.snippet }),
        ),
      ),
    ),
  );
}

/** todos = todosDue(...); onToggle(todo, done) -> Promise */
export function renderTodos(todos, onToggle) {
  if (!todos.length) return empty("No todos due in the next 2 days.");
  return h(
    "ul",
    { class: "rows" },
    todos.map((t) => {
      const status = h("span", { class: "row-status", "aria-live": "polite" });
      const box = h("input", { type: "checkbox", id: `todo-${t.row}`, "aria-describedby": `todo-${t.row}-due` });
      box.checked = t.done;
      const li = h(
        "li",
        { class: "row todo" },
        box,
        h("label", { for: `todo-${t.row}`, class: "grow", text: t.todo }),
        t.project && h("span", { class: "tag", text: t.project }),
        h("span", { id: `todo-${t.row}-due`, class: `num due ${t.overdue ? "tone-text-bad" : t.diff === 0 ? "tone-text-warn" : "muted"}`, text: t.when }),
        status,
      );
      box.addEventListener("change", async () => {
        const want = box.checked;
        box.disabled = true;
        replace(status);
        try {
          await onToggle(t, want);
          t.done = want;
          li.classList.toggle("is-done", want);
        } catch (err) {
          box.checked = !want;
          replace(status, errorCard(err));
        } finally {
          box.disabled = false;
        }
      });
      return li;
    }),
  );
}

export { chip };
