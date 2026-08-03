import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import {
  createChatRateLimiter,
  createChatRequestGate,
  createPortfolioServer,
} from "./index.mjs";

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

test("accepts a validated chat request and forwards its conversation history", async () => {
  let receivedRequest;
  const configuredServer = createPortfolioServer({
    chatRateLimiter: () => ({ allowed: true, retryAfterSeconds: 0 }),
    chatService: {
      async reply(request) {
        receivedRequest = request;
        return { text: "You told me your name is Alex." };
      },
    },
    distDirectory,
    logger: { error() {} },
    safetySalt: "server-only-test-salt",
  });
  const configuredUrl = await listen(configuredServer);

  try {
    const history = [
      { sender: "visitor", status: "delivered", text: "My name is Alex." },
      { sender: "harry", status: "delivered", text: "Nice to meet you." },
      { sender: "visitor", status: "sent", text: "What is my name?" },
    ];
    const response = await fetch(`${configuredUrl}/api/chat`, {
      body: JSON.stringify({ history, message: "What is my name?" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      reply: "You told me your name is Alex.",
    });
    assert.equal(receivedRequest.message, "What is my name?");
    assert.deepEqual(receivedRequest.history, history);
    assert.match(receivedRequest.safetyIdentifier, /^[a-f0-9]{64}$/);
  } finally {
    await close(configuredServer);
  }
});

test("rejects invalid chat bodies before calling the AI service", async () => {
  let calls = 0;
  const configuredServer = createPortfolioServer({
    chatRateLimiter: () => ({ allowed: true, retryAfterSeconds: 0 }),
    chatService: {
      async reply() {
        calls += 1;
        return { text: "unused" };
      },
    },
    distDirectory,
    logger: { error() {} },
  });
  const configuredUrl = await listen(configuredServer);

  try {
    const response = await fetch(`${configuredUrl}/api/chat`, {
      body: JSON.stringify({ history: "not-an-array", message: "Hello" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, "INVALID_CHAT_HISTORY");
    assert.equal(calls, 0);
  } finally {
    await close(configuredServer);
  }
});

test("limits repeated chat requests per visitor", () => {
  let currentTime = 1_000;
  const rateLimiter = createChatRateLimiter({
    limit: 2,
    now: () => currentTime,
    windowMs: 10_000,
  });

  assert.equal(rateLimiter("visitor").allowed, true);
  assert.equal(rateLimiter("visitor").allowed, true);
  assert.deepEqual(rateLimiter("visitor"), {
    allowed: false,
    retryAfterSeconds: 10,
  });
  currentTime += 10_000;
  assert.equal(rateLimiter("visitor").allowed, true);
});

test("caps provider concurrency and daily request volume", () => {
  let currentTime = Date.UTC(2026, 7, 3, 12);
  const gate = createChatRequestGate({
    concurrencyLimit: 1,
    dailyLimit: 2,
    now: () => currentTime,
  });

  const first = gate();
  assert.equal(first.allowed, true);
  assert.equal(gate().code, "CHAT_BUSY");
  first.release();

  const second = gate();
  assert.equal(second.allowed, true);
  second.release();
  assert.equal(gate().code, "CHAT_DAILY_LIMIT_REACHED");

  currentTime = Date.UTC(2026, 7, 4, 0, 0, 1);
  const nextDay = gate();
  assert.equal(nextDay.allowed, true);
  nextDay.release();
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

async function listen(targetServer) {
  await new Promise((resolveReady) =>
    targetServer.listen(0, "127.0.0.1", resolveReady),
  );
  const address = targetServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not bind");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function close(targetServer) {
  await new Promise((resolveClosed) => targetServer.close(resolveClosed));
}
