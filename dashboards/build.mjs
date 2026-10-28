// Inline the kit into each dashboard page: dashboards/<name>/page.html -> dashboards/dist/<name>.html.
// Markers in page.html: /*@KIT_CSS*/ inside <style>, /*@KIT_JS*/ and /*@PANELS_JS*/ inside <script>.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// Panels import from the kit for tests; once inlined they share one script, so drop imports and exports.
const unexport = (src) =>
  src.replace(/^import\s[^;]+;\s*$/gm, "").replace(/^export\s+(?=(async\s+)?function|const|let|class)/gm, "");
const kitCss = readFileSync(join(here, "kit/kit.css"), "utf8");
const kitJs = unexport(readFileSync(join(here, "kit/kit.js"), "utf8"));

// `--preview` also writes dist/<name>.preview.html with the matching test fixture injected, for local screenshots.
const preview = process.argv.includes("--preview");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const fixtureFor = (name) => join(here, "..", "tests", "dashboards", "fixtures", `${name}.json`);
mkdirSync(join(here, "dist"), { recursive: true });
for (const name of readdirSync(here, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  if (["kit", "dist"].includes(name) || (only.length && !only.includes(name))) continue;
  const page = join(here, name, "page.html");
  if (!existsSync(page)) continue;
  const panelsPath = join(here, name, "panels.js");
  const panels = existsSync(panelsPath) ? unexport(readFileSync(panelsPath, "utf8")) : "";
  const out = readFileSync(page, "utf8")
    .replace("/*@KIT_CSS*/", () => kitCss)
    .replace("/*@KIT_JS*/", () => kitJs)
    .replace("/*@PANELS_JS*/", () => panels);
  if (/\/\*@(KIT_CSS|KIT_JS|PANELS_JS)\*\//.test(out)) throw new Error(`${name}: unreplaced marker`);
  if (out.includes("__FIXTURE__ =")) throw new Error(`${name}: page must not set a fixture`);
  writeFileSync(join(here, "dist", `${name}.html`), out);
  console.log(`built dist/${name}.html (${(out.length / 1024).toFixed(1)} KB)`);
  const feedName = (/boot\(\{\s*feed:\s*"([a-z]+)"/.exec(out) || [])[1];
  if (preview && feedName && existsSync(fixtureFor(feedName))) {
    const inject = `<script>window.__FIXTURE__ = ${readFileSync(fixtureFor(feedName), "utf8")};</script>\n`;
    writeFileSync(join(here, "dist", `${name}.preview.html`),
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${inject}${out}</body></html>`);
  }
}
