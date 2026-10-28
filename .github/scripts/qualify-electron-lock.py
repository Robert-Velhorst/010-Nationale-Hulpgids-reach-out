"""Owned hosted lock metadata only; never imports application or Electron code."""
import argparse
import datetime
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import urllib.request

assert os.environ.get("GITHUB_ACTIONS") == "true"
assert os.environ.get("GITHUB_REPOSITORY") == "Robert-Velhorst/010-Nationale-Hulpgids-reach-out"
ROOT = Path(__file__).resolve().parents[2]
OUT = Path(os.environ["RUNNER_TEMP"]) / "hulpgids-electron-lock"
OUT.mkdir(exist_ok=True)


def save(name, data):
    (OUT / name).write_text(json.dumps(data, indent=2) + "\n")


def tracked():
    files = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).split(b"\0")
    return {f.decode(): hashlib.sha256((ROOT / f.decode()).read_bytes()).hexdigest()
            for f in files if f and (ROOT / f.decode()).is_file()}


def prepare():
    original = tracked()
    raw = (ROOT / "package.json").read_bytes()
    before = json.loads(raw)
    assert before["devDependencies"]["electron"] == "45.0.0"
    request = urllib.request.Request("https://registry.npmjs.org/electron", headers={"Accept-Encoding": "gzip"})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read(32 * 1024 * 1024 + 1)
        assert len(data) <= 32 * 1024 * 1024
        if response.headers.get("Content-Encoding") == "gzip":
            with gzip.GzipFile(fileobj=io.BytesIO(data)) as decoded:
                data = decoded.read(128 * 1024 * 1024 + 1)
    assert len(data) <= 128 * 1024 * 1024
    registry = json.loads(data)
    stable = [v for v, metadata in registry["versions"].items()
              if re.fullmatch(r"\d+\.\d+\.\d+", v) and not metadata.get("deprecated")]
    target = max(stable, key=lambda v: tuple(map(int, v.split("."))))
    assert target == "45.1.0", "Review a newly published target before substituting it"
    published = datetime.datetime.fromisoformat(registry["time"][target].replace("Z", "+00:00"))
    assert (datetime.datetime.now(datetime.timezone.utc) - published).total_seconds() >= 86400
    with urllib.request.urlopen("https://releases.electronjs.org/releases.json", timeout=60) as response:
        releases = json.load(response)
    runtime = next(row for row in releases if row["version"] == target)
    assert runtime["node"] == "24.22.1"
    old, new = b'"electron": "45.0.0"', b'"electron": "45.1.0"'
    assert raw.count(old) == 1
    candidate = raw.replace(old, new)
    expected = json.loads(raw)
    expected["devDependencies"]["electron"] = target
    assert json.loads(candidate) == expected
    (ROOT / "package.json").write_bytes(candidate)
    save("original-source-hashes.json", original)
    save("input.json", {"checkout": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
         "owner_head": os.environ["GITHUB_SHA"], "target": target,
         "published": published.isoformat(), "registry_response_sha256": hashlib.sha256(data).hexdigest(),
         "published_runtime_metadata": runtime, "release_dist": registry["versions"][target]["dist"],
         "original_package_sha256": hashlib.sha256(raw).hexdigest(),
         "candidate_package_sha256": hashlib.sha256(candidate).hexdigest(),
         "actual_packaged_runtime_acceptance": False})


def resolve():
    command = "pnpm install --lockfile-only --ignore-scripts --no-frozen-lockfile --strict-peer-dependencies"
    with (OUT / "resolve.log").open("wb") as log:
        result = subprocess.run(["bash", "--noprofile", "--norc", "-e", "-o", "pipefail", "-c", command],
                                cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, check=False)
    save("resolve-result.json", {"command": command, "exit_code": result.returncode})
    assert result.returncode == 0, "Normal strict resolution failed; no override or fallback allowed"


def collect():
    original = json.loads((OUT / "original-source-hashes.json").read_bytes())
    after = tracked()
    changed = [p for p in original if original[p] != after.get(p)]
    assert original.keys() == after.keys()
    intended = json.loads((OUT / "input.json").read_bytes())["candidate_package_sha256"]
    assert hashlib.sha256((ROOT / "package.json").read_bytes()).hexdigest() == intended
    for name in ["package.json", "pnpm-lock.yaml"]:
        shutil.copyfile(ROOT / name, OUT / name)
    policy = Path(os.environ["RUNNER_TEMP"]) / "hulpgids-pnpm-policy"
    for phase in ["before", "after"]:
        if (policy / (phase + ".json")).exists():
            shutil.copyfile(policy / (phase + ".json"), OUT / ("policy-" + phase + ".json"))
    save("source-preservation.json", {"original_payloads": len(original), "changed": changed,
         "only_manifest_and_normal_lock_changed": set(changed) <= {"package.json", "pnpm-lock.yaml"},
         "original_cases_helpers_commands_runtime_guard_and_policy_unchanged": set(changed) <= {"package.json", "pnpm-lock.yaml"},
         "full_runtime_or_SDK_acceptance": False})
    assert set(changed) <= {"package.json", "pnpm-lock.yaml"}


parser = argparse.ArgumentParser()
parser.add_argument("mode", choices=["prepare", "resolve", "collect"])
mode = parser.parse_args().mode
{"prepare": prepare, "resolve": resolve, "collect": collect}[mode]()
