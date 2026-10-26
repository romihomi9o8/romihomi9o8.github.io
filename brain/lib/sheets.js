import { qs } from "./api.js";
import { REGISTRY_TABS } from "./shape.js";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/** values:batchGet over the Registry tabs (header row 1). */
export function getRegistry(fetchJson, sheetId) {
  const ranges = REGISTRY_TABS.map((t) => `${t}!A1:Z`);
  return fetchJson(`${BASE}/${encodeURIComponent(sheetId)}/values:batchGet${qs({ ranges, majorDimension: "ROWS" })}`);
}

/** Write one row-contiguous range (values.update). */
export function updateRange(fetchJson, sheetId, range, values) {
  return fetchJson(
    `${BASE}/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}${qs({ valueInputOption: "USER_ENTERED" })}`,
    { method: "PUT", body: { range, majorDimension: "ROWS", values } },
  );
}

/** Write several single cells at once ({range, value}[]) via values:batchUpdate. */
export function updateCells(fetchJson, sheetId, cells) {
  return fetchJson(`${BASE}/${encodeURIComponent(sheetId)}/values:batchUpdate`, {
    method: "POST",
    body: {
      valueInputOption: "USER_ENTERED",
      data: cells.map((c) => ({ range: c.range, majorDimension: "ROWS", values: [[c.value]] })),
    },
  });
}

/** Spreadsheet title + tab names. */
export async function getSheetMeta(fetchJson, sheetId) {
  const meta = await fetchJson(
    `${BASE}/${encodeURIComponent(sheetId)}${qs({ fields: "properties.title,sheets.properties(title,index)" })}`,
  );
  return {
    title: (meta.properties && meta.properties.title) || "",
    tabs: (meta.sheets || [])
      .map((s) => s.properties)
      .sort((a, b) => a.index - b.index)
      .map((p) => p.title),
  };
}

export function getValues(fetchJson, sheetId, range) {
  return fetchJson(`${BASE}/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`);
}

/** Quote a tab name for A1 notation. */
export function quoteTab(title) {
  return `'${String(title).replace(/'/g, "''")}'`;
}
