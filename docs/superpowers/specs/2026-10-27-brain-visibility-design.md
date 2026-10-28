# Brain visibility layer — design (approved 2026-10-27)

## Context

The Drive reorg finished on 2026-10-27. Roman now wants Drive to be the **visibility medium** for his sessions and agent teams:
- **Drive holds the substance:** files, guides, logs, status.
- **Claude artifacts are the dashboards,** and they stay current as Drive changes.
- **A daily cloud routine** runs at 6:00 am CT, and also on demand ("update the brain"). It rolls sessions up into Drive.
- **The view is organized by owner (persona),** with each owner's standing team roles beneath.

Decisions made with Roman:
- **Dashboards:** **HQ** first, then **Personal Finance, Chord, Agentic Desk** (Bullseye, Kenji), **Writing** (Book + Substack) and **Health**. They share one template plus 1–2 domain panels each.
- **Existing artifacts:** upgrade them in place (Chord HQ, Agentic Desk, Personal Balance Sheet). Retire stale ones by **archiving, never deleting**.
- **The `/brain/` GitHub Pages app is replaced by artifacts.** Its pure shapers are reused, and the OAuth-client chore goes away.
- **Finance:** cash flow vs budget, planning, goals and investments, from the "Budget — Plaid Sync" sheet plus a **live read-only Robinhood** feed. It shows data only, never advice.
- **Registry edits:** no third-party Sheets connector. The routine **regenerates** system files, and everything finds them **by title inside a known folder**.
- **Scope cuts:** no Gmail/Calendar "Today" panel. Rosters are seeded now and reviewed in HQ.
- **Build mode:** all at once, with an agent team.

## Architecture

**Rule:** folder IDs are stable; file IDs may change. Every consumer (dashboards, routine, START HERE, CLAUDE.md) locates system files as "title X in folder Y".

```
00 Brain/                       (stable folder id 1NFxaaIKd6R6HOf-WdNur7pjL-v_DayGr)
  Brain Registry                regenerated only when Inbox has change requests; adds a "Roles" tab
  Sessions/                     one Doc per session; first lines = header block (below)
  Sessions Index                Google Sheet, regenerated each run
  Feeds/                        JSON written by the routine; what the dashboards read
    hq.json  finance.json  chord.json  desk.json  writing.json  health.json  sessions.json
  Inbox/                        change requests from sessions ("CR 2026-10-28 archive-loopline-links")
  Teams/<Owner>/                "<Owner> — Status" doc (regenerated) + shortcuts to owned project folders
  _history/                     every superseded generated file, dated; nothing trashed
```

The **session log header** (the routine parses only these lines):

```
Owner: rafael
Project: chord
Roles: Chord-eng, Chord-QA
Subagents: 3 — Chord-eng×2 (refactor, tests); Chord-QA (review)
Files: <one link per line>
Questions: CHORD-012
Changes: <optional Inbox CR titles>
```

**Dashboards** are claude.ai artifacts with the `mcp` capability, using the viewer's connectors:
- **Google Drive** (`search_files`, `download_file_content`/`read_file_content`): find a feed by title in `Feeds/` and parse its JSON. Fresh as of the last rollup.
- **Robinhood**, Finance only, read-only tools only (`get_portfolio`, `get_equity_positions`, `get_accounts`): live investments.
- **No personal data is embedded** in any page's HTML.

**The shared template** has these panels:
- Status and next step
- Owner and team-role activity
- Open questions (Registry)
- Recent sessions
- Key files and artifacts
- Feed freshness stamp

**Domain panels:**

| Dashboard | Artifact | Domain panels |
|---|---|---|
| HQ (new "Brain HQ") | new | domain cards, last-24 h sessions, "Waiting on you", owner rosters (for review) |
| Finance | upgrade Personal Balance Sheet `7xHF62HWV6hCSYruyB32xq` | budget vs actual by category, cash-flow trend (6 mo), Treasury gaps, subscriptions to review, live investments |
| Chord | upgrade Chord HQ `Xu5boxp8xh3sfwJ2vSCS8y` | roadmap milestones, artifact gallery (the ~20 Chord artifacts) |
| Agentic Desk | upgrade Agentic Desk `6uhFkQyBxM6H7hJ23bG3W4` | build/test/runbook status (never trades) |
| Writing | new | publishing calendar (Substack), book chapter/consent progress |
| Health | new | appointments, claims, results tracker |

