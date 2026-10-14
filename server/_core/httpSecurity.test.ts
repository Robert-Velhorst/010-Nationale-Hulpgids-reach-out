import express from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  applySecurityHeaders,
  requireSameOriginForMutation,
} from "./httpSecurity";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(resolve => server.close(() => resolve()))
    )
  );
});

async function createTestOrigin() {
  const app = express();
  app.use(applySecurityHeaders);
  app.use(requireSameOriginForMutation);
  app.all("/test", (_req, res) => res.json({ ok: true }));
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  return `http://127.0.0.1:${address.port}`;
}

describe("HTTP security", () => {
  it("sets browser hardening headers", async () => {
    const origin = await createTestOrigin();
    const response = await fetch(`${origin}/test`);
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'"
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("allows same-origin mutations and blocks cross-origin mutations", async () => {
    const origin = await createTestOrigin();
    const allowed = await fetch(`${origin}/test`, {
      method: "POST",
      headers: { origin },
    });
    const blocked = await fetch(`${origin}/test`, {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    });
    expect(allowed.status).toBe(200);
    expect(blocked.status).toBe(403);
  });
});
