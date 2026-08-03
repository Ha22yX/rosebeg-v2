import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
        sendJson(response, 501, {
          code: "AI_NOT_CONFIGURED",
          message: "Harry Messenger is not connected to an AI service yet.",
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
  const server = createPortfolioServer();

  server.listen(port, host, () => {
    console.log(`Rosebeg XP is listening on http://${host}:${port}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
