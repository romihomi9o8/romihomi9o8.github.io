import { el, panel, chip, empty, money, usedFraction, errorBlock, getMcp } from "../kit/kit.js";

const num = (v) => (v == null || v === "" || isNaN(Number(v)) ? null : Number(v));
const pct = (f) => `${Math.round(f * 100)}%`;
const signed = (n, opts) => (n == null ? "—" : `${n > 0 ? "+" : ""}${money(n, opts)}`);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Spent vs month-elapsed pace: ahead means spending faster than the month passes. */
export function paceTone(spent, budget, elapsed) {
  const f = usedFraction(spent, budget);
  if (f == null || elapsed == null) return { tone: "muted", label: "no pace" };
  if (f > elapsed + 0.03) return { tone: "bad", label: "ahead of pace" };
  if (f < elapsed - 0.15) return { tone: "ok", label: "under pace" };
  return { tone: "ok", label: "on pace" };
}

function tile(label, value, sub, tone) {
  return el("div", { class: "tile" },
    el("span", { class: "label", text: label }),
    el("b", { class: tone ? `tone-${tone}` : "", text: value }),
    sub ? el("span", { class: "muted", text: sub }) : null);
}

export function kpiPanel(p) {
  const k = (p && p.kpis) || {};
  const el0 = num(p && p.month_elapsed);
  const pace = paceTone(k.spent, k.budget, el0);
  const f = usedFraction(k.spent, k.budget);
  return panel("This month", { wide: true, meta: p && p.month ? `${p.month}${el0 != null ? ` · ${pct(el0)} elapsed` : ""}` : "" },
    el("div", { class: "pace" },
      el("div", { class: "pace-line" },
        el("span", {}, el("b", { class: "mono big", text: money(k.spent) }), el("span", { class: "muted", text: ` of ${money(k.budget)} budget` })),
        chip(pace.label, pace.tone)),
      el("div", { class: `bar pace-bar${f != null && f > 1 ? " over" : ""}`, role: "img", "aria-label": `Spent ${f != null ? pct(f) : "n/a"} of budget, ${el0 != null ? pct(el0) : "n/a"} of month elapsed` },
        el("i", { style: `width:${Math.min(100, (f || 0) * 100)}%` }),
        el0 != null ? el("u", { class: "tick", style: `left:${el0 * 100}%`, title: "Month elapsed" }) : null)),
    el("div", { class: "tiles" },
      tile("Left to spend", money(k.left), "", k.left < 0 ? "bad" : ""),
      tile("Discretionary left", money(k.discretionary_left), "", k.discretionary_left < 0 ? "bad" : ""),
      tile("Cash", money(k.cash)),
      tile("Investments", money(k.investments)),
      tile("Net worth", money(k.net_worth), p && p.accounts_synced ? `synced ${p.accounts_synced}` : "")),
    p && p.income ? el("p", { class: "muted fine", text: `Income this month: ${money(p.income.actual)} actual vs ${money(p.income.planned)} planned.` }) : null);
}

export function categoriesPanel(p) {
  const cats = (p && p.categories) || [];
  const sections = [...new Set(cats.map((c) => c.section))];
  return panel("Budget vs actual", { meta: cats.length ? "by category" : "" },
    cats.length
      ? sections.map((s) => {
          const rows = cats.filter((c) => c.section === s && (num(c.target) || num(c.actual)));
          const t = rows.reduce((a, c) => a + (num(c.target) || 0), 0);
          const a = rows.reduce((x, c) => x + (num(c.actual) || 0), 0);
          return el("div", { class: "cat-sec" },
            el("div", { class: "cat-head" }, el("h3", { text: s }), el("span", { class: "mono muted", text: `${money(a)} / ${money(t)}` })),
            rows.map((c) => {
              const tg = num(c.target) || 0, ac = num(c.actual) || 0;
              const over = ac > tg;
              const f = usedFraction(ac, tg);
              return el("div", { class: "cat-row" },
                el("div", { class: "cat-line" },
                  el("span", { text: c.category }),
                  el("span", { class: `mono${over ? " tone-bad" : " muted"}`, text: `${money(ac)} / ${money(tg)}` })),
                el("div", { class: `bar${over ? " over" : ""}`, role: "img", "aria-label": `${c.category}: ${money(ac)} of ${money(tg)}${over ? ", over budget" : ""}` },
                  el("i", { style: `width:${over ? 100 : Math.min(100, (f || 0) * 100)}%` })));
            }));
        })
      : empty("No budget categories in this feed."));
}

