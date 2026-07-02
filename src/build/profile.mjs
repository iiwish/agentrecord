import { safePathSegment } from "../core/config.mjs";
import { dimensions, roles } from "./catalog.mjs";
import { buildShareCard } from "./share-card.mjs";
import { unique } from "./utils.mjs";

export function buildProfile({ config, stats, codexAccountUsage, evidenceCards, report, localeBundle, runMetadata, agentContextEnabled }) {
  const codexStats = stats.clients?.codex || stats;
  const opencodeStats = stats.clients?.opencode || null;
  const claudeCodeStats = stats.clients?.claude_code || null;
  const evidenceIds = evidenceCards.map((card) => card.id);
  const roleSignals = buildRoleSignals(evidenceCards, localeBundle);
  const abilityModel = buildAbilityModel(evidenceCards, localeBundle);
  const hasCuratedEvidence = evidenceCards.some((card) => card.id !== "EV-ACTIVITY-METADATA");
  const identityConfidence = hasCuratedEvidence ? "medium" : stats.files > 0 ? "low-medium" : "low";
  const shareCard = buildShareCard({
    roleSignals,
    abilityModel,
    stats,
    identityConfidence,
    evidenceCards,
    locale: report.locale
  });
  const topRole = roleSignals[0] || roleSignals.find((item) => item.role_id === "agent_operator");
  const topAbility = abilityModel[0] || abilityModel.find((item) => item.dimension_id === "agent_delegation");
  const topRoleEvidence = topRole?.evidence_ids?.slice(0, 3) || [];

  return {
    schema_version: "agentrecord.profile.v0",
    owner: {
      id: safePathSegment(config.resolved.owner),
      display_name: config.resolved.ownerDisplayName || config.resolved.owner
    },
    generated_at: report.generated_at,
    report,
    share_card: shareCard,
    archetype: shareCard,
    work_identity: {
      primary_label: hasCuratedEvidence ? "Evidence-bound AI work operator" : "Local AI-agent activity baseline",
      localized_label: report.locale === "zh-CN" ? (hasCuratedEvidence ? "证据约束的 AI 工作操作者" : "本地 AI Agent 活跃度基线") : null,
      summary: hasCuratedEvidence
        ? `AgentRecord found ${evidenceCards.length} public-safe evidence cards for how this owner frames, delegates, reviews, verifies, and hands off AI-agent work.`
        : `AgentRecord found local AI-agent activity and generated a conservative baseline profile without curated memory evidence.`,
      strongest_claim: hasCuratedEvidence
        ? `Strongest current signal: ${topRole?.label || "agent operation"} with ${topRole?.confidence || identityConfidence} confidence, supported by ${topRoleEvidence.join(", ") || evidenceIds.slice(0, 2).join(", ")}.`
        : "The defensible claim is repeated local AI-agent usage, not calibrated work quality.",
      confidence: identityConfidence,
      evidence_ids: evidenceIds.slice(0, 6)
    },
    work_role_signals: roleSignals,
    ability_model: abilityModel,
    agent_ledger: {
      clients: [
        buildCodexClient({ stats: codexStats, codexAccountUsage, evidenceCards }),
        buildOpencodeClient({ stats: opencodeStats, evidenceCards }),
        buildClaudeCodeClient({ stats: claudeCodeStats, evidenceCards }),
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
    calibration_notes: buildCalibrationNotes({ hasCuratedEvidence, stats, codexAccountUsage }),
    privacy_boundary: {
      local_only_generation: true,
      raw_logs_included: false,
      public_session_ids_included: false,
      public_project_paths_included: config.resolved.privacy.publicProjectPaths,
      public_artifacts: [
        "profile.json",
        "evidence.jsonl",
        "index.html",
        "profile.md",
        "redaction-report.md",
        "run-report.md",
        ...(agentContextEnabled ? ["agent-context.md", "agent-context.json"] : [])
      ],
      excluded_from_public_artifacts: [
        "raw prompts",
        "raw assistant responses",
        "raw session IDs",
        "Codex session file paths",
        "opencode database path",
        "Claude Code project transcript paths",
        "terminal bodies",
        "source bodies",
        "secret-like values"
      ]
    },
    run_metadata: runMetadata
  };
}

function buildCodexClient({ stats, codexAccountUsage, evidenceCards }) {
  return {
    client_id: "codex",
    status: stats.files > 0 ? "measured" : stats.status || "not_found",
    sessions: stats.files,
    token_sessions: stats.token_sessions,
    token_usage: stats.total_token_usage,
    usage_source: "local_codex_logs",
    account_usage: codexAccountUsage || {
      status: "unavailable",
      source: "codex_app_server",
      summary: null,
      daily_usage_buckets: null
    },
    display_usage: buildCodexDisplayUsage(stats, codexAccountUsage),
    trace_window: {
      start: stats.trace_window.start,
      end: stats.trace_window.end
    },
    top_projects: stats.top_projects,
    evidence_count: evidenceCards.length
  };
}

function buildOpencodeClient({ stats, evidenceCards }) {
  if (!stats) return { client_id: "opencode", status: "not_configured" };
  return {
    client_id: "opencode",
    status: stats.status || (stats.files > 0 ? "measured" : "not_found"),
    status_reason: stats.status_reason || null,
    sessions: stats.files || 0,
    token_sessions: stats.token_sessions || 0,
    token_usage: stats.total_token_usage,
    usage_source: "local_opencode_sqlite",
    display_usage: {
      source: "local_opencode_sqlite",
      source_label: "Local opencode SQLite",
      token_usage: {
        total_tokens: stats.total_token_usage?.total_tokens || 0,
        peak_daily_tokens: null,
        longest_running_turn_sec: null,
        current_streak_days: null,
        longest_streak_days: null
      },
      local_sessions: stats.files || 0,
      local_token_usage: stats.total_token_usage,
      cost_usd: Number(stats.cost_usd || 0)
    },
    trace_window: {
      start: stats.trace_window?.start || "unknown",
      end: stats.trace_window?.end || "unknown"
    },
    top_projects: stats.top_projects || [],
    cost_usd: Number(stats.cost_usd || 0),
    evidence_count: stats.files > 0 ? evidenceCards.length : 0
  };
}

function buildClaudeCodeClient({ stats, evidenceCards }) {
  if (!stats) return { client_id: "claude_code", status: "not_configured" };
  return {
    client_id: "claude_code",
    status: stats.status || (stats.files > 0 ? "measured" : "not_found"),
    status_reason: stats.status_reason || null,
    sessions: stats.files || 0,
    token_sessions: stats.token_sessions || 0,
    token_usage: stats.total_token_usage,
    usage_source: "local_claude_code_projects",
    display_usage: {
      source: "local_claude_code_projects",
      source_label: "Local Claude Code projects",
      token_usage: {
        total_tokens: stats.total_token_usage?.total_tokens || 0,
        peak_daily_tokens: null,
        longest_running_turn_sec: null,
        current_streak_days: null,
        longest_streak_days: null
      },
      local_sessions: stats.files || 0,
      local_token_usage: stats.total_token_usage
    },
    trace_window: {
      start: stats.trace_window?.start || "unknown",
      end: stats.trace_window?.end || "unknown"
    },
    top_projects: stats.top_projects || [],
    evidence_count: stats.files > 0 ? evidenceCards.length : 0
  };
}

function buildCodexDisplayUsage(stats, codexAccountUsage) {
  const accountSummary = codexAccountUsage?.status === "measured" ? codexAccountUsage.summary : null;
  if (accountSummary?.lifetime_tokens) {
    return {
      source: "codex_account_usage",
      source_label: codexAccountUsage.source_label || "Codex CLI account usage",
      token_usage: {
        total_tokens: accountSummary.lifetime_tokens,
        peak_daily_tokens: accountSummary.peak_daily_tokens,
        longest_running_turn_sec: accountSummary.longest_running_turn_sec,
        current_streak_days: accountSummary.current_streak_days,
        longest_streak_days: accountSummary.longest_streak_days
      },
      local_sessions: stats.files,
      local_token_usage: stats.total_token_usage
    };
  }

  return {
    source: "local_codex_logs",
    source_label: "Local Codex logs",
    token_usage: {
      total_tokens: stats.total_token_usage?.total_tokens || 0,
      peak_daily_tokens: null,
      longest_running_turn_sec: null,
      current_streak_days: null,
      longest_streak_days: null
    },
    local_sessions: stats.files,
    local_token_usage: stats.total_token_usage
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
        ? `Evidence mix ${formatEvidenceMix(evidenceLevelMix)} across ${cards.length} public-safe evidence card${cards.length === 1 ? "" : "s"}.`
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

export function formatEvidenceMix(mix = {}) {
  return ["E1", "E2", "E3", "E4"]
    .filter((level) => (mix[level] || 0) > 0)
    .map((level) => `${level}:${mix[level]}`)
    .join(" / ") || "none";
}

function scoreForCards(cards) {
  if (!cards.length) return 40;
  const onlyBaseline = cards.every((card) => card.id === "EV-ACTIVITY-METADATA");
  const levelWeight = cards.reduce((sum, card) => sum
    + (card.level.includes("E1") ? 11 : 0)
    + (card.level.includes("E2") ? 7 : 0)
    + (card.level.includes("E3") ? 3 : 0)
    + (card.level.includes("E4") ? 1 : 0), 0);
  const categorySpread = new Set(cards.map((card) => card.category).filter(Boolean)).size;
  const baseline = onlyBaseline ? 52 : 45;
  const score = baseline + Math.sqrt(levelWeight) * 3.6 + categorySpread * 3.5 + cards.length * 1.5;
  return Math.max(45, Math.min(96, Math.round(score)));
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

function buildCalibrationNotes({ hasCuratedEvidence, stats, codexAccountUsage }) {
  const measuredClients = stats.measured_clients || [];
  const measuredLabel = measuredClients.length ? measuredClients.join(", ") : "none";
  const notes = [
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
      summary: `Measured adapters in this run: ${measuredLabel}; ${stats.files} local agent sessions were scanned.`
    },
    {
      type: "missing_evidence",
      severity: hasCuratedEvidence ? "low" : "medium",
      summary: hasCuratedEvidence
        ? "The profile still needs external outcomes before making stronger public claims."
        : "No curated memory evidence was available, so the profile stays at activity-baseline strength."
    }
  ];
  notes.push({
    type: "account_usage_boundary",
    severity: codexAccountUsage?.status === "measured" ? "low" : "medium",
    summary: codexAccountUsage?.status === "measured"
      ? "Codex account-level token usage was read through the local Codex CLI app-server; local session counts still come from auditable local traces."
      : "Codex account-level usage was unavailable, so public token totals fall back to auditable local traces."
  });
  if (stats.clients?.opencode?.status === "measured") {
    notes.push({
      type: "opencode_boundary",
      severity: "low",
      summary: "opencode activity is read from local SQLite session metadata only; raw prompts, raw responses, and tool output bodies stay excluded."
    });
  }
  if (stats.clients?.claude_code?.status === "measured") {
    notes.push({
      type: "claude_code_boundary",
      severity: "low",
      summary: "Claude Code activity is read from local project JSONL metadata and usage fields only; raw prompts, raw responses, attachments, and tool output bodies stay excluded."
    });
  }
  return notes;
}
