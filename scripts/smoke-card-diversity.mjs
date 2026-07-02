#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dimensions, dimensionByCanonical, roles, roleByCanonical } from "../src/build/catalog.mjs";
import { buildAbilityModel, buildRoleSignals } from "../src/build/profile.mjs";
import { buildShareCard, SHARE_CARD_ARCHETYPES } from "../src/build/share-card.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localeBundle = { roles: {}, abilities: {} };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeDimensions(values = []) {
  return values.map((value) => dimensionByCanonical.get(String(value).toLowerCase())).filter(Boolean);
}

function normalizeRoles(values = []) {
  return values.map((value) => roleByCanonical.get(String(value).toLowerCase())).filter(Boolean);
}

function roleSignalsFromScores(scores) {
  return roles.map((role) => ({
    role_id: role.id,
    label: role.id,
    score: scores[role.id] ?? 35,
    evidence_ids: ["EV-SYNTHETIC-DIRECT"]
  }));
}

function abilityModelFromScores(scores) {
  return dimensions.map((dimension) => ({
    dimension_id: dimension.id,
    label: dimension.id,
    score: scores[dimension.id] ?? 35,
    evidence_ids: ["EV-SYNTHETIC-DIRECT"]
  }));
}

function maxSet(target, key, value) {
  target[key] = Math.max(target[key] ?? 35, value);
}

function syntheticInputForCode(code) {
  const roleScores = Object.fromEntries(roles.map((role) => [role.id, 35]));
  const abilityScores = Object.fromEntries(dimensions.map((dimension) => [dimension.id, 35]));
  const [focus, execution, quality, scope] = code.split("");

  if (focus === "S") {
    maxSet(roleScores, "systems_thinker", 100);
    maxSet(abilityScores, "context_packaging", 90);
    maxSet(abilityScores, "scope_control", 90);
  } else {
    maxSet(roleScores, "product_builder", 100);
    maxSet(abilityScores, "product_judgment", 90);
    maxSet(abilityScores, "goal_framing", 90);
  }

  if (execution === "R") {
    maxSet(roleScores, "technical_reviewer", 100);
    maxSet(abilityScores, "review_judgment", 100);
    maxSet(abilityScores, "failure_recovery", 92);
  } else {
    maxSet(roleScores, "agent_operator", 100);
    maxSet(abilityScores, "agent_delegation", 100);
    maxSet(abilityScores, "collaboration_handoff", scope === "C" ? 100 : 75);
  }

  if (quality === "V") {
    maxSet(abilityScores, "verification_discipline", 100);
    maxSet(abilityScores, "failure_recovery", 95);
    maxSet(roleScores, "technical_reviewer", execution === "R" ? 100 : 90);
  } else {
    maxSet(roleScores, "shipping_owner", 100);
    maxSet(abilityScores, "shipping_hygiene", 100);
    maxSet(abilityScores, "scope_control", 95);
  }

  if (scope === "C") {
    maxSet(abilityScores, "context_packaging", 100);
    maxSet(abilityScores, "collaboration_handoff", 100);
    maxSet(roleScores, "collaboration_handoff", 100);
  } else {
    maxSet(abilityScores, "goal_framing", 100);
    maxSet(abilityScores, "product_judgment", 100);
    maxSet(roleScores, "product_builder", focus === "P" ? 100 : 55);
  }

  return {
    roleSignals: roleSignalsFromScores(roleScores),
    abilityModel: abilityModelFromScores(abilityScores)
  };
}

function buildSyntheticCard(code, locale = "en-US") {
  const input = syntheticInputForCode(code);
  return buildShareCard({
    ...input,
    stats: measuredStats(24),
    identityConfidence: "medium",
    evidenceCards: [{
      id: "EV-SYNTHETIC-DIRECT",
      level: ["E2"],
      category: "synthetic_direct",
      dimensions: [],
      role_signals: [],
      agent_clients: ["codex"]
    }],
    locale,
    tieBreakerSeed: `synthetic:${code}`
  });
}

function measuredStats(files, totalTokens = files * 250_000) {
  return {
    files,
    measured_clients: ["codex"],
    trace_window: { start: "2026-06-01", end: "2026-06-30" },
    total_token_usage: { total_tokens: totalTokens },
    top_projects: []
  };
}

function evidenceCardsForSubset(rules, mask) {
  return rules.filter((_, index) => mask & (1 << index)).map((rule) => ({
    id: rule.id,
    level: rule.evidence_level || ["E3"],
    title: rule.title,
    category: rule.category,
    dimensions: normalizeDimensions(rule.dimensions),
    role_signals: normalizeRoles(rule.role_impacts),
    agent_clients: ["codex"],
    confidence: "medium"
  }));
}

function cardForEvidenceSubset(cards, locale = "en-US") {
  return buildShareCard({
    roleSignals: buildRoleSignals(cards, localeBundle),
    abilityModel: buildAbilityModel(cards, localeBundle),
    stats: measuredStats(cards.length * 12),
    identityConfidence: "medium",
    evidenceCards: cards,
    locale,
    tieBreakerSeed: "generic-subset-smoke"
  });
}

function checkSyntheticCoverage() {
  const codes = Object.keys(SHARE_CARD_ARCHETYPES);
  assert(codes.length === 16, "share-card system must keep 16 base archetypes.");
  const results = Object.fromEntries(codes.map((code) => [code, buildSyntheticCard(code).code]));
  const failures = Object.entries(results).filter(([expected, actual]) => expected !== actual);
  assert(failures.length === 0, `synthetic archetype coverage failed: ${JSON.stringify(failures)}`);
  return results;
}

