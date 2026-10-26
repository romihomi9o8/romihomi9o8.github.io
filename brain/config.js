// Public configuration for the Second Brain dashboard.
// Nothing here is secret: an OAuth *client ID* is meant to be public, and the
// sheet/folder IDs are useless without signing in as an account that can read them.
// See brain/README.md for how to create the OAuth client.

export const GOOGLE_CLIENT_ID = "REPLACE_WITH_OAUTH_CLIENT_ID.apps.googleusercontent.com";

// "00 Brain/Brain Registry" Google Sheet (tabs: Projects, Team, Questions, Todos, Links, Notes).
export const REGISTRY_SHEET_ID = "1KeN9EG_x1Sv9zfmB7oOhZXvEu4Fq3LtMuhTHvMMY4xY";

// "Budget — Plaid Sync" Google Sheet.
export const BUDGET_SHEET_ID = "1T1ezaJtzAt94vk0cJWyOujteV0Yt4XfZ2l2QGBJCvis";

// "00 Brain/Sessions" Drive folder.
export const SESSIONS_FOLDER_ID = "1-ag8oaNPBQe5A-xF_SyCYkCnoVc3b5xx";

export const GITHUB_USER = "romihomi9o8";

export const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

/** True when a config value still holds its REPLACE_WITH_ placeholder (or is empty). */
export function isPlaceholder(value) {
  return !value || String(value).includes("REPLACE_WITH_");
}
