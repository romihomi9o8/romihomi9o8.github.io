// Data sources. The live source talks to Google/GitHub; the demo source serves
// fake fixtures through the same interface so `?demo=1` exercises the real renderers.

import * as cfg from "../config.js";
import { createClient } from "./api.js";
import * as sheets from "./sheets.js";
import * as drive from "./drive.js";
import * as calendar from "./calendar.js";
import * as gmail from "./gmail.js";
import * as github from "./github.js";
import { parseRegistry, cellAddress, pickBudgetTab, filterLinks } from "./shape.js";
import * as demo from "./demo-data.js";

export class NotConfiguredError extends Error {
  constructor(setting) {
    super(`${setting} is not set in brain/config.js yet`);
    this.name = "NotConfiguredError";
    this.setting = setting;
  }
}

function need(name) {
  if (cfg.isPlaceholder(cfg[name])) throw new NotConfiguredError(name);
  return cfg[name];
}

export function liveSource({ getToken, onUnauthorized }) {
  const fetchJson = createClient({ getToken, onUnauthorized });
  return {
    demo: false,
    async registry() {
      return parseRegistry(await sheets.getRegistry(fetchJson, need("REGISTRY_SHEET_ID")));
    },
    events: (today) => calendar.listTodayTomorrow(fetchJson, today),
    threads: () => gmail.listImportantUnread(fetchJson, 10),
    sessionFiles: () => drive.listSessions(fetchJson, need("SESSIONS_FOLDER_ID")),
    async budget() {
      const id = need("BUDGET_SHEET_ID");
      const meta = await sheets.getSheetMeta(fetchJson, id);
      const tab = pickBudgetTab(meta.tabs);
      if (!tab) return { ...meta, tab: null, values: [], url: sheetUrl(id) };
      const res = await sheets.getValues(fetchJson, id, `${sheets.quoteTab(tab)}!A1:L40`);
      return { ...meta, tab, values: res.values || [], url: sheetUrl(id) };
    },
    repos: () => github.listRepos(fetchJson),
    searchDrive: (text) => drive.searchDrive(fetchJson, text),
    async answerQuestion(q, answer, headers) {
      const id = need("REGISTRY_SHEET_ID");
      const a = cellAddress("Questions", headers, "answer", q.row);
      const s = cellAddress("Questions", headers, "status", q.row);
      if (!a || !s) throw new Error("Questions tab is missing an answer/status column");
      return sheets.updateCells(fetchJson, id, [
        { range: a, value: answer },
        { range: s, value: "answered" },
      ]);
    },
    async setTodoDone(todo, done, headers) {
      const id = need("REGISTRY_SHEET_ID");
      const cell = cellAddress("Todos", headers, "done", todo.row);
      if (!cell) throw new Error("Todos tab is missing a done column");
      return sheets.updateRange(fetchJson, id, cell, [[done ? "TRUE" : "FALSE"]]);
    },
    registryUrl: () => (cfg.isPlaceholder(cfg.REGISTRY_SHEET_ID) ? "" : sheetUrl(cfg.REGISTRY_SHEET_ID)),
    sessionsUrl: () =>
      cfg.isPlaceholder(cfg.SESSIONS_FOLDER_ID) ? "" : `https://drive.google.com/drive/folders/${cfg.SESSIONS_FOLDER_ID}`,
  };
}

function sheetUrl(id) {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** In-memory demo source; writes mutate the fake registry so the UI round-trips. */
export function demoSource(today = new Date()) {
  const reg = demo.demoRegistryResponse(today);
  const tab = (name) => reg.valueRanges.find((v) => v.range.startsWith(`${name}!`)).values;
  const setCell = (name, headers, header, row, value) => {
    const values = tab(name);
    const col = headers.indexOf(header);
    while (values[row - 1].length <= col) values[row - 1].push("");
    values[row - 1][col] = value;
  };
  return {
    demo: true,
    async registry() {
      await delay(80);
      return parseRegistry(structuredClone(reg));
    },
    events: async () => (await delay(60), demo.demoEvents(today)),
    threads: async () => (await delay(120), demo.demoThreads(new Date())),
    sessionFiles: async () => (await delay(90), demo.demoSessionFiles(today)),
    budget: async () => {
      await delay(150);
      const b = demo.demoBudget();
      return { title: b.title, tabs: b.tabs, tab: pickBudgetTab(b.tabs), values: b.values, url: "" };
    },
    repos: async () => (await delay(70), demo.demoRepos(new Date())),
    async searchDrive(text) {
      await delay(200);
      const links = parseRegistry(structuredClone(reg)).links;
      return filterLinks(links, text).map((l, i) => ({
        id: `demo-${i}`,
        name: `${l.title} (demo Drive hit)`,
        mimeType: "application/vnd.google-apps.document",
        webViewLink: l.url,
        modifiedTime: new Date().toISOString(),
      }));
    },
    async answerQuestion(q, answer, headers) {
      await delay(150);
      setCell("Questions", headers, "answer", q.row, answer);
      setCell("Questions", headers, "status", q.row, "answered");
    },
    async setTodoDone(todo, done, headers) {
      await delay(120);
      setCell("Todos", headers, "done", todo.row, done ? "TRUE" : "FALSE");
    },
    registryUrl: () => "",
    sessionsUrl: () => "",
  };
}
