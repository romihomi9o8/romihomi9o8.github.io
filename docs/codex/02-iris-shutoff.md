# Codex task 02 — Find and stop the Iris Hub sync (after the Registry migration)

The Iris Hub Google Sheet is refreshed every ~10 minutes by a backend: an Apps Script time trigger, or a local or hosted job (tables `hub_projects`, `hub_questions`, `cast`, plus "Claude/Codex session" counts). Its data has already been migrated into `00 Brain/Brain Registry`, and a snapshot is saved in `4 Archive/Iris (retired)/`.

Paste below the line into Codex on Roman's Mac, from the folder where the Iris code lives. If you don't know where it lives, start in `~`.

---

Find what keeps syncing my "Iris Hub" Google Sheet (id `1eZRRFZojwy3VAskLSOWg4zR1vJt_I7wpEGtGmW108rE`) and stop it safely. Do not delete code or data.

1. Search my machine for the Iris project. Look for `rg -l "hub_projects|syncNow|1eZRRFZojwy3VAskLSOWg4zR1vJt_I7wpEGtGmW108rE"` under `~/` (skip `node_modules` and `Library`), `launchctl list | grep -i iris`, `crontab -l`, and `~/Library/LaunchAgents`. Also check for a `.clasp.json` (Apps Script project) and any Supabase or Postgres config.
2. Report what you found: the scheduler (Apps Script trigger, launchd, cron or hosted), the database, and the code path. Then **wait for my OK**.
3. On OK:
   - For launchd or cron, unload or disable the job and keep the plist or crontab line commented out with a dated note.
   - For Apps Script, print the exact click path: script.google.com → project → Triggers → delete the `syncNow` time trigger. If `clasp` is logged in, list the triggers instead.
   - Leave the database untouched. Export a final JSON dump of all hub tables to `~/Iris-final-export-YYYY-MM-DD/`.
4. Confirm the sync has stopped: the `_log` tab of Iris Hub gets no new `syncNow` rows for 20 minutes. I can check that, or you can if you have Sheets access.
5. Log a session note at `My Drive/00 Brain/Sessions/YYYY-MM-DD iris codex shutoff.md`.
