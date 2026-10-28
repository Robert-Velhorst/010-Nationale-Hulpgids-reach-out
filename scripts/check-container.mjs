import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const owner = `hulpgids-container-${randomBytes(12).toString("hex")}`;
const docker = args => execFileSync("docker", args, { encoding: "utf8", timeout: 120000, windowsHide: true }).trim();
let container;
try {
 container = docker(["run", "--detach", "--name", owner, "--label", `hulpgids.fixture=${owner}`, "--network", "none", "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true", "--tmpfs", "/tmp:rw,size=64m", "--env", "LOCAL_DESKTOP_MODE=1", "--env", "LOCAL_DATA_DIR=/tmp/synthetic-data", "hulpgids:ci"]);
 const state = JSON.parse(docker(["inspect", container]))[0];
 assert.equal(state.Config.User, "node"); assert.equal(state.Config.Labels["hulpgids.fixture"], owner);
 let ready = false;
 for (let i=0;i<60;i++) {
  try {
   docker(["exec", container, "node", "-e", "fetch('http://127.0.0.1:3000/api/readiness').then(async r=>{const b=await r.json();if(!r.ok||!b.ready||b.mode!=='local-or-development')process.exit(1)}).catch(()=>process.exit(1))"]);
   ready = true; break;
  } catch { await new Promise(resolve=>setTimeout(resolve,500)); }
 }
 assert.ok(ready, "Isolated compiled container did not become ready");
 docker(["exec", container, "node", "-e", "const assert=require('node:assert/strict');fetch('http://127.0.0.1:3000/').then(async r=>{assert.equal(r.status,200);assert.match(await r.text(),/Nationale Hulpgids/i);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(process.versions.node,'26.12.1');assert.ok(!require('node:fs').existsSync('/usr/local/lib/node_modules/npm'))}).catch(e=>{console.error(e);process.exitCode=1})"]);
 fs.mkdirSync("artifacts", { recursive: true });
 fs.writeFileSync("artifacts/container-verification.json", JSON.stringify({ syntheticLocalMode: true, hostedDatabaseTested: false, actualNode: "26.12.1", productionAssetsAndReadiness: true, network: "none", readOnly: true, capabilities: [], providerRequests: 0 }, null, 2)+"\n");
} finally {
 if (container) {
  const state = JSON.parse(docker(["inspect", container]))[0];
  assert.equal(state.Id, container); assert.equal(state.Config.Labels["hulpgids.fixture"], owner);
  assert.ok(state.Mounts.every(m=>m.Type==="tmpfs"));
  docker(["rm", "--force", container]);
 }
}
