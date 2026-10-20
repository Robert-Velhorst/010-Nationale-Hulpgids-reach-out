import { afterEach, describe, expect, it } from "vitest";
import { validateDeploymentConfig } from "./deploymentConfig";

const previousEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  LOCAL_DESKTOP_MODE: process.env.LOCAL_DESKTOP_MODE,
  NODE_ENV: process.env.NODE_ENV,
  OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL,
  VITE_APP_ID: process.env.VITE_APP_ID,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function setHostedProductionEnv() {
  process.env.NODE_ENV = "production";
  delete process.env.LOCAL_DESKTOP_MODE;
  process.env.JWT_SECRET = "test-only-hosted-session-secret-with-enough-length";
  process.env.CREDENTIAL_ENCRYPTION_KEY =
    "test-only-credential-encryption-key-long-enough";
  process.env.DATABASE_URL = "mysql://user:password@example.test/reachout";
  process.env.VITE_APP_ID = "reachout-test-app";
  process.env.OAUTH_SERVER_URL = "https://oauth.example.test";
}

afterEach(() => {
  restoreEnv();
});

describe("deployment configuration validation", () => {
  it("does not require hosted OAuth settings for local desktop production", () => {
    process.env.NODE_ENV = "production";
    process.env.LOCAL_DESKTOP_MODE = "1";
    delete process.env.JWT_SECRET;
    delete process.env.VITE_APP_ID;
    delete process.env.OAUTH_SERVER_URL;

    expect(validateDeploymentConfig()).toEqual({
      status: "local-or-development",
    });
  });

  it("requires OAuth app id and HTTPS OAuth server URL for hosted production", () => {
    setHostedProductionEnv();
    delete process.env.VITE_APP_ID;

    expect(() => validateDeploymentConfig()).toThrow(/VITE_APP_ID/);

    process.env.VITE_APP_ID = "reachout-test-app";
    process.env.OAUTH_SERVER_URL = "http://oauth.example.test";

    expect(() => validateDeploymentConfig()).toThrow(/OAUTH_SERVER_URL.*HTTPS/);
  });

});
