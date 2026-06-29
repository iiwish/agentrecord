import fs from "node:fs";
import path from "node:path";

import { loadConfig } from "../core/config.mjs";

export async function runScan({ options }) {
  const config = loadConfig(options);
  const sources = config.resolved.codex.sessionRoots.map((sessionRoot) => {
    const exists = fs.existsSync(sessionRoot);
    return {
      client_id: "codex",
      path: sessionRoot,
      found: exists,
      status: exists ? "available" : "missing",
      rollout_files: exists ? countRolloutFiles(sessionRoot) : 0
    };
  });

  console.log(JSON.stringify({
    ok: true,
    config: {
      path: config.configPath,
      exists: config.exists,
      owner: config.resolved.owner,
      profile_dir: config.resolved.profileDir,
      private_state_dir: config.resolved.privateStateDir,
      locale: config.resolved.report.locale,
      privacy: config.resolved.privacy
    },
    sources
  }, null, 2));
}

function countRolloutFiles(rootDir) {
  let count = 0;
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(target);
      } else if (entry.isFile() && /^rollout-.*\.jsonl$/.test(entry.name)) {
        count += 1;
      }
    }
  }

  return count;
}
