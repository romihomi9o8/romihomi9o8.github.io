// Obviously fake data for `?demo=1` and for unit tests.
// Shapes mirror the real Google API responses so the real render code is exercised.
// Names, emails (example.com) and amounts are invented. Dates are relative to `today`.

import { addDays, isoDay } from "./shape.js";

const H = {
  projects: ["slug", "name", "type", "status", "owner", "next_step", "waiting", "drive_folder_url", "repo_url", "prefix", "sort"],
  team: ["slug", "name", "role"],
  questions: ["code", "project", "question", "options", "default", "default_date", "answer", "status", "blocks", "context"],
  todos: ["todo", "due", "project", "source", "done"],
  links: ["title", "url", "kind", "project", "updated"],
};

const drive = (n) => `https://drive.google.com/drive/folders/DEMO_FOLDER_${n}`;

/** Registry as a Sheets values:batchGet response. */
export function demoRegistryResponse(today = new Date()) {
  const d = (n) => isoDay(addDays(today, n));
  return {
    spreadsheetId: "DEMO",
    valueRanges: [
      {
        range: "Projects!A1:Z1000",
        values: [
          ["Slug", "Name", "Type", "Status", "Owner", "Next Step", "Waiting", "Drive Folder URL", "Repo URL", "Prefix", "Sort"],
          ["brain", "Second Brain", "project", "active", "sam", "Wire the dashboard to the Registry", "", drive(0), "https://github.com/example/brain", "BRN", "0.0"],
          ["chord", "Chord", "project", "active", "sam", "Ship onboarding v2 behind a flag", "", drive(1), "https://github.com/example/chord", "CHD", "1.0"],
          ["bullseye", "Bullseye", "project", "waiting", "ada", "Pick pricing tier for pilot", "Pilot partner reply", drive(2), "", "BUL", "2"],
          ["substack", "Substack writing", "project", "active", "quill", "Draft post #4 outline", "", drive(3), "", "SUB", "3"],
          ["leland", "Leland Ventures", "project", "blocked", "sam", "Send intro deck v3", "Legal review of deck", drive(4), "", "LEL", "4"],
          [],
          ["book", "Book", "project", "active", "quill", "Chapter 3 rewrite", "", drive(5), "", "BK", "5"],
          ["health", "Health", "area", "active", "sam", "Book annual check-up", "", drive(6), "", "HLT", "10"],
          ["money", "Money", "area", "active", "penny", "Review demo budget categories", "Statement import", drive(7), "", "MNY", "11.0"],
          ["iris", "Iris (retired)", "project", "archived", "sam", "", "", drive(8), "", "IRS", "20.0"],
          ["website", "Personal Website", "project", "later", "ada", "Pick a template", "", "", "https://github.com/example/site", "WEB", "9"],
          ["", "", "", "", "", "", "", "", "", "", ""],
        ],
      },
      {
        range: "Team!A1:Z1000",
        values: [
          ["slug", "name", "role"],
          ["sam", "Sam", "PM"],
          ["ada", "Ada", "Engineer"],
          ["quill", "Quill", "Writer"],
          ["penny", "Penny", "Finance"],
        ],
      },
      {
        range: "Questions!A1:Z1000",
        values: [
          H.questions,
          ["Q-101", "chord", "Launch onboarding v2 to all users or 10% first?", "a) All users / b) 10% first / c) Wait a week", "b", d(1), "", "open", "CHD release", "Flag is ready; metrics dashboard is the demo one."],
          ["Q-102", "bullseye", "Which pricing tier for the pilot?", "a) Starter / b) Team / c) Custom", "b) Team", d(3), "", "", "Pilot contract", ""],
          ["Q-103", "book", "Keep chapter 3 title?", "Yes | No", "Yes", d(5), "", "open", ""],
          ["Q-090", "leland", "Use the short deck?", "a) Yes / b) No", "a", d(-4), "a) Yes", "answered", ""],
          ["Q-091", "money", "Old question", "a) A / b) B", "a", d(-9), "", "closed", ""],
          ["Q-092", "brain", "Defaulted question", "a) Keep / b) Drop", "a", d(-2), "", "defaulted", ""],
        ],
      },
      {
        range: "Todos!A1:Z1000",
        values: [
          H.todos,
          ["Reply to demo pilot partner", d(-1), "bullseye", "email", "FALSE"],
          ["Outline post #4", d(0), "substack", "session", "FALSE"],
          ["Review onboarding copy", d(1), "chord", "", "FALSE"],
          ["Upload demo statements", d(2), "money", "", "FALSE"],
          ["Plan chapter 4", d(6), "book", "", "FALSE"],
          ["Already done thing", d(0), "chord", "", "TRUE"],
          ["No due date", "", "health", "", "FALSE"],
        ],
      },
      {
        range: "Links!A1:Z1000",
        values: [
          H.links,
          ["Chord onboarding mock", "https://claude.ai/artifact/demo-chord-onboarding", "artifact", "chord", d(-2)],
          ["Chord metrics sketch", "https://claude.ai/artifact/demo-chord-metrics", "artifact", "Chord", d(-5)],
          ["Bullseye pricing calc", "https://claude.ai/artifact/demo-bullseye-pricing", "artifact", "bullseye", d(-3)],
          ["Substack drafts", "https://docs.google.com/document/d/DEMO_DOC_1", "doc", "substack", d(-1)],
          ["Book outline", "https://docs.google.com/document/d/DEMO_DOC_2", "doc", "book", d(-8)],
          ["Leland deck v2", "https://docs.google.com/presentation/d/DEMO_DECK", "doc", "leland", d(-6)],
          ["Example site", "https://example.com", "site", "website", d(-30)],
          ["Unfiled note", "https://example.org/note", "other", "", d(-12)],
        ],
      },
    ],
  };
}