function checkGenericSubsetDistribution() {
  const rules = JSON.parse(readFileSync(path.join(repoRoot, "references", "evidence-rules.json"), "utf8")).rules
    .filter((rule) => !rule.fallback);
  const counts = {};
  const firstExample = {};
  const snapshots = [];

  for (let mask = 1; mask < (1 << rules.length); mask += 1) {
    const cards = evidenceCardsForSubset(rules, mask);
    const card = cardForEvidenceSubset(cards);
    counts[card.code] = (counts[card.code] || 0) + 1;
    firstExample[card.code] ||= cards.map((item) => item.category).join("+");
    snapshots.push(JSON.stringify(card));
    assert(JSON.stringify(cardForEvidenceSubset(cards)) === snapshots.at(-1), "share-card selection must be deterministic for identical input.");
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const unique = Object.keys(counts).length;
  const topCount = Math.max(...Object.values(counts));
  const topShare = topCount / total;

  assert(unique >= 14, `generic rule subset diversity too narrow: unique=${unique}, counts=${JSON.stringify(counts)}`);
  assert(topShare <= 0.30, `generic rule subset top archetype too concentrated: topShare=${topShare}, counts=${JSON.stringify(counts)}`);

  return { unique, total, top_code_count: topCount, top_share: topShare, counts, first_example: firstExample };
}

function checkBaselinesAndLocale() {
  const fallbackEvidence = [{
    id: "EV-ACTIVITY-METADATA",
    level: ["E2"],
    category: "agent_usage",
    dimensions: ["agent_delegation", "context_packaging"],
    role_signals: ["agent_operator"],
    agent_clients: []
  }];
  const noData = buildShareCard({
    roleSignals: buildRoleSignals(fallbackEvidence, localeBundle),
    abilityModel: buildAbilityModel(fallbackEvidence, localeBundle),
    stats: { files: 0, measured_clients: [], trace_window: { start: "unknown", end: "unknown" }, total_token_usage: { total_tokens: 0 }, top_projects: [] },
    identityConfidence: "no_data",
    evidenceCards: fallbackEvidence,
    locale: "zh-CN",
    tieBreakerSeed: "no-data-smoke"
  });
  assert(noData.code === "NO_DATA", "zero data must produce NO_DATA, not a strong archetype.");
  assert(noData.state === "baseline/no_data", "zero data must be marked baseline/no_data.");
  assert(!["SRVC", "SRDC", "SOVC", "SODC"].includes(noData.code), "zero data must not produce a concentrated strong archetype.");
  assert(!/Systems Proof Reviewer|Proof Reviewer|Delivery Operator/i.test(`${noData.name} ${noData.share_subtitle}`), "zh-CN no-data card must not expose an English archetype subtitle.");

  const activity = buildShareCard({
    roleSignals: buildRoleSignals(fallbackEvidence, localeBundle),
    abilityModel: buildAbilityModel(fallbackEvidence, localeBundle),
    stats: measuredStats(5, 750_000),
    identityConfidence: "activity_baseline",
    evidenceCards: fallbackEvidence,
    locale: "zh-CN",
    tieBreakerSeed: "activity-smoke"
  });
  assert(activity.code === "ACTIVITY", "activity-only evidence must produce the ACTIVITY baseline code.");
  assert(activity.state === "baseline/activity_only", "activity-only evidence must be marked baseline/activity_only.");
  assert(activity.variant_badges.some((badge) => /活动度/.test(badge)), "activity-only card must have a distinct activity badge.");

  const zhCard = cardForEvidenceSubset(evidenceCardsForSubset(
    JSON.parse(readFileSync(path.join(repoRoot, "references", "evidence-rules.json"), "utf8")).rules.filter((rule) => !rule.fallback),
    1 << 3
  ), "zh-CN");
  assert(!/Product Goal Reviewer|Systems Proof Reviewer|Delivery Operator/i.test(zhCard.share_subtitle), "zh-CN share_subtitle must stay localized.");

  return {
    no_data: { code: noData.code, name: noData.name, state: noData.state },
    activity_only: { code: activity.code, name: activity.name, state: activity.state }
  };
}

function checkHelpDocsParity() {
  const help = execFileSync(process.execPath, [path.join(repoRoot, "src", "cli.mjs"), "--help"], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  const readmes = {
    "README.md": readFileSync(path.join(repoRoot, "README.md"), "utf8"),
    "README.zh-CN.md": readFileSync(path.join(repoRoot, "README.zh-CN.md"), "utf8")
  };
  const criticalFlags = [
    "--config",
    "--dry-run",
    "--owner",
    "--profiles-dir",
    "--output",
    "--sessions-dir",
    "--locale",
    "--agent-context",
    "--display-name",
    "--no-account-usage",
    "--account-usage-timeout-ms",
    "--opencode-db",
    "--opencode-data-dir",
    "--no-opencode",
    "--claude-code-projects-dir",
    "--no-claude-code"
  ];

  for (const flag of criticalFlags) {
    assert(help.includes(flag), `agentrecord --help must include ${flag}.`);
    for (const [name, contents] of Object.entries(readmes)) {
      assert(contents.includes(flag), `${name} must document ${flag} to stay aligned with --help.`);
    }
  }
  return criticalFlags;
}

const synthetic = checkSyntheticCoverage();
const distribution = checkGenericSubsetDistribution();
const baselines = checkBaselinesAndLocale();
const helpFlags = checkHelpDocsParity();

console.log(JSON.stringify({
  ok: true,
  synthetic_archetypes: Object.keys(synthetic).length,
  distribution,
  baselines,
  help_flags_checked: helpFlags
}, null, 2));
