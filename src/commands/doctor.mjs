import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export async function runDoctor({ version }) {
  const defaultCodexSessionsDir = path.join(os.homedir(), ".codex", "sessions");
  const defaultOpencodeDataDir = path.join(os.homedir(), ".local", "share", "opencode");
  const defaultOpencodeDatabase = path.join(defaultOpencodeDataDir, "opencode.db");
  const defaultClaudeCodeProjectsDir = path.join(os.homedir(), ".claude", "projects");

  console.log(JSON.stringify({
    ok: true,
    package: "agentrecord",
    version,
    node: process.version,
    cwd: process.cwd(),
    config_exists: fs.existsSync(path.resolve(process.cwd(), "agentrecord.config.json")),
    codex_sessions_default: {
      path: defaultCodexSessionsDir,
      exists: fs.existsSync(defaultCodexSessionsDir)
    },
    opencode_default: {
      data_dir: defaultOpencodeDataDir,
      data_dir_exists: fs.existsSync(defaultOpencodeDataDir),
      database_path: defaultOpencodeDatabase,
      database_exists: fs.existsSync(defaultOpencodeDatabase)
    },
    claude_code_default: {
      projects_dir: defaultClaudeCodeProjectsDir,
      projects_dir_exists: fs.existsSync(defaultClaudeCodeProjectsDir)
    }
  }, null, 2));
}
