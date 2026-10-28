# Recipe: `finance` feed

Writes `finance.json` into `00 Brain/Feeds` (`1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h`) per `feeds.schema.md`. Owner `iris`, project `money`. No personal values belong in this file; the feed itself lives in private Drive.

## Sources

- Money area folder: `1Zs8DC8NIzSESVZBtREY6UM5Y3OOdhczY` (`drive_folder_url` of project `money` in the Registry). Read `_CONTEXT` there first.
- Sheet `Budget — Plaid Sync` (id `1T1ezaJtzAt94vk0cJWyOujteV0Yt4XfZ2l2QGBJCvis`). Tabs: Dashboard, Budget, Treasury, Subscriptions, Accounts, Transactions, Rules, Categories.
- Other docs in the folder: `02 — Money`, `00 — Health & Money command center`, subfolder `Taxes`.
- Registry: Projects (slug `money`), Questions (prefix `IRIS`/`MONEY`), Links (project `money`), Notes. Roster from the seeded Iris roles.

## Extraction

`read_file_content` truncates the Budget tab. For the full category list, call `download_file_content` on the sheet with `exportMimeType` xlsx, decode the base64, and read `Budget` from the unzipped XML (or openpyxl where available).

## Mapping

- `domain`: name "Personal Finance", status `active`. `summary` is one paragraph built from the KPIs, the over-budget categories and the Treasury reserve gap. `next_step` comes from the Treasury `Action` column for the largest gap. `waiting` comes from open items in `_CONTEXT` (empty if none).
- `owners` / `roles`: Iris and her seeded roles, `last_active` and `recent` empty unless a session shows activity.
- `questions`: Registry Questions for the project with status open and no answer. Defaulted or answered ones are excluded.
- `panels.month`: `Budget!B3`. `month_elapsed`: `Budget` "Month elapsed" row, rounded to 2 decimals.
- `panels.kpis`: Dashboard row 5-6 (A..G): spent, budget, left, discretionary left, cash, investments, net worth, rounded to whole dollars.
- `panels.income`: Budget "Planned income" and "Actual income (synced)".
- `panels.categories`: every category row in the Budget tab under each section header (Fixed, Recurring, Subscriptions, Discretionary, Savings), `target` and `actual` columns; skip total rows.
- `panels.trend`: Dashboard chart data block, columns Month, Fixed, Recurring, Subscriptions, Discretionary (six months).
- `panels.treasury`: Treasury tab table from the header row `Role | Account | Balance | Target | Gap | Action`; exclude the Net position row; blank target or gap becomes null.
- `panels.subscriptions_review`: Subscriptions tab rows whose Status is not `Keep`; fields service, monthly cost, status, billing.
- `panels.goals`: from Treasury targets (reserve target months, operating float months) with current balance from the matching Treasury row; plus Registry-defaulted questions that block a goal target (target null, `due` from the context doc).
- `panels.accounts_synced`: newest `Last synced` in the Accounts tab, as ISO date.
- `files`: the sheet, `_CONTEXT`, the folder docs, newest first (max 12). `artifacts`: Registry Links of kind artifact for `money`. `sessions`: Sessions folder docs titled `... money ...`, newest 15.

## Page notes

The page `dashboards/finance/page.html` also reads the viewer's Robinhood connector live (read-only: `get_accounts`, `get_portfolio`, `get_equity_positions`, `get_equity_quotes`). Nothing from it goes in the feed.
