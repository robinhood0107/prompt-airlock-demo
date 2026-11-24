import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/prompt-airlock-demo/", "index.html"],
  ["/prompt-airlock-demo/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/prompt-airlock-demo/styles.css", "styles.css"],
  ["/scenarios.js", "scenarios.js"],
  ["/prompt-airlock-demo/scenarios.js", "scenarios.js"],
  ["/app.js", "app.js"],
  ["/prompt-airlock-demo/app.js", "app.js"]
]);
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"]
]);
const requestedPort = 0;

const server = http.createServer(function (request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end("Method not allowed");
    return;
  }
  const pathname = new URL(request.url, "http://127.0.0.1:4173").pathname;
  const relativeFile = files.get(pathname);
  if (!relativeFile) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end("Not found");
    return;
  }
  const filePath = path.join(root, relativeFile);
  const body = fs.readFileSync(filePath);
  response.writeHead(200, {
    "Content-Type": types.get(path.extname(filePath)),
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(request.method === "HEAD" ? undefined : body);
});

server.listen(requestedPort, "127.0.0.1", function () {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Loopback preview did not receive a TCP port.");
  process.stdout.write("Static demo preview ready at 127.0.0.1:" + address.port + "\n");
});