/** Calendar events.list items. */
export function demoEvents(today = new Date()) {
  const at = (dayOffset, h, m = 0) => {
    const x = addDays(today, dayOffset);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  };
  return [
    { id: "e1", summary: "Demo standup", start: { dateTime: at(0, 9, 30) }, end: { dateTime: at(0, 9, 45) }, htmlLink: "https://calendar.google.com/" },
    { id: "e2", summary: "Chord design review", start: { dateTime: at(0, 13) }, end: { dateTime: at(0, 14) }, htmlLink: "https://calendar.google.com/", location: "Room Example" },
    { id: "e0", summary: "Demo all-day focus block", start: { date: isoDay(today) }, end: { date: isoDay(addDays(today, 1)) }, htmlLink: "https://calendar.google.com/" },
    { id: "e3", summary: "Gym (demo)", start: { dateTime: at(0, 18) }, end: { dateTime: at(0, 19) }, htmlLink: "https://calendar.google.com/" },
    { id: "e4", summary: "Bullseye pilot call", start: { dateTime: at(1, 11) }, end: { dateTime: at(1, 11, 30) }, htmlLink: "https://calendar.google.com/" },
    { id: "e5", summary: "Writing block", start: { dateTime: at(1, 15) }, end: { dateTime: at(1, 17) }, htmlLink: "https://calendar.google.com/" },
  ];
}

/** Gmail threads.get(format=metadata) payloads. */
export function demoThreads(now = new Date()) {
  const msg = (from, subject, snippet, minsAgo, starred) => ({
    snippet,
    internalDate: String(now.getTime() - minsAgo * 60000),
    labelIds: starred ? ["STARRED", "UNREAD"] : ["IMPORTANT", "UNREAD"],
    payload: { headers: [{ name: "From", value: from }, { name: "Subject", value: subject }] },
  });
  return [
    { id: "demo-t1", messages: [msg('"Pilot Partner" <partner@example.com>', "Re: Bullseye pilot terms", "Thanks &amp; happy to move forward once we agree on the tier&#39;s scope…", 42, true)] },
    { id: "demo-t2", messages: [msg("Demo Bank <alerts@example.com>", "Your demo statement is ready", "This is a fake notification used for the dashboard preview.", 180, false)] },
    {
      id: "demo-t3",
      messages: [
        msg('"Editor Example" <editor@example.org>', "Chapter 3 notes", "First pass attached.", 1500, false),
        msg('"Editor Example" <editor@example.org>', "Chapter 3 notes", "One more thought on the opening scene — can we talk Thursday?", 600, false),
      ],
    },
  ];
}

/** Drive files in the Sessions folder. */
export function demoSessionFiles(today = new Date()) {
  const d = (n) => isoDay(addDays(today, n));
  const f = (i, name, n) => ({
    id: `DEMO_SESSION_${i}`,
    name,
    createdTime: `${d(n)}T12:00:00.000Z`,
    webViewLink: `https://docs.google.com/document/d/DEMO_SESSION_${i}/edit`,
  });
  return [
    f(1, `${d(0)} chord claude onboarding-flags`, 0),
    f(2, `${d(0)} substack codex post-4-outline`, 0),
    f(3, `${d(-1)} bullseye claude pricing-model`, -1),
    f(4, `${d(-2)} leland ventures codex deck-v3`, -2),
    f(5, `${d(-3)} book claude chapter-3`, -3),
    f(6, `${d(-4)} money codex budget-tabs`, -4),
    f(7, `${d(-6)} chord codex metrics`, -6),
    f(8, "Untitled scratch doc", -9),
  ];
}

/** Sheets metadata + values for the budget panel. */
export function demoBudget() {
  return {
    title: "Budget (demo)",
    tabs: ["Transactions", "Summary", "Categories"],
    values: [
      ["Category", "Budget", "Spent", "Left", "% used"],
      ["Rent (demo)", "$1,000.00", "$1,000.00", "$0.00", "100%"],
      ["Groceries (demo)", "$400.00", "$123.45", "$276.55", "31%"],
      ["Transport (demo)", "$100.00", "$42.00", "$58.00", "42%"],
      ["Fun (demo)", "$200.00", "$250.00", "($50.00)", "125%"],
      [],
      ["Total", "$1,700.00", "$1,415.45", "$284.55", "83%"],
    ],
  };
}

/** GitHub /users/:user/repos payload. */
export function demoRepos(now = new Date()) {
  const ago = (h) => new Date(now.getTime() - h * 3600000).toISOString();
  return [
    { name: "romihomi9o8.github.io", html_url: "https://github.com/romihomi9o8/romihomi9o8.github.io", description: "Second Brain dashboard (demo)", language: "JavaScript", stargazers_count: 0, pushed_at: ago(1) },
    { name: "chord-demo", html_url: "https://github.com/example/chord", description: "Fake repo for the preview", language: "TypeScript", stargazers_count: 3, pushed_at: ago(20) },
    { name: "notes-demo", html_url: "https://github.com/example/notes", description: "", language: "Python", stargazers_count: 0, pushed_at: ago(24 * 9) },
  ];
}
