import { describe, expect, it } from "vitest";
import * as db from "./db";

describe("candidate data quality", () => {
  it("aggregates only the current user's candidate fields by platform", async () => {
    const userId = 100_000 + Math.floor(Math.random() * 1_000_000_000);
    const platform = await db.getPlatformByName("Indeed");
    if (!platform) throw new Error("Missing default Indeed platform");

    const campaignId = await db.createCampaign({
      userId,
      title: `Data quality test ${userId}`,
      description: "Verify source completeness aggregation",
      targetPlatforms: JSON.stringify([platform.id]),
      searchCriteria: JSON.stringify({ location: "Arnhem" }),
      status: "draft",
    });
    await Promise.all([
      db.createCandidate({
        campaignId,
        platformId: platform.id,
        name: "Complete candidate",
        email: `quality-${userId}@example.com`,
        phone: "0612345678",
        profileUrl: `https://example.com/profile/${userId}`,
        location: "Arnhem",
        experience: "Five years of care experience",
        services: "Begeleiding",
        availability: "Weekdays",
        hourlyRate: 2500,
        bio: "Reliable care professional.",
      }),
      db.createCandidate({
        campaignId,
        platformId: platform.id,
        name: "Minimal candidate",
        location: "Arnhem",
      }),
    ]);

    const summary = await db.getCandidateDataQualitySummary(userId);
    const indeed = summary.platforms.find(
      entry => entry.platformId === platform.id
    );

    expect(summary.totalCandidates).toBe(2);
    expect(summary.directContactCandidates).toBe(1);
    expect(summary.fields.email).toBe(1);
    expect(summary.fields.phone).toBe(1);
    expect(indeed).toMatchObject({
      totalCandidates: 2,
      directContactCandidates: 1,
      fields: {
        email: 1,
        profileUrl: 1,
        hourlyRate: 1,
      },
    });
  });
});
