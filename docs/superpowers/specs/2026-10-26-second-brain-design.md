# Second Brain — Design Spec

Date: 2026-10-26 · Owner: Roman · PM persona: Sam

## 1. Goal

One system where every project, file, link, artifact, session, email and event is findable in one place, and every Claude/Codex session starts with the right context.

Success = after one day of work:
- Google Drive is in PARA, with nothing lost and every move logged and reversible.
- SSD = working files only; archival pictures/docs live in Drive, verified no loss / no duplicates.
- `romihomi9o8.github.io/brain/` dashboard shows Projects, Today, Search/Links, Budget, Needs-you questions.
- Any new Claude or Codex session can read `START HERE` and be productive.
- Iris Hub migrated and its sync shut off.

## 2. Decisions (from Q&A)

| Topic | Decision |
|---|---|
| Hub | GitHub Pages, this repo, at `/brain/` (root kept free for the future Personal Website) |
| Private data | Google sign-in in the browser; nothing private committed |
| Drive layout | PARA |
| Drive autonomy | Full, but every move logged to a manifest (resumable + undoable); nothing trashed |
| SSD | SSD = working items; archival pictures/docs → Drive; verify no loss / no dupes |
| Sources | Claude artifacts + sessions, GitHub repos, Gmail, Calendar |
| Iris Hub | Migrate data, stop sync, archive |
| Team + Questions | Keep agent owners and the Needs-you questions with defaults |
| Style | Minimal cards + dense command-center density |
| Machine | Mac + Codex CLI; Codex takes the larger share |

## 3. Drive structure (PARA)

```
My Drive/
  00 Brain/                      ← system files (read by Claude, Codex, dashboard)
    START HERE                   (Google Doc: brain index for every session)
    Brain Registry               (Google Sheet: tabs below)
    Move Manifest                (Google Sheet: every Drive move)
    Sessions/                    (one small Doc per Claude/Codex session)
    SSD Sync Reports/            (Codex verification reports)
  1 Projects/
    Chord/  Bullseye/  Substack/  Leland Ventures/  Book/  Personal Website/
      each has: _CONTEXT (Doc), plus project files
  2 Areas/
    Health/  Money/  Career & Consulting/  Home & Apartment/  Identity & Admin/  Self-care/
  3 Resources/
    Casebooks & Cases/  Reference/  Templates/
  4 Archive/
    Iris (retired)/  Loopline/  Study OS/  Old Misc/  Photos/<year>/
```

- Health and Money are Areas (ongoing), but still appear on the Projects board.
- Existing `Second Brain`, `THINGS TO ORGANIZE`, `Misc` are emptied into the tree, then moved to `4 Archive/` (never trashed).
- Duplicates (e.g. `Casebooks NEW` vs `Casebooks NEW (from Career 2)`, the two `Iris Hub` sheets) are merged by moving the extra copy to `4 Archive/_duplicates/` and logging it, never deleting.

## 4. Brain Registry (Google Sheet, single source of truth)

| Tab | Columns |
|---|---|
| Projects | slug, name, type (project/area), status, owner, next_step, waiting, drive_folder_url, repo_url, prefix, sort |
| Team | slug, name, role |
| Questions | code, project, question, options, default, default_date, answer, status, blocks |
| Todos | todo, due, project, source, done |
| Links | title, url, kind (artifact/repo/doc/site/other), project, updated |
| Notes | date, title, body |

Seeded from Iris Hub `_state` (projects, questions, team) plus the 43 artifacts in Links.

Dashboard reads all tabs and writes only `Questions.answer/status` and `Todos.done`.

## 5. Move Manifest

Columns: `file_id, title, old_parent_id, old_path, new_parent_id, new_path, reason, status (planned/done/failed/reverted), time`.

- Resume: rerun rows where `status != done`.
- Undo: move `file_id` back to `old_parent_id`.
- Check: count files per old top-level folder before = count found under new paths after.

## 6. Claude / Codex integration

- **START HERE** doc: what the system is, PARA map with folder links, Registry link, conventions (naming, where things go), how to log a session, project list with `_CONTEXT` links.
- **`_CONTEXT` doc per project**: one-paragraph purpose, status, key links (Drive, repo, artifacts), open questions, owner persona. Every session on that project reads it first and updates it at the end.
- **Session log**: each session creates `00 Brain/Sessions/YYYY-MM-DD <project> <tool> <slug>` (a Doc: what was done, links to PRs/artifacts/files, next step). These are append-only files, so they work with the Drive connector, which can create files but not append rows. The dashboard lists this folder.
- A repo `CLAUDE.md` / `AGENTS.md` in each project repo points to START HERE and the `_CONTEXT` doc.