**The routine** is a scheduled cloud agent (via the `schedule` skill), 6:00 am CT, plus a manual run. Its prompt lives in the repo at `docs/routines/brain-rollup.md`. Each run:
1. Apply Inbox change requests. Regenerate the Registry if needed, archive the old copy to `_history`, and move each applied CR to `_history`.
2. Parse Sessions headers since the last run. Regenerate the Sessions Index and `sessions.json`.
3. Build each domain feed from the Registry, sessions, Drive folders and, for Finance, the Budget sheet tabs (Dashboard, Budget, Treasury, Subscriptions, Accounts, Transactions).
4. Rewrite owner Status docs that had activity.
5. Archive every prior version to `_history`. Log the run as `YYYY-MM-DD brain claude rollup`.
6. Never trash, share or send anything.

## Repo layout (`~/romihomi9o8.github.io`, branch `claude/google-drive-second-brain-gk8t5d`)

- **`dashboards/kit/`** holds the shared code:
  - `feeds.js`: find and parse a feed via mcp, with a freshness check.
  - `render.js`: the template panels.
  - `tokens.css`: light and dark themes.
  - `shape.js`: ported from `brain/lib/shape.js`; reuse `openQuestions`, `buildProjectBoard`, `parseSessionTitle`, `rowsToObjects`, `budgetTable`.
- **Pages:** `dashboards/<name>/page.html` plus `panels.js`. `dashboards/build.mjs` inlines the kit into `dashboards/dist/<name>.html`, which is what gets published.
- **Feed contract:** `dashboards/feeds.schema.md` holds the JSON contract each feed must satisfy (routine ↔ pages).
- **Tests:** `tests/dashboards/*.test.mjs` (`node --test`), with feed fixtures and shaper tests ported from `tests/brain/shape.test.mjs`.
- **Retire `brain/`:** remove the `/brain/` app from the branch (git history keeps it) and update the PR #1 description.
- **Docs:** revise `docs/superpowers/specs/2026-10-27-brain-visibility-design.md` to this plan, then update `CLAUDE.md` and START HERE.

## Execution

**Phase 0 — foundations (lead session, sequential; everything else depends on it)**
1. **Spike:**
   - Confirm an artifact page can read a JSON file in Drive via the Google Drive connector (`download_file_content` vs `read_file_content`).
   - Confirm a scheduled cloud agent can use the Drive connector.
   - If either fails, fall back: routine-written Google Doc feeds, or the artifact `db` capability.
2. Write `feeds.schema.md` and the kit, then port the shapers and their tests.
3. **Drive plumbing:**
   - Create the `Feeds`, `Inbox`, `Teams/<8 owners>` and `_history` folders.
   - Regenerate the Registry once, adding the Roles tab with the seeded rosters.
   - Write the first feeds by running the rollup steps by hand.

**Phase 1 — agent team (6 parallel builders, Sonnet; each loads `artifact-design` and `artifact-capabilities`)**
- **Builders:** HQ, Finance, Chord, Agentic Desk, Writing, Health.
- **Each builder's brief:**
  1. Read the existing artifact, if upgrading.
  2. Build the page on the kit.
  3. Publish: to the existing URL when upgrading, otherwise as a new artifact.
  4. Declare a minimal `mcp` manifest (read-only tools).
  5. Run the verification steps below and report.
- **Lead session:** reviews each result. Fixes go back to that builder.

**Phase 2 — wiring (lead session)**
1. Schedule the routine at 6:00 am CT and do one manual run.
2. Prune via Inbox CRs. Mark archived the Loopline (6), Study OS (2) and older duplicate Chord Demo artifact links; nothing is deleted.
3. START HERE: add the dashboard links and the session-header rule, and link `00 Brain` rather than regenerated file IDs.
4. Update `CLAUDE.md` with the find-by-title rule and the header rule.
5. Commit and push, and update PR #1.
6. Write the session log.

## Verification

- **Unit tests:** `node --test "tests/dashboards/*.test.mjs"` pass (shapers and feed fixtures).
- **No personal data in published HTML:** `grep` the `dashboards/dist/*.html` files for `$` amounts, account masks and emails; expect no hits.
- **Each dashboard:**
  - Open the artifact in the browser pane and confirm it renders from the live feed.
  - Signed-out or denied-connector state degrades cleanly.
  - The freshness stamp matches the feed.
  - Light and dark modes and 375px width all render.
- **Routine (manual run):**
  - Feed timestamps advance.
  - Sessions Index row count equals the number of Sessions docs.
  - The prior versions are in `_history`.
  - The run log doc exists.
  - An applied Inbox CR is reflected in the regenerated Registry, and Registry row counts per tab are unchanged apart from the CR.
- **Finance:** live Robinhood totals display. The `mcp` manifest lists only read-only tools.
