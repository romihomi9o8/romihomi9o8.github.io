// Unit tests for brain/lib/shape.js. Run: node --test "tests/brain/*.test.mjs"  (or npm test)
import { test } from "node:test";
import assert from "node:assert/strict";

import * as S from "../../brain/lib/shape.js";
import { demoRegistryResponse, demoSessionFiles, demoEvents, demoThreads, demoBudget } from "../../brain/lib/demo-data.js";

const TODAY = new Date(2026, 9, 26); // 2026-10-26, local midnight
const reg = () => S.parseRegistry(demoRegistryResponse(TODAY));

test("header mapping: lowercased, trimmed, spaces -> underscores; _row is the sheet row", () => {
  const { headers, rows } = S.rowsToObjects([
    [" Slug ", "Next Step", "DRIVE Folder URL"],
    ["chord", "  ship it ", "https://x"],
  ]);
  assert.deepEqual(headers, ["slug", "next_step", "drive_folder_url"]);
  assert.deepEqual(rows, [{ _row: 2, slug: "chord", next_step: "ship it", drive_folder_url: "https://x" }]);
});

test("short rows fill missing cells with empty strings", () => {
  const { rows } = S.rowsToObjects([["a", "b", "c"], ["1"]]);
  assert.deepEqual(rows, [{ _row: 2, a: "1", b: "", c: "" }]);
});

test("blank rows are skipped but row numbers stay true to the sheet", () => {
  const { projects } = reg();
  assert.equal(projects.length, 10);
  const book = projects.find((p) => p.slug === "book");
  assert.equal(book._row, 8, "row 7 is blank, so Book sits on sheet row 8");
  assert.ok(!projects.some((p) => p.slug === ""));
});

test("empty / missing values produce empty tabs", () => {
  assert.deepEqual(S.rowsToObjects(undefined), { headers: [], rows: [] });
  const r = S.parseRegistry({ valueRanges: [{ range: "Todos!A1:Z1000" }] });
  assert.deepEqual(r.todos, []);
  assert.deepEqual(r.projects, []);
});

test("parseRegistry routes ranges by tab name (quoted or not)", () => {
  const r = S.parseRegistry({
    valueRanges: [{ range: "'Links'!A1:E3", values: [["title", "url"], ["A", "https://a"]] }],
  });
  assert.equal(r.links.length, 1);
  assert.deepEqual(r.headers.links, ["title", "url"]);
  assert.equal(S.tabFromRange("'It''s'!A1"), "It's");
});

test("column letters and cell addresses for write-back", () => {
  assert.equal(S.columnLetter(0), "A");
  assert.equal(S.columnLetter(25), "Z");
  assert.equal(S.columnLetter(26), "AA");
  const r = reg();
  assert.equal(S.cellAddress("Questions", r.headers.questions, "answer", 2), "Questions!G2");
  assert.equal(S.cellAddress("Questions", r.headers.questions, "status", 2), "Questions!H2");
  assert.equal(S.cellAddress("Todos", r.headers.todos, "done", 5), "Todos!E5");
  assert.equal(S.cellAddress("Questions", r.headers.questions, "context", 2), "Questions!J2");
  assert.equal(S.cellAddress("Todos", r.headers.todos, "nope", 5), null);
});

test("project board: projects vs areas vs archived, float sort, owner persona from Team", () => {
  const r = reg();
  const board = S.buildProjectBoard({ ...r, sessions: S.shapeSessions(demoSessionFiles(TODAY)) });
  assert.deepEqual(
    board.projects.map((p) => p.name),
    ["Second Brain", "Chord", "Bullseye", "Substack writing", "Leland Ventures", "Book", "Personal Website"],
  );
  assert.deepEqual(board.areas.map((p) => p.name), ["Health", "Money"]);
  assert.deepEqual(board.archived.map((p) => p.name), ["Iris (retired)"], "archived hidden from main groups");
  assert.equal(board.archived[0].tone, "done");

  const chord = board.projects.find((p) => p.slug === "chord");
  assert.equal(chord.owner, "Sam");
  assert.equal(chord.ownerRole, "PM");
  assert.equal(chord.tone, "ok");
  assert.equal(chord.nextStep, "Ship onboarding v2 behind a flag");

  const site = board.projects.find((p) => p.slug === "website");
  assert.equal(site.status, "later");
  assert.equal(site.tone, "muted");
  assert.equal(board.projects.find((p) => p.slug === "leland").tone, "bad");
  assert.equal(board.projects.find((p) => p.slug === "bullseye").waiting, "Pilot partner reply");
  assert.equal(board.areas.find((p) => p.slug === "money").owner, "Penny");
});

test("unknown owner falls back to the raw owner text", () => {
  const b = S.buildProjectBoard({ projects: [{ slug: "x", name: "X", owner: "codex" }], team: [] });
  assert.equal(b.projects[0].owner, "codex");
});

