# Codex task 03 — Wire every local project repo into the brain

Paste below the line into Codex on Roman's Mac, starting from `~`.

---

Connect each of my local project repos to my Second Brain so every Claude Code and Codex session starts with context and ends with a session log.

The brain's rules live in the Google Doc "START HERE": https://docs.google.com/document/d/1tDofVCR6ySzW2Ra0fADFzAQ5WKspfSyRJusgip17Lwc

Drive for Desktop mounts My Drive at `~/Library/CloudStorage/GoogleDrive-romimodhera@gmail.com/My Drive`.

## Steps

1. **Find the repos.** Look for git repos under `~` (maxdepth 4, skipping `Library` and `node_modules`) and on any mounted SSD under `/Volumes/*`.
   - Print a table: repo path, remote URL, last commit date, and a guessed brain project slug.
   - Slugs: `brain`, `chord`, `bullseye`, `substack`, `leland`, `book`, `website`, `health`, `money`, `career`, `home`, `admin`, `self-care`, `loopline`, `study-os`, `iris`.
   - Hints: "agentic-desk", "trading" or "bullseye" → `bullseye`; "chord" → `chord`; "loopline" → `loopline`; "study" → `study-os`; "iris" → `iris`.
   - **Wait for me to confirm the mapping.**
2. **Add `BRAIN.md` to each confirmed repo's root** (keep it under 40 lines). It holds:
   - the project slug, name and owner persona
   - links to START HERE and the project's Drive folder (from the table below)
   - the session-log rule: at the end of a session, write `My Drive/00 Brain/Sessions/YYYY-MM-DD <slug> <claude|codex> <short-slug>.md` with what was done, links, decisions and the next step
   - "never send, share or trash without Roman's yes"
3. **Point the agent files at `BRAIN.md`.**
   - In `CLAUDE.md`, prepend a 2-line pointer: "Read BRAIN.md first." Create the file if it's missing.
   - In `AGENTS.md`, prepend the same pointer.
   - Don't rewrite existing content.
4. **Create `~/bin/brain-log`**, a small zsh script:
   - Usage: `brain-log <slug> <tool> "<summary>"`
   - It writes the session `.md` into the Sessions folder above, with a timestamp, the git branch, the last 5 commits, and the summary passed in or read from `$EDITOR`.
   - Make it executable and make sure `~/bin` is on `PATH` (via `~/.zshrc`, but only if it isn't already there).
5. **Commit:** in each repo, commit `BRAIN.md` and the pointer edits on a branch `brain/wire-up`. **Do not push.** Show me the diffs.

## Project Drive folders

| slug | folder |
|---|---|
| chord | https://drive.google.com/drive/folders/1xILuiZqQKVTcCGZgkKksJidTzv6shKVx |
| bullseye | https://drive.google.com/drive/folders/1SR7lo-IxJmJhYru2L20NprugGnWGIfCF |
| substack | https://drive.google.com/drive/folders/1TtFDbYtSc-g4Ucm9FDGE3Ivr70Q48a1m |
| leland | https://drive.google.com/drive/folders/1W6KMv_UTTH4dPh8McqXCHONlrdmTshpM |
| book | https://drive.google.com/drive/folders/1biZbAiqI977u5Y2jwbTuNR6bcd53wCsU |
| website | https://drive.google.com/drive/folders/1AW9FB_SyLjJ3u73UefdA9O4CDPkXbmR0 |
| brain | https://drive.google.com/drive/folders/1NFxaaIKd6R6HOf-WdNur7pjL-v_DayGr |
| loopline (archived) | https://drive.google.com/drive/folders/1ByDWx1qmEeIJZ7AXjHsD2_byanuO4Rpd |
| study-os (archived) | https://drive.google.com/drive/folders/1SxrnOi9x-UrWrZ86ed59JcxZL2xlIPdx |
| iris (archived) | https://drive.google.com/drive/folders/1JXHqWPUe0fwRb1IqRaIdtVkVIeUjC9fT |
