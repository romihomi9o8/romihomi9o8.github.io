# Recipe: health feed

Output: `health.json` in `00 Brain/Feeds` (`1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h`). Owner: nadia. Registry project slug: `health`. Health data is sensitive: keep notes to what and when, with no diagnoses beyond what a title states, and never copy values into this repo.

## Sources
- Health area folder `1HEgp-DwavBC-x4bY2gviRU6LFkf7d7i9` (2 Areas/Health): `_CONTEXT`, `01 — Health`, `03 — Training & Mobility`, three `reference-sheet — *.svg` files (daily mobility, desk reset, Muay Thai fundamentals), and the `Health` subfolder `1IpRj3c79gLc3MZZERJAaCq9UReNExDsy` (insurance and records documents).
- Registry: Projects row `health`, Questions and Links filtered to `health`.
- Sessions folder `1-ag8oaNPBQe5A-xF_SyCYkCnoVc3b5xx`: titles `YYYY-MM-DD health ...`.

## Extraction
1. Find files by title inside the folders above (IDs change). Read `_CONTEXT` for status, current state and next step.
2. `domain`: status from Registry; summary and next_step from `_CONTEXT` "Current state" and "Next step", in one or two neutral sentences. `waiting` from open Registry questions, else "".
3. `owners`/`projects`/`roles`: Registry plus `rosters.seed.json` (empty if none seeded).
4. `questions`: Registry Questions for `health` with status open and no answer. `sessions`: newest 15 matching the title pattern.
5. `files`: max 12; the two track docs, `_CONTEXT`, the Health subfolder, newest documents in it, newest first. `artifacts`: Registry Links for `health`, not archived.

## panels
- `appointments`, `claims`, `results`: read the progress logs and tables in `01 — Health` for dated entries with an appointment, claim (EOB) or result. Map to `{date, what, status}`, `{date, what, amount, status}` (amount only if the source states it, else omit), `{date, what, note}`. Do not infer; if the doc has none, leave the array empty. Keep `what` to the title wording and `note` to a short phrase.
- `training`: `headline` from the "Next" line of `03 — Training & Mobility`; `status` from its "Where this stands" section (e.g. not started / active); `sheets` from the three SVGs (title, Drive view URL); `plan_url` is the doc URL.
