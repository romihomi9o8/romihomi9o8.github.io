# Recipe: `writing` feed

Feed: `writing.json` in 00 Brain/Feeds (`1RwTznBFa6cLX-hLSKK22G-Zl3NtM_5-h`). Owners: `clara` (project `substack`, prefix WRITE) and `ezra` (project `book`, prefix BOOK). Dashboard name "Writing Room".

## Sources

- Registry (`Brain Registry` in 00 Brain): Projects rows `substack` and `book` (status, next_step, drive_folder_url); Team rows `clara`, `ezra`; Questions with project `substack` or `book`; Links with those projects (skip archived).
- Substack folder `1TtFDbYtSc-g4Ucm9FDGE3Ivr70Q48a1m`: docs `_CONTEXT`, `Writing & Substack` (track doc with the publishing board table), subfolders `Writing` (corpus; `Essays — Long form` is inside, plus short form, poems, personal), `Writings`.
- Book folder `1biZbAiqI977u5Y2jwbTuNR6bcd53wCsU`: `_CONTEXT`, and any outline, chapter or consent-register docs or sheets that appear later.
- Sessions folder `1-ag8oaNPBQe5A-xF_SyCYkCnoVc3b5xx`: titles `YYYY-MM-DD <project> <tool> <slug>` where project is `substack`/`writing` or `book`.

## Extraction

1. `domain`: name "Writing Room". Status from the two Projects rows (active if either is). Summary and next_step from the two `_CONTEXT` docs (Current state, Next step). `waiting` summarizes the open questions in one line, with no private names.
2. `owners` from Team rows; `roles` from `rosters.seed.json` (Clara and Ezra), `last_active` and `recent` from their sessions, otherwise empty.
3. `projects` from Registry Projects. `questions` are rows with status open and no answer. A question about the book (for example the consent register) is filed with `project: "book"` so it lands in Ezra's lane, even if the Registry files it under substack.
4. `sessions`: newest 15 for both projects, newest first. `files`: at most 12, newest or most important (`_CONTEXT` docs, track doc, corpus folders). `artifacts` from Links.

## Panels

- `panels.calendar`: one entry per piece with `title`, `channel` (`substack` or `book`), `status` (`draft`, `scheduled`, `published`) and `date` (`YYYY-MM-DD`, or null). Start from the publishing board table in the track doc. Use dates only where a source gives one (a scheduled post, a Substack publication, a dated plan); otherwise `date: null` (shown under "No date yet"). Map board status: Published to `published`, any other or empty to `draft`; `scheduled` only when a date is set. Channel is `book` once a decision (answered question or book outline) places the piece in the book, else `substack`.
- `panels.book.chapters`: `{name, status}` from the book outline or chapter docs, by chapter title only. Empty array if none exist.
- `panels.book.consent_open`: a count of consent-register rows whose exposure level is not yet set. Null if no register exists. Never copy person names, relationships or exposure details into the feed; counts only.

## Privacy

The public repo and the feed must not carry names of private people from the consent register. Essay and chapter titles are fine; people are counted, never named.
