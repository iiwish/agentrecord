import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import { loadConfig } from "../core/config.mjs";

export async function runOpen({ options }) {
  const config = loadConfig(options);
  const htmlFile = path.join(config.resolved.profileDir, "index.html");

  if (!fs.existsSync(htmlFile)) {
    console.error(JSON.stringify({
      ok: false,
      file: htmlFile,
      message: "index.html was not found. Run `agentrecord build` first, then retry `agentrecord open`."
    }, null, 2));
    process.exitCode = 1;
    return;
  }

  const result = await openFile(htmlFile);
  if (!result.ok) {
    console.error(JSON.stringify({
      ok: false,
      file: htmlFile,
      message: result.message,
      fallback: "Open the file manually in a browser."
    }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({
    ok: true,
    file: htmlFile,
    opener: result.opener
  }, null, 2));
}

async function openFile(file) {
  const candidates = openerCandidates(file);
  const failures = [];

  for (const candidate of candidates) {
    const result = await spawnAndWait(candidate.command, candidate.args);
    if (result.ok) return { ok: true, opener: candidate.command };
    failures.push(`${candidate.command}: ${result.message}`);
  }

  return {
    ok: false,
    message: `No supported opener succeeded. ${failures.join(" | ")}`
  };
}

function openerCandidates(file) {
  if (process.platform === "darwin") return [{ command: "open", args: [file] }];
  if (process.platform === "win32") return [{ command: "cmd", args: ["/c", "start", "", file] }];
  return [
    { command: "xdg-open", args: [file] },
    { command: "gio", args: ["open", file] }
  ];
}

function spawnAndWait(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      detached: false,
      stdio: "ignore"
    });

    child.on("error", (error) => {
      resolve({ ok: false, message: error.message });
    });

    child.on("close", (code) => {
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, message: `exited with code ${code}` });
    });
  });
}
