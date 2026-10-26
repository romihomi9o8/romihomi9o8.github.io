# Second Brain dashboard (`/brain/`)

A static page (HTML, CSS and vanilla ES modules, with no build step) served by GitHub Pages at
https://romihomi9o8.github.io/brain/. You sign in with Google in the browser, and the page then reads your
Brain Registry, Calendar, Gmail, Drive and Budget sheet directly from Google's APIs. No data is
committed, and nothing is stored on a server. The access token stays in memory, with a copy in this tab's
`sessionStorage` so a reload doesn't ask you to sign in again. **Sign out** revokes the token.

`?demo=1` (https://romihomi9o8.github.io/brain/?demo=1) skips sign-in and renders made-up data through the
same code. Use it to preview the layout.

## 1. Create the Google OAuth client (one time, about 10 minutes)

1. Go to https://console.cloud.google.com/ and create a project (for example "Second Brain").
2. **APIs & Services → Library**: enable **Google Drive API**, **Google Sheets API**,
   **Google Calendar API** and **Gmail API**.
3. **APIs & Services → OAuth consent screen**:
   - User type **External**. App name "Second Brain", with your email as support and developer contact.
   - Scopes: you can leave this empty, because the page requests them at sign-in.
   - Publishing status: leave the app in **Testing**.
   - **Test users → Add users**: `romimodhera@gmail.com`.
     (In Testing mode only listed test users can sign in, and Google doesn't need to verify the app.)
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `https://romihomi9o8.github.io` and `http://localhost:8000`.
   - Redirect URIs are not needed, because the page uses the token popup flow.
5. Copy the **Client ID** (it looks like `1234-abc.apps.googleusercontent.com`) into
   `brain/config.js` as `GOOGLE_CLIENT_ID`, then commit. A client ID is public by design. Never commit a
   client *secret*, which this page doesn't use.

Scopes requested: `drive.readonly`, `spreadsheets` (the page writes only Questions `answer`/`status` and
Todos `done`), `calendar.readonly` and `gmail.readonly`. Because the app is in Testing mode, Google asks
you to sign in again about once a week.

## 2. Configure IDs (`brain/config.js`)

| Setting | What |
|---|---|
| `GOOGLE_CLIENT_ID` | From step 1 |
| `REGISTRY_SHEET_ID` | `00 Brain/Brain Registry` sheet |
| `BUDGET_SHEET_ID` | `Budget — Plaid Sync` sheet |
| `SESSIONS_FOLDER_ID` | `00 Brain/Sessions` folder |
| `GITHUB_USER` | Public repos panel |

A setting still holding a `REPLACE_WITH_…` placeholder shows a "Not configured yet" card in its panel
instead of an error.

## 3. Run locally

```sh
python3 -m http.server 8000      # from the repo root
open http://localhost:8000/brain/            # real sign-in (origin must be authorised, step 1.4)
open http://localhost:8000/brain/?demo=1     # fake data, no sign-in
```

## 4. Tests

```sh
node --test "tests/brain/*.test.mjs"   # unit tests for lib/shape.js (or: npm test)
node tests/brain/smoke.mjs             # Playwright smoke test (or: npm run smoke; needs `npm i` + `npx playwright install chromium` on a fresh machine)
```

The smoke test serves the repo on a free port and checks several things. The signed-out page shows only
the sign-in button and makes no Google or GitHub calls. Sign-in degrades gracefully when Google's script
is blocked. The demo renders every panel without errors or horizontal scroll. Screenshots go to
`$SCREENSHOT_DIR` (by default `<tmp>/brain-smoke`).

## Layout

```
brain/
  index.html, styles.css, theme.js (pre-paint theme), app.js (entry), config.js
  lib/auth.js         GIS token client (sign in / out / revoke)
  lib/api.js          fetch wrapper + ApiError(status)
  lib/sheets.js drive.js calendar.js gmail.js github.js   REST calls
  lib/source.js       live source vs. demo source (same interface)
  lib/shape.js        pure data shaping (unit-tested)
  lib/demo-data.js    fake fixtures for ?demo=1 and tests
  lib/dom.js          safe DOM builder (text nodes only, http(s) hrefs only)
  lib/render/*.js     one module per panel
```

## Troubleshooting

- **A panel shows `HTTP 403`**: the API isn't enabled in the Cloud project, or you unticked that
  permission on the consent screen. Sign out and sign in again.
- **`HTTP 404` on the Registry, Budget or Sessions panels**: the ID in `config.js` is wrong, or the signed-in account can't open the file.
- **The sign-in popup is blocked or closes immediately**: check that the origin you're using is listed in
  step 1.4. The page's Content-Security-Policy (in `index.html`) allows only Google APIs, GIS and
  api.github.com.
