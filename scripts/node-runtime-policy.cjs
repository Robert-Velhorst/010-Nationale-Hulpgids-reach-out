function supportedNodeRuntime(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version));
  if (!match) return false;
  const [major, minor, patch] = match.slice(1).map(Number);
  const floor = major === 24 ? [22, 1] : major === 26 ? [12, 1] : null;
  return Boolean(floor && (minor > floor[0] || (minor === floor[0] && patch >= floor[1])));
}
module.exports = { supportedNodeRuntime };
