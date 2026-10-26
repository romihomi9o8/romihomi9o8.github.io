import { qs } from "./api.js";
import { driveQueryLiteral } from "./shape.js";

const BASE = "https://www.googleapis.com/drive/v3/files";
const FIELDS = "files(id,name,mimeType,webViewLink,createdTime,modifiedTime)";

/** Files in the Sessions folder, newest first. */
export async function listSessions(fetchJson, folderId, pageSize = 50) {
  const res = await fetchJson(
    BASE +
      qs({
        q: `'${driveQueryLiteral(folderId)}' in parents and trashed = false`,
        orderBy: "createdTime desc",
        pageSize,
        fields: FIELDS,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      }),
  );
  return res.files || [];
}

/** Drive full-text search. */
export async function searchDrive(fetchJson, text, pageSize = 15) {
  const res = await fetchJson(
    BASE +
      qs({
        q: `fullText contains '${driveQueryLiteral(text)}' and trashed = false`,
        pageSize,
        fields: FIELDS,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      }),
  );
  return res.files || [];
}
