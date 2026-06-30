import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../core/config.mjs";
import { writeArtifacts } from "../build/artifacts.mjs";
import { readCodexAccountUsage } from "../build/codex-account.mjs";
import { buildEvidenceCards, extractMemoryBlocks, loadEvidenceRules } from "../build/evidence.mjs";
import { buildProfile } from "../build/profile.mjs";
import { loadLocaleBundle, resolveReportSettings } from "../build/report.mjs";
import { buildRunContext } from "../build/run-context.mjs";
import { collectCodexStats } from "../build/stats.mjs";
import { ensureDir, hashObject } from "../build/utils.mjs";

export async function runBuild({ options }) {
  const config = loadConfig(options);
  const generatedAt = new Date().toISOString();
  const agentContextEnabled = options.agentContext === true;
  ensureDir(config.resolved.profileDir);
  ensureDir(config.resolved.privateStateDir);

  const stats = collectCodexStats(config.resolved.codex.sessionRoots, {
    publicProjectPaths: config.resolved.privacy.publicProjectPaths
  });
  const codexAccountUsage = await readCodexAccountUsage(config.resolved.codex.accountUsage);
  const report = resolveReportSettings(config, stats, generatedAt);
  const localeBundle = loadLocaleBundle(report.locale);

  let rulePaths = config.resolved.evidenceRulesPaths;
  if (report.locale === "zh-CN") {
    rulePaths = rulePaths.map((filePath) => {
      const parent = path.dirname(filePath);
      const ext = path.extname(filePath);
      const base = path.basename(filePath, ext);
      const zhPath = path.join(parent, `${base}.zh-CN${ext}`);
      return fs.existsSync(zhPath) ? zhPath : filePath;
    });
  }
  const rules = loadEvidenceRules(rulePaths);

  const memoryBlocks = config.resolved.memory.enabled ? extractMemoryBlocks(config.resolved.memory.registryPath) : [];
  const evidenceCards = buildEvidenceCards({ stats, rules, memoryBlocks, locale: report.locale });
  const runContext = buildRunContext({ config, stats, generatedAt, reset: Boolean(options.reset) });
  const profile = buildProfile({
    config,
    stats,
    codexAccountUsage,
    evidenceCards,
    report,
    localeBundle,
    runMetadata: runContext.public,
    agentContextEnabled
  });

  runContext.privateState.last_profile_hash = hashObject(profile);
  writeArtifacts({ config, profile, evidenceCards, localeBundle, privateState: runContext.privateState, agentContextEnabled });

  console.log(JSON.stringify({
    ok: true,
    out_dir: config.resolved.profileDir,
    owner: config.resolved.owner,
    schema_version: profile.schema_version,
    sessions_scanned: stats.files,
    codex_account_usage: codexAccountUsage.status,
    evidence_cards: evidenceCards.length,
    report_locale: report.locale,
    artifacts: [
      "profile.json",
      "evidence.jsonl",
      "index.html",
      "profile.md",
      "redaction-report.md",
      "run-report.md",
      ...(agentContextEnabled ? ["agent-context.md", "agent-context.json"] : [])
    ]
  }, null, 2));
}
