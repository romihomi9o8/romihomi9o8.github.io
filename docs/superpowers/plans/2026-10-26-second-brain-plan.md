# Second Brain — Implementation Plan

Spec: `docs/superpowers/specs/2026-10-26-second-brain-design.md`

Status legend: ✅ done · 🔄 in progress · ⏳ waiting on Roman · 🤖 Codex task

## Track A — Drive (Claude, cloud session)

| # | Step | Status |
|---|---|---|
| A1 | Read-only inventory of all of My Drive → `drive_inventory.csv` | 🔄 |
| A2 | Create the PARA skeleton (28 folders under `00 Brain`, `1 Projects`, `2 Areas`, `3 Resources`, `4 Archive`) | ✅ |
| A3 | Snapshot Iris Hub → `4 Archive/Iris (retired)/Iris Hub snapshot 2026-10-26` | ✅ |
| A4 | Build Brain Registry from the Iris `_state` (11 projects, 8 team, 27 questions) + 43 artifacts; upload, then verify that a round-trip download matches | ✅ |
| A5 | START HERE doc in `00 Brain` | ✅ |
| A6 | `_CONTEXT` doc per active project/area (13) | 🔄 |
| A7 | Move plan: inventory → target path per file/folder, written to the Move Manifest before any move | ⏳ after A1 |
| A8 | Execute moves via `update_file(parentId)`, marking each manifest row `done` | ⏳ |
| A9 | Verify: file count per old root = count found under new paths; spot-check 10 IDs; old roots emptied then moved to `4 Archive` | ⏳ |
| A10 | Move both Iris Hub sheets to `4 Archive/Iris (retired)` once the sync is off (B2) | ⏳ |

## Track B — Mac (Codex, run by Roman)

| # | Step | Prompt |
|---|---|---|
| B1 | SSD inventory → plan → (OK) → copy → verify → (OK) → prune | 🤖 `docs/codex/01-ssd-sync.md` |
| B2 | Find and stop the Iris sync, final export | 🤖 `docs/codex/02-iris-shutoff.md` |
| B3 | Add `BRAIN.md` + agent pointers to local repos, plus the `brain-log` helper | 🤖 `docs/codex/03-wire-repos-to-brain.md` |
| B4 | Dashboard follow-ups from review | 🤖 `docs/codex/04-dashboard-followups.md` (written after A/C review) |

## Track C — Dashboard (Claude subagent → PR #1)

| # | Step | Status |
|---|---|---|
| C1 | `brain/` static app: GIS auth and panels Today, Needs you, Projects, Search, Budget, Sessions, Repos | 🔄 |
| C2 | Unit tests (`node --test tests/brain/`) and a Playwright smoke test (signed-out + `?demo=1`) | 🔄 |
| C3 | Review, then commit and push to PR #1 | ⏳ |
| C4 | Roman creates the OAuth client (steps in `brain/README.md`) and pastes the client ID into `brain/config.js` | ⏳ Roman |
| C5 | Merge the PR so GitHub Pages serves `/brain/` | ⏳ Roman |

## Roman's checklist (about 25 minutes total)

1. Create the Google Cloud OAuth client and send me the client ID (C4).
2. Run Codex prompts 01 → 03 on your Mac. Approve the SSD plan before the copy step, and approve the prune.
3. Approve the Iris shutoff in Codex prompt 02, or delete the Apps Script trigger yourself.
4. Merge PR #1.

## Verification gates

- Drive: every manifest row is `done`, and the per-root counts match (A9).
- SSD: the verify report shows **0 missing**.
- Dashboard: tests green, signed-out state shows no data, and you've done a signed-in manual check.
- Iris: no new `_log` rows for 20 minutes after B2.
