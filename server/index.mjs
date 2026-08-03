import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createOpenAIChatService } from "./ai/openai-chat-service.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const defaultDistDirectory = resolve(projectRoot, "dist");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

export function createPortfolioServer({
  distDirectory = defaultDistDirectory,
  logger = console,
  chatService = null,
  chatRateLimiter = createChatRateLimiter(),
  chatRequestGate = createChatRequestGate(),
  safetySalt = "",
} = {}) {
  const distRoot = resolve(distDirectory);

  return createServer(async (request, response) => {
    setSecurityHeaders(response);

    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

      if (requestUrl.pathname === "/api/health") {
        sendJson(response, 200, { service: "rosebeg-xp", status: "ok" });
        return;
      }

      if (requestUrl.pathname === "/api/chat") {
        await handleChatRequest(request, response, {
          chatService,
          chatRateLimiter,
          chatRequestGate,
          logger,
          safetySalt,
        });
        return;
      }

      if (requestUrl.pathname.startsWith("/api/")) {
        sendJson(response, 404, { code: "API_ROUTE_NOT_FOUND" });
        return;
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end();
        return;
      }

      const decodedPath = decodeURIComponent(requestUrl.pathname);
      const requestedFile = resolve(
        distRoot,
        `.${decodedPath === "/" ? "/index.html" : decodedPath}`,
      );

      if (!isInsideDirectory(requestedFile, distRoot)) {
        sendJson(response, 403, { code: "FORBIDDEN" });
        return;
      }

      const filePath = await resolveFile(
        requestedFile,
        distRoot,
        request.headers.accept,
      );
      if (!filePath) {
        sendJson(response, 404, { code: "NOT_FOUND" });
        return;
      }

      const body = await readFile(filePath);
      const extension = extname(filePath).toLowerCase();
      response.writeHead(200, {
        "Cache-Control": cacheControlFor(filePath),
        "Content-Length": body.byteLength,
        "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      logger.error("Rosebeg XP request failed", error);
      sendJson(response, 500, { code: "INTERNAL_SERVER_ERROR" });
    }
  });
}

async function handleChatRequest(
  request,
  response,
  { chatService, chatRateLimiter, chatRequestGate, logger, safetySalt },
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { code: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (!chatService) {
    sendJson(response, 501, {
      code: "AI_NOT_CONFIGURED",
      message: "Harry Messenger is not connected to an AI service yet.",
    });
    return;
  }

  const clientAddress = getClientAddress(request);
  const rateLimit = chatRateLimiter(clientAddress);
  if (!rateLimit.allowed) {
    response.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
    sendJson(response, 429, {
      code: "CHAT_RATE_LIMITED",
      message: "Please wait a moment before sending another message.",
    });
    return;
  }

  let requestTicket;
  try {
    const contentType = request.headers["content-type"] ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ChatRequestError("JSON_CONTENT_TYPE_REQUIRED", 415);
    }

    const body = await readJsonBody(request);
    const { message, history } = normalizeChatRequest(body);
    requestTicket = chatRequestGate();
    if (!requestTicket.allowed) {
      if (requestTicket.retryAfterSeconds) {
        response.setHeader(
          "Retry-After",
          String(requestTicket.retryAfterSeconds),
        );
      }
      sendJson(response, requestTicket.statusCode, {
        code: requestTicket.code,
        message: requestTicket.message,
      });
      return;
    }

    const safetyIdentifier = safetySalt
      ? createHmac("sha256", safetySalt).update(clientAddress).digest("hex")
      : undefined;
    const result = await chatService.reply({
      history,
      message,
      safetyIdentifier,
    });

    if (!result || typeof result.text !== "string" || !result.text.trim()) {
      throw new ChatRequestError("AI_INVALID_RESPONSE", 502);
    }

    sendJson(response, 200, { reply: result.text.trim() });
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : 500;
    const code = typeof error?.code === "string"
      ? error.code
      : "INTERNAL_SERVER_ERROR";

    logger.error("Harry Messenger request failed", { code, statusCode });
    sendJson(response, statusCode, {
      code,
      message:
        statusCode >= 500
          ? "Harry's digital mirror is temporarily unavailable."
          : error.message,
    });
  } finally {
    requestTicket?.release?.();
  }
}

class ChatRequestError extends Error {
  constructor(code, statusCode, message = code) {
    super(message);
    this.name = "ChatRequestError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function readJsonBody(request, maxBytes = 128 * 1024) {
  const chunks = [];
  let byteLength = 0;

  for await (const chunk of request) {
    byteLength += chunk.byteLength;
    if (byteLength > maxBytes) {
      throw new ChatRequestError(
        "CHAT_REQUEST_TOO_LARGE",
        413,
        "The conversation is too large to send.",
      );
    }
    chunks.push(chunk);
  }

  if (byteLength === 0) {
    throw new ChatRequestError(
      "INVALID_CHAT_REQUEST",
      400,
      "A message is required.",
    );
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ChatRequestError(
      "INVALID_JSON",
      400,
      "The request body must be valid JSON.",
    );
  }
}

function normalizeChatRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ChatRequestError(
      "INVALID_CHAT_REQUEST",
      400,
      "A message is required.",
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2_000) {
    throw new ChatRequestError(
      "INVALID_CHAT_MESSAGE",
      400,
      "The message must contain between 1 and 2,000 characters.",
    );
  }

  const rawHistory = body.history ?? [];
  if (!Array.isArray(rawHistory)) {
    throw new ChatRequestError(
      "INVALID_CHAT_HISTORY",
      400,
      "Conversation history must be an array.",
    );
  }

  const history = rawHistory.slice(-60).map((item) => {
    const sender = item?.sender;
    const text = typeof item?.text === "string" ? item.text.trim() : "";
    const status = item?.status;
    if (
      (sender !== "visitor" && sender !== "harry") ||
      !text ||
      text.length > 2_000 ||
      (status !== undefined &&
        status !== "sent" &&
        status !== "delivered" &&
        status !== "error")
    ) {
      throw new ChatRequestError(
        "INVALID_CHAT_HISTORY",
        400,
        "Conversation history contains an invalid message.",
      );
    }

    return { sender, text, status };
  });

  return { history, message };
}

export function createChatRateLimiter({
  limit = 20,
  windowMs = 10 * 60 * 1_000,
  now = Date.now,
} = {}) {
  const clients = new Map();

  return (clientKey) => {
    const currentTime = now();
    if (clients.size > 10_000) {
      for (const [key, value] of clients) {
        if (currentTime >= value.resetAt) clients.delete(key);
      }
      while (clients.size > 8_000) {
        const oldestKey = clients.keys().next().value;
        if (oldestKey === undefined) break;
        clients.delete(oldestKey);
      }
    }
    const existing = clients.get(clientKey);
    if (!existing || currentTime >= existing.resetAt) {
      clients.set(clientKey, { count: 1, resetAt: currentTime + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.resetAt - currentTime) / 1_000),
        ),
      };
    }

    existing.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

export function createChatRequestGate({
  concurrencyLimit = 3,
  dailyLimit = 100,
  now = Date.now,
} = {}) {
  let activeRequests = 0;
  let dailyRequests = 0;
  let resetAt = nextUtcDay(now());

  return () => {
    const currentTime = now();
    if (currentTime >= resetAt) {
      dailyRequests = 0;
      resetAt = nextUtcDay(currentTime);
    }

    if (dailyRequests >= dailyLimit) {
      return {
        allowed: false,
        code: "CHAT_DAILY_LIMIT_REACHED",
        message: "Harry Messenger has reached today's AI limit. Please try again later.",
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - currentTime) / 1_000)),
        statusCode: 429,
      };
    }

    if (activeRequests >= concurrencyLimit) {
      return {
        allowed: false,
        code: "CHAT_BUSY",
        message: "Harry Messenger is busy. Please try again in a moment.",
        retryAfterSeconds: 5,
        statusCode: 503,
      };
    }

    activeRequests += 1;
    dailyRequests += 1;
    let released = false;
    return {
      allowed: true,
      release() {
        if (released) return;
        released = true;
        activeRequests = Math.max(0, activeRequests - 1);
      },
    };
  };
}