test("link chips: drive + repo + Links rows matched by slug or name (case-insensitive)", () => {
  const r = reg();
  const chord = S.buildProjectBoard(r).projects.find((p) => p.slug === "chord");
  assert.deepEqual(
    chord.links.map((l) => l.label),
    ["Drive", "Repo", "Chord onboarding mock", "Chord metrics sketch"],
  );
  assert.equal(chord.links[2].kind, "artifact");
  // "Chord" (name, capitalised) matched as well as "chord" (slug).
  assert.equal(S.linksForProject(r.links, { slug: "chord", name: "Chord" }).length, 2);
  // Unfiled link matches nothing.
  assert.equal(S.linksForProject(r.links, { slug: "", name: "" }).length, 0);
});

test("open questions: unanswered + open status (closed/defaulted/answered excluded), sorted by default date", () => {
  const r = reg();
  const qs = S.openQuestions(r.questions, r.projects);
  assert.deepEqual(qs.map((q) => q.code), ["Q-101", "Q-102", "Q-103"]);
  assert.deepEqual(qs[0].options.map((o) => o.label), ["All users", "10% first", "Wait a week"]);
  assert.deepEqual(qs[0].options.map((o) => o.key), ["a", "b", "c"]);
  assert.equal(qs[0].options[1].raw, "b) 10% first", "raw option text is what gets written back");
  assert.deepEqual(qs[0].options.map((o) => o.isDefault), [false, true, false], "default 'b' matches by letter");
  assert.deepEqual(qs[1].options.map((o) => o.isDefault), [false, true, false], "default 'b) Team' matches");
  assert.deepEqual(qs[2].options.map((o) => o.label), ["Yes", "No"]);
  assert.equal(qs[2].options[0].isDefault, true, "plain-label default matches");
  assert.equal(qs[0].context, "Flag is ready; metrics dashboard is the demo one.");
  assert.equal(qs[0].project, "Chord", "project slug resolved to name");
  assert.equal(qs[0].default, "10% first");
  assert.equal(qs[0].defaultDate, "2026-10-27");
  assert.equal(qs[0].row, 2);
});

test("todos due: not done, due <= today+2, overdue first, labelled", () => {
  const r = reg();
  const due = S.todosDue(r.todos, TODAY, 2);
  assert.deepEqual(due.map((t) => t.todo), [
    "Reply to demo pilot partner",
    "Outline post #4",
    "Review onboarding copy",
    "Upload demo statements",
  ]);
  assert.deepEqual(due.map((t) => t.when), ["1d overdue", "today", "tomorrow", "in 2d"]);
  assert.equal(due[0].overdue, true);
  assert.equal(due[0].row, 2);
});

test("option parsing: ' / ' separator and 'x) ' prefixes", () => {
  assert.deepEqual(S.splitOptions("a) Send it / b) Shelve it"), ["a) Send it", "b) Shelve it"]);
  assert.deepEqual(S.splitOptions("a) Use A/B test / b) Skip"), ["a) Use A/B test", "b) Skip"], "slash without spaces is not a separator");
  assert.deepEqual(S.parseOption("b) Shelve it"), { key: "b", label: "Shelve it", raw: "b) Shelve it" });
  assert.deepEqual(S.parseOption("Plain"), { key: "", label: "Plain", raw: "Plain" });
  const opt = S.parseOption("a) Send it");
  for (const d of ["a", "A", "a)", "a) Send it", "Send it"]) assert.equal(S.isDefaultOption(opt, d), true, d);
  for (const d of ["b", "", "Shelve it"]) assert.equal(S.isDefaultOption(opt, d), false, d);
});

test("isTrue understands sheet checkbox values", () => {
  for (const v of ["TRUE", "true", "Yes", "x", "1"]) assert.equal(S.isTrue(v), true, v);
  for (const v of ["FALSE", "", "no", "0", undefined]) assert.equal(S.isTrue(v), false, String(v));
});

test("session titles parse as YYYY-MM-DD <project> <tool> <slug>", () => {
  assert.deepEqual(S.parseSessionTitle("2026-10-26 chord claude onboarding-flags"), {
    date: "2026-10-26",
    project: "chord",
    tool: "claude",
    slug: "onboarding-flags",
    title: "2026-10-26 chord claude onboarding-flags",
  });
  const multi = S.parseSessionTitle("2026-10-24 leland ventures codex deck-v3");
  assert.equal(multi.project, "leland ventures");
  assert.equal(multi.tool, "codex");
  const other = S.parseSessionTitle("2026-10-20 book gpt5 chapter three");
  assert.deepEqual([other.project, other.tool, other.slug], ["book", "gpt5", "chapter three"]);
  const bare = S.parseSessionTitle("Untitled scratch doc");
  assert.deepEqual([bare.date, bare.project, bare.slug], ["", "", "Untitled scratch doc"]);
});

