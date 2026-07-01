import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const CONFIG_FILE = "agentrecord.config.json";
export const SUPPORTED_LOCALES = new Set(["en-US", "zh-CN", "auto"]);
export const SUPPORTED_LABEL_MODES = new Set(["localized", "canonical", "bilingual-compact"]);
export const DEFAULT_AUDIENCES = ["self", "share"];

export function safePathSegment(value) {
  return String(value || "default").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "default";
}

export function expandHome(value) {
  if (!value) return value;
  if (value === "~") return process.env.HOME || value;
  if (value.startsWith("~/")) return path.join(process.env.HOME || "", value.slice(2));
  return value;
}

export function resolvePath(value, baseDir = process.cwd()) {
  const expanded = expandHome(value);
  if (!expanded) return expanded;
  return path.isAbsolute(expanded) ? expanded : path.resolve(baseDir, expanded);
}

export function normalizeLocale(value, fallback = "auto") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const normalized = raw.replace("_", "-").toLowerCase();
  if (["auto", "detect"].includes(normalized)) return "auto";
  if (normalized === "zh" || normalized.startsWith("zh-") || normalized === "cn") return "zh-CN";
  if (normalized === "en" || normalized.startsWith("en-")) return "en-US";
  return SUPPORTED_LOCALES.has(raw) ? raw : fallback;
}

export function normalizeLabelMode(value) {
  const raw = String(value || "").trim();
  return SUPPORTED_LABEL_MODES.has(raw) ? raw : "bilingual-compact";
}

export function normalizeAudiences(value) {
  const allowed = new Set(["self", "share", "hiring", "job-agent"]);
  const raw = Array.isArray(value) ? value : String(value || "").split(",");
  const audiences = unique(raw.map((item) => String(item).trim()).filter((item) => allowed.has(item)));
  const defaultOnly = audiences.length ? audiences : DEFAULT_AUDIENCES;
  return defaultOnly.includes("self") ? defaultOnly : ["self", ...defaultOnly];
}