function nextUtcDay(timestamp) {
  const date = new Date(timestamp);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );
}

function getClientAddress(request) {
  const remoteAddress = request.socket.remoteAddress ?? "unknown";
  if (!isLoopbackAddress(remoteAddress)) return remoteAddress;

  const realIp = request.headers["x-real-ip"];
  if (typeof realIp === "string" && isPlausibleAddress(realIp)) {
    return realIp.trim();
  }

  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    const firstAddress = forwardedFor.split(",", 1)[0]?.trim();
    if (firstAddress && isPlausibleAddress(firstAddress)) return firstAddress;
  }

  return remoteAddress;
}

function isLoopbackAddress(address) {
  return (
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1"
  );
}

function isPlausibleAddress(address) {
  const trimmed = address.trim();
  return trimmed.length > 0 && trimmed.length <= 64 && /^[0-9a-f:.]+$/i.test(trimmed);
}

function setSecurityHeaders(response) {
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  );
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

function sendJson(response, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": body.byteLength,
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(body);
}

async function resolveFile(requestedFile, distRoot, acceptHeader = "") {
  try {
    const fileStat = await stat(requestedFile);
    if (fileStat.isFile()) return requestedFile;
    if (fileStat.isDirectory()) {
      const directoryIndex = resolve(requestedFile, "index.html");
      if (isInsideDirectory(directoryIndex, distRoot)) {
        const indexStat = await stat(directoryIndex);
        if (indexStat.isFile()) return directoryIndex;
      }
    }
  } catch {
    // A missing extensionless browser route can fall back to the SPA entry.
  }

  if (!extname(requestedFile) && acceptHeader.includes("text/html")) {
    return resolve(distRoot, "index.html");
  }

  return null;
}

function isInsideDirectory(filePath, directory) {
  return filePath === directory || filePath.startsWith(`${directory}${sep}`);
}

function cacheControlFor(filePath) {
  return filePath.endsWith("index.html")
    ? "no-cache"
    : "public, max-age=86400";
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isMainModule) {
  const host = process.env.HOST ?? "127.0.0.1";
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  const chatService = process.env.OPENAI_API_KEY
    ? createOpenAIChatService({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL ?? "gpt-5.6-sol",
        privateProfilePath: process.env.HARRY_PRIVATE_PROFILE_PATH || undefined,
      })
    : null;
  if (chatService) await chatService.ready();
  const server = createPortfolioServer({
    chatService,
    chatRequestGate: createChatRequestGate({
      concurrencyLimit: parsePositiveInteger(
        process.env.CHAT_CONCURRENCY_LIMIT,
        3,
      ),
      dailyLimit: parsePositiveInteger(process.env.CHAT_DAILY_LIMIT, 100),
    }),
    safetySalt: process.env.CHAT_SAFETY_SALT ?? "",
  });

  server.listen(port, host, () => {
    console.log(`Rosebeg XP is listening on http://${host}:${port}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
