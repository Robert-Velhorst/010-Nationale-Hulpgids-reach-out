const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const requireBuilt = process.argv.includes("--built");
const jsonOutput = process.argv.includes("--json");
const localDesktop = ["1", "true"].includes(
  String(process.env.LOCAL_DESKTOP_MODE).toLowerCase()
);
const production = process.env.NODE_ENV === "production";
const hosted = production && !localDesktop;
const ngrok = ["1", "true"].includes(
  String(process.env.NGROK_ENABLED).toLowerCase()
);
const checks = [];

function check(name, ok, level, detail) {
  checks.push({ name, ok: Boolean(ok), level, detail });
}

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
check(
  "node-version",
  nodeMajor >= 22,
  "error",
  `Node ${process.versions.node}; 22+ required`
);
check(
  "lockfile",
  fs.existsSync(path.join(root, "pnpm-lock.yaml")),
  "error",
  "pnpm-lock.yaml is required for deterministic installs"
);
check(
  "dependencies",
  fs.existsSync(path.join(root, "node_modules")),
  "error",
  "Run pnpm install --frozen-lockfile"
);

if (requireBuilt) {
  for (const relative of ["dist/index.js", "dist/public/index.html"]) {
    check(
      `build-${relative}`,
      fs.existsSync(path.join(root, relative)),
      "error",
      `${relative} must exist after pnpm build`
    );
  }
}

if (hosted) {
  for (const name of [
    "DATABASE_URL",
    "JWT_SECRET",
    "CREDENTIAL_ENCRYPTION_KEY",
    "VITE_APP_ID",
    "OAUTH_SERVER_URL",
  ]) {
    const value = process.env[name]?.trim();
    const longSecret = ["JWT_SECRET", "CREDENTIAL_ENCRYPTION_KEY"].includes(
      name
    );
    check(
      `env-${name}`,
      Boolean(value) && (!longSecret || value.length >= 32),
      "error",
      longSecret
        ? `${name} must contain at least 32 characters`
        : `${name} is required`
    );
  }
  if (ngrok) {
    check(
      "env-NGROK_AUTHTOKEN",
      Boolean(process.env.NGROK_AUTHTOKEN?.trim()),
      "error",
      "NGROK_AUTHTOKEN is required when NGROK_ENABLED=true"
    );
  }
} else {
  check(
    "runtime-mode",
    true,
    "info",
    localDesktop ? "local desktop" : "development/local"
  );
}

if (localDesktop && ngrok) {
  check(
    "desktop-tunnel-isolation",
    false,
    "error",
    "Local desktop auto-login must never be exposed through ngrok"
  );
}

const failures = checks.filter(item => !item.ok && item.level === "error");
const result = {
  ok: failures.length === 0,
  mode: localDesktop
    ? "local-desktop"
    : ngrok
      ? "ngrok"
      : production
        ? "production"
        : "development",
  checks,
};

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  for (const item of checks) {
    process.stdout.write(
      `${item.ok ? "PASS" : "FAIL"} ${item.name}: ${item.detail}\n`
    );
  }
  process.stdout.write(`\nDoctor ${result.ok ? "passed" : "failed"}.\n`);
}
process.exitCode = result.ok ? 0 : 1;
