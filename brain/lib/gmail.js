import { qs } from "./api.js";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
export const MAIL_QUERY = "is:unread (is:important OR is:starred) newer_than:3d";

/** Up to `max` matching threads, each with From/Subject metadata. */
export async function listImportantUnread(fetchJson, max = 10) {
  const list = await fetchJson(`${BASE}/threads${qs({ q: MAIL_QUERY, maxResults: max })}`);
  const ids = (list.threads || []).map((t) => t.id);
  return Promise.all(
    ids.map((id) =>
      fetchJson(`${BASE}/threads/${encodeURIComponent(id)}${qs({ format: "metadata", metadataHeaders: ["From", "Subject"] })}`),
    ),
  );
}
