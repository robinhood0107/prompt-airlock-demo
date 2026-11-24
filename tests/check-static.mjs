import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const scenarios = fs.readFileSync(path.join(root, "scenarios.js"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "check.yml"), "utf8");
const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const stack = [];
const tagPattern = /<\/?([a-z][a-z0-9-]*)(?:\s[^<>]*?)?\s*\/?>/gi;
let tagMatch;
while ((tagMatch = tagPattern.exec(html))) {
  const raw = tagMatch[0];
  const tagName = tagMatch[1].toLowerCase();
  if (raw.startsWith("</")) {
    assert.equal(stack.pop(), tagName, "HTML tags must close in nesting order");
  } else if (!voidTags.has(tagName) && !raw.endsWith("/>")) {
    stack.push(tagName);
  }
}
assert.deepEqual(stack, [], "HTML tags must all close");
console.log("PASS HTML element nesting");

let braceDepth = 0;
for (const character of css) {
  if (character === "{") braceDepth += 1;
  if (character === "}") braceDepth -= 1;
  assert.ok(braceDepth >= 0, "CSS closing brace has a matching open brace");
}
assert.equal(braceDepth, 0, "CSS braces must balance");
assert.match(css, /prefers-color-scheme:\s*dark/);
assert.match(css, /:focus-visible/);
assert.match(css, /\.skip-link\s*\{[^}]*transform:\s*translateY\(/s);
assert.match(css, /\.skip-link:focus-visible\s*\{[^}]*transform:\s*translateY\(0\)/s);
assert.match(css, /word-break:\s*keep-all/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /max-width:\s*760px/);
console.log("PASS CSS balance, light/dark theme, focus and mobile rules");

const assetTags = Array.from(html.matchAll(/<(?:script|link)\b[^>]*>/gi), match => match[0]);
const assets = assetTags.map(function (tag) {
  const attribute = tag.startsWith("<script") ? "src" : "href";
  const match = tag.match(new RegExp(attribute + '="([^"]+)"'));
  assert.ok(match, "static script and stylesheet tags require a local path");
  assert.ok(match[1].startsWith("./"), "page assets must use repository-relative paths");
  return match[1];
});
assert.deepEqual(assets.sort(), ["./app.js", "./scenarios.js", "./styles.css"].sort());
assert.doesNotMatch(html, /<(?:img|iframe|video|audio)\b/i);
assert.doesNotMatch(css, /url\s*\(\s*["']?https?:/i);
assert.doesNotMatch(app + scenarios, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|document\.write)\b/);
assert.doesNotMatch(html, /<input\b|<textarea\b|on(?:click|load|error)\s*=/i);
assert.doesNotMatch(html, /class="(?:hero|workbench|demo-grid|scenario-panel|result-badge)"/);
assert.match(html, /class="sidebar"/);
assert.match(html, /class="chat-main"/);
assert.match(html, /class="user-message"/);
assert.match(html, /class="event-list"/);
assert.ok(html.indexOf('id="menu-toggle"') < html.indexOf('id="chat-main"'), "mobile menu toggle stays outside inert chat content");
assert.match(app, /chatMain\.inert\s*=\s*true/);
assert.match(app, /chatMain\.inert\s*=\s*false/);
assert.match(app, /event\.key\s*===\s*"Escape"/);
assert.match(app, /menuToggle\.focus\(\)/);
assert.match(app, /sidebar\.contains\(document\.activeElement\)/);
assert.match(app, /sidebarScrim\.hidden\s*=\s*false/);
assert.match(html, /aria-controls="case-sidebar"/);
assert.match(css, /grid-template-columns:\s*232px/);
assert.match(css, /max-width:\s*690px/);
assert.match(css, /--sidebar:\s*#202823/);
assert.match(css, /--paper:\s*#faf9f7/);
const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), match => match[1]);
assert.equal(new Set(ids).size, ids.length, "element IDs must be unique");
assert.match(html, /aria-live="polite"/);
console.log("PASS local assets, no input, storage or page-load network");

for (const job of ["static-resources", "scenario-contract", "links-and-pages-path"]) {
  assert.match(workflow, new RegExp("^  " + job + ":", "m"));
}
assert.match(workflow, /pull_request:[\s\S]*branches:[\s\S]*- main/);
assert.equal((workflow.match(/actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/g) || []).length, 3);
assert.doesNotMatch(workflow, /setup-node|npm install|pnpm install|yarn install/);
console.log("PASS three read-only pull request jobs with pinned checkout");
