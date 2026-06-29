import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export async function runDoctor({ version }) {
  const defaultCodexSessionsDir = path.join(os.homedir(), ".codex", "sessions");

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
    }
  }, null, 2));
}
