import { afterEach, describe, expect, it } from "vitest";
import { getRuntimeReadiness } from "./runtimeReadiness";

const previous = {
  NODE_ENV: process.env.NODE_ENV,
  LOCAL_DESKTOP_MODE: process.env.LOCAL_DESKTOP_MODE,
};

afterEach(() => {
  process.env.NODE_ENV = previous.NODE_ENV;
  process.env.LOCAL_DESKTOP_MODE = previous.LOCAL_DESKTOP_MODE;
});

describe("runtime readiness", () => {
  it("treats the self-contained desktop data store as ready", async () => {
    process.env.NODE_ENV = "production";
    process.env.LOCAL_DESKTOP_MODE = "1";
    await expect(getRuntimeReadiness()).resolves.toEqual({
      ready: true,
      mode: "local-or-development",
      checks: { configuration: true, database: true },
    });
  });
});