## 7. SSD ↔ Drive (Codex on Mac)

1. **Inventory**: walk the SSD, write a CSV with path, size, mtime and sha256 for each file.
2. **Classify**:
   - Archival goes to Drive: photos, videos, PDFs and docs not modified in 90+ days, plus anything under folders named like Photos or Documents.
   - Working files stay on the SSD: code repos, files modified in the last 90 days, and active project folders.
   - Rules are kept in `rules.yaml` and shown to Roman before any copy.
3. **Copy**: use Google Drive for Desktop, with destination `My Drive/4 Archive/Photos/<year>` or `3 Resources/...`. Copy only. The SSD original is deleted only after hash verification, and only with Roman's yes.
4. **Verify**:
   - Re-hash the Drive-for-Desktop local mirror.
   - Report missing files (in the inventory, not in Drive) and duplicates (same sha256 in more than one place, across SSD and Drive).
   - Upload the report to `00 Brain/SSD Sync Reports/`.
5. Re-runnable and idempotent: files are skipped when the same hash already exists at the destination.

## 8. Dashboard (`/brain/`)

- **Stack**: static HTML, CSS and vanilla JS modules. No build step, so GitHub Pages serves it directly.
- **Auth**: Google Identity Services token client, browser-only. The OAuth client ID is public config in `brain/config.js`. Scopes:
  - `drive.readonly`
  - `spreadsheets` (for answers and todos)
  - `calendar.readonly`
  - `gmail.readonly`
- The app stays in Google "Testing" mode with Roman as the only test user. No verification is needed.
- **Panels**:
  - **Today**: calendar events for today and tomorrow, starred or important unread Gmail threads, Todos due.
  - **Needs you**: open Questions with options. Answering writes to the Registry, and the default is shown with its date.
  - **Projects board**: a card per project/area with owner, status, next step, waiting, and links (Drive, repo, artifacts, latest session).
  - **Search / Links**: a filter box over Links plus a Drive full-text search.
  - **Budget**: summary pulled from `Budget — Plaid Sync`. Exact ranges are confirmed when the sheet is read on build day.
  - **Recent sessions**: the latest 10 files in `Sessions/`.
  - **Repos**: from the GitHub public API for `romihomi9o8`.
- **Signed-out state**: shows only a "Sign in with Google" button and no data.
- **Style**:
  - Light and dark themes, a compact card grid, a 3-column command-center layout on desktop, and a single column on mobile.
  - Monospace for numbers, and a status color per project.

## 9. Iris Hub retirement

1. Snapshot: copy Iris Hub to `4 Archive/Iris (retired)/Iris Hub snapshot 2026-10-26`.
2. Migrate `_state` rows into the Registry.
3. Stop the sync. Roman disables the Apps Script time trigger (Extensions → Apps Script → Triggers), because the Drive connector can't reach Apps Script. The `_log` must show no new rows after that.
4. Move both Iris Hub sheets to `4 Archive/Iris (retired)/`.

## 10. Security

- No tokens, emails or financial data are committed. The repo holds code and the public OAuth client ID only.
- The OAuth client is restricted to the origin `https://romihomi9o8.github.io`.
- Nothing in Drive is trashed or shared by this work.

## 11. Testing / verification

- **Drive**: compare manifest row counts, files-per-folder counts before and after, and spot-check 10 random file IDs.
- **SSD**: the verification report shows 0 missing files and lists duplicates for Roman to decide on.
- **Dashboard**:
  - Smoke test with Playwright in the signed-out state.
  - Unit tests for the pure data shapers (Registry rows → cards) with fixtures.
  - Manual signed-in check by Roman.

## 12. Work split

| Block | Owner |
|---|---|
| Drive PARA, manifest, moves, Registry, START HERE, `_CONTEXT` docs, Iris migration | Claude (cloud session) |
| SSD inventory, classify, sync, verify | Codex (Mac) |
| Dashboard implementation | Codex (Mac), from the plan; Claude reviews the PR |
| OAuth client, Apps Script trigger off, approving SSD deletions | Roman |

## 13. Out of scope (today)

- Personal Website content
- Writing to Gmail/Calendar
- Notion
- Automated scheduled syncs. The dashboard reads live data, so none are needed.
