import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { validateDeploymentConfig } from "./deploymentConfig";

export async function getRuntimeReadiness() {
  const checks = {
    configuration: false,
    database: false,
  };
  let mode: "local-or-development" | "hosted-production" =
    "local-or-development";

  try {
    const configuration = validateDeploymentConfig();
    mode = configuration.status;
    checks.configuration = true;
  } catch {
    return { ready: false, mode, checks };
  }

  if (mode === "local-or-development") {
    checks.database = true;
    return { ready: true, mode, checks };
  }

  try {
    const db = await getDb();
    if (db) {
      await db.execute(sql`select 1`);
      checks.database = true;
    }
  } catch {
    checks.database = false;
  }

  return {
    ready: checks.configuration && checks.database,
    mode,
    checks,
  };
}