const SERIES = [
  ["fixed", "Fixed", "var(--info)"],
  ["recurring", "Recurring", "var(--muted)"],
  ["subscriptions", "Subscriptions", "var(--warn)"],
  ["discretionary", "Discretionary", "var(--accent)"],
];

export function trendPanel(p) {
  const rows = (p && p.trend) || [];
  if (!rows.length) return panel("6-month cash flow", {}, empty("No trend data in this feed."));
  const W = 420, H = 230, L = 40, R = 8, T = 16, B = 28;
  const totals = rows.map((r) => SERIES.reduce((a, [k]) => a + (num(r[k]) || 0), 0));
  const step = Math.max(500, Math.pow(10, Math.floor(Math.log10(Math.max(...totals, 1)))) / 2);
  const max = Math.ceil(Math.max(...totals, 1) / step) * step;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const slot = (W - L - R) / rows.length, bw = slot * 0.6;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Monthly spending by section, stacked" font-family="inherit">`;
  for (let v = 0; v <= max; v += step) {
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1" fill="none"/>`;
    s += `<text x="${L - 5}" y="${y(v) + 3.5}" text-anchor="end" font-size="10" fill="var(--text-3)">${v >= 1000 ? `${v / 1000}k` : v}</text>`;
  }
  rows.forEach((r, i) => {
    const x = L + slot * i + (slot - bw) / 2;
    let acc = 0;
    SERIES.forEach(([k, name, color]) => {
      const v = num(r[k]) || 0;
      if (v <= 0) return;
      s += `<rect x="${x}" y="${y(acc + v)}" width="${bw}" height="${y(acc) - y(acc + v)}" fill="${color}"><title>${esc(r.month)} ${name}: ${money(v)}</title></rect>`;
      acc += v;
    });
    s += `<text x="${x + bw / 2}" y="${y(acc) - 4}" text-anchor="middle" font-size="9.5" fill="var(--text-2)">${money(acc)}</text>`;
    s += `<text x="${x + bw / 2}" y="${H - 10}" text-anchor="middle" font-size="10" fill="var(--text-3)">${esc(String(r.month).slice(2))}</text>`;
  });
  s += `</svg>`;
  const chart = el("div", { class: "chart" });
  chart.innerHTML = s;
  return panel("6-month cash flow", { meta: "spend by section" },
    chart,
    el("ul", { class: "legend" }, SERIES.map(([, name, color]) =>
      el("li", null, el("i", { style: `background:${color}` }), name))));
}

export function treasuryPanel(p) {
  const rows = (p && p.treasury) || [];
  return panel("Treasury", { meta: "roles and gaps" },
    rows.length
      ? el("div", { class: "table-wrap" }, el("table", null,
          el("thead", null, el("tr", null, ["Role", "Account", "Balance", "Target", "Gap", "Action"].map((h, i) => el("th", { class: i > 1 && i < 5 ? "num" : "", text: h })))),
          el("tbody", null, rows.map((r) => el("tr", null,
            el("td", null, chip(r.role, "info")),
            el("td", { text: r.account }),
            el("td", { class: "num", text: money(r.balance) }),
            el("td", { class: "num", text: r.target == null ? "—" : money(r.target) }),
            el("td", { class: `num${num(r.gap) < 0 ? " tone-bad" : ""}`, text: r.gap == null ? "—" : signed(r.gap) }),
            el("td", { text: r.action || "" }))))))
      : empty("No treasury roles in this feed."));
}

