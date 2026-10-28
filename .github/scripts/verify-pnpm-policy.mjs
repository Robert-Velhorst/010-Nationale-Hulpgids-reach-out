import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

assert.equal(process.env.GITHUB_ACTIONS, 'true', 'This check runs on the owned CI worker');
assert.equal(process.env.GITHUB_REPOSITORY, 'Robert-Velhorst/010-Nationale-Hulpgids-reach-out');
const phase = process.argv[2];
assert.ok(['before', 'after'].includes(phase));

function pnpm(args) {
  assert.ok(args.every(value => /^[A-Za-z0-9-]+$/.test(value)));
  const options = {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']};
  return (process.platform === 'win32'
    ? execFileSync('cmd.exe', ['/d', '/s', '/c', ['pnpm', ...args].join(' ')], options)
    : execFileSync('pnpm', args, options)).trim();
}

const expected = {
  minimumReleaseAge: 1440,
  minimumReleaseAgeStrict: true,
  minimumReleaseAgeIgnoreMissingTime: false,
  minimumReleaseAgeExclude: [],
  strictPeerDependencies: true,
  trustLockfile: false,
  verifyStoreIntegrity: true,
};
const policy = {};
for (const key of Object.keys(expected)) {
  const value = pnpm(['config', 'get', key, '--json']);
  policy[key] = value === 'undefined' || value === '' ? null : JSON.parse(value);
}
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const declared = /^pnpm@([^+]+)/.exec(manifest.packageManager)?.[1];
const record = {
  phase,
  checkout: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
  actualNode: process.version,
  actualPnpm: pnpm(['--version']),
  declaredPnpm: declared,
  workspaceSha256: createHash('sha256').update(readFileSync('pnpm-workspace.yaml')).digest('hex'),
  policy,
};
const directory = path.join(process.env.RUNNER_TEMP, 'hulpgids-pnpm-policy');
mkdirSync(directory, {recursive: true});
writeFileSync(path.join(directory, `${phase}.json`), `${JSON.stringify(record, null, 2)}\n`);
assert.deepEqual(policy, expected, 'The effective policy must match every explicit requirement');
assert.equal(record.actualPnpm, declared, 'CI must use the package manager declared by this source');
if (phase === 'after') {
  const before = JSON.parse(readFileSync(path.join(directory, 'before.json'), 'utf8'));
  assert.equal(record.workspaceSha256, before.workspaceSha256, 'Installation must not rewrite the policy');
  assert.deepEqual(record.policy, before.policy);
  assert.equal(record.actualPnpm, before.actualPnpm);
  assert.equal(record.checkout, before.checkout);
}
console.log(JSON.stringify({phase, actualPnpm: record.actualPnpm, policy}));
