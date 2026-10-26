# Codex task 01 — SSD → Drive sync with zero-loss verification

Paste everything below the line into Codex CLI on Roman's Mac, run from an empty working folder such as `~/brain-tools`.

---

You are building a small, safe command-line tool called `ssdsync` (Python 3.11+, standard library only plus `pyyaml`). It moves archival files from my external SSD into Google Drive and proves nothing was lost or duplicated.

Google Drive for Desktop is installed. Drive is mounted at `~/Library/CloudStorage/GoogleDrive-romimodhera@gmail.com/My Drive`.

## Context

- My Drive is organized in PARA. The destinations are:
  - `My Drive/4 Archive/Photos/<YYYY>/` for photos and videos, by capture year (EXIF) or file mtime year.
  - `My Drive/3 Resources/Reference/From SSD/<original relative folder>/` for documents (pdf, doc(x), xls(x), ppt(x), txt, md, pages, numbers, key).
  - `My Drive/4 Archive/Old Misc/From SSD/<original relative folder>/` for everything else archival.
- The SSD is for **working files**. These always stay on the SSD:
  - anything inside a git repo (a folder that contains `.git`)
  - `node_modules`, `.venv`, build folders
  - files modified in the last 90 days
  - any folder listed under `keep_on_ssd` in `rules.yaml`
- System rules live in Drive at `00 Brain/START HERE`. Reports go to `My Drive/00 Brain/SSD Sync Reports/`.

## Hard safety rules (do not violate)

1. **Never delete or move anything on the SSD** in `plan`, `copy` or `verify`. Only `prune` may delete. `prune` must:
   - require `--yes`
   - delete only files whose sha256 was verified at the destination in the latest verify report
   - print the list and total size first
2. Never overwrite an existing destination file.
   - If a file with the same name and the **same sha256** exists, skip it as already synced.
   - If a file with the same name and a **different sha256** exists, write it as `name (ssd-<first8 of sha>).ext`.
3. Never touch the `00 Brain`, `1 Projects` or `2 Areas` Drive folders, except writing reports to `00 Brain/SSD Sync Reports/`.
4. Every command is idempotent and resumable. State lives in `~/.ssdsync/state.sqlite`.

## Commands

- `ssdsync init --ssd /Volumes/<NAME>`
  - Writes `rules.yaml` with sensible defaults (the extensions, the 90-day threshold, a `keep_on_ssd` list and an `exclude` list).
  - Exclusions: `.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `.TemporaryItems`.
  - Stops so I can edit `rules.yaml`.
- `ssdsync inventory`
  - Walks the SSD and records path, size, mtime and sha256 in sqlite.
  - Hashes in streaming chunks with a progress bar, and skips files whose size and mtime haven't changed.
- `ssdsync plan`
  - Classifies each file as `keep`, `photos`, `docs` or `other` and computes its destination.
  - Detects duplicates: the same sha256 more than once on the SSD, or already present anywhere under My Drive (this needs a Drive-side hash index).
  - Writes `plan.csv` and a human-readable `plan.md` summary: counts and GB per class, the top 20 folders by size, and duplicate groups.
  - Copies nothing.
- `ssdsync index-drive`
  - Hashes the Drive for Desktop mirror under My Drive, skipping Google-native files (`.gdoc`, `.gsheet`, etc.).
  - Writes the hashes to sqlite so duplicates against Drive can be found.
  - Mention in the output that Drive for Desktop "stream" mode downloads files to hash them. Hash `4 Archive` and `3 Resources` by default, and the whole drive only with `--all`.
- `ssdsync copy [--limit-gb N]`
  - Copies the planned files with `shutil.copy2`, preserving mtime.
  - Skips anything whose sha256 already exists at the destination folder or anywhere in the Drive index. Those are logged as `dup-skipped` with the existing path.
  - Logs each copy to sqlite.
- `ssdsync verify`
  - For every planned non-keep file, re-hashes the destination copy and compares it with the SSD hash.
  - Waits for Drive for Desktop to finish uploading: it checks that the file exists and that the size matches.
  - Writes a `verify-YYYY-MM-DD-HHMM.md` report with these sections:
    - totals
    - **missing** (planned but not at destination or hash mismatch): must be 0 for success
    - **duplicates** (groups with paths)
    - **skipped as already in Drive**
    - **kept on SSD**, by reason
  - Copies the report into `00 Brain/SSD Sync Reports/` and prints the path.
- `ssdsync prune --yes`: see safety rule 1. It also writes a prune report to the same Reports folder.
- `ssdsync status`: counts per state.

## Quality bar

- Tests: `pytest` in `tests/`, using temp folders to fake the SSD and Drive. They cover:
  - classification
  - destination naming, including the collision rename
  - idempotent re-runs
  - dup detection
  - verify catching a corrupted copy
  - prune refusing without `--yes` and refusing unverified files
- `README.md` with the exact run order:
  1. `init`
  2. edit `rules.yaml`
  3. `inventory`
  4. `index-drive`
  5. `plan` (then show me `plan.md` and wait for my OK)
  6. `copy`
  7. `verify`
  8. `prune --yes`, only after I read the verify report
- Run the tests and show me the output.
- Then run `init`, `inventory`, `index-drive` and `plan` against my real SSD. Show me `plan.md` and **stop for my approval before `copy`**.

When done, log a session note: create a Google Doc (or a `.md` file, which Drive for Desktop syncs) in `My Drive/00 Brain/Sessions/` named `YYYY-MM-DD brain codex ssd-sync`. It should say what ran, the report paths and the next step.