export function splitPathList(value) {
  return String(value || "").split(new RegExp(`[${escapeRegExp(path.delimiter)},]`)).map((item) => item.trim()).filter(Boolean);
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function gitUserName(cwd = process.cwd()) {
  try {
    const value = execFileSync("git", ["config", "--get", "user.name"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return value || null;
  } catch {
    return null;
  }
}

export function defaultOwnerDisplayName() {
  return process.env.AGENTRECORD_OWNER || gitUserName() || os.userInfo().username || "default";
}

export function defaultOwner() {
  return safePathSegment(defaultOwnerDisplayName());
}

export function createDefaultConfig({ owner, ownerDisplayName, profilesDir = "profiles", locale = "auto" } = {}) {
  const safeOwner = safePathSegment(owner || defaultOwner());
  const displayName = ownerDisplayName || owner || defaultOwnerDisplayName();
  return {
    schema_version: "agentrecord.config.v0",
    owner: safeOwner,
    owner_display_name: displayName,
    profiles_dir: profilesDir,
    output: {
      profile_dir: `${profilesDir}/${safeOwner}`
    },
    codex: {
      sessions_dir: "~/.codex/sessions",
      session_roots: ["~/.codex/sessions"],
      account_usage: {
        enabled: true,
        timeout_ms: 15000
      }
    },
    memory: {
      enabled: true,
      registry_path: "~/.codex/memories/MEMORY.md"
    },
    evidence_rules_paths: [
      "references/evidence-rules.json"
    ],
    report: {
      locale,
      fallback_locale: "en-US",
      label_mode: "bilingual-compact",
      schema_language: "en-US",
      audiences: DEFAULT_AUDIENCES,
      default_audience: "self"
    },
    privacy: {
      public_session_ids: false,
      public_project_paths: false
    }
  };
}

export function loadConfig(options = {}) {
  const configPath = resolvePath(options.config || process.env.AGENTRECORD_CONFIG || CONFIG_FILE);
  const configDir = path.dirname(configPath);
  const rawConfig = readJsonIfExists(configPath) || {};
  const envOwner = process.env.AGENTRECORD_OWNER;
  const hasOwnerOverride = Boolean(options.owner || envOwner);
  const hasProfilesDirOverride = Boolean(options.profilesDir || process.env.AGENTRECORD_PROFILES_DIR);
  const ownerInput = options.owner || envOwner || rawConfig.owner || rawConfig.profile_owner || defaultOwner();
  const owner = safePathSegment(rawConfig.owner_id || ownerInput);
  const ownerDisplayName = options.displayName
    || (hasOwnerOverride ? ownerInput : rawConfig.owner_display_name || rawConfig.identity?.display_name || ownerInput);
  const profilesDirRaw = options.profilesDir || process.env.AGENTRECORD_PROFILES_DIR || rawConfig.profiles_dir || rawConfig.output?.profiles_dir || "profiles";
  const profileDirRaw = options.output
    || (hasOwnerOverride || hasProfilesDirOverride
      ? path.join(profilesDirRaw, owner)
      : rawConfig.output?.profile_dir || path.join(profilesDirRaw, owner));
  const profileDir = resolvePath(profileDirRaw, configDir);
  const profilesDir = resolvePath(profilesDirRaw, configDir);
  const privateStateDir = path.join(profileDir, ".agentrecord");
  const sessionsOverride = options.codexSessionsDir || options.sessionsDir || process.env.AGENTRECORD_CODEX_SESSIONS_DIR;
  const configuredSessionRoots = rawConfig.codex?.session_roots || rawConfig.codex?.sessions_roots || rawConfig.codex?.sessions_dirs;
  const configuredSessionDir = rawConfig.codex?.sessions_dir || rawConfig.codex?.session_dir;
  const sessionRootsRaw = sessionsOverride
    ? splitPathList(sessionsOverride)
    : configuredSessionRoots
      ? Array.isArray(configuredSessionRoots) ? configuredSessionRoots : splitPathList(configuredSessionRoots)
      : [configuredSessionDir || "~/.codex/sessions"];
  const accountUsageConfig = rawConfig.codex?.account_usage || {};
  const accountUsageEnabled = typeof options.accountUsage === "boolean"
    ? options.accountUsage
    : accountUsageConfig.enabled !== false;
  const accountUsageTimeoutMs = Number(options.accountUsageTimeoutMs || process.env.AGENTRECORD_CODEX_ACCOUNT_USAGE_TIMEOUT_MS || accountUsageConfig.timeout_ms || 15000);
  const privacyMode = options.privacy || rawConfig.privacy?.mode || "strict";
  const publicProjectPaths = typeof options.publicProjectPaths === "boolean"
    ? options.publicProjectPaths
    : privacyMode === "open"
      ? true
      : rawConfig.privacy?.public_project_paths === true;
  const publicSessionIds = typeof options.publicSessionIds === "boolean"
    ? options.publicSessionIds
    : rawConfig.privacy?.public_session_ids === true;
  const locale = normalizeLocale(options.locale || process.env.AGENTRECORD_LOCALE || rawConfig.report?.locale || rawConfig.locale || "auto");
  const fallbackLocale = normalizeLocale(rawConfig.report?.fallback_locale || process.env.AGENTRECORD_FALLBACK_LOCALE || "en-US", "en-US");
  const evidenceRulesRaw = options.evidenceRules
    ? splitPathList(options.evidenceRules)
    : Array.isArray(rawConfig.evidence_rules_paths)
      ? rawConfig.evidence_rules_paths
      : rawConfig.evidence_rules_paths
        ? splitPathList(rawConfig.evidence_rules_paths)
        : ["references/evidence-rules.json"];

  return {
    configPath,
    configDir,
    exists: fs.existsSync(configPath),
    raw: rawConfig,
    resolved: {
      owner,
      ownerDisplayName,
      profilesDir,
      profileDir,
      privateStateDir,
      codex: {
        sessionRoots: unique(sessionRootsRaw.map((item) => resolvePath(item, configDir))),
        accountUsage: {
          enabled: accountUsageEnabled,
          timeoutMs: Number.isFinite(accountUsageTimeoutMs) ? accountUsageTimeoutMs : 15000,
          executable: process.env.AGENTRECORD_CODEX_BIN || accountUsageConfig.executable || "codex"
        }
      },
      memory: {
        enabled: rawConfig.memory?.enabled !== false,
        registryPath: rawConfig.memory?.enabled === false
          ? null
          : resolvePath(options.memoryFile || process.env.AGENTRECORD_MEMORY_FILE || rawConfig.memory?.registry_path || "~/.codex/memories/MEMORY.md", configDir)
      },
      evidenceRulesPaths: unique(evidenceRulesRaw.map((item) => resolvePath(item, configDir))),
      report: {
        locale,
        fallbackLocale: fallbackLocale === "auto" ? "en-US" : fallbackLocale,
        labelMode: normalizeLabelMode(options.labelMode || rawConfig.report?.label_mode || "bilingual-compact"),
        schemaLanguage: "en-US",
        audiences: normalizeAudiences(options.audiences || rawConfig.report?.audiences || DEFAULT_AUDIENCES),
        defaultAudience: rawConfig.report?.default_audience || "self"
      },
      privacy: {
        mode: privacyMode,
        publicSessionIds,
        publicProjectPaths
      }
    }
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
