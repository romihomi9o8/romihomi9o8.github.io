# Recipe: `desk` feed (Agentic Desk, project slug `bullseye`)

Writes `desk.json` into Drive `00 Brain/Feeds` (folder `1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h`). If a `desk.json` already exists there, the routine replaces it per feeds.schema.md. Validate with `node dashboards/kit/validate.mjs` before upload. Guardrail: the team builds code, tests and runbooks and never places trades.

## Sources

1. Registry (Projects, Questions, Links tabs), rows where `project` is `bullseye` (prefix `DESK`). Owner slug `kenji`.
2. Drive folder `1 Projects/Bullseye`, id `1SR7lo-IxJmJhYru2L20NprugGnWGIfCF`, and its `_CONTEXT` doc (purpose, state, key links, next step).
3. Sessions folder `1-ag8oaNPBQe5A-xF_SyCYkCnoVc3b5xx`: docs titled `YYYY-MM-DD bullseye <tool> <slug>` (also match the old name `agentic-desk`).
4. Local repo, read-only: `~/Projects/Agentic Desk`. Files: `CLAUDE.md` (standing rules), `RESUME.md`, the newest `STATE-*.md` (health table, gaps, waiting list), the newest `PLAN-*.md` (plan of record, phases), `trading-system/README.md`, `trading-system/tests/` (test layout), `trading-system/docs/memos/` (newest memos), `trading-system/data/loop/plan_decisions.jsonl` (ruling log, read the last lines). The repo is not a git checkout at the time of writing; if it becomes one, `git log --oneline -10` is allowed (read-only). **The cloud rollup can't reach this repo.** There, carry `panels.workstreams` and the test counts forward from the previous `desk.json` unchanged. Only a session on Roman's Mac refreshes them, by writing a new `desk.json`.

## Extraction

- `domain`: status from the Registry project row. `summary` from the newest STATE doc plus `_CONTEXT`. `next_step` from the PLAN's current phase or `_CONTEXT`. `waiting` from the STATE doc's waiting-on-Roman list, or "".
- `owners`, `roles`: copy the Kenji roster from the Registry Roles tab. Set `last_active` and `recent` only when a session doc shows activity.
- `projects`: the Registry row, with `drive_folder_url` and `repo_url` (empty if unknown).
- `questions`: Registry Questions rows for `bullseye` with status `open` and no `answer`.
- `sessions`: newest 15 docs from the Sessions folder matching the project, newest first.
- `files`: max 12 from the Bullseye folder, `_CONTEXT` first, then newest or most important.
- `artifacts`: Registry Links rows for `bullseye`, skipping archived. The app artifact "Agentic Desk App" is listed here.

## `panels`

- `guardrail`: the fixed string "Research and engineering only. Never places trades."
- `app_url`: the URL of the "Agentic Desk App" Registry link.
- `workstreams`: one entry per row of the STATE doc's "What exists and works" table, plus pipeline, test suite and plan rows. Fields:
  - `name`: the area name.
  - `status`: one word the page maps to a column (active or in progress to Building; waiting or review to Waiting; blocked to Blocked; done; paused).
  - `tests`: a count only when a source states one (STATE health table or a test summary in RESUME), with the date of that source. Never run the tests. Empty string when none.
  - `note`: one sentence from the STATE gaps list or the newest ruling-log entry.

Never copy dollar amounts, holdings, tickers or account details into `panels`. Counts and states only.
