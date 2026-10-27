# Local session handoff — Second Brain

> **Update 2026-10-27:** tasks 1–5 below are done. All 55 moves are complete, the Cleanup candidates doc is `14j9zaYqHuomN6UkM_n1cKKPyIsGwCLXIu8fikzbb_F4`, and the session log is in `00 Brain/Sessions`. START HERE and the Move Manifest were re-created with new IDs (used below); the old copies are in `4 Archive/_old roots`.

How to start: on your Mac, run `git clone https://github.com/romihomi9o8/romihomi9o8.github.io && cd romihomi9o8.github.io && git checkout claude/google-drive-second-brain-gk8t5d`. Then open Claude Code there (CLI or Desktop) with the claude.ai Google Drive connector enabled. Pick **"Always allow"** the first time a Drive tool prompts. Then paste the prompt below.

---

Continue the Second Brain build. Read `CLAUDE.md`, `docs/superpowers/specs/2026-10-26-second-brain-design.md` and `docs/superpowers/plans/2026-10-26-second-brain-plan.md` first.

## State as of 2026-10-27

- Done:
  - The PARA skeleton in Drive.
  - The Brain Registry sheet (`1KeN9EG_x1Sv9zfmB7oOhZXvEu4Fq3LtMuhTHvMMY4xY`).
  - The START HERE doc (`1jHmgz775t5pTHsdzFi57a82kRenhH5TMpvJNo1Cae0I`).
  - 13 `_CONTEXT` docs.
  - The Iris Hub snapshot.
  - The `/brain/` dashboard, in PR #1.
- The Drive reorg is **26 of 55 moves done**.
  - The log is the **Move Manifest** sheet in `00 Brain` (`1HxclIC-l9nkuwIR-TQ0WseJOG1MhcAuOi9TdyFY8q0w`). Columns: file_id, title, old_parent_id, old_path, new_parent_id, new_path, reason, status, time.
  - Rows with `status = planned` are still to do.

## Tasks, in order

1. **Finish the moves.** For each `planned` row in the Move Manifest, in sheet order, call Drive `update_file(fileId=file_id, parentId=new_parent_id)`.
   - The last 3 rows move the emptied old roots into `4 Archive/_old roots`. Do them last, only after confirming via `search_files parentId='<root id>'` that no other children are left behind.
   - Mark each row `done` with a timestamp. Rewrite the manifest by creating a new CSV-converted sheet version and keep the old one in `4 Archive/_old roots`, or edit it by hand if easier.
   - Never trash anything.
2. **Verify.**
   - My Drive root should hold only `00 Brain`, `1 Projects`, `2 Areas`, `3 Resources`, `4 Archive` and the live `Iris Hub` sheet (`1eZRRFZojwy3VAskLSOWg4zR1vJt_I7wpEGtGmW108rE`).
   - Spot-check 10 random manifest file_ids: each one's parent equals `new_parent_id`.
3. **Clean up Drive so it's better to use.** Report first, then act on what's safe.
   - **Near-duplicate folders.** Compare these by file title and size:
     - `Casebooks NEW` vs `Casebooks NEW (from Career 2)`
     - `Essays` vs `Essays (from Career 2)`
     - `GRE` vs `GRE (from Career 2)`

     Where every file in a "(from …)" copy also exists in the original, move that copy to `4 Archive/_duplicates` and log it. Otherwise list the unique files and leave both copies.
   - **The TreadLab copy.** It is stored twice: `Past Internship/TreadLabs/EMA` and `SCHOOL/ay SUM 2022-2023/2023 Summer/TreadLab/Sho SS`, about 522 MB of duplicates. Report it; don't move it.
   - **Junk.** List the `.DS_Store` files, `.ipynb_checkpoints` and `.Rproj.user` folders, and empty folders, in a "Cleanup candidates" doc in `00 Brain`. Do not trash them; Roman decides.
   - **Folder colors.** Projects blue, Areas green, Resources yellow, Archive gray, 00 Brain red (`update_file folderColorRgb`). Star START HERE and Brain Registry.
4. **Update the docs.**
   - Add the Move Manifest and the Cleanup candidates links to START HERE. To change START HERE's content, re-create it with the same structure and archive the old copy, unless you can edit Docs directly.
   - Update `docs/superpowers/plans/2026-10-26-second-brain-plan.md` statuses.
   - Commit and push to `claude/google-drive-second-brain-gk8t5d`.
5. **Log the session:** a Doc in `00 Brain/Sessions` titled `2026-10-27 brain claude drive-reorg`.

## Then (from the plan, Roman-driven)

- Create the Google OAuth client and paste its ID into `brain/config.js` (steps in `brain/README.md`). Merge PR #1.
- Run the Codex prompts in `docs/codex/` on the Mac:
  - `01` SSD sync
  - `02` stop the Iris sync, then move the live Iris Hub into `4 Archive/Iris (retired)`
  - `03` wire up the repos
