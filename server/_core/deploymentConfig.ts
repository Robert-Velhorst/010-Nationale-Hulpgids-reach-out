import {
  assertHostedProductionSecret,
  isLocalDesktopMode,
} from "./secretPolicy";
import { assertHaiConnectorConfiguration } from "../integrations/haiConnector";

export type DeploymentConfigValidationResult =
  | { status: "local-or-development" }
  | { status: "hosted-production" };

function requireEnv(name: string, purpose: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured for ${purpose}.`);
  }
  return value;
}

function requireHttpsUrl(name: string, purpose: string) {
  const value = requireEnv(name, purpose);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL for ${purpose}.`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS for ${purpose}.`);
  }
  return value;
}

export function validateDeploymentConfig(): DeploymentConfigValidationResult {
  assertHaiConnectorConfiguration();
  if (process.env.NODE_ENV !== "production" || isLocalDesktopMode()) {
    return { status: "local-or-development" };
  }

  assertHostedProductionSecret(
    "JWT_SECRET",
    process.env.JWT_SECRET,
    "sessions"
  );
  assertHostedProductionSecret(
    "CREDENTIAL_ENCRYPTION_KEY",
    process.env.CREDENTIAL_ENCRYPTION_KEY,
    "credential encryption"
  );
  requireEnv("DATABASE_URL", "durable hosted data storage");
  requireEnv("VITE_APP_ID", "hosted OAuth sessions");
  requireHttpsUrl("OAUTH_SERVER_URL", "hosted OAuth sessions");

  return { status: "hosted-production" };
}
