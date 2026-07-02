import fs from "node:fs";
import path from "node:path";

import { loadConfig } from "../core/config.mjs";
import { collectClaudeCodeStats, collectOpencodeStats } from "../build/stats.mjs";

export async function runScan({ options }) {
  const config = loadConfig(options);
  const codexSources = config.resolved.codex.sessionRoots.map((sessionRoot) => {
    const exists = fs.existsSync(sessionRoot);
    return {
      client_id: "codex",
      path: sessionRoot,
      found: exists,
      status: exists ? "available" : "missing",
      rollout_files: exists ? countRolloutFiles(sessionRoot) : 0
    };
  });
  const opencodeStats = collectOpencodeStats(config.resolved.opencode, {
    publicProjectPaths: config.resolved.privacy.publicProjectPaths
  });
  const claudeCodeStats = collectClaudeCodeStats(config.resolved.claudeCode, {
    publicProjectPaths: config.resolved.privacy.publicProjectPaths
  });
  const sources = [
    ...codexSources,
    {
      client_id: "opencode",
      path: config.resolved.opencode.databasePath,
      found: opencodeStats.database_found === true,
      status: opencodeStats.status,
      status_reason: opencodeStats.status_reason || null,
      sessions: opencodeStats.files || 0,
      token_sessions: opencodeStats.token_sessions || 0,
      trace_window: {
        start: opencodeStats.trace_window?.start || "unknown",
        end: opencodeStats.trace_window?.end || "unknown"
      }
    },
    {
      client_id: "claude_code",
      path: config.resolved.claudeCode.projectsDir,
      found: claudeCodeStats.projects_dir_found === true,
      status: claudeCodeStats.status,
      status_reason: claudeCodeStats.status_reason || null,
      sessions: claudeCodeStats.files || 0,
      token_sessions: claudeCodeStats.token_sessions || 0,
      trace_window: {
        start: claudeCodeStats.trace_window?.start || "unknown",
        end: claudeCodeStats.trace_window?.end || "unknown"
      }
    }
  ];

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
