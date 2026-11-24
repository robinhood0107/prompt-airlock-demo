import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const pagesRoot = new URL("https://pages.invalid/prompt-airlock-demo/");
const server = spawn(process.execPath, [path.join(root, "scripts", "serve.mjs")], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let previewPort = 0;
let ready = false;
const readyPromise = new Promise(function (resolve, reject) {
  const output = createInterface({ input: server.stdout });
  output.on("line", function (line) {
    const match = line.match(/^Static demo preview ready at 127\.0\.0\.1:(\d+)$/);
    if (!match) return;
    previewPort = Number(match[1]);
    ready = previewPort > 0;
    if (ready) resolve();
  });
  server.once("error", reject);
  server.once("exit", function (code) {
    if (!ready) reject(new Error("Owned preview child exited before listening, exit " + code));
  });
});

async function waitForReadyChild() {
  await Promise.race([
    readyPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Owned preview child did not confirm listen.")), 3000))
  ]);
}

try {
  await waitForReadyChild();
  assert.equal(server.exitCode, null, "the child server must still own its listener");
  const previewOrigin = "http://127.0.0.1:" + previewPort;
  const subpathResponse = await fetch(previewOrigin + "/prompt-airlock-demo/");
  assert.equal(subpathResponse.status, 200);
  const subpathHtml = await subpathResponse.text();
  assert.match(subpathHtml, /정상 보호/);
  assert.ok(readme.includes("https://robinhood0107.github.io/prompt-airlock-demo/"));
  const assetTags = Array.from(html.matchAll(/<(?:script|link)\b[^>]*>/gi), match => match[0]);
  for (const tag of assetTags) {
    const attribute = tag.startsWith("<script") ? "src" : "href";
    const source = tag.match(new RegExp(attribute + '="([^"]+)"'))[1];
    const resolved = new URL(source, pagesRoot);
    assert.ok(resolved.pathname.startsWith("/prompt-airlock-demo/"));
    const localPath = "/prompt-airlock-demo/" + source.slice(2);
    const response = await fetch(previewOrigin + localPath);
    assert.equal(response.status, 200);
    const expectedType = source.endsWith(".css") ? "text/css" : "text/javascript";
    assert.ok(response.headers.get("content-type").startsWith(expectedType));
  }
  const rootResponse = await fetch(previewOrigin + "/");
  assert.equal(rootResponse.status, 200);
  console.log("PASS Pages root and repository subpath HTTP paths from owned listener");

  const hrefs = Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi), match => match[1]);
  const installLink = "https://github.com/robinhood0107/PromptAirlock/blob/main/deploy/librechat/README.md";
  assert.ok(hrefs.includes(installLink));
  assert.equal(new URL(installLink).pathname, "/robinhood0107/PromptAirlock/blob/main/deploy/librechat/README.md");
  console.log("PASS verified LibreChat installation guide link");

  const mockLink = "https://github.com/robinhood0107/PromptAirlock/blob/main/docs/local-mock-smoke.md";
  assert.ok(hrefs.includes(mockLink));
  assert.equal(new URL(mockLink).pathname, "/robinhood0107/PromptAirlock/blob/main/docs/local-mock-smoke.md");
  console.log("PASS verified local mock guide link");
} finally {
  if (server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise(resolve => server.once("exit", resolve)), new Promise(resolve => setTimeout(resolve, 2000))]);
  }
}