test("sessions sort newest first; latest session attaches to its project", () => {
  const sessions = S.shapeSessions(demoSessionFiles(TODAY));
  assert.equal(sessions[0].date, "2026-10-26");
  assert.equal(sessions[sessions.length - 1].title, "Untitled scratch doc");
  const chord = S.latestSessionFor({ slug: "chord", name: "Chord" }, sessions);
  assert.equal(chord.slug, "onboarding-flags");
  const leland = S.latestSessionFor({ slug: "leland", name: "Leland Ventures" }, sessions);
  assert.equal(leland.slug, "deck-v3", "multi-word project name matches project name");
});

test("link filter: every term must match title/url/kind/project", () => {
  const { links } = reg();
  assert.equal(S.filterLinks(links, "").length, links.length);
  assert.deepEqual(S.filterLinks(links, "chord artifact").map((l) => l.title), ["Chord onboarding mock", "Chord metrics sketch"]);
  assert.deepEqual(S.filterLinks(links, "BOOK").map((l) => l.title), ["Book outline"]);
  assert.equal(S.filterLinks(links, "zzz").length, 0);
});

test("drive query literal escapes quotes and backslashes", () => {
  assert.equal(S.driveQueryLiteral(`it's a\\b`), `it\\'s a\\\\b`);
});

test("calendar events split into today / tomorrow with all-day first", () => {
  const ev = S.shapeEvents(demoEvents(TODAY), TODAY);
  assert.deepEqual(ev.today.map((e) => e.title), ["Demo all-day focus block", "Demo standup", "Chord design review", "Gym (demo)"]);
  assert.deepEqual(ev.tomorrow.map((e) => e.title), ["Bullseye pilot call", "Writing block"]);
});

test("gmail threads: from name, subject, decoded snippet, starred, link", () => {
  const rows = S.shapeThreads(demoThreads(new Date(2026, 9, 26, 12)));
  assert.equal(rows[0].from, "Pilot Partner");
  assert.equal(rows[0].subject, "Re: Bullseye pilot terms");
  assert.match(rows[0].snippet, /^Thanks & happy .* tier's scope/);
  assert.equal(rows[0].starred, true);
  assert.equal(rows[0].url, "https://mail.google.com/mail/u/0/#all/demo-t1");
  assert.equal(rows[2].count, 2);
  assert.equal(S.parseFromHeader("plain@example.com"), "plain@example.com");
  assert.equal(S.parseFromHeader("<only@example.com>"), "only@example.com");
});

test("budget: prefer Summary-like tab, trim table, detect numbers", () => {
  assert.equal(S.pickBudgetTab(["Transactions", "Monthly Summary", "Dashboard"]), "Monthly Summary");
  assert.equal(S.pickBudgetTab(["Transactions", "Overview"]), "Overview");
  assert.equal(S.pickBudgetTab(["Transactions", "Raw"]), "Transactions");
  assert.equal(S.pickBudgetTab([]), null);
  const t = S.budgetTable(demoBudget().values, 12);
  assert.equal(t.length, 6, "blank row dropped");
  assert.equal(t[0].length, 5);
  assert.equal(t[1][1].numeric, true);
  assert.equal(t[1][0].numeric, false);
  assert.equal(S.isNumericCell("($50.00)"), true);
  assert.equal(S.isNumericCell("83%"), true);
  assert.equal(S.isNumericCell("Rent"), false);
  assert.equal(S.budgetTable([["a"], ["b"], ["c"]], 2).length, 2);
});

test("status tones", () => {
  assert.equal(S.statusTone("active"), "ok");
  assert.equal(S.statusTone("waiting"), "warn");
  assert.equal(S.statusTone("blocked"), "bad");
  assert.equal(S.statusTone("later"), "muted");
  assert.equal(S.statusTone("done"), "done");
  assert.equal(S.statusTone("ongoing"), "ok");
  assert.equal(S.statusTone("weird"), "info");
});

test("safeUrl blocks javascript: and data: URLs", () => {
  assert.equal(S.safeUrl("javascript:alert(1)"), "");
  assert.equal(S.safeUrl("data:text/html,x"), "");
  assert.equal(S.safeUrl(" https://ok.example "), "https://ok.example");
});

test("relative time", () => {
  const now = new Date(2026, 9, 26, 12);
  assert.equal(S.relativeTime(new Date(now - 30e3), now), "just now");
  assert.equal(S.relativeTime(new Date(now - 5 * 60e3), now), "5m ago");
  assert.equal(S.relativeTime(new Date(now - 3 * 3600e3), now), "3h ago");
  assert.equal(S.relativeTime(new Date(now - 4 * 86400e3), now), "4d ago");
});
