import fs from "node:fs";
import path from "node:path";

import { CONFIG_FILE, loadConfig, readJsonIfExists, resolvePath } from "../core/config.mjs";
import { runBuild } from "./build.mjs";
import { runInit } from "./init.mjs";
import { runOpen } from "./open.mjs";
import { runValidate } from "./validate.mjs";

export async function runGenerate({ version, options }) {
  const configPath = resolvePath(options.config || process.env.AGENTRECORD_CONFIG || CONFIG_FILE);
  const configExists = fs.existsSync(configPath);
  const verbose = options.verbose === true;
  const generateOptions = {
    ...options,
    config: configPath
  };

  if (!configExists) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    if (!await runStep({ verbose }, () => runInit({ version, options: generateOptions, args: [] }))) return;
  }

  if (!await runStep({ verbose }, () => runBuild({ version, options: generateOptions, args: [] }))) return;
  if (!await runStep({ verbose }, () => runValidate({ version, options: generateOptions, args: [] }))) return;

  if (options.open === true) {
    if (!await runStep({ verbose }, () => runOpen({ version, options: generateOptions, args: [] }))) return;
  }

  const config = loadConfig(generateOptions);
  const profile = readJsonIfExists(path.join(config.resolved.profileDir, "profile.json"));
  const shareCard = profile?.share_card || null;
  console.log(JSON.stringify({
    ok: true,
    command: "generate",
    config: {
      path: configPath,
      created: !configExists
    },
    profile_dir: config.resolved.profileDir,
    index_html: path.join(config.resolved.profileDir, "index.html"),
    opened: options.open === true,
    sessions_scanned: profile?.run_metadata?.total_sessions_seen ?? null,
    report_locale: profile?.report?.locale || null,
    share_card: shareCard ? {
      code: shareCard.code,
      state: shareCard.state,
      name: shareCard.chinese_name || shareCard.name || shareCard.code
    } : null
  }, null, 2));
}

async function runStep({ verbose }, callback) {
  if (verbose) {
    await callback();
    return !process.exitCode;
  }

  const originalLog = console.log;
  const originalError = console.error;
  const stdout = [];
  const stderr = [];

  console.log = (...args) => stdout.push(args.join(" "));
  console.error = (...args) => stderr.push(args.join(" "));
  try {
    await callback();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  if (process.exitCode) {
    for (const line of stdout) originalLog(line);
    for (const line of stderr) originalError(line);
    return false;
  }
  return true;
}
