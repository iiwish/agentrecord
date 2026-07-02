import fs from "node:fs";
import path from "node:path";

import { readJsonIfExists } from "../core/config.mjs";
import { dimensionByCanonical, roleByCanonical } from "./catalog.mjs";
import { repoRoot } from "./paths.mjs";
import { snakeId, unique } from "./utils.mjs";

export function loadEvidenceRules(files) {
  const rules = new Map();
  for (const file of files) {
    const parsed = readJsonIfExists(file) || readJsonIfExists(path.join(repoRoot, "references", path.basename(file)));
    if (!Array.isArray(parsed?.rules)) continue;
    for (const rule of parsed.rules) {
      if (!rule?.id) continue;
      rules.set(rule.id, {
        ...rule,
        rule_source_path: `references/${path.basename(file)}`,
        rule_scope: parsed.scope || null
      });
    }
  }
  return [...rules.values()];
}

export function extractMemoryBlocks(file) {
  if (!file || !fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf8").split(/\n/);
  const starts = [];
  lines.forEach((line, index) => {
    if (/^# Task Group: /.test(line)) starts.push(index);
  });

  return starts.map((startIndex, position) => {
    const endIndex = position + 1 < starts.length ? starts[position + 1] - 1 : lines.length - 1;
    const bodyLines = lines.slice(startIndex, endIndex + 1);
    return {
      title: lines[startIndex].replace(/^# Task Group:\s*/, "").trim(),
      body: bodyLines.join("\n"),
      start_line: startIndex + 1,
      end_line: endIndex + 1,
      source: path.basename(file)
    };
  });
}

function matchesRule(block, rule) {
  const text = `${block.title}\n${block.body}`.toLowerCase();
  const includeAll = rule.match?.include_all || [];
  const includeAny = rule.match?.include_any || [];
  const excludeAny = rule.match?.exclude_any || [];
  const allIncluded = includeAll.every((pattern) => text.includes(String(pattern).toLowerCase()));
  const anyIncluded = includeAny.length === 0 || includeAny.some((pattern) => text.includes(String(pattern).toLowerCase()));
  const excluded = excludeAny.some((pattern) => text.includes(String(pattern).toLowerCase()));
  return allIncluded && anyIncluded && !excluded;
}

export function buildEvidenceCards({ stats, rules, memoryBlocks, locale }) {
  const cards = [];

  for (const rule of rules.filter((item) => !item.fallback)) {
    const matches = memoryBlocks.filter((block) => matchesRule(block, rule));
    if (!matches.length) continue;

    cards.push({
      id: rule.id,
      level: rule.evidence_level || ["E3"],
      title: rule.title,
      category: rule.category,
      summary: locale === "zh-CN"
        ? `${rule.signal_template} 已匹配 ${matches.length} 个精选记忆任务组。`
        : `${rule.signal_template} Matched ${matches.length} curated memory task group${matches.length === 1 ? "" : "s"}.`,
      agent_clients: ["codex"],
      dimensions: normalizeDimensionIds(rule.dimensions),
      role_signals: normalizeRoleIds(rule.role_impacts),
      confidence: confidenceFromLevels(rule.evidence_level),
      refs: [
        ...matches.slice(0, 4).map((block) => ({
          type: "memory",
          source: block.source,
          start_line: block.start_line,
          end_line: block.end_line
        })),
        { type: "metadata", source: "codex_session_metadata" }
      ],
      extraction: {
        rule_id: rule.id,
        rule_source_path: rule.rule_source_path,
        rule_scope: rule.rule_scope
      },
      privacy: {
        public_safe: true,
        mode: "summary_only",
        redacted_fields: ["raw prompts", "raw responses", "raw session ids", "terminal bodies", "source bodies"]
      }
    });
  }

  const fallbackRule = rules.find((rule) => rule.fallback);
  if (fallbackRule && (cards.length === 0 || stats.files > 0)) {
    const measuredClients = stats.measured_clients?.length ? stats.measured_clients : ["codex"];
    const metadataRefs = measuredClients.map((client) => ({
      type: "metadata",
      source: metadataSourceForClient(client)
    }));
    cards.push({
      id: fallbackRule.id,
      level: fallbackRule.evidence_level || ["E2"],
      title: fallbackRule.title,
      category: fallbackRule.category,
      summary: locale === "zh-CN"
        ? `${fallbackRule.signal_template} 已扫描 ${stats.files} 个本地 AI Agent 会话，覆盖 ${measuredClients.join("、")}，涉及 ${stats.top_projects.length} 个脱敏项目。`
        : `${fallbackRule.signal_template} Scanned ${stats.files} local AI-agent sessions across ${measuredClients.join(", ")} and ${stats.top_projects.length} redacted project references.`,
      agent_clients: measuredClients,
      dimensions: normalizeDimensionIds(fallbackRule.dimensions),
      role_signals: normalizeRoleIds(fallbackRule.role_impacts),
      confidence: stats.files > 0 ? "medium" : "low",
      refs: metadataRefs.length ? metadataRefs : [{ type: "metadata", source: "agent_activity_metadata" }],
      extraction: {
        rule_id: fallbackRule.id,
        rule_source_path: fallbackRule.rule_source_path,
        rule_scope: fallbackRule.rule_scope
      },
      privacy: {
        public_safe: true,
        mode: "aggregate_only",
        redacted_fields: ["raw session ids", "session file paths", "private project paths"]
      }
    });
  }

  return cards;
}

function metadataSourceForClient(client) {
  if (client === "opencode") return "opencode_session_metadata";
  if (client === "claude_code") return "claude_code_session_metadata";
  return "codex_session_metadata";
}

function normalizeDimensionIds(values = []) {
  return unique(values.map((value) => dimensionByCanonical.get(String(value).toLowerCase()) || snakeId(value)));
}

function normalizeRoleIds(values = []) {
  return unique(values.map((value) => roleByCanonical.get(String(value).toLowerCase()) || snakeId(value)));
}

function confidenceFromLevels(levels = []) {
  if (levels.includes("E1") && levels.includes("E2")) return "high";
  if (levels.includes("E1") || levels.includes("E2")) return "medium";
  if (levels.includes("E3")) return "medium";
  return "low";
}
