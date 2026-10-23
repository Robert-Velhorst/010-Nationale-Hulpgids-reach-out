import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { supportedNodeRuntime } = require("../../scripts/node-runtime-policy.cjs");
const { inspectEmbeddedRuntime } = require("../../scripts/verify-packaged-runtime.cjs");
describe("patched runtime baseline", () => {
  it.each(["24.22.1", "24.23.0", "26.12.1", "26.13.0"])("accepts %s", version => expect(supportedNodeRuntime(version)).toBe(true));
  it.each(["24.22.0", "26.12.0", "22.23.4", "27.0.0", "26.12.1-rc.1", "invalid", ""])("rejects %s", version => expect(supportedNodeRuntime(version)).toBe(false));
  it("rejects old embedded Node even when the Electron release matches", () => {
    expect(inspectEmbeddedRuntime({ electron: "45.0.0", node: "24.22.0" }, "45.0.0").passed).toBe(false);
  });
  it("rejects an unexpected Electron binary", () => {
    expect(inspectEmbeddedRuntime({ electron: "44.9.0", node: "26.12.1" }, "45.0.0").passed).toBe(false);
  });
});
