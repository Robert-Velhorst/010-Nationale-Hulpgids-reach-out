const http = require("node:http");

const upstream = process.env.REACHOUT_HAI_URL?.trim();
const token = process.env.REACHOUT_HAI_TOKEN?.trim();
const host = process.env.HAI_PROXY_HOST?.trim() || "127.0.0.1";
const port = Number.parseInt(process.env.HAI_PROXY_PORT || "39411", 10);
const maxBytes = 1024 * 1024;

if (!upstream || !/^https?:\/\//i.test(upstream)) {
  throw new Error(
    "REACHOUT_HAI_URL must be an absolute HTTP(S) Reach-Out feed URL"
  );
}
if (!token || token.length < 32 || /[\r\n]/.test(token)) {
  throw new Error(
    "REACHOUT_HAI_TOKEN must contain at least 32 non-newline characters"
  );
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("HAI_PROXY_PORT must be a valid TCP port");
}

function json(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(value));
}

function validFeed(value) {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray(value.items) &&
    value.items.length <= 101 &&
    value.items.every(
      item =>
        item &&
        typeof item.externalId === "string" &&
        typeof item.title === "string" &&
        typeof item.content === "string"
    ) &&
    typeof value.nextCursor === "string"
  );
}

async function fetchFeed(cursor) {
  const target = new URL(upstream);
  if (cursor) target.searchParams.set("cursor", cursor);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 8000);
  try {
    const response = await fetch(target, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      redirect: "error",
      signal: abortController.signal,
    });
    if (!response.ok) {
      throw new Error(`Reach-Out feed returned HTTP ${response.status}`);
    }
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxBytes)
      throw new Error("Reach-Out feed is too large");
    const body = await response.text();
    if (Buffer.byteLength(body) > maxBytes)
      throw new Error("Reach-Out feed is too large");
    const value = JSON.parse(body);
    if (!validFeed(value))
      throw new Error("Reach-Out feed has an invalid contract");
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || "localhost"}`
  );
  if (request.method !== "GET") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }
  if (url.pathname === "/health") {
    json(response, 200, {
      ok: true,
      mode: "hai-json-feed-proxy",
      upstreamConfigured: true,
    });
    return;
  }
  if (url.pathname !== "/feed") {
    json(response, 404, { error: "Not found" });
    return;
  }
  try {
    json(response, 200, await fetchFeed(url.searchParams.get("cursor") || ""));
  } catch (error) {
    json(response, 502, {
      error: error instanceof Error ? error.message : "Reach-Out feed failed",
    });
  }
});

server.listen(port, host, () => {
  console.log(`HAI connector proxy listening on http://${host}:${port}/feed`);
});
