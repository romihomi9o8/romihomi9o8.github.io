# romihomi9o8.github.io

This repo holds the code and docs for Roman's Second Brain: the claude.ai artifact dashboards (`dashboards/`) and the daily rollup that feeds them. The site root is reserved for a future personal website. The old `/brain/` GitHub Pages app was retired on 2026-10-27; it is in git history.

- **Start here:**
  - The brain's rules live in the Google Doc "START HERE" in Drive `00 Brain`. Find it by title; its ID changes when it is rebuilt.
  - Design: `docs/superpowers/specs/2026-10-27-brain-visibility-design.md` (and the original `2026-10-26-second-brain-design.md`).
  - Plan: `docs/superpowers/plans/2026-10-26-second-brain-plan.md`.
  - Routine: `docs/routines/brain-rollup.md`.
- **Picking up unfinished work:** `docs/handoff/local-session.md`.
- **Codex tasks for the Mac:** `docs/codex/`.
- **Never commit private data.** The repo is public. Dashboards load all data at view time from Drive; published HTML, recipes and fixtures hold no personal values.
- **In Drive:**
  - Never trash, share, or send on Roman's behalf without an explicit yes.
  - Log every Drive move in the Move Manifest sheet.
- **Find system files by title, not ID.** Generated files (Brain Registry, START HERE, Sessions Index, feeds, Status docs) are regenerated and get new IDs. Folder IDs are stable:
  - `00 Brain`: `1NFxaaIKd6R6HOf-WdNur7pjL-v_DayGr`
  - `Sessions`: `1-ag8oaNPBQe5A-xF_SyCYkCnoVc3b5xx`
  - `Feeds`: `1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h`
  - `Inbox`: `1ZB_ajkEgJ2aF7yltQHSY_uSmM-zymNSj`
  - `Teams`: `1wIj4vaxH_e818KIAxcLCwkwc0_3RYbXk`
  - `_history`: `19wrko3sHAHR-Ag7Ot-5Pk7ZusZO33wPa`

  To replace a generated file, create the new one, verify it, then move the old one to `_history`. Never edit in place.
- **Session logs** go in `00 Brain/Sessions`, titled `YYYY-MM-DD <project> <claude|codex> <slug>`. They start with this header block, which is the only part the rollup parses:
  ```
  Owner: <persona slug>
  Project: <project slug>
  Roles: <roles from Registry → Roles>
  Subagents: <count — role (what each did)>
  Files: <one link per line>
  Questions: <Registry codes raised or answered>
  Changes: <Inbox change-request titles, if any>
  ```
- **Registry changes** go through a change-request Doc in `00 Brain/Inbox` (target tab, action add/update/archive, key, fields). The rollup applies them. Don't edit the Registry directly.
- **Dashboards:**
  - **Feed contract:** `dashboards/feeds.schema.md`. **Per-feed recipes:** `dashboards/recipes/`.
  - **Build:** `node dashboards/build.mjs [name] [--preview]`. Publish `dashboards/dist/<name>.html` to its existing artifact URL; the links are in the Registry Links tab, kind `dashboard`.
  - **Test:** `node --test "tests/dashboards/*.test.mjs"`.
