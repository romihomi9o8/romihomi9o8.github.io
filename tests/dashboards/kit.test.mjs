import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  statusTone, relativeTime, isStale, safeUrl, parseOption, money, usedFraction,
  newestFile, decodeBase64Utf8, errorCopy,
} from "../../dashboards/kit/kit.js";
import { validateFeed } from "../../dashboards/kit/validate.mjs";

const fixtures = new URL("./fixtures/", import.meta.url);
const load = (name) => JSON.parse(readFileSync(new URL(`${name}.json`, fixtures), "utf8"));

test("statusTone maps free text to tones", () => {
  assert.equal(statusTone("Active"), "ok");
  assert.equal(statusTone("on hold"), "warn");
  assert.equal(statusTone("blocked by legal"), "bad");
  assert.equal(statusTone("archived"), "done");
  assert.equal(statusTone("later"), "muted");
  assert.equal(statusTone(""), "muted");
  assert.equal(statusTone("Cancel"), "bad");
  assert.equal(statusTone("Keep"), "ok");
});

test("relativeTime and isStale", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  assert.equal(relativeTime("2026-10-28T11:59:30Z", now), "just now");
  assert.equal(relativeTime("2026-10-28T09:00:00Z", now), "3h ago");
  assert.equal(relativeTime("2026-10-25T12:00:00Z", now), "3d ago");
  assert.equal(relativeTime("not a date", now), "");
  assert.equal(isStale("2026-10-28T06:00:00Z", now), false);
  assert.equal(isStale("2026-10-26T06:00:00Z", now), true);
  assert.equal(isStale("garbage", now), true);
});

test("safeUrl allows only http(s)", () => {
  assert.equal(safeUrl("https://x.test/a"), "https://x.test/a");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("mailto:a@b.c"), "");
});

test("parseOption and money", () => {
  assert.deepEqual(parseOption("a) Send it"), { key: "a", label: "Send it" });
  assert.deepEqual(parseOption("Just text"), { key: "", label: "Just text" });
  assert.equal(money(4308), "$4,308");
  assert.equal(money(-15205), "−$15,205");
  assert.equal(money(29.92, { cents: true }), "$29.92");
  assert.equal(money(null), "—");
  assert.equal(usedFraction(214, 125).toFixed(2), "1.71");
  assert.equal(usedFraction(5, 0), null);
});

test("newestFile and base64 decoding", () => {
  const f = newestFile({ files: [{ id: "old", modifiedTime: "2026-10-01T00:00:00Z" }, { id: "new", modifiedTime: "2026-10-27T00:00:00Z" }] });
  assert.equal(f.id, "new");
  assert.equal(newestFile({}), null);
  // Exact bytes the Drive connector returned in the 2026-10-27 spike.
  assert.equal(
    decodeBase64Utf8("eyJmZWVkIjoic3Bpa2UiLCJnZW5lcmF0ZWRfYXQiOiIyMDI2LTEwLTI3VDA0OjQ4OjAwWiIsIml0ZW1zIjpbeyJhIjoxLCJiIjoieCDigJQgeSJ9XX0="),
    '{"feed":"spike","generated_at":"2026-10-27T04:48:00Z","items":[{"a":1,"b":"x — y"}]}',
  );
});

test("errorCopy branches on code", () => {
  assert.match(errorCopy({ code: "needs_reauth" }).title, /Reconnect/);
  assert.equal(errorCopy({ code: "approval_required" }).canAsk, true);
  assert.match(errorCopy({ code: "feed_missing" }).title, /No data/);
  assert.match(errorCopy({ code: "something_new" }).title, /Couldn't load/);
});

test("every fixture passes the validator", () => {
  for (const file of readdirSync(fixtures).filter((f) => f.endsWith(".json"))) {
    assert.deepEqual(validateFeed(JSON.parse(readFileSync(new URL(file, fixtures), "utf8"))), [], file);
  }
});

test("validator rejects common rollup mistakes", () => {
  const f = load("finance");
  f.panels.kpis.spent = "$4,308";
  f.sessions = [{ date: "2026-10-01", url: "" }, { date: "2026-10-05", url: "" }];
  f.generated_at = "2026-10-27";
  const errs = validateFeed(f);
  assert.ok(errs.some((e) => e.includes("kpis.spent")));
  assert.ok(errs.some((e) => e.includes("newest first")));
  assert.ok(errs.some((e) => e.includes("generated_at")));
  assert.deepEqual(validateFeed({ feed: "nope", generated_at: "2026-10-27T00:00:00Z" }), ['unknown feed "nope"']);
});