export function subscriptionsPanel(p) {
  const rows = (p && p.subscriptions_review) || [];
  const total = rows.reduce((a, r) => a + (num(r.monthly) || 0), 0);
  return panel("Subscriptions to review", { meta: rows.length ? `${rows.length} · ${money(total, { cents: true })}/mo` : "clear" },
    rows.length
      ? el("ul", { class: "subs" }, rows.map((r) => el("li", null,
          el("div", { class: "sub-line" }, el("strong", { text: r.service }), el("span", { class: "mono", text: money(r.monthly, { cents: true }) })),
          el("div", { class: "sub-line" }, el("span", { class: "muted", text: r.billing || "" }), chip(r.status)))))
      : empty("Every subscription is marked Keep."));
}

export function goalsPanel(p) {
  const goals = (p && p.goals) || [];
  return panel("Goals", { meta: goals.length ? `${goals.length}` : "" },
    goals.length
      ? el("ul", { class: "goals" }, goals.map((g) => {
          const t = num(g.target), c = num(g.current);
          const f = t ? Math.max(0, (c || 0) / t) : null;
          return el("li", null,
            el("div", { class: "cat-line" },
              el("strong", { text: g.name }),
              el("span", { class: "mono muted", text: t == null ? "target not set" : `${money(c)} / ${money(t)}` })),
            f != null ? el("div", { class: "bar", role: "img", "aria-label": `${g.name}: ${pct(f)}` }, el("i", { style: `width:${Math.min(100, f * 100)}%` })) : null,
            el("p", { class: "muted fine", text: [f != null ? pct(f) : "", g.due ? `due ${g.due}` : ""].filter(Boolean).join(" · ") }));
        }))
      : empty("No goals in this feed."));
}

/* ---------- Live investments (Robinhood, read-only) ---------- */

const RH = "Robinhood";
export const RH_TOOLS = ["get_accounts", "get_portfolio", "get_equity_positions", "get_equity_quotes"];

/** Newer of regular-hours and extended-hours last trade. */
export function livePrice(q) {
  const a = num(q.last_trade_price), b = num(q.last_non_reg_trade_price);
  const ta = Date.parse(q.venue_last_trade_time) || 0, tb = Date.parse(q.venue_last_non_reg_trade_time) || 0;
  return b != null && tb > ta ? b : a != null ? a : b;
}

const last4 = (n) => `••••${String(n).slice(-4)}`;
const qty = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 4 });
const tone = (n) => (n > 0 ? "tone-ok" : n < 0 ? "tone-bad" : "muted");

async function readRobinhood(mcp) {
  const call = async (tool, input) => (await mcp.callTool(RH, tool, input)).payload.data;
  const accts = (await call("get_accounts", {})).accounts || [];
  const per = await Promise.all(accts.map(async (a) => {
    const [pf, pos] = await Promise.all([
      call("get_portfolio", { account_number: a.account_number }),
      (async () => {
        let all = [], cursor;
        for (let i = 0; i < 5; i++) {
          const d = await call("get_equity_positions", cursor ? { account_number: a.account_number, cursor } : { account_number: a.account_number });
          all = all.concat(d.positions || []);
          cursor = d.next;
          if (!cursor) break;
        }
        return all;
      })(),
    ]);
    return { a, pf, pos };
  }));
  const symbols = [...new Set(per.flatMap((x) => x.pos.map((p) => p.symbol)))];
  const quotes = {};
  for (let i = 0; i < symbols.length; i += 20) {
    const d = await call("get_equity_quotes", { symbols: symbols.slice(i, i + 20) });
    for (const r of d.results || []) if (r.quote) quotes[r.quote.symbol] = r.quote;
  }
  return { per, quotes };
}

