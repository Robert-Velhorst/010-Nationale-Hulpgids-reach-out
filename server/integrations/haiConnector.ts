import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import * as db from "../db";

const MAX_CAMPAIGNS = 100;
const MIN_TOKEN_LENGTH = 32;

function isEnabled(value: string | undefined) {
  return value === "1" || value === "true";
}

function bounded(value: string | null | undefined, max: number) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function connectorUserId() {
  const raw = process.env.HAI_CONNECTOR_USER_ID?.trim();
  if (!raw && isEnabled(process.env.LOCAL_DESKTOP_MODE)) return 1;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getHaiConnectorStatus() {
  const enabled = isEnabled(process.env.HAI_CONNECTOR_ENABLED);
  const token = process.env.HAI_CONNECTOR_TOKEN?.trim() ?? "";
  const userId = connectorUserId();
  const errors: string[] = [];
  if (enabled && token.length < MIN_TOKEN_LENGTH) {
    errors.push(
      `HAI_CONNECTOR_TOKEN must contain at least ${MIN_TOKEN_LENGTH} characters`
    );
  }
  if (enabled && userId === null) {
    errors.push(
      "HAI_CONNECTOR_USER_ID must identify one positive numeric user id"
    );
  }
  return {
    enabled,
    configured: enabled && errors.length === 0,
    mode: "read-only aggregate JSON feed" as const,
    feedPath: "/api/integrations/hai/feed",
    userIdConfigured: userId !== null,
    errors,
  };
}

export function assertHaiConnectorConfiguration() {
  const status = getHaiConnectorStatus();
  if (status.enabled && !status.configured) {
    throw new Error(
      `HAI connector configuration is invalid: ${status.errors.join("; ")}.`
    );
  }
  return status;
}

function tokenMatches(candidate: string) {
  const expected = process.env.HAI_CONNECTOR_TOKEN?.trim() ?? "";
  if (
    expected.length < MIN_TOKEN_LENGTH ||
    candidate.length !== expected.length
  ) {
    return false;
  }
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

function requestToken(request: Request) {
  const authorization = request.get("authorization") ?? "";
  const [scheme, value] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() === "bearer" && value) return value;
  return request.get("x-hai-connector-token") ?? "";
}

function campaignDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function buildHaiFeed(userId: number, cursor?: string) {
  const [campaigns, control] = await Promise.all([
    db.getUserCampaigns(userId),
    db.getUserOperatorControl(userId),
  ]);
  const cursorDate = campaignDate(cursor);
  const campaignCounts = campaigns.reduce<Record<string, number>>(
    (counts, campaign) => {
      counts[campaign.status] = (counts[campaign.status] ?? 0) + 1;
      return counts;
    },
    {}
  );
  const items = [
    {
      externalId: "reachout:operations",
      title: "Nationale Hulpgids Reach-Out operations",
      content: `Outreach is ${control.outreachPaused === 1 ? "paused" : "active"}. ${campaigns.length} campaign(s) are registered; ${campaignCounts.active ?? 0} active, ${campaignCounts.paused ?? 0} paused, and ${campaignCounts.archived ?? 0} archived. Retention target: ${control.retentionDays} days. External delivery remains human-approved and evidence-backed.`,
      sourceUri: "reachout://operations",
      itemType: "reachout_operations",
      projectKey: "nationale-hulpgids",
      metadata:
        "connector=nationale-hulpgids-reachout;read_only=true;aggregate_only=true;candidate_pii=false",
      updatedAt: campaignDate(control.updatedAt) ?? new Date(0),
    },
    ...campaigns
      .slice()
      .sort((left, right) => right.id - left.id)
      .slice(0, MAX_CAMPAIGNS)
      .map(campaign => {
        const nextExecution = campaignDate(campaign.nextExecutionAt);
        return {
          externalId: `reachout:campaign:${campaign.id}`,
          title: bounded(campaign.title, 180) || `Campaign ${campaign.id}`,
          content: `Campaign status is ${campaign.status}. Scheduling is ${campaign.isScheduled === 1 ? "enabled" : "disabled"}${nextExecution ? `; next execution is ${nextExecution.toISOString()}` : ""}. Outreach is ${control.outreachPaused === 1 ? "globally paused" : "operator-controlled"}. Candidate personal data and message bodies are excluded from this connector.`,
          sourceUri: `reachout://campaign/${campaign.id}`,
          itemType: "reachout_campaign",
          projectKey: "nationale-hulpgids",
          metadata: `connector=nationale-hulpgids-reachout;read_only=true;aggregate_only=true;campaign_id=${campaign.id};status=${bounded(campaign.status, 40)}`,
          updatedAt: campaignDate(campaign.updatedAt) ?? new Date(0),
        };
      }),
  ];
  const changedItems = cursorDate
    ? items.filter(item => item.updatedAt > cursorDate)
    : items;
  const latest = items.reduce(
    (value, item) => (item.updatedAt > value ? item.updatedAt : value),
    new Date(0)
  );
  return {
    items: changedItems.map(({ updatedAt: _updatedAt, ...item }) => item),
    nextCursor: latest.toISOString(),
  };
}

export async function handleHaiFeed(request: Request, response: Response) {
  const status = getHaiConnectorStatus();
  response.setHeader("Cache-Control", "no-store");
  if (!status.enabled) {
    response.status(404).json({ error: "HAI connector is disabled" });
    return;
  }
  if (!status.configured) {
    response.status(503).json({ error: "HAI connector is not configured" });
    return;
  }
  if (!tokenMatches(requestToken(request))) {
    response.setHeader("WWW-Authenticate", 'Bearer realm="reachout-hai"');
    response.status(401).json({ error: "HAI connector authorization failed" });
    return;
  }

  const userId = connectorUserId()!;
  const feed = await buildHaiFeed(userId, String(request.query.cursor ?? ""));
  await db.createAuditEvent({
    userId,
    entityType: "integration",
    entityId: userId,
    action: "integration.hai_feed_read",
    actor: "system",
    source: "haiConnector",
    riskLevel: "low",
    afterState: JSON.stringify({
      itemCount: feed.items.length,
      aggregateOnly: true,
      candidatePiiIncluded: false,
    }),
  });
  response.json(feed);
}
