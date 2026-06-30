#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { runBuild } from "./commands/build.mjs";
import { runDoctor } from "./commands/doctor.mjs";
import { runInit } from "./commands/init.mjs";
import { runOpen } from "./commands/open.mjs";
import { runScan } from "./commands/scan.mjs";
import { runValidate } from "./commands/validate.mjs";
import { parseArgs } from "./core/args.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const VERSION = packageJson.version;

const help = `AgentRecord ${VERSION}

Local-first, auditable AI work profiles from agent traces.

Usage:
  agentrecord --help
  agentrecord --version
  agentrecord doctor
  agentrecord init [--dry-run] [--owner <name>] [--profiles-dir <dir>] [--output <dir>]
  agentrecord scan [--config <file>] [--sessions-dir <dir>]
  agentrecord build [--config <file>] [--agent-context] [--no-account-usage]
  agentrecord validate [--config <file>]
  agentrecord open [--config <file>] [--owner <owner>]

Commands:
  agentrecord doctor     Check local runtime and source availability
  agentrecord init       Create agentrecord.config.json
  agentrecord scan       Discover local AI-agent trace sources
  agentrecord build      Generate profile.json, evidence.jsonl, and HTML report
  agentrecord validate   Check schema, privacy boundary, and report integrity
  agentrecord open       Open profiles/<owner>/index.html

Build options:
  --no-account-usage                    Skip Codex CLI account usage lookup
  --account-usage-timeout-ms <ms>       Timeout for Codex CLI account usage lookup
`;

const { options, positional } = parseArgs(process.argv.slice(2));
const command = positional[0];

if (options.version || command === "version") {
  console.log(VERSION);
  process.exit(0);
}

if (options.help || !command || command === "help") {
  console.log(help);
  process.exit(0);
}

const commands = {
  doctor: runDoctor,
  init: runInit,
  scan: runScan,
  build: runBuild,
  validate: runValidate,
  open: runOpen
};

const handler = commands[command];

if (handler) {
  await handler({
    version: VERSION,
    options,
    args: positional.slice(1)
  });
  process.exit(process.exitCode || 0);
}

console.error(`Unknown command: ${command}`);
console.error("Run `agentrecord --help` for usage.");
process.exit(1);
