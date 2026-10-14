const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const command = process.argv[2];
const positional = process.argv
  .slice(3)
  .filter(value => !value.startsWith("--"));
const source = path.resolve(
  process.env.LOCAL_DATA_DIR || path.join(root, ".local-data")
);

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function sha256(file) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex");
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function assertOutsideSource(target) {
  const relative = path.relative(source, target);
  if (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  ) {
    fail("Backup destination must be outside the live local data directory.");
  }
}

function buildManifest(directory) {
  return {
    format: "nationale-hulpgids-local-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    files: listFiles(directory)
      .filter(file => path.basename(file) !== "manifest.json")
      .map(file => ({
        path: path.relative(directory, file).replace(/\\/g, "/"),
        size: fs.statSync(file).size,
        sha256: sha256(file),
      }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
}

function verify(directory) {
  const manifestPath = path.join(directory, "manifest.json");
  if (!fs.existsSync(manifestPath)) fail("Backup manifest.json is missing.");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (
    manifest.format !== "nationale-hulpgids-local-backup" ||
    manifest.version !== 1
  ) {
    fail("Backup manifest format is unsupported.");
  }
  for (const entry of manifest.files) {
    const file = path.resolve(directory, entry.path);
    const relative = path.relative(directory, file);
    if (relative.startsWith("..") || path.isAbsolute(relative))
      fail("Unsafe backup path detected.");
    if (!fs.existsSync(file)) fail(`Backup file missing: ${entry.path}`);
    if (
      fs.statSync(file).size !== entry.size ||
      sha256(file) !== entry.sha256
    ) {
      fail(`Backup integrity check failed: ${entry.path}`);
    }
  }
  process.stdout.write(`Verified ${manifest.files.length} backup files.\n`);
  return manifest;
}

if (command === "backup") {
  if (!fs.existsSync(source))
    fail(`Local data directory does not exist: ${source}`);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.resolve(
    positional[0] || path.join(root, "backups", stamp)
  );
  assertOutsideSource(destination);
  if (fs.existsSync(destination)) fail("Backup destination already exists.");
  fs.cpSync(source, destination, { recursive: true, errorOnExist: true });
  const manifest = buildManifest(destination);
  fs.writeFileSync(
    path.join(destination, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  verify(destination);
  process.stdout.write(`Backup created at ${destination}\n`);
} else if (command === "verify") {
  const backup = positional[0] ? path.resolve(positional[0]) : null;
  if (!backup) fail("Usage: pnpm verify:backup -- <backup-directory>");
  verify(backup);
} else if (command === "restore") {
  const backup = positional[0] ? path.resolve(positional[0]) : null;
  if (!backup || !process.argv.includes("--confirm")) {
    fail("Usage: pnpm restore:local -- <backup-directory> --confirm");
  }
  const manifest = verify(backup);
  fs.mkdirSync(source, { recursive: true });
  for (const entry of manifest.files) {
    const from = path.resolve(backup, entry.path);
    const to = path.resolve(source, entry.path);
    const relative = path.relative(source, to);
    if (relative.startsWith("..") || path.isAbsolute(relative))
      fail("Unsafe restore path detected.");
    fs.mkdirSync(path.dirname(to), { recursive: true });
    const temporary = `${to}.restore-${process.pid}`;
    fs.copyFileSync(from, temporary);
    fs.renameSync(temporary, to);
  }
  process.stdout.write(
    `Restored ${manifest.files.length} files into ${source}.\n`
  );
} else {
  fail(
    "Usage: node scripts/local-data.cjs <backup|verify|restore> [directory] [--confirm]"
  );
}
