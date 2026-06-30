#!/usr/bin/env node

import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = mkdtempSync(path.join(tmpdir(), "agentrecord-smoke-"));
const packDir = path.join(tempRoot, "pack");
const installDir = path.join(tempRoot, "install");
const expectedVersion = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      npm_config_update_notifier: "false",
      npm_config_fund: "false",
      npm_config_audit: "false"
    }
  });

  if (result.status !== 0) {
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : "";
    const stdout = result.stdout ? `\n${result.stdout.trim()}` : "";
    throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status}${stdout}${stderr}`);
  }

  return result.stdout;
}

function assertEqual(actual, expected, label) {
  if (actual.trim() !== expected) {
    throw new Error(`${label} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual.trim())}`);
  }
}

try {
  mkdirSync(packDir, { recursive: true });
  mkdirSync(installDir, { recursive: true });
  const packOutput = run("npm", ["pack", "--json", "--pack-destination", packDir]);
  const packInfo = JSON.parse(packOutput)[0];
  const tarball = path.join(packDir, packInfo.filename);

  run("npm", ["install", "--ignore-scripts", tarball], { cwd: installDir });

  const bin = path.join(installDir, "node_modules", ".bin", process.platform === "win32" ? "agentrecord.cmd" : "agentrecord");

  assertEqual(run(bin, ["--version"], { cwd: installDir }), expectedVersion, "agentrecord --version");
  assertEqual(run(bin, ["version"], { cwd: installDir }), expectedVersion, "agentrecord version");

  run(bin, ["init", "--dry-run", "--owner", "smoke-owner"], { cwd: installDir });
  run(bin, ["doctor"], { cwd: installDir });

  console.log(JSON.stringify({
    ok: true,
    temp_dir: tempRoot,
    tarball: packInfo.filename,
    version: expectedVersion,
    commands: [
      "agentrecord --version",
      "agentrecord version",
      "agentrecord init --dry-run --owner smoke-owner",
      "agentrecord doctor"
    ]
  }, null, 2));
} finally {
  if (process.env.AGENTRECORD_KEEP_SMOKE_TEMP !== "1") {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
