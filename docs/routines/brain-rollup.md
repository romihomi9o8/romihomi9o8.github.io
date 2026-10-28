# Brain rollup — routine prompt

This prompt runs as a scheduled cloud agent every day at 6:00 am America/Chicago, and on demand whenever Roman says "update the brain". It keeps Drive current, and the dashboards read what it writes. The repo is public, so this file and the recipes contain **no personal data**: they describe where data lives and how to shape it, never the values themselves.

## Setup

- Repo: `romihomi9o8/romihomi9o8.github.io`, branch `claude/google-drive-second-brain-gk8t5d`. Use it for `dashboards/kit/validate.mjs` and these recipes.
- Connector: Google Drive. Never trash, share, or send anything. Never write anywhere outside `00 Brain/`.
- Python: the cloud sandbox has several interpreters, and bare `python3` may lack openpyxl. Pick one that has it and use it throughout:
  ```
  PY=$(for p in python3.13 python3.12 python3; do command -v $p >/dev/null && $p -c "import openpyxl" 2>/dev/null && { command -v $p; break; }; done)
  ```
  If `PY` is still empty, run `python3 -m pip install -q openpyxl` and set `PY=python3`.
- Large exports: `download_file_content` with an xlsx `exportMimeType` returns base64 and is often saved to a tool-results file. Decode that file with `$PY`; don't paste it.
- **Read the Registry from an xlsx export**, not `read_file_content`. That view truncates long tabs (it showed 28 of 50 Links rows).
- **Write CSVs with Python's `csv` module** (`csv.writer(..., quoting=csv.QUOTE_MINIMAL)`), never by hand. Hand-quoted rows break on commas inside fields.
- **Rewrite every feed on every run**, even if its sources didn't change: carry the previous content forward and set a new `generated_at`. Dashboards mark a feed as stale after 30 hours, so a feed left in place looks broken.
- **Local-only sources:** a recipe source that lives on Roman's Mac (e.g. `~/Projects/...`) isn't reachable from the cloud. Carry that part forward from the previous feed unchanged, and refresh only the Drive and Registry parts.
- Stable folder IDs (file IDs change; always find files by title inside these folders):

| Folder | ID |
|---|---|
| 00 Brain | `1NFxaaIKd6R6HOf-WdNur7pjL-v_DayGr` |
| 00 Brain/Sessions | `1-ag8oaNPBQe5A-xF_SyCYkCnoVc3b5xx` |
| 00 Brain/Feeds | `1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h` |
| 00 Brain/Inbox | `1ZB_ajkEgJ2aF7yltQHSY_uSmM-zymNSj` |
| 00 Brain/Teams | `1wIj4vaxH_e818KIAxcLCwkwc0_3RYbXk` |
| 00 Brain/_history | `19wrko3sHAHR-Ag7Ot-5Pk7ZusZO33wPa` |

- To replace a generated file: first create the new file, then verify it (read it back), then move the old one into `_history` and rename it `<title> (YYYY-MM-DD HHMM)`. Never leave two current copies, and never delete.

## Steps

1. **Read the Registry.** Title `Brain Registry` in `00 Brain`, newest. Tabs: Projects, Team, Roles, Questions, Todos, Links, Notes.
2. **Apply Inbox change requests.** Each Doc in `Inbox/` describes one change: target tab, action (`add`, `update` or `archive`), key, and fields.
   - If there are any, export the Registry as `.xlsx` (`download_file_content` with exportMimeType xlsx). Apply the changes with openpyxl and re-upload it as `Brain Registry`, converted to a Google Sheet.
   - Verify the tab row counts: they should be unchanged except for the requests.
   - Archive the old Registry and each applied request into `_history`.
   - If a request is ambiguous, leave it in the Inbox and add it to the run log.
3. **Sessions.** List `Sessions/` (newest first). Parse each Doc's header block: Owner, Project, Roles, Subagents, Files, Questions, Changes.
   - Docs without a header: derive the project from the title (`YYYY-MM-DD <project> <tool> <slug>`) and the summary from the first lines.
   - Write `sessions.json`.
   - Regenerate the `Sessions Index` sheet (CSV → Google Sheet) with columns: date, owner, project, roles, subagents, summary, next step, open questions, log link.
4. **Domain feeds.** For each feed in `dashboards/recipes/`, follow its recipe, write `<feed>.json`, run `node dashboards/kit/validate.mjs <file>`, and upload it to `Feeds/` (contentMimeType `application/json`, `disableConversionToGoogleType: true`). Then archive the previous copy.
   - **A feed that fails validation is not uploaded.** Log the errors and keep yesterday's copy.
5. **HQ feed.** Follow `dashboards/recipes/hq.md` and build it from the domain feeds just written plus the Registry.
6. **Owner Status docs.** For each owner with activity since the last run, write `<Owner name> — Status` in `Teams/<Owner name>/`.
   - Sections: status, last 24 h, team (roles and what they did), waiting on Roman, next steps, key files.
   - Archive the previous doc.
7. **Run log.** Create `YYYY-MM-DD brain claude rollup` in `Sessions/` with a header block (Owner: sam, Roles: Brain-ops). Include feeds written, any validation failures, requests applied or left, and anything that looked wrong.

## Recipes

One file per feed in `dashboards/recipes/<feed>.md`: its sources (folder and file titles), the extraction steps, and the domain `panels` mapping. The dashboard builders wrote these on 2026-10-27, and anyone who changes a feed's shape updates its recipe in the same commit.
