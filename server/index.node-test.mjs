import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createPortfolioServer } from "./index.mjs";

let baseUrl;
let distDirectory;
let server;

before(async () => {
  distDirectory = await mkdtemp(join(tmpdir(), "rosebeg-server-"));
  await writeFile(join(distDirectory, "index.html"), "<main>Rosebeg XP</main>");
  await writeFile(join(distDirectory, "app.js"), "console.log('Rosebeg XP');");

  server = createPortfolioServer({
    distDirectory,
    logger: { error() {} },
  });
  await new Promise((resolveReady) => server.listen(0, "127.0.0.1", resolveReady));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Server did not bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolveClosed) => server.close(resolveClosed));
  await rm(distDirectory, { force: true, recursive: true });
});

test("serves the health endpoint without exposing configuration", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    service: "rosebeg-xp",
    status: "ok",
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("reserves the chat endpoint for a server-side AI integration", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, { method: "POST" });

  assert.equal(response.status, 501);
  assert.deepEqual(await response.json(), {
    code: "AI_NOT_CONFIGURED",
    message: "Harry Messenger is not connected to an AI service yet.",
  });
});

test("serves static files and the SPA fallback with security headers", async () => {
  const assetResponse = await fetch(`${baseUrl}/app.js`);
  const routeResponse = await fetch(`${baseUrl}/portfolio/project`, {
    headers: { Accept: "text/html" },
  });

  assert.equal(assetResponse.status, 200);
  assert.match(assetResponse.headers.get("content-type"), /text\/javascript/);
  assert.equal(await assetResponse.text(), "console.log('Rosebeg XP');");
  assert.equal(routeResponse.status, 200);
  assert.equal(await routeResponse.text(), "<main>Rosebeg XP</main>");
  assert.match(routeResponse.headers.get("content-security-policy"), /frame-ancestors 'none'/);
});

test("does not turn missing assets into HTML responses", async () => {
  const response = await fetch(`${baseUrl}/assets/missing.jpg`, {
    headers: { Accept: "image/avif,image/webp" },
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { code: "NOT_FOUND" });
});
