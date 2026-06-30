import fs from "node:fs";
import path from "node:path";

import { renderAgentContextJson, renderAgentContextMarkdown, renderHtml, renderMarkdown, renderRedactionReport, renderRunReport } from "./renderers.mjs";

export function writeArtifacts({ config, profile, evidenceCards, localeBundle, privateState, agentContextEnabled }) {
  const outDir = config.resolved.profileDir;
  fs.writeFileSync(path.join(outDir, "profile.json"), `${JSON.stringify(profile, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "evidence.jsonl"), `${evidenceCards.map((card) => JSON.stringify(card)).join("\n")}\n`);
  fs.writeFileSync(path.join(outDir, "profile.md"), renderMarkdown(profile, localeBundle));
  fs.writeFileSync(path.join(outDir, "index.html"), renderHtml(profile, localeBundle));
  fs.writeFileSync(path.join(outDir, "redaction-report.md"), renderRedactionReport(profile, localeBundle));
  fs.writeFileSync(path.join(outDir, "run-report.md"), renderRunReport(profile, localeBundle));
  if (agentContextEnabled) {
    fs.writeFileSync(path.join(outDir, "agent-context.md"), renderAgentContextMarkdown(profile, localeBundle));
    fs.writeFileSync(path.join(outDir, "agent-context.json"), `${JSON.stringify(renderAgentContextJson(profile), null, 2)}\n`);
  } else {
    removeGeneratedArtifactIfExists(outDir, "agent-context.md");
    removeGeneratedArtifactIfExists(outDir, "agent-context.json");
  }
  fs.writeFileSync(path.join(config.resolved.privateStateDir, "state.json"), `${JSON.stringify(privateState, null, 2)}\n`);
  removeGeneratedArtifactIfExists(outDir, "hiring.html");
  removeGeneratedArtifactIfExists(outDir, "job-agent-profile.md");
}

function removeGeneratedArtifactIfExists(outDir, file) {
  const target = path.join(outDir, file);
  if (fs.existsSync(target)) fs.rmSync(target);
}
