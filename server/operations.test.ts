import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import { appRouter } from "./routers";
import { resetApiLimit } from "./services/rateLimiter";
import type { TrpcContext } from "./_core/context";

const userId = 910_000_001;
const otherUserId = 910_000_002;

function user(id: number): User {
  const now = new Date();
  return {
    id,
    openId: `operations-${id}`,
    name: `Operations ${id}`,
    email: `operations-${id}@example.test`,
    loginMethod: "test",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

function context(id: number): TrpcContext {
  return {
    user: user(id),
    req: { headers: {}, protocol: "http", get: () => undefined } as any,
    res: { clearCookie: () => undefined } as any,
  };
}

beforeEach(async () => {
  await Promise.all([resetApiLimit(userId), resetApiLimit(otherUserId)]);
  for (const id of [userId, otherUserId]) {
    const caller = appRouter.createCaller(context(id));
    await caller.operations.setControl({
      outreachPaused: false,
      retentionDays: 365,
    });
  }
});

describe("operator controls and privacy", () => {
  it("keeps pause state scoped to the current user", async () => {
    const owner = appRouter.createCaller(context(userId));
    const other = appRouter.createCaller(context(otherUserId));

    await owner.operations.setControl({
      outreachPaused: true,
      reason: "Provider compliance review",
      retentionDays: 180,
    });

    const [ownerOverview, otherOverview] = await Promise.all([
      owner.operations.overview(),
      other.operations.overview(),
    ]);
    expect(ownerOverview.operatorControl).toMatchObject({
      outreachPaused: true,
      pauseReason: "Provider compliance review",
      retentionDays: 180,
    });
    expect(otherOverview.operatorControl.outreachPaused).toBe(false);
  });

  it("blocks consequential work while the global stop is active", async () => {
    const caller = appRouter.createCaller(context(userId));
    await caller.operations.setControl({
      outreachPaused: true,
      reason: "Emergency provider stop",
      retentionDays: 365,
    });

    await expect(
      caller.candidates.discover({
        campaignId: 999_999,
        platforms: ["Nationale Hulpgids"],
        searchCriteria: { location: "Arnhem" },
      })
    ).rejects.toThrow(/globally paused/i);
  });

  it("exports current-user data without credential secrets", async () => {
    const caller = appRouter.createCaller(context(userId));
    const secret = "never-export-this-password";
    await caller.platformCredentials.save({
      platformId: 2,
      email: "operator@example.test",
      password: secret,
    });

    const exported = await caller.operations.exportMyData({
      personalDataAcknowledged: true,
    });
    const serialized = JSON.stringify(exported);
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain("encryptedPassword");
    expect(serialized).not.toContain("sessionData");
    expect(exported.scope).toBe("current-user");
    expect(exported).toEqual(
      expect.objectContaining({
        matchFactors: expect.any(Array),
        followUps: expect.any(Array),
        candidateIdentities: expect.any(Array),
        candidateSources: expect.any(Array),
        campaignReadinessChecks: expect.any(Array),
        messageApprovals: expect.any(Array),
        messageSendAttempts: expect.any(Array),
        candidateQualificationDecisions: expect.any(Array),
        candidateDuplicateResolutions: expect.any(Array),
        queueJobs: expect.any(Array),
        rateLimitEvents: expect.any(Array),
        credentialEvents: expect.any(Array),
        auditEvents: expect.any(Array),
        messageSnippets: expect.any(Array),
      })
    );
  });

  it("requires outreach pause before destructive deletion", async () => {
    const caller = appRouter.createCaller(context(userId));
    await expect(
      caller.operations.deleteMyData({ confirmation: "DELETE MY DATA" })
    ).rejects.toThrow(/Pause outreach/i);

    await caller.operations.setControl({
      outreachPaused: true,
      reason: "Preparing account deletion",
      retentionDays: 365,
    });
    await expect(
      caller.operations.deleteMyData({ confirmation: "DELETE MY DATA" })
    ).resolves.toEqual({ success: true, deleted: true });
  });
});
