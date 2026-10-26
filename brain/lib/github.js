import { GITHUB_USER } from "../config.js";

/** Public repos, most recently pushed first. No auth. */
export function listRepos(fetchJson, user = GITHUB_USER) {
  return fetchJson(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=pushed&per_page=12`, { auth: false });
}
