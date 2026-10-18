import { afterEach, describe, expect, it } from "vitest";
import * as db from "../db";
import {
  assertHaiConnectorConfiguration,
  buildHaiFeed,
  getHaiConnectorStatus,
} from "./haiConnector";

const original = {
  enabled: process.env.HAI_CONNECTOR_ENABLED,
  token: process.env.HAI_CONNECTOR_TOKEN,
  userId: process.env.HAI_CONNECTOR_USER_ID,
  local: process.env.LOCAL_DESKTOP_MODE,
};

afterEach(() => {
  for (const [name, value] of Object.entries({
    HAI_CONNECTOR_ENABLED: original.enabled,
    HAI_CONNECTOR_TOKEN: original.token,
    HAI_CONNECTOR_USER_ID: original.userId,
    LOCAL_DESKTOP_MODE: original.local,
  })) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("HAI connector", () => {
  it("fails closed when an enabled connector lacks scoped credentials", () => {
    process.env.HAI_CONNECTOR_ENABLED = "true";
    delete process.env.HAI_CONNECTOR_TOKEN;
    delete process.env.HAI_CONNECTOR_USER_ID;
    delete process.env.LOCAL_DESKTOP_MODE;

    expect(getHaiConnectorStatus()).toMatchObject({
      enabled: true,
      configured: false,
    });
    expect(() => assertHaiConnectorConfiguration()).toThrow(
      /HAI_CONNECTOR_TOKEN.*HAI_CONNECTOR_USER_ID/
    );
  });

  it("emits a bounded aggregate feed without candidate or credential data", async () => {
    const userId = 920_000_001;
    await db.deleteUserData(userId);
    const campaignId = await db.createCampaign({
      userId,
      title: "Arnhem care outreach",
      description: "This private description must not reach HAI",
      targetPlatforms: JSON.stringify([2]),
      searchCriteria: JSON.stringify({ location: "Arnhem" }),
      status: "active",
    });
    await db.createCandidate({
      campaignId,
      platformId: 2,
      name: "Private Candidate Name",
      email: "private-candidate@example.test",
      compatibilityScore: 90,
      status: "matched",
    });

    const feed = await buildHaiFeed(userId);
    const serialized = JSON.stringify(feed);
    expect(feed.items).toHaveLength(2);
    expect(feed.items.map(item => item.externalId)).toContain(
      `reachout:campaign:${campaignId}`
    );
    expect(serialized).not.toContain("Private Candidate Name");
    expect(serialized).not.toContain("private-candidate@example.test");
    expect(serialized).not.toContain("This private description");
    expect(serialized).toContain("candidate_pii=false");

    const unchanged = await buildHaiFeed(userId, feed.nextCursor);
    expect(unchanged.items).toEqual([]);
    expect(unchanged.nextCursor).toBe(feed.nextCursor);
  });
});
