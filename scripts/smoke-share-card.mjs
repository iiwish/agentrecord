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
  assert(!/contenteditable\b/i.test(html), "HTML display name must not be directly editable.");
  assert(html.includes("node src/cli.mjs build --config ./agentrecord.config.json --display-name &quot;Your Name&quot;"), "HTML must show the source-checkout display-name correction command.");
  assert(html.includes("agentrecord build --config ./agentrecord.config.json --display-name &quot;Your Name&quot;"), "HTML must show the installed CLI display-name correction command.");
  assert(html.includes("github.com/iiwish/agentrecord"), "HTML must show the GitHub project text.");
  assert(!html.includes("npm @iiwish/agentrecord"), "HTML share card must keep a single source entry.");
  assert(!existsSync(path.join(tempRoot, "profiles", "Visible-Name")), "--display-name must not create a display-name output path.");
  assert(profile.share_card?.code && profile.share_card?.share_subtitle, "profile.share_card must be generated.");
  assert(!/<script\b/i.test(html), "index.html must not include script tags.");
  assert(!/<link\b/i.test(html), "index.html must not include link tags.");
  assert(!/https?:\/\//i.test(html), "index.html must not include http or https URLs.");
  assert(!/url\s*\(/i.test(html), "index.html must not include CSS url(...).");
  assert(!/@import\b/i.test(html), "index.html must not include CSS imports.");

  const archetypeCodes = Object.keys(SHARE_CARD_ARCHETYPES);
  assert(archetypeCodes.length === 16, "share-card system must define 16 base archetypes.");

  const stats = {
    files: 128,
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
