import fs from "node:fs";
import path from "node:path";

import { CONFIG_FILE, createDefaultConfig, defaultOwner, defaultOwnerDisplayName, safePathSegment, writeJson } from "../core/config.mjs";

export async function runInit({ options }) {
  const owner = safePathSegment(options.owner || defaultOwner());
  const ownerDisplayName = options.displayName || options.owner || defaultOwnerDisplayName();
  const profilesDir = options.profilesDir || "profiles";
  const profileDir = options.output || path.join(profilesDir, owner);
  const config = createDefaultConfig({
    owner,
    ownerDisplayName,
    profilesDir,
    locale: options.locale || "auto"
  });

  config.output.profile_dir = profileDir;

  if (options.codexSessionsDir || options.sessionsDir) {
    const sessionsDir = options.codexSessionsDir || options.sessionsDir;
    config.codex.sessions_dir = sessionsDir;
    config.codex.session_roots = [sessionsDir];
  }

  if (typeof options.accountUsage === "boolean") config.codex.account_usage.enabled = options.accountUsage;
  if (options.accountUsageTimeoutMs) config.codex.account_usage.timeout_ms = Number(options.accountUsageTimeoutMs);

  if (options.publicProjectPaths === true) config.privacy.public_project_paths = true;
  if (options.publicProjectPaths === false) config.privacy.public_project_paths = false;
  if (options.privacy) config.privacy.mode = options.privacy;

  const target = path.resolve(process.cwd(), options.config || CONFIG_FILE);

  if (options.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dry_run: true,
      would_write: target,
      config
    }, null, 2));
    return;
  }

  if (fs.existsSync(target) && !options.force) {
    console.log(JSON.stringify({
      ok: true,
      created: false,
      exists: true,
      path: target,
      message: "Config already exists. Use --force to overwrite."
    }, null, 2));
    return;
  }

  writeJson(target, config);
  console.log(JSON.stringify({
    ok: true,
    created: true,
    path: target,
    config
  }, null, 2));
}
