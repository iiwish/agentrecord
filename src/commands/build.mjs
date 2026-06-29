import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { loadConfig, normalizeLocale, readJsonIfExists, safePathSegment } from "../core/config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const supportedLocales = ["en-US", "zh-CN"];

const dimensions = [
  { id: "goal_framing", canonical: "Goal Framing" },
  { id: "context_packaging", canonical: "Context Packaging" },
  { id: "agent_delegation", canonical: "Agent Delegation" },
  { id: "review_judgment", canonical: "Review Judgment" },
  { id: "verification_discipline", canonical: "Verification Discipline" },
  { id: "failure_recovery", canonical: "Failure Recovery" },
  { id: "scope_control", canonical: "Scope Control" },
  { id: "shipping_hygiene", canonical: "Shipping Hygiene" },
  { id: "product_judgment", canonical: "Product Judgment" },
  { id: "collaboration_handoff", canonical: "Collaboration Handoff" }
];

const roles = [
  { id: "product_builder", canonical: "Product Builder" },
  { id: "technical_reviewer", canonical: "Technical Reviewer" },
  { id: "agent_operator", canonical: "Agent Operator" },
  { id: "shipping_owner", canonical: "Shipping Owner" },
  { id: "systems_thinker", canonical: "Systems Thinker" },
  { id: "research_synthesizer", canonical: "Research Synthesizer" },
  { id: "collaboration_handoff", canonical: "Collaboration Handoff" }
];

const dimensionByCanonical = new Map(dimensions.map((item) => [item.canonical.toLowerCase(), item.id]));
const roleByCanonical = new Map(roles.map((item) => [item.canonical.toLowerCase(), item.id]));
roleByCanonical.set("delivery owner", "shipping_owner");
roleByCanonical.set("ai agent operator", "agent_operator");
roleByCanonical.set("software engineer", "systems_thinker");

