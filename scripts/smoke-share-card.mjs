#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildShareCard, SHARE_CARD_ARCHETYPES } from "../src/build/share-card.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = mkdtempSync(path.join(tmpdir(), "agentrecord-share-card-"));
const sessionsDir = path.join(tempRoot, "sessions");
const opencodeDbPath = path.join(tempRoot, "opencode.db");
const claudeProjectsDir = path.join(tempRoot, "claude", "projects");
const claudeProjectDir = path.join(claudeProjectsDir, "-tmp-agentrecord-smoke");
const profileDir = path.join(tempRoot, "profiles", "stable-owner");
const configPath = path.join(tempRoot, "agentrecord.config.json");

function run(args) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, "src", "cli.mjs"), ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  if (result.status !== 0) {
    const stdout = result.stdout ? `\n${result.stdout.trim()}` : "";
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : "";
    throw new Error(`node src/cli.mjs ${args.join(" ")} failed with exit ${result.status}${stdout}${stderr}`);
  }
  return result.stdout;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runSqlite(sql) {
  const result = spawnSync("sqlite3", [opencodeDbPath, sql], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  if (result.status !== 0) {
    const stdout = result.stdout ? `\n${result.stdout.trim()}` : "";
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : "";
    throw new Error(`sqlite3 smoke setup failed with exit ${result.status}${stdout}${stderr}`);
  }
}

function syntheticRoles(overrides) {
  return [
    "product_builder",
    "technical_reviewer",
    "agent_operator",
    "shipping_owner",
    "systems_thinker",
    "research_synthesizer",
    "collaboration_handoff"
  ].map((id) => ({
    role_id: id,
    label: id,
    score: overrides[id] || 40,
    evidence_ids: ["EV-SYNTHETIC"]
  }));
}

function syntheticAbilities(overrides) {
  return [
    "goal_framing",
    "context_packaging",
    "agent_delegation",
    "review_judgment",
    "verification_discipline",
    "failure_recovery",
    "scope_control",
    "shipping_hygiene",
    "product_judgment",
    "collaboration_handoff"
  ].map((id) => ({
    dimension_id: id,
    label: id,
    score: overrides[id] || 40,
    evidence_ids: ["EV-SYNTHETIC"]
  }));
}

try {
  mkdirSync(sessionsDir, { recursive: true });
  mkdirSync(claudeProjectDir, { recursive: true });
  runSqlite(`
    CREATE TABLE project (
      id TEXT PRIMARY KEY,
      worktree TEXT NOT NULL,
      time_created INTEGER NOT NULL,
      time_updated INTEGER NOT NULL
    );
    CREATE TABLE session (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      directory TEXT NOT NULL,
      title TEXT NOT NULL,
      version TEXT NOT NULL,
      time_created INTEGER NOT NULL,
      time_updated INTEGER NOT NULL,
      cost REAL DEFAULT 0 NOT NULL,
      tokens_input INTEGER DEFAULT 0 NOT NULL,
      tokens_output INTEGER DEFAULT 0 NOT NULL,
      tokens_reasoning INTEGER DEFAULT 0 NOT NULL,
      tokens_cache_read INTEGER DEFAULT 0 NOT NULL,
      tokens_cache_write INTEGER DEFAULT 0 NOT NULL
    );
    INSERT INTO project (id, worktree, time_created, time_updated)
      VALUES ('project-smoke', '${repoRoot.replaceAll("'", "''")}', 1780275600000, 1782787200000);
    INSERT INTO session (
      id, project_id, directory, title, version, time_created, time_updated, cost,
      tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write
    ) VALUES
      ('ses_smoke_001', 'project-smoke', '${repoRoot.replaceAll("'", "''")}', 'smoke metadata only', '1.17.12', 1780275600000, 1780362000000, 0.12, 1000000, 0, 0, 1000000, 0),
      ('ses_smoke_002', 'project-smoke', '${repoRoot.replaceAll("'", "''")}', 'smoke metadata only 2', '1.17.12', 1782787200000, 1782787200000, 0.34, 800000, 100000, 100000, 0, 0);
  `);
  writeFileSync(path.join(sessionsDir, "rollout-smoke-start.jsonl"), [
    JSON.stringify({
      type: "session_meta",
      payload: {
        id: "smoke-start-session",
        timestamp: "2026-06-01T09:00:00.000Z",
        cwd: repoRoot,
        source: "codex"
      }
    })
  ].join("\n") + "\n");
  writeFileSync(path.join(sessionsDir, "rollout-smoke-token.jsonl"), [
    JSON.stringify({
      type: "session_meta",
      payload: {
        id: "smoke-token-session",
        timestamp: "2026-06-30T12:00:00.000Z",
        cwd: repoRoot,
        source: "codex"
      }
    }),
    JSON.stringify({
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          total_token_usage: {
            total_tokens: 12_000_000,
            input_tokens: 11_500_000,
            cached_input_tokens: 10_000_000,
            output_tokens: 500_000,
            reasoning_output_tokens: 120_000
          }
        }
      }
    })
  ].join("\n") + "\n");
  writeFileSync(path.join(claudeProjectDir, "claude-smoke.jsonl"), [
    JSON.stringify({
      type: "user",
      sessionId: "claude-smoke-session",
      timestamp: "2026-06-20T10:00:00.000Z",
      cwd: repoRoot,
      version: "2.1.178",
      message: {
        role: "user",
        content: []
      }
    }),
    JSON.stringify({
      type: "assistant",
      sessionId: "claude-smoke-session",
      timestamp: "2026-06-20T10:05:00.000Z",
      cwd: repoRoot,
      version: "2.1.178",
      message: {
        role: "assistant",
        usage: {
          input_tokens: 100_000,
          output_tokens: 50_000,
          cache_read_input_tokens: 350_000
        }
      }
    })
  ].join("\n") + "\n");
  const initDryRun = JSON.parse(run(["init", "--dry-run", "--owner", "init-owner", "--display-name", "Init Name"]));
  assert(initDryRun.config.owner === "init-owner", "init --owner must write stable owner id.");
  assert(initDryRun.config.owner_display_name === "Init Name", "init --display-name must write owner_display_name.");
  assert(initDryRun.config.output.profile_dir === path.join("profiles", "init-owner"), "init --display-name must not change output path.");

  writeFileSync(configPath, `${JSON.stringify({
    schema_version: "agentrecord.config.v0",
    owner: "stable-owner",
    owner_display_name: "Config Name",
    profiles_dir: path.join(tempRoot, "profiles"),
    output: {
      profile_dir: profileDir
    },
    codex: {
      sessions_dir: sessionsDir,
      session_roots: [sessionsDir],
      account_usage: {
        enabled: false,
        timeout_ms: 1500
      }
    },
    opencode: {
      enabled: true,
      database_path: opencodeDbPath,
      sqlite_executable: "sqlite3"
    },
    claude_code: {
      enabled: true,
      projects_dir: claudeProjectsDir
    },
    memory: {
      enabled: false
    },
    evidence_rules_paths: [
      path.join(repoRoot, "references", "evidence-rules.json")
    ],
    report: {
      locale: "en-US",
      fallback_locale: "en-US",
      label_mode: "bilingual-compact",
      schema_language: "en-US",
      audiences: ["self", "share"],
      default_audience: "self"
    },
    privacy: {
      mode: "strict",
      public_session_ids: false,
      public_project_paths: false
    }
  }, null, 2)}\n`);

  run(["build", "--config", configPath, "--display-name", "Visible Name", "--no-account-usage"]);
  run(["validate", "--config", configPath]);

  const profile = JSON.parse(readFileSync(path.join(profileDir, "profile.json"), "utf8"));
  const html = readFileSync(path.join(profileDir, "index.html"), "utf8");
  assert(profile.owner.id === "stable-owner", "--display-name must not change owner id.");
  assert(profile.owner.display_name === "Visible Name", "--display-name must update profile owner display name.");
  assert(html.includes("Visible Name"), "--display-name must update HTML.");
  assert(/class="holder-name"[^>]*contenteditable="plaintext-only"/.test(html), "HTML display name must be directly editable for screenshot sharing.");
  assert(!html.includes("node src/cli.mjs build --config ./agentrecord.config.json --display-name &quot;Your Name&quot;"), "HTML must not show a display-name correction module.");
  assert(!html.includes("agentrecord build --config ./agentrecord.config.json --display-name &quot;Your Name&quot;"), "HTML must not show an installed CLI display-name correction module.");
  assert(html.includes("github.com/iiwish/agentrecord"), "HTML must show the GitHub project text.");
  assert(!html.includes("npm @iiwish/agentrecord"), "HTML share card must keep a single source entry.");
  assert(!existsSync(path.join(tempRoot, "profiles", "Visible-Name")), "--display-name must not create a display-name output path.");
  assert(profile.share_card?.code && profile.share_card?.share_subtitle, "profile.share_card must be generated.");
  assert(profile.share_card?.state === "baseline/activity_only", "metadata-only CLI build must produce an activity-only baseline state.");
  assert(profile.share_card?.code === "ACTIVITY", "metadata-only CLI build must not produce a strong archetype code.");
  const opencodeClient = profile.agent_ledger?.clients?.find((client) => client.client_id === "opencode");
  assert(opencodeClient?.status === "measured", "profile.agent_ledger must mark opencode as measured when a local opencode database is configured.");
  assert(opencodeClient.sessions === 2, "opencode ledger must include local opencode session count.");
  assert(opencodeClient.token_usage?.total_tokens === 3_000_000, "opencode ledger must aggregate opencode token metadata.");
  assert(!html.includes(opencodeDbPath), "HTML must not expose the raw opencode database path.");
  const claudeCodeClient = profile.agent_ledger?.clients?.find((client) => client.client_id === "claude_code");
  assert(claudeCodeClient?.status === "measured", "profile.agent_ledger must mark Claude Code as measured when local project logs are configured.");
  assert(claudeCodeClient.sessions === 1, "Claude Code ledger must include local project JSONL session count.");
  assert(claudeCodeClient.token_usage?.total_tokens === 500_000, "Claude Code ledger must aggregate local usage metadata.");
  assert(!html.includes(claudeProjectsDir), "HTML must not expose the raw Claude Code projects path.");
  assert(!html.includes("claude-smoke-session"), "HTML must not expose the raw Claude Code session id.");
  assert(/15\.5M\s+tokens/i.test(html), "HTML share card must surface aggregate measured-client token usage.");
  const evidenceMetaMatch = html.match(/<div class="evidence-meta"[\s\S]*?<\/div>/);
  assert(evidenceMetaMatch, "HTML share card must include a compact evidence meta line.");
  assert(/Codex/.test(evidenceMetaMatch[0]), "HTML evidence meta must show Codex when Codex traces are measured.");
  assert(/opencode/.test(evidenceMetaMatch[0]), "HTML evidence meta must show opencode when opencode traces are measured.");
  assert(/Claude Code/.test(evidenceMetaMatch[0]), "HTML evidence meta must show Claude Code when Claude Code traces are measured.");
  assert(/30-day record/i.test(evidenceMetaMatch[0]), "HTML evidence meta must show usage span from the trace window.");
  assert(/15\.5M\s+tokens/i.test(evidenceMetaMatch[0]), "HTML evidence meta must surface aggregate measured-client token usage.");
  assert(!/Agent Stack/i.test(evidenceMetaMatch[0]), "HTML evidence meta must not add a separate tool-stack label.");
  assert(!/\d+\s+evidence/i.test(evidenceMetaMatch[0]), "HTML evidence meta must not show evidence-count metrics.");
  assert(!/\d+\s+sessions/i.test(evidenceMetaMatch[0]), "HTML evidence meta must not show session-count metrics.");
  assert(!/class="tool-stack"|class="tool-chip"|class="proof-strip"|class="proof-pill"/.test(html), "HTML share card must not keep the old stacked auxiliary chip rows.");
  assert(!/<script\b/i.test(html), "index.html must not include script tags.");
  assert(!/<link\b/i.test(html), "index.html must not include link tags.");
  assert(!/https?:\/\//i.test(html), "index.html must not include http or https URLs.");
  assert(!/url\s*\(/i.test(html), "index.html must not include CSS url(...).");
  assert(!/@import\b/i.test(html), "index.html must not include CSS imports.");

  const emptySessionsDir = path.join(tempRoot, "empty-sessions");
  const noDataProfileDir = path.join(tempRoot, "profiles", "no-data-owner");
  const noDataConfigPath = path.join(tempRoot, "agentrecord.no-data.config.json");
  mkdirSync(emptySessionsDir, { recursive: true });
  writeFileSync(noDataConfigPath, `${JSON.stringify({
    schema_version: "agentrecord.config.v0",
    owner: "no-data-owner",
    owner_display_name: "No Data Owner",
    profiles_dir: path.join(tempRoot, "profiles"),
    output: {
      profile_dir: noDataProfileDir
    },
    codex: {
      sessions_dir: emptySessionsDir,
      session_roots: [emptySessionsDir],
      account_usage: {
        enabled: false,
        timeout_ms: 1500
      }
    },
    opencode: {
      enabled: false
    },
    claude_code: {
      enabled: false
    },
    memory: {
      enabled: false
    },
    evidence_rules_paths: [
      path.join(repoRoot, "references", "evidence-rules.json")
    ],
    report: {
      locale: "en-US",
      fallback_locale: "en-US",
      label_mode: "bilingual-compact",
      schema_language: "en-US",
      audiences: ["self", "share"],
      default_audience: "self"
    },
    privacy: {
      mode: "strict",
      public_session_ids: false,
      public_project_paths: false
    }
  }, null, 2)}\n`);
  run(["build", "--config", noDataConfigPath, "--no-account-usage"]);
  run(["validate", "--config", noDataConfigPath]);
  const noDataProfile = JSON.parse(readFileSync(path.join(noDataProfileDir, "profile.json"), "utf8"));
  const noDataHtml = readFileSync(path.join(noDataProfileDir, "index.html"), "utf8");
  assert(noDataProfile.share_card?.state === "baseline/no_data", "zero-data HTML build must keep baseline/no_data state.");
  assert(!/class="evidence-meta"|class="tool-stack"/.test(noDataHtml), "zero-data HTML share card must not show measured auxiliary metadata.");
  assert(!/Agent Stack|工具栈/i.test(noDataHtml), "zero-data HTML share card must not imply an agent tool stack.");

  const archetypeCodes = Object.keys(SHARE_CARD_ARCHETYPES);
  assert(archetypeCodes.length === 16, "share-card system must define 16 base archetypes.");

  const noDataEvidence = [{
    id: "EV-ACTIVITY-METADATA",
    level: ["E2"],
    category: "agent_usage",
    role_signals: ["agent_operator"],
    dimensions: ["agent_delegation", "context_packaging"]
  }];
  const noDataCard = buildShareCard({
    roleSignals: syntheticRoles({}),
    abilityModel: syntheticAbilities({}),
    stats: {
      files: 0,
      measured_clients: [],
      trace_window: { start: "unknown", end: "unknown" },
      total_token_usage: { total_tokens: 0 }
    },
    identityConfidence: "no_data",
    evidenceCards: noDataEvidence,
    locale: "zh-CN",
    tieBreakerSeed: "share-smoke-no-data"
  });
  assert(noDataCard.code === "NO_DATA", "zero-data share card must use the explicit NO_DATA code.");
  assert(noDataCard.state === "baseline/no_data", "zero-data share card must expose baseline/no_data state.");
  assert(!/代码判官|proof reviewer/i.test(`${noDataCard.name} ${noDataCard.share_subtitle} ${noDataCard.strength_sentence} ${noDataCard.risk_sentence}`), "zero-data card must not use strong archetype copy.");

  const activityOnlyCard = buildShareCard({
    roleSignals: syntheticRoles({ agent_operator: 58 }),
    abilityModel: syntheticAbilities({ agent_delegation: 58, context_packaging: 58 }),
    stats: {
      files: 4,
      measured_clients: ["codex"],
      trace_window: { start: "2026-06-01", end: "2026-06-02" },
      total_token_usage: { total_tokens: 250_000 }
    },
    identityConfidence: "activity_baseline",
    evidenceCards: noDataEvidence,
    locale: "zh-CN",
    tieBreakerSeed: "share-smoke-activity"
  });
  assert(activityOnlyCard.code === "ACTIVITY", "activity-only share card must use the explicit ACTIVITY code.");
  assert(activityOnlyCard.state === "baseline/activity_only", "activity-only share card must expose baseline/activity_only state.");
  assert(activityOnlyCard.variant_badges.some((badge) => badge.includes("活动度")), "activity-only card must have a distinct activity badge.");

  const stats = {
    files: 128,
    measured_clients: ["codex"],
    trace_window: { start: "2026-06-01", end: "2026-06-30" },
    total_token_usage: { total_tokens: 12_000_000 }
  };
  const evidenceCards = [{ id: "EV-SYNTHETIC", level: ["E2"], role_signals: [], dimensions: [] }];
  const systemsCard = buildShareCard({
    roleSignals: syntheticRoles({
      systems_thinker: 90,
      technical_reviewer: 84,
      agent_operator: 58,
      product_builder: 45,
      shipping_owner: 55,
      collaboration_handoff: 72
    }),
    abilityModel: syntheticAbilities({
      context_packaging: 88,
      verification_discipline: 86,
      review_judgment: 82,
      goal_framing: 54,
      product_judgment: 48,
      shipping_hygiene: 62
    }),
    stats,
    identityConfidence: "medium",
    evidenceCards,
    locale: "zh-CN"
  });
  const productCard = buildShareCard({
    roleSignals: syntheticRoles({
      product_builder: 91,
      agent_operator: 88,
      shipping_owner: 86,
      technical_reviewer: 52,
      systems_thinker: 46
    }),
    abilityModel: syntheticAbilities({
      goal_framing: 90,
      product_judgment: 92,
      shipping_hygiene: 88,
      agent_delegation: 84,
      context_packaging: 52,
      verification_discipline: 56
    }),
    stats,
    identityConfidence: "medium",
    evidenceCards,
    locale: "zh-CN"
  });

  assert(systemsCard.code !== productCard.code, "different signals must produce different archetypes.");
  assert(systemsCard.punchline !== productCard.punchline, "different archetypes must produce different share copy.");

  console.log(JSON.stringify({
    ok: true,
    profile_dir: profileDir,
    display_name: profile.owner.display_name,
    owner_id: profile.owner.id,
    archetypes: archetypeCodes.length,
    variant_codes: [systemsCard.code, productCard.code]
  }, null, 2));
} finally {
  if (process.env.AGENTRECORD_KEEP_SMOKE_TEMP !== "1") {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