export function summarize({ per, quotes }) {
  const held = new Map();
  for (const x of per) for (const p of x.pos) {
    const h = held.get(p.symbol) || { symbol: p.symbol, qty: 0, cost: 0 };
    const q = num(p.quantity) || 0;
    h.qty += q; h.cost += q * (num(p.average_buy_price) || 0);
    held.set(p.symbol, h);
  }
  const rows = [...held.values()].map((h) => {
    const q = quotes[h.symbol];
    const price = q ? livePrice(q) : null;
    const prev = q ? num(q.adjusted_previous_close) : null;
    const value = price != null ? price * h.qty : null;
    const day = price != null && prev != null ? (price - prev) * h.qty : null;
    const dayPct = price != null && prev ? price / prev - 1 : null;
    return { ...h, price, value, day, dayPct };
  }).sort((a, b) => (b.value || 0) - (a.value || 0));
  const sum = (f) => per.reduce((a, x) => a + (num(f(x)) || 0), 0);
  const day = rows.reduce((a, r) => a + (r.day || 0), 0);
  const equity = rows.reduce((a, r) => a + (r.value || 0), 0);
  return { rows, total: sum((x) => x.pf.total_value), cash: sum((x) => x.pf.cash), day, dayPct: equity - day ? day / (equity - day) : null };
}

export function renderRobinhood(data) {
  const s = summarize(data);
  return [
    el("div", { class: "tiles" },
      tile("Portfolio value", money(s.total, { cents: true }), `${data.per.length} accounts`),
      tile("Day change", signed(s.day, { cents: true }), s.dayPct == null ? "" : `${s.dayPct > 0 ? "+" : ""}${(s.dayPct * 100).toFixed(2)}% on positions`, s.day > 0 ? "ok" : s.day < 0 ? "bad" : ""),
      tile("Cash", money(s.cash, { cents: true }))),
    s.rows.length
      ? el("div", { class: "table-wrap" }, el("table", null,
          el("thead", null, el("tr", null, ["Symbol", "Qty", "Price", "Value", "Day"].map((h, i) => el("th", { class: i ? "num" : "", text: h })))),
          el("tbody", null, s.rows.map((r) => el("tr", null,
            el("td", null, el("strong", { text: r.symbol })),
            el("td", { class: "num", text: qty(r.qty) }),
            el("td", { class: "num", text: r.price == null ? "—" : money(r.price, { cents: true }) }),
            el("td", { class: "num", text: r.value == null ? "—" : money(r.value, { cents: true }) }),
            el("td", { class: `num ${tone(r.day)}`, text: r.day == null ? "—" : `${signed(r.day, { cents: true })} (${r.dayPct > 0 ? "+" : ""}${(r.dayPct * 100).toFixed(2)}%)` }))))))
      : empty("No open equity positions."),
    el("ul", { class: "acct-list" }, data.per.map((x) =>
      el("li", null, el("span", { class: "mono", text: last4(x.a.account_number) }),
        el("span", { class: "muted", text: [x.a.brokerage_account_type, x.a.management_type === "managed" ? "managed" : ""].filter(Boolean).join(" · ") }),
        el("span", { class: "mono", text: money(num(x.pf.total_value), { cents: true }) })))),
  ];
}

export function liveInvestmentsPanel(mcp) {
  const body = el("div", { class: "live-body" }, el("p", { class: "loading", text: "Reading Robinhood…" }));
  const meta = el("span", { class: "panel-meta", text: "read-only" });
  const root = el("section", { class: "panel wide", id: "live-investments" },
    el("header", { class: "panel-head" }, el("h2", { text: "Live investments" }), meta),
    body,
    el("p", { class: "muted fine", text: "Data only. Not financial advice." }));
  const run = async () => {
    body.replaceChildren(el("p", { class: "loading", text: "Reading Robinhood…" }));
    if (!mcp) { body.replaceChildren(errorBlock({ code: "not_granted" }, { server: RH })); return; }
    try {
      const data = await readRobinhood(mcp);
      body.replaceChildren(...renderRobinhood(data));
      meta.textContent = `read-only · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    } catch (err) {
      if (err && err.retryable && !run.retried) { run.retried = true; setTimeout(run, Math.min(err.retryAfterMs || 1500, 10000)); return; }
      body.replaceChildren(errorBlock(err, { server: RH, onAsk: run }));
    }
  };
  run();
  return root;
}
