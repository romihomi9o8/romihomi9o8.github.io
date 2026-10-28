# Recipe: `chord` feed (Chord HQ, project slug `chord`)

Writes `chord.json` into Drive `00 Brain/Feeds` (folder `1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h`). If a `chord.json` already exists there, the routine replaces it per feeds.schema.md. Validate with `node dashboards/kit/validate.mjs` before upload. Page: `dashboards/chord/`.

## Sources

1. Registry (Projects, Questions, Links tabs), rows where `project` is `chord` (prefix `CHORD`). Owner slug `rafael`.
2. Drive folder `1 Projects/Chord`, id `1xILuiZqQKVTcCGZgkKksJidTzv6shKVx`. Docs: `_CONTEXT` (purpose, current state, key links, next step), `Healthcare platform` (track doc) and `Healthcare platform — Chord build log` (dated progress lines and a Next list; the roadmap or its timeline may also be in a working plan artifact).
3. Sessions folder `1-ag8oaNPBQe5A-xF_SyCYkCnoVc3b5xx`: docs titled `YYYY-MM-DD chord <tool> <slug>`. Empty is fine.

## Extraction

- `domain`: status from the Registry project row. `summary` from `_CONTEXT` current state and the build log. `next_step` from `_CONTEXT` Next step, falling back to the build log's Next list; if a source says it is unknown, say so. `waiting` names the open ask codes and any held item.
- `owners`, `roles`: copy the Rafael roster from `rosters.seed.json`. Set `last_active` and `recent` only when a session doc shows activity.
- `projects`: the Registry row, with `drive_folder_url` and `repo_url` (empty if unknown).
- `questions`: Registry Questions rows for `chord` with status `open` and no `answer`. Split `options` on " / ". If a row's `context` begins with "HELD", set `held: true` and write a one-line neutral `context` naming the hold and its start date. Held items stay in the feed; the page shows them in the warn tone under their own heading, not as asks.
- `sessions`: newest 15 matching docs, newest first.
- `files`: every doc in the Chord folder, `_CONTEXT` first, then newest; max 12.
- `artifacts`: Registry Links rows for `chord`, skipping archived. Exclusions: the "Chord HQ" row itself, and the older duplicate "Chord Demo" (same title as the current demo with the earlier updated date; id `EvCSctuMu1yUDgARTD2w3q`). Add a `purpose` to each (below).

## `artifacts[].purpose`

Assign by title; the page groups and sorts by it, newest first within a group.
- `Product demos`: demo, health, sandbox, spend, atlas, pilot console, employer value report.
- `Investor and business`: pitch deck, investor briefing, business plan, working plan.
- `Design and research`: surface review, aesthetic range, landing directions, the whitepaper.
A new artifact with an unclear purpose gets the closest group by title and is noted in the run log.

## `panels`

- `milestones`: the roadmap stages (five stages across 18 months) from the build log or working plan. Fields: `name` (for example M2-5), `title`, `status`, `due` (empty unless a date is stated), `note`.
  - `done` only when a Drive doc records the stage as built.
  - `target` for a stage a Registry question says to mark as a target (the M2-5 question).
  - `planned` for the rest.