export async function runBuild({ options }) {
  const config = loadConfig(options);
  const generatedAt = new Date().toISOString();
  ensureDir(config.resolved.profileDir);
  ensureDir(config.resolved.privateStateDir);

  const stats = collectCodexStats(config.resolved.codex.sessionRoots, {
    publicProjectPaths: config.resolved.privacy.publicProjectPaths
  });
  const report = resolveReportSettings(config, stats, generatedAt);
  const localeBundle = loadLocaleBundle(report.locale);
  const rules = loadEvidenceRules(config.resolved.evidenceRulesPaths);
  const memoryBlocks = config.resolved.memory.enabled ? extractMemoryBlocks(config.resolved.memory.registryPath) : [];
  const evidenceCards = buildEvidenceCards({ stats, rules, memoryBlocks });
  const runContext = buildRunContext({ config, stats, generatedAt, reset: Boolean(options.reset) });
  const profile = buildProfile({
    config,
    stats,
    evidenceCards,
    report,
    localeBundle,
    runMetadata: runContext.public
  });

  runContext.privateState.last_profile_hash = hashObject(profile);
  writeArtifacts({ config, profile, evidenceCards, localeBundle, privateState: runContext.privateState });

  console.log(JSON.stringify({
    ok: true,
    out_dir: config.resolved.profileDir,
    owner: config.resolved.owner,
    schema_version: profile.schema_version,
    sessions_scanned: stats.files,
    evidence_cards: evidenceCards.length,
    report_locale: report.locale,
    artifacts: [
      "profile.json",
      "evidence.jsonl",
      "index.html",
      "profile.md",
      "redaction-report.md",
      "run-report.md"
    ]
  }, null, 2));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJsonlLines(file) {
  try {
    return fs.readFileSync(file, "utf8").split(/\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function hashObject(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stableTimestamp(value) {
  return String(value || new Date().toISOString()).replace(/[:.]/g, "-");
}

function collectRolloutFiles(rootDirs) {
  const files = [];
  const roots = Array.isArray(rootDirs) ? rootDirs : [rootDirs].filter(Boolean);

  for (const root of roots) {
    if (!root || !fs.existsSync(root)) continue;
    const stack = [root];
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
          files.push(target);
        }
      }
    }
  }

  return [...new Set(files)].sort();
}

function extractUserText(obj) {
  if (obj.type !== "response_item" || obj.payload?.type !== "message" || obj.payload?.role !== "user") return "";
  if (!Array.isArray(obj.payload.content)) return "";
  return obj.payload.content
    .filter((item) => ["input_text", "output_text", "text"].includes(item?.type))
    .map((item) => item.text || "")
    .join("\n");
}

function countLanguageSignal(text) {
  const sample = String(text || "").slice(0, 12000);
  const cjk = sample.match(/[\u3400-\u9fff]/g)?.length || 0;
  const latinWords = sample.match(/[A-Za-z]{2,}/g)?.length || 0;
  if (cjk >= 12 && cjk >= latinWords * 0.25) return "zh-CN";
  if (latinWords >= 30 && cjk < 8) return "en-US";
  return null;
}

function sumTokenUsage(records) {
  return records.reduce((total, record) => {
    const usage = record.token_usage || {};
    for (const key of Object.keys(total)) total[key] += usage[key] || 0;
    return total;
  }, zeroTokenUsage());
}

function zeroTokenUsage() {
  return {
    total_tokens: 0,
    input_tokens: 0,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0
  };
}

function collectCodexStats(rootDirs, { publicProjectPaths }) {
  const files = collectRolloutFiles(rootDirs);
  const byCwd = new Map();
  const bySource = new Map();
  const projectTokens = new Map();
  const sessionRecords = [];
  const languageVotes = { "zh-CN": 0, "en-US": 0 };
  const languageSample = { user_messages_seen: 0, sampled_characters: 0 };
  const totals = zeroTokenUsage();
  let tokenSessions = 0;
  let minTs = null;
  let maxTs = null;

  for (const file of files) {
    let meta = null;
    let lastToken = null;

    for (const line of readJsonlLines(file)) {
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }

      if (obj.type === "session_meta" && obj.payload) meta = obj.payload;
      if (obj.type === "event_msg" && obj.payload?.type === "token_count") {
        lastToken = obj.payload.info?.total_token_usage || null;
      }

      if (languageSample.user_messages_seen < 500) {
        const userText = extractUserText(obj);
        if (userText) {
          languageSample.user_messages_seen += 1;
          languageSample.sampled_characters += Math.min(userText.length, 12000);
          const detected = countLanguageSignal(userText);
          if (detected) languageVotes[detected] += 1;
        }
      }
    }

    const cwd = meta?.cwd || "(unknown)";
    const source = meta?.source || meta?.originator || "(unknown)";
    byCwd.set(cwd, (byCwd.get(cwd) || 0) + 1);
    bySource.set(source, (bySource.get(source) || 0) + 1);

    if (meta?.timestamp) {
      if (!minTs || meta.timestamp < minTs) minTs = meta.timestamp;
      if (!maxTs || meta.timestamp > maxTs) maxTs = meta.timestamp;
    }

    if (lastToken?.total_tokens) {
      tokenSessions += 1;
      for (const key of Object.keys(totals)) totals[key] += lastToken[key] || 0;
      projectTokens.set(cwd, (projectTokens.get(cwd) || 0) + (lastToken.total_tokens || 0));
    }

    let fileMtimeMs = 0;
    try {
      fileMtimeMs = Math.round(fs.statSync(file).mtimeMs);
    } catch {
      fileMtimeMs = 0;
    }

    sessionRecords.push({
      session_id: meta?.id || path.basename(file).replace(/^rollout-|\.jsonl$/g, ""),
      timestamp: meta?.timestamp || null,
      project_path: cwd,
      source,
      has_token_usage: Boolean(lastToken?.total_tokens),
      token_usage: lastToken || null,
      file_mtime_ms: fileMtimeMs
    });
  }

  const projectRows = [...byCwd.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const topProjects = projectRows.map(([projectPath, sessions], index) => ({
    project_ref: publicProjectPaths ? safeProjectName(projectPath) : `project_ref_${String(index + 1).padStart(3, "0")}`,
    sessions,
    total_tokens: projectTokens.get(projectPath) || 0,
    public_project_path_included: Boolean(publicProjectPaths)
  }));

  return {
    session_roots_count: Array.isArray(rootDirs) ? rootDirs.length : 0,
    files: files.length,
    token_sessions: tokenSessions,
    trace_window: {
      start: minTs ? minTs.slice(0, 10) : "unknown",
      end: maxTs ? maxTs.slice(0, 10) : "unknown",
      start_timestamp: minTs,
      end_timestamp: maxTs
    },
    total_token_usage: totals,
    language_votes: languageVotes,
    language_sample: languageSample,
    by_source: Object.fromEntries([...bySource.entries()].sort((a, b) => b[1] - a[1])),
    top_projects: topProjects,
    session_records: sessionRecords
  };
}

function safeProjectName(projectPath) {
  if (!projectPath || projectPath === "(unknown)") return "unknown";
  return path.basename(projectPath);
}

function loadEvidenceRules(files) {
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

function extractMemoryBlocks(file) {
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

function buildEvidenceCards({ stats, rules, memoryBlocks }) {
  const cards = [];

  for (const rule of rules.filter((item) => !item.fallback)) {
    const matches = memoryBlocks.filter((block) => matchesRule(block, rule));
    if (!matches.length) continue;

    cards.push({
      id: rule.id,
      level: rule.evidence_level || ["E3"],
      title: rule.title,
      category: rule.category,
      summary: `${rule.signal_template} Matched ${matches.length} curated memory task group${matches.length === 1 ? "" : "s"}.`,
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
    cards.push({
      id: fallbackRule.id,
      level: fallbackRule.evidence_level || ["E2"],
      title: fallbackRule.title,
      category: fallbackRule.category,
      summary: `${fallbackRule.signal_template} Scanned ${stats.files} Codex rollout files across ${stats.top_projects.length} redacted project references.`,
      agent_clients: ["codex"],
      dimensions: normalizeDimensionIds(fallbackRule.dimensions),
      role_signals: normalizeRoleIds(fallbackRule.role_impacts),
      confidence: stats.files > 0 ? "medium" : "low",
      refs: [{ type: "metadata", source: "codex_session_metadata" }],
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

function normalizeDimensionIds(values = []) {
  return unique(values.map((value) => dimensionByCanonical.get(String(value).toLowerCase()) || snakeId(value)));
}

function normalizeRoleIds(values = []) {
  return unique(values.map((value) => roleByCanonical.get(String(value).toLowerCase()) || snakeId(value)));
}

function snakeId(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function confidenceFromLevels(levels = []) {
  if (levels.includes("E1") && levels.includes("E2")) return "high";
  if (levels.includes("E1") || levels.includes("E2")) return "medium";
  if (levels.includes("E3")) return "medium";
  return "low";
}

function resolveReportSettings(config, stats, generatedAt) {
  let locale = config.resolved.report.locale;
  let languageSource = "config";
  let confidence = locale === "auto" ? "low" : "explicit";

  if (locale === "auto") {
    const agentLocale = inferAgentConversationLocale(stats);
    if (agentLocale) {
      locale = agentLocale.locale;
      languageSource = "agent_conversation_language";
      confidence = agentLocale.confidence;
    } else {
      locale = normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale, config.resolved.report.fallbackLocale);
      if (locale === "auto") locale = config.resolved.report.fallbackLocale;
      languageSource = "system_locale";
      confidence = "medium";
    }
  }

  if (!supportedLocales.includes(locale)) {
    locale = config.resolved.report.fallbackLocale;
    languageSource = "fallback_locale";
    confidence = "low";
  }

  return {
    locale_requested: config.resolved.report.locale,
    locale,
    fallback_locale: config.resolved.report.fallbackLocale,
    label_mode: config.resolved.report.labelMode,
    language_source: languageSource,
    language_confidence: confidence,
    schema_language: "en-US",
    audiences: config.resolved.report.audiences.filter((audience) => ["self", "share"].includes(audience)),
    default_audience: "self",
    supported_locales: supportedLocales,
    agent_language_votes: stats.language_votes,
    agent_language_sample: stats.language_sample,
    generated_at: generatedAt
  };
}

function inferAgentConversationLocale(stats) {
  const zh = stats.language_votes?.["zh-CN"] || 0;
  const en = stats.language_votes?.["en-US"] || 0;
  const total = zh + en;
  if (total < 3) return null;
  const locale = zh >= en ? "zh-CN" : "en-US";
  const share = Math.max(zh, en) / total;
  if (share < 0.6) return null;
  return { locale, confidence: share >= 0.8 ? "high" : "medium" };
}

function loadLocaleBundle(locale) {
  return readJsonIfExists(path.join(repoRoot, "locales", `${locale}.json`))
    || readJsonIfExists(path.join(repoRoot, "locales", "en-US.json"))
    || { ui: {}, roles: {}, abilities: {}, html_lang: "en" };
}

function buildRunContext({ config, stats, generatedAt, reset }) {
  const stateFile = path.join(config.resolved.privateStateDir, "state.json");
  const snapshotsDir = path.join(config.resolved.privateStateDir, "snapshots");
  const previousState = reset ? null : readJsonIfExists(stateFile);
  const previouslyProcessed = new Set(previousState?.processed_session_ids || []);
  const previousTokenTotals = previousState?.session_token_totals || {};
  const hasPreviousTokenTotals = Object.keys(previousTokenTotals).length > 0;
  const newRecords = previousState
    ? stats.session_records.filter((record) => !previouslyProcessed.has(record.session_id))
    : stats.session_records;
  const updatedRecords = previousState && hasPreviousTokenTotals
    ? stats.session_records.filter((record) => {
        if (!previouslyProcessed.has(record.session_id)) return false;
        const currentTokens = record.token_usage?.total_tokens || 0;
        const previousTokens = previousTokenTotals[record.session_id]?.total_tokens || 0;
        return currentTokens > previousTokens;
      })
    : [];
  const tokenDelta = sumTokenUsage(newRecords.filter((record) => record.has_token_usage));
  for (const record of updatedRecords) {
    const current = record.token_usage || {};
    const previous = previousTokenTotals[record.session_id] || {};
    for (const key of Object.keys(tokenDelta)) tokenDelta[key] += Math.max(0, (current[key] || 0) - (previous[key] || 0));
  }

  let snapshotCreated = false;
  const profileFile = path.join(config.resolved.profileDir, "profile.json");
  if (fs.existsSync(profileFile)) {
    ensureDir(snapshotsDir);
    const previousProfile = readJsonIfExists(profileFile);
    const snapshotName = `profile-${stableTimestamp(previousProfile?.generated_at || generatedAt)}.json`;
    fs.copyFileSync(profileFile, path.join(snapshotsDir, snapshotName));
    snapshotCreated = true;
  }

  const runCount = reset ? 1 : (previousState?.run_count || 0) + 1;
  const sessionTokenTotals = Object.fromEntries(stats.session_records.map((record) => [
    record.session_id,
    record.token_usage || zeroTokenUsage()
  ]));

  return {
    public: {
      mode: previousState ? "incremental" : "initial",
      run_count: runCount,
      generated_at: generatedAt,
      previous_generated_at: previousState?.generated_at || null,
      reset,
      new_sessions_this_run: newRecords.length,
      updated_sessions_this_run: updatedRecords.length,
      changed_sessions_this_run: newRecords.length + updatedRecords.length,
      token_delta_this_run: tokenDelta,
      total_sessions_seen: stats.files,
      total_token_sessions_seen: stats.token_sessions,
      private_state_present: true,
      private_snapshot_created: snapshotCreated,
      public_session_ids_included: false
    },
    privateState: {
      schema_version: "agentrecord.state.v0",
      owner: config.resolved.owner,
      generated_at: generatedAt,
      run_count: runCount,
      reset,
      session_roots: config.resolved.codex.sessionRoots,
      trace_window: stats.trace_window,
      processed_sessions_count: stats.session_records.length,
      processed_session_ids: stats.session_records.map((record) => record.session_id).sort(),
      session_token_totals: sessionTokenTotals,
      last_trace_end_timestamp: stats.trace_window.end_timestamp,
      last_profile_hash: null,
      last_run_delta: {
        new_sessions: newRecords.length,
        updated_sessions: updatedRecords.length,
        changed_sessions: newRecords.length + updatedRecords.length,
        token_delta: tokenDelta
      },
      history: [
        ...(previousState?.history || []).slice(-19),
        {
          generated_at: generatedAt,
          mode: previousState ? "incremental" : "initial",
          new_sessions: newRecords.length,
          updated_sessions: updatedRecords.length,
          total_sessions_seen: stats.files
        }
      ]
    }
  };
}

function buildProfile({ config, stats, evidenceCards, report, localeBundle, runMetadata }) {
  const evidenceIds = evidenceCards.map((card) => card.id);
  const roleSignals = buildRoleSignals(evidenceCards, localeBundle);
  const abilityModel = buildAbilityModel(evidenceCards, localeBundle);
  const topRole = roleSignals[0] || roleSignals.find((item) => item.role_id === "agent_operator");
  const topAbility = abilityModel[0] || abilityModel.find((item) => item.dimension_id === "agent_delegation");
  const hasCuratedEvidence = evidenceCards.some((card) => card.id !== "EV-ACTIVITY-METADATA");
  const identityConfidence = hasCuratedEvidence ? "medium" : stats.files > 0 ? "low-medium" : "low";

  return {
    schema_version: "agentrecord.profile.v0",
    owner: {
      id: safePathSegment(config.resolved.owner),
      display_name: config.resolved.owner
    },
    generated_at: report.generated_at,
    report,
    work_identity: {
      primary_label: hasCuratedEvidence ? "Evidence-bound AI work operator" : "Local AI-agent activity baseline",
      localized_label: report.locale === "zh-CN" ? (hasCuratedEvidence ? "证据约束的 AI 工作操作者" : "本地 AI Agent 活跃度基线") : null,
      summary: hasCuratedEvidence
        ? `AgentRecord found ${evidenceCards.length} public-safe evidence cards for how this owner frames, delegates, reviews, verifies, and hands off AI-agent work.`
        : `AgentRecord found local Codex activity and generated a conservative baseline profile without curated memory evidence.`,
      strongest_claim: hasCuratedEvidence
        ? `The strongest current signal is ${topRole?.label || "agent operation"} supported by ${topAbility?.label || "activity"} evidence.`
        : "The defensible claim is repeated local AI-agent usage, not calibrated work quality.",
      confidence: identityConfidence,
      evidence_ids: evidenceIds.slice(0, 6)
    },
    work_role_signals: roleSignals,
    ability_model: abilityModel,
    agent_ledger: {
      clients: [
        {
          client_id: "codex",
          status: stats.files > 0 ? "measured" : "not_found",
          sessions: stats.files,
          token_sessions: stats.token_sessions,
          token_usage: stats.total_token_usage,
          trace_window: {
            start: stats.trace_window.start,
            end: stats.trace_window.end
          },
          top_projects: stats.top_projects,
          evidence_count: evidenceCards.length
        },
        { client_id: "claude_code", status: "not_configured" },
        { client_id: "opencode", status: "not_configured" },
        { client_id: "openclaw", status: "not_configured" },
        { client_id: "hermes", status: "not_configured" }
      ]
    },
    evidence_notes: evidenceCards.map((card) => ({
      evidence_id: card.id,
      level: card.level,
      title: card.title,
      summary: card.summary,
      agent_clients: card.agent_clients,
      dimensions: card.dimensions,
      role_signals: card.role_signals,
      confidence: card.confidence,
      refs: card.refs,
      privacy: card.privacy
    })),
    calibration_notes: buildCalibrationNotes({ hasCuratedEvidence, stats }),
    privacy_boundary: {
      local_only_generation: true,
      raw_logs_included: false,
      public_session_ids_included: false,
      public_project_paths_included: config.resolved.privacy.publicProjectPaths,
      public_artifacts: ["profile.json", "evidence.jsonl", "index.html", "profile.md", "redaction-report.md", "run-report.md"],
      excluded_from_public_artifacts: [
        "raw prompts",
        "raw assistant responses",
        "raw session IDs",
        "Codex session file paths",
        "terminal bodies",
        "source bodies",
        "secret-like values"
      ]
    },
    run_metadata: runMetadata
  };
}

function buildRoleSignals(evidenceCards, localeBundle) {
  return roles.map((role) => {
    const cards = evidenceCards.filter((card) => card.role_signals.includes(role.id));
    const evidenceLevelMix = countEvidenceLevels(cards);
    const score = scoreForCards(cards);
    return {
      role_id: role.id,
      label: localeBundle.roles?.[role.id] || role.canonical,
      score,
      band: bandForScore(score),
      confidence: confidenceForCards(cards),
      why: cards.length
        ? `Supported by ${cards.length} public-safe evidence card${cards.length === 1 ? "" : "s"}.`
        : "No strong public-safe evidence card supports this role signal yet.",
      evidence_level_mix: evidenceLevelMix,
      evidence_ids: cards.map((card) => card.id),
      missing_evidence: cards.length ? [] : ["More non-volume work evidence is needed before making a stronger claim."]
    };
  }).sort((a, b) => b.score - a.score);
}

function buildAbilityModel(evidenceCards, localeBundle) {
  return dimensions.map((dimension) => {
    const cards = evidenceCards.filter((card) => card.dimensions.includes(dimension.id));
    const evidenceLevelMix = countEvidenceLevels(cards);
    const score = scoreForCards(cards);
    return {
      dimension_id: dimension.id,
      label: localeBundle.abilities?.[dimension.id] || dimension.canonical,
      score,
      band: bandForScore(score),
      confidence: confidenceForCards(cards),
      evidence_level_mix: evidenceLevelMix,
      evidence_ids: cards.map((card) => card.id),
      missing_evidence: cards.length ? [] : ["No direct public-safe evidence card yet."]
    };
  }).sort((a, b) => b.score - a.score);
}

function countEvidenceLevels(cards) {
  const mix = { E1: 0, E2: 0, E3: 0, E4: 0 };
  for (const card of cards) {
    for (const level of card.level || []) {
      if (Object.hasOwn(mix, level)) mix[level] += 1;
    }
  }
  return mix;
}

function scoreForCards(cards) {
  if (!cards.length) return 40;
  const onlyBaseline = cards.every((card) => card.id === "EV-ACTIVITY-METADATA");
  const levelBonus = cards.reduce((sum, card) => sum + (card.level.includes("E1") ? 8 : 0) + (card.level.includes("E2") ? 5 : 0) + (card.level.includes("E3") ? 3 : 0), 0);
  return Math.max(45, Math.min(86, (onlyBaseline ? 54 : 58) + cards.length * 5 + levelBonus));
}

function bandForScore(score) {
  if (score >= 78) return "strong";
  if (score >= 68) return "solid";
  if (score >= 56) return "developing";
  return "emerging";
}

function confidenceForCards(cards) {
  const levels = unique(cards.flatMap((card) => card.level || []));
  if (levels.includes("E1") && levels.includes("E2")) return "high";
  if (levels.includes("E2")) return "medium";
  if (levels.includes("E3")) return "medium";
  return cards.length ? "low-medium" : "low";
}

function buildCalibrationNotes({ hasCuratedEvidence, stats }) {
  return [
    {
      type: "privacy_boundary",
      severity: "high",
      summary: "Public artifacts are generated from aggregate metadata and curated summaries only; raw conversation payloads remain excluded."
    },
    {
      type: "activity_not_ability",
      severity: "medium",
      summary: "Token usage and session counts are activity-density context, not direct proof of ability."
    },
    {
      type: "adapter_coverage",
      severity: "medium",
      summary: `Codex is the only measured adapter in this run; ${stats.files} local rollout files were scanned.`
    },
    {
      type: "missing_evidence",
      severity: hasCuratedEvidence ? "low" : "medium",
      summary: hasCuratedEvidence
        ? "The profile still needs external outcomes before making stronger public claims."
        : "No curated memory evidence was available, so the profile stays at activity-baseline strength."
    }
  ];
}

function writeArtifacts({ config, profile, evidenceCards, localeBundle, privateState }) {
  const outDir = config.resolved.profileDir;
  fs.writeFileSync(path.join(outDir, "profile.json"), `${JSON.stringify(profile, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "evidence.jsonl"), `${evidenceCards.map((card) => JSON.stringify(card)).join("\n")}\n`);
  fs.writeFileSync(path.join(outDir, "profile.md"), renderMarkdown(profile, localeBundle));
  fs.writeFileSync(path.join(outDir, "index.html"), renderHtml(profile, localeBundle));
  fs.writeFileSync(path.join(outDir, "redaction-report.md"), renderRedactionReport(profile, localeBundle));
  fs.writeFileSync(path.join(outDir, "run-report.md"), renderRunReport(profile, localeBundle));
  fs.writeFileSync(path.join(config.resolved.privateStateDir, "state.json"), `${JSON.stringify(privateState, null, 2)}\n`);
  removeGeneratedArtifactIfExists(outDir, "hiring.html");
  removeGeneratedArtifactIfExists(outDir, "job-agent-profile.md");
}

function removeGeneratedArtifactIfExists(outDir, file) {
  const target = path.join(outDir, file);
  if (fs.existsSync(target)) fs.rmSync(target);
}

function renderMarkdown(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  const codex = profile.agent_ledger.clients.find((client) => client.client_id === "codex") || {};
  return `# ${profile.owner.display_name} ${t("title")}

${t("subtitle")}

- ${t("generated")}: ${profile.generated_at}
- ${t("trace_window")}: ${codex.trace_window?.start || "unknown"} to ${codex.trace_window?.end || "unknown"}
- ${t("sessions")}: ${formatNumber(codex.sessions || 0, profile.report.locale)}
- ${t("token_activity")}: ${formatNumber(codex.token_usage?.total_tokens || 0, profile.report.locale)}
- ${t("evidence")}: ${formatNumber(profile.evidence_notes.length, profile.report.locale)}

## ${t("identity")}

${profile.work_identity.summary}

Strongest defensible claim: ${profile.work_identity.strongest_claim}

Confidence: ${profile.work_identity.confidence}

## ${t("role_signals")}

${profile.work_role_signals.map((role) => `- ${role.label}: ${role.band}, ${role.confidence}. ${role.why}`).join("\n")}

## ${t("ability_model")}

${profile.ability_model.map((ability) => `- ${ability.label}: ${ability.band} (${ability.score}), ${ability.confidence}. Evidence: ${ability.evidence_ids.join(", ") || "none"}`).join("\n")}

## ${t("agent_ledger")}

${profile.agent_ledger.clients.map((client) => `- ${client.client_id}: ${client.status}${Number.isFinite(client.sessions) ? `, ${formatNumber(client.sessions, profile.report.locale)} sessions` : ""}`).join("\n")}

## ${t("evidence")}

${profile.evidence_notes.map((card) => `### ${card.evidence_id}: ${card.title}

- Level: ${card.level.join(", ")}
- Confidence: ${card.confidence}
- Summary: ${card.summary}
- Refs: ${card.refs.map(formatPublicRef).join("; ")}
`).join("\n")}

## ${t("calibration")}

${profile.calibration_notes.map((note) => `- ${note.severity}: ${note.summary}`).join("\n")}

## ${t("privacy_boundary")}

${t("public_safe")}

${t("not_hiring")}
`;
}

function renderHtml(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  const codex = profile.agent_ledger.clients.find((client) => client.client_id === "codex") || {};
  const topRoles = profile.work_role_signals.slice(0, 4);
  const topAbilities = profile.ability_model.slice(0, 6);
  return `<!doctype html>
<html lang="${esc(localeBundle.html_lang || profile.report.locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(profile.owner.display_name)} ${esc(t("title"))}</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f7f4ed;
      --ink: #141414;
      --muted: #626866;
      --line: #1f2424;
      --accent: #0b7f74;
      --accent-soft: #d9eee9;
      --warn: #b23b32;
      --panel: #fffdf7;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); }
    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 56px; }
    .hero { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr); gap: 18px; align-items: stretch; min-height: 520px; }
    .identity, .passport, section { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
    .identity { padding: clamp(28px, 5vw, 56px); background: #111716; color: #fffdf7; }
    .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0; color: #8ce6d9; font-weight: 800; }
    h1 { margin: 26px 0 0; max-width: 760px; font-size: clamp(46px, 8vw, 96px); line-height: .9; letter-spacing: 0; }
    .summary { margin-top: 24px; max-width: 740px; font-size: 19px; line-height: 1.55; color: rgba(255,253,247,.78); }
    .claim { margin-top: 24px; padding-top: 18px; border-top: 1px solid rgba(255,253,247,.24); font-size: 22px; line-height: 1.35; font-weight: 800; }
    .passport { padding: 24px; display: grid; align-content: space-between; }
    .stamp { display: inline-flex; width: max-content; border: 2px solid var(--warn); color: var(--warn); border-radius: 999px; padding: 8px 14px; font-weight: 900; text-transform: uppercase; font-size: 12px; transform: rotate(3deg); }
    .metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-top: 24px; }
    .metric { border: 1px solid var(--line); padding: 16px; background: #fbf1df; min-height: 110px; }
    .metric b { display: block; font-size: 30px; line-height: 1; overflow-wrap: anywhere; }
    .metric span { display: block; margin-top: 10px; color: var(--muted); font-size: 12px; text-transform: uppercase; }
    section { margin-top: 20px; padding: 24px; }
    h2 { margin: 0 0 16px; font-size: clamp(28px, 4vw, 46px); line-height: 1; letter-spacing: 0; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
    .item { border: 1px solid #d1cabe; border-radius: 8px; padding: 16px; background: #fffaf0; }
    .item b { display: block; font-size: 18px; }
    .item p { margin: 8px 0 0; color: var(--muted); line-height: 1.5; }
    .bar { margin-top: 10px; height: 10px; border: 1px solid #b8b0a2; background: #ece4d7; }
    .fill { height: 100%; background: linear-gradient(90deg, var(--warn), var(--accent)); }
    .privacy { border-left: 5px solid var(--warn); color: var(--muted); line-height: 1.65; }
    @media (max-width: 820px) { .hero, .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <div class="identity">
        <div class="eyebrow">AgentRecord v0.1</div>
        <h1>${esc(profile.owner.display_name)}<br>${esc(profile.work_identity.primary_label)}</h1>
        <p class="summary">${esc(profile.work_identity.summary)}</p>
        <p class="claim">${esc(profile.work_identity.strongest_claim)}</p>
      </div>
      <aside class="passport">
        <div>
          <div class="stamp">Local proof</div>
          <div class="metric-grid">
            <div class="metric"><b>${esc(codex.trace_window?.start || "unknown")}<br>${esc(codex.trace_window?.end || "unknown")}</b><span>${esc(t("trace_window"))}</span></div>
            <div class="metric"><b>${formatNumber(codex.sessions || 0, profile.report.locale)}</b><span>${esc(t("sessions"))}</span></div>
            <div class="metric"><b>${formatCompactNumber(codex.token_usage?.total_tokens || 0, profile.report.locale)}</b><span>${esc(t("token_activity"))}</span></div>
            <div class="metric"><b>${formatNumber(profile.evidence_notes.length, profile.report.locale)}</b><span>${esc(t("evidence"))}</span></div>
          </div>
        </div>
        <p class="privacy">${esc(t("public_safe"))} ${esc(t("not_hiring"))}</p>
      </aside>
    </div>

    <section>
      <h2>${esc(t("role_signals"))}</h2>
      <div class="grid">
        ${topRoles.map((role) => `<article class="item"><b>${esc(role.label)}</b><p>${esc(role.band)} · ${esc(role.confidence)}</p><p>${esc(role.why)}</p></article>`).join("\n")}
      </div>
    </section>

    <section>
      <h2>${esc(t("ability_model"))}</h2>
      <div class="grid">
        ${topAbilities.map((ability) => `<article class="item"><b>${esc(ability.label)}</b><p>${esc(ability.band)} · ${esc(ability.confidence)} · ${ability.score}</p><div class="bar"><div class="fill" style="width:${ability.score}%"></div></div></article>`).join("\n")}
      </div>
    </section>

    <section>
      <h2>${esc(t("evidence"))}</h2>
      <div class="grid">
        ${profile.evidence_notes.map((card) => `<article class="item"><b>${esc(card.title)}</b><p>${esc(card.level.join(" / "))} · ${esc(card.confidence)}</p><p>${esc(card.summary)}</p><p>${esc(card.refs.map(formatPublicRef).join(" | "))}</p></article>`).join("\n")}
      </div>
    </section>

    <section>
      <h2>${esc(t("calibration"))}</h2>
      <div class="grid">
        ${profile.calibration_notes.map((note) => `<article class="item"><b>${esc(note.type)}</b><p>${esc(note.severity)}</p><p>${esc(note.summary)}</p></article>`).join("\n")}
      </div>
    </section>
  </main>
</body>
</html>`;
}

function renderRedactionReport(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  return `# Redaction Report

Generated: ${profile.generated_at}
Owner: ${profile.owner.display_name}

## Included

- Aggregate Codex session counts.
- Aggregate token activity.
- Redacted project references.
- Public evidence IDs and public-safe summaries.
- Evidence refs at summary level.

## Excluded

${profile.privacy_boundary.excluded_from_public_artifacts.map((item) => `- ${item}`).join("\n")}

## Boundary

${t("public_safe")}

${t("not_hiring")}
`;
}

function renderRunReport(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  const run = profile.run_metadata;
  return `# AgentRecord Run Report

Generated: ${profile.generated_at}

## ${t("run_metadata")}

- Mode: ${run.mode}
- Run count: ${run.run_count}
- Previous generated at: ${run.previous_generated_at || "none"}
- Reset requested: ${run.reset ? "yes" : "no"}
- New sessions this run: ${run.new_sessions_this_run}
- Updated sessions this run: ${run.updated_sessions_this_run}
- Changed sessions this run: ${run.changed_sessions_this_run}
- Token delta this run: ${run.token_delta_this_run.total_tokens}
- Total sessions seen: ${run.total_sessions_seen}
- Total token-accounted sessions seen: ${run.total_token_sessions_seen}
- Public session IDs included: ${run.public_session_ids_included ? "yes" : "no"}
- Private state present: ${run.private_state_present ? "yes" : "no"}

## Privacy

Public artifacts do not include raw session IDs or raw local trace paths.
`;
}

function formatPublicRef(ref) {
  if (ref.type === "memory") return `${ref.source}:${ref.start_line}-${ref.end_line}`;
  return ref.source || ref.type || "ref";
}

function formatNumber(value, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(value || 0);
}

function formatCompactNumber(value, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    notation: "compact"
  }).format(value || 0);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
