# Feed contract

The daily rollup writes one JSON file per dashboard into Drive `00 Brain/Feeds/` (folder id `1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h`), titled `<feed>.json`. The dashboards read the newest file with that title, so file IDs may change between runs.

Before upload, the routine runs `node dashboards/kit/validate.mjs <file>` and must not upload a feed that fails.

All dates are ISO strings: `YYYY-MM-DD`, or full UTC timestamps for `generated_at`. All money values are plain numbers in USD with no `$`. Unknown values are `null` or an empty array, never invented.

## Domain feeds: `finance`, `chord`, `desk`, `writing`, `health`

```jsonc
{
  "feed": "chord",                       // matches the file name
  "generated_at": "2026-10-28T11:00:12Z",
  "domain": {
    "name": "Chord",
    "status": "active",                  // free text; tone derived in the page
    "summary": "One paragraph on where things stand.",
    "next_step": "…",
    "waiting": "…"                       // what's blocked on Roman, or ""
  },
  "owners": [{ "slug": "rafael", "name": "Rafael Ortiz", "role": "Chord: roadmap, design system, partners" }],
  "projects": [{ "slug": "chord", "name": "Chord", "status": "active", "owner": "rafael",
                 "next_step": "", "drive_folder_url": "https://…", "repo_url": "" }],
  "roles": [{ "owner": "rafael", "role": "Chord-eng", "purpose": "…",
              "last_active": "2026-10-27", "recent": ["refactored X (2026-10-27)"] }],
  "questions": [{ "code": "CHORD-008", "project": "chord", "question": "…",
                  "options": ["a) …", "b) …"], "default": "a", "default_date": "", "blocks": "…" }],
  "sessions": [{ "date": "2026-10-27", "title": "2026-10-27 chord claude surface-review",
                 "owner": "rafael", "project": "chord", "roles": ["Chord-QA"], "subagents": "2 — …",
                 "summary": "…", "next_step": "…", "url": "https://docs.google.com/…" }],
  "files": [{ "title": "…", "url": "https://…", "kind": "doc|sheet|folder|pdf|other", "updated": "2026-10-20" }],
  "artifacts": [{ "title": "Chord Pitch Deck", "url": "https://claude.ai/artifact/…", "updated": "2026-08-27" }],
  "panels": { }                          // domain-specific; see below
}
```

Rules:
- **`questions`** holds open questions only: no answer, status open.
- **`sessions`** holds the newest 15 sessions for the domain's projects, newest first.
- **`artifacts`** excludes links marked archived.

### `panels` per domain

- **`finance`**, from the "Budget — Plaid Sync" sheet:
  ```jsonc
  { "month": "2026-10", "month_elapsed": 0.84,
    "kpis": { "spent": 4308, "budget": 5068, "left": 760, "discretionary_left": 218,
              "cash": 12344, "investments": 30247, "net_worth": 42491 },
    "income": { "planned": 7736, "actual": 8453 },
    "categories": [{ "section": "Fixed", "category": "Rent", "target": 2583, "actual": 2583 }],
    "trend": [{ "month": "2026-05", "fixed": 140, "recurring": 0, "subscriptions": 2346, "discretionary": 1762 }],
    "treasury": [{ "role": "Reserve", "account": "High-yield savings (to open)", "balance": 0,
                   "target": 15205, "gap": -15205, "action": "Open HYSA and fund it" }],
    "subscriptions_review": [{ "service": "WHOOP", "monthly": 29.92, "status": "Review", "billing": "…" }],
    "goals": [{ "name": "Reserve (3 months)", "target": 15205, "current": 0, "due": "" }],
    "accounts_synced": "2026-10-26" }
  ```
- **`chord`**: `{ "milestones": [{ "name": "M2-5", "status": "target", "due": "", "note": "" }] }`. Its artifacts also carry `purpose` (gallery group), and its questions carry `held: true` when the context says the item is held by the send freeze.
- **`desk`**: `{ "workstreams": [{ "name": "Backtester", "status": "…", "tests": "…", "note": "" }], "guardrail": "Research and engineering only. Never places trades." }`.
- **`writing`**:
  ```jsonc
  { "calendar": [{ "date": "2026-11-04", "title": "…", "channel": "substack|book", "status": "draft|scheduled|published" }],
    "book": { "chapters": [{ "name": "…", "status": "…" }], "consent_open": 0 } }
  ```
- **`health`**:
  ```jsonc
  { "appointments": [{ "date": "…", "what": "…", "status": "…" }],
    "claims": [{ "date": "…", "what": "…", "amount": 0, "status": "…" }],
    "results": [{ "date": "…", "what": "…", "note": "…" }],
    "training": { "headline": "…", "status": "…", "plan_url": "https://…",
                  "sheets": [{ "title": "…", "url": "https://…" }] } }
  ```

## `hq`

```jsonc
{
  "feed": "hq", "generated_at": "…",
  "domains": [{ "feed": "chord", "name": "Chord", "dashboard_url": "https://claude.ai/artifact/…",
                "owners": ["Rafael Ortiz"], "status": "active", "next_step": "…",
                "open_questions": 3, "last_session": "2026-10-27" }],
  "areas": [{ "slug": "leland", "name": "Leland Ventures", "owner": "Theo Mercer", "status": "active",
              "next_step": "", "open_questions": 4, "last_session": "" }],
  "waiting": [ /* question objects, all projects, soonest default_date first */ ],
  "sessions_24h": [ /* session objects from the last 24 h, any project */ ],
  "rosters": [{ "owner": "rafael", "name": "Rafael Ortiz",
                "roles": [{ "role": "Chord-eng", "purpose": "…", "last_active": "" }] }]
}
```

## `sessions`

`{ "feed": "sessions", "generated_at": "…", "sessions": [ /* every session object, newest first */ ] }`. This is the Sessions Index in JSON form.
