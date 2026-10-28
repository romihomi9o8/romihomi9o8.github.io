// Validate a feed against dashboards/feeds.schema.md before the rollup uploads it.
// Usage: node dashboards/kit/validate.mjs <feed.json> [...more]   (exit 1 on any error)
import { readFileSync } from "node:fs";

export const DOMAIN_FEEDS = ["finance", "chord", "desk", "writing", "health"];
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isArr = Array.isArray;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isDay = (v) => v === "" || v == null || /^\d{4}-\d{2}-\d{2}$/.test(v);
const isUrl = (v) => v === "" || v == null || /^https:\/\//.test(v);

export function validateFeed(f) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };
  need(isObj(f), "feed must be an object");
  if (!isObj(f)) return errs;
  need(typeof f.feed === "string", "feed: missing name");
  need(!isNaN(Date.parse(f.generated_at)) && /T.*Z$/.test(f.generated_at || ""), "generated_at: must be a UTC ISO timestamp");

  const checkQuestions = (qs, at) => {
    need(isArr(qs), `${at}: must be an array`);
    (qs || []).forEach((q, i) => {
      need(typeof q.code === "string" && q.code, `${at}[${i}].code missing`);
      need(typeof q.question === "string" && q.question, `${at}[${i}].question missing`);
      need(isArr(q.options), `${at}[${i}].options must be an array`);
      need(isDay(q.default_date), `${at}[${i}].default_date must be YYYY-MM-DD or ""`);
    });
  };
  const checkSessions = (ss, at) => {
    need(isArr(ss), `${at}: must be an array`);
    (ss || []).forEach((s, i) => {
      need(isDay(s.date) && s.date, `${at}[${i}].date must be YYYY-MM-DD`);
      need(isUrl(s.url), `${at}[${i}].url must be https`);
      need(s.roles == null || isArr(s.roles), `${at}[${i}].roles must be an array`);
    });
    for (let i = 1; i < (ss || []).length; i++) need(ss[i - 1].date >= ss[i].date, `${at}: must be newest first`);
  };
  const checkLinks = (ls, at) => {
    need(isArr(ls), `${at}: must be an array`);
    (ls || []).forEach((l, i) => need(isUrl(l.url) && l.url, `${at}[${i}].url must be https`));
  };

  if (DOMAIN_FEEDS.includes(f.feed)) {
    need(isObj(f.domain) && typeof f.domain.name === "string", "domain.name missing");
    need(isArr(f.owners), "owners must be an array");
    need(isArr(f.projects), "projects must be an array");
    need(isArr(f.roles), "roles must be an array");
    checkQuestions(f.questions, "questions");
    checkSessions(f.sessions, "sessions");
    checkLinks(f.files, "files");
    checkLinks(f.artifacts, "artifacts");
    need(isObj(f.panels), "panels must be an object");
    if (f.feed === "finance" && isObj(f.panels)) {
      const p = f.panels;
      need(isObj(p.kpis), "panels.kpis missing");
      for (const k of ["spent", "budget", "left", "cash", "investments", "net_worth"]) {
        need(isObj(p.kpis) && (p.kpis[k] == null || isNum(p.kpis[k])), `panels.kpis.${k} must be a number (no "$")`);
      }
      need(isArr(p.categories), "panels.categories must be an array");
      (p.categories || []).forEach((c, i) => need(isNum(c.target) && isNum(c.actual), `panels.categories[${i}] target/actual must be numbers`));
      need(isArr(p.trend), "panels.trend must be an array");
      need(isArr(p.treasury), "panels.treasury must be an array");
    }
  } else if (f.feed === "hq") {
    need(isArr(f.domains), "domains must be an array");
    (f.domains || []).forEach((d, i) => need(isUrl(d.dashboard_url), `domains[${i}].dashboard_url must be https`));
    need(isArr(f.areas), "areas must be an array");
    checkQuestions(f.waiting, "waiting");
    checkSessions(f.sessions_24h, "sessions_24h");
    need(isArr(f.rosters), "rosters must be an array");
  } else if (f.feed === "sessions") {
    checkSessions(f.sessions, "sessions");
  } else {
    errs.push(`unknown feed "${f.feed}"`);
  }
  return errs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let bad = 0;
  for (const path of process.argv.slice(2)) {
    let errs;
    try {
      errs = validateFeed(JSON.parse(readFileSync(path, "utf8")));
    } catch (e) {
      errs = [`not valid JSON: ${e.message}`];
    }
    if (errs.length) { bad++; console.error(`✗ ${path}\n  - ${errs.join("\n  - ")}`); }
    else console.log(`✓ ${path}`);
  }
  process.exit(bad ? 1 : 0);
}
