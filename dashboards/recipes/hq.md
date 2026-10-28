# Recipe: `hq` and `sessions`

Build these last in each run, after every domain feed has been written. No personal values belong in this file.

## Inputs

- The domain feeds just written: `finance`, `chord`, `desk`, `writing` and `health` (from `00 Brain/Feeds`).
- Brain Registry (`00 Brain`, newest by title): Projects, Team, Roles, Questions.
- The parsed session list from rollup step 3.

## Mapping from project slug to feed

| Registry project | Feed |
|---|---|
| `money` | finance |
| `chord` | chord |
| `bullseye` | desk |
| `substack`, `book` | writing |
| `health` | health |

Every other project that isn't archived is an **area**: leland, career, home, admin, self-care, website, brain.

## `hq` fields

- **`domains`**: one entry per domain feed, in the order finance, chord, desk, writing, health.
  - `name`: the feed's `domain.name`; use "Personal Finance" for finance.
  - `dashboard_url`: the Registry Links row with kind `dashboard` for that project.
  - `owners`: the feed's owner names.
  - `status` and `next_step`: from the feed's `domain`.
  - `open_questions`: the count of `waiting` items whose `project` is this feed.
  - `last_session`: the date of the feed's newest session, or `""`.
- **`areas`**: Registry Projects rows that aren't archived and aren't mapped to a feed.
  - `owner`: the Team name for the owner slug.
  - `open_questions`: as above, matched on the area slug.
  - `last_session`: the newest session date for that project.
- **`waiting`**: every Registry question with status `open` and no answer, excluding archived projects.
  - Set `project` to the mapped feed name for domain projects, otherwise the area slug.
  - Split `options` on " / ".
  - Truncate `default_date` to `YYYY-MM-DD`.
  - Keep `context`: HQ shows items whose context or blocks contain "HELD" as held.
  - Sort by `default_date` ascending, with blanks last, then by code.
- **`sessions_24h`**: sessions whose date is within the 24 hours before the run, newest first.
- **`rosters`**: Registry Roles grouped by owner, in Team-tab order.
  - `name` comes from Team.
  - Each role's `last_active` is the newest session date whose `Roles:` header names that role for that owner, or `""`.

## `sessions` fields

`sessions` is every parsed session, newest first, with the same objects the Sessions Index sheet is built from. Each session object has:
- `date`, `title`, `owner`, `project`, `roles` (an array), `subagents`, `summary`, `next_step`;
- `url`, the session Doc's `https://docs.google.com/document/d/<id>/edit`.

Validate both files with `node dashboards/kit/validate.mjs` before uploading.
