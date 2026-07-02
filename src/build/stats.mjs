import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { readJsonlLines } from "./utils.mjs";

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

function collectJsonlFiles(rootDirs) {
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
        } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
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

export function sumTokenUsage(records) {
  return records.reduce((total, record) => {
    const usage = record.token_usage || {};
    for (const key of Object.keys(total)) total[key] += usage[key] || 0;
    return total;
  }, zeroTokenUsage());
}

export function zeroTokenUsage() {
  return {
    total_tokens: 0,
    input_tokens: 0,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0
  };
}

export function collectAgentStats({ codexSessionRoots, opencode, claudeCode }, { publicProjectPaths }) {
  const codex = collectCodexStats(codexSessionRoots, { publicProjectPaths });
  const opencodeStats = collectOpencodeStats(opencode, { publicProjectPaths });
  const claudeCodeStats = collectClaudeCodeStats(claudeCode, { publicProjectPaths });
  return mergeClientStats({ codex, opencode: opencodeStats, claude_code: claudeCodeStats });
}

export function collectCodexStats(rootDirs, { publicProjectPaths }) {
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
    session_records: sessionRecords,
    client_id: "codex",
    status: files.length > 0 ? "measured" : "not_found",
    usage_source: "local_codex_logs"
  };
}

export function collectOpencodeStats(options = {}, { publicProjectPaths }) {
  const base = emptyClientStats({
    clientId: "opencode",
    status: options?.enabled === false ? "not_configured" : "not_found",
    usageSource: "local_opencode_sqlite"
  });
  if (options?.enabled === false) return base;

  const databasePath = options?.databasePath;
  if (!databasePath || !fs.existsSync(databasePath)) {
    return {
      ...base,
      database_found: false,
      status_reason: "opencode_database_not_found"
    };
  }

  const sqliteExecutable = options?.sqliteExecutable || "sqlite3";
  try {
    const summaryRows = querySqliteJson(sqliteExecutable, databasePath, `
      SELECT
        COUNT(*) AS sessions,
        SUM(CASE WHEN (tokens_input + tokens_output + tokens_reasoning + tokens_cache_read + tokens_cache_write) > 0 THEN 1 ELSE 0 END) AS token_sessions,
        MIN(time_created) AS start_ms,
        MAX(CASE WHEN time_updated > 0 THEN time_updated ELSE time_created END) AS end_ms,
        SUM(tokens_input) AS input_tokens,
        SUM(tokens_output) AS output_tokens,
        SUM(tokens_reasoning) AS reasoning_output_tokens,
        SUM(tokens_cache_read + tokens_cache_write) AS cached_input_tokens,
        SUM(tokens_input + tokens_output + tokens_reasoning + tokens_cache_read + tokens_cache_write) AS total_tokens,
        SUM(cost) AS cost_usd
      FROM session;
    `);
    const summary = summaryRows[0] || {};
    const sessions = Number(summary.sessions || 0);
    const tokenUsage = normalizeTokenUsage(summary);
    const traceWindow = traceWindowFromMs(summary.start_ms, summary.end_ms);

    const projectRows = querySqliteJson(sqliteExecutable, databasePath, `
      SELECT
        COALESCE(NULLIF(s.directory, ''), p.worktree, '(unknown)') AS project_path,
        COUNT(s.id) AS sessions,
        SUM(s.tokens_input + s.tokens_output + s.tokens_reasoning + s.tokens_cache_read + s.tokens_cache_write) AS total_tokens,
        SUM(s.cost) AS cost_usd
      FROM session s
      LEFT JOIN project p ON p.id = s.project_id
      GROUP BY project_path
      ORDER BY sessions DESC, total_tokens DESC
      LIMIT 12;
    `);
    const topProjects = projectRows.map((row, index) => ({
      agent_client: "opencode",
      project_ref: publicProjectPaths ? safeProjectName(row.project_path) : `opencode_project_ref_${String(index + 1).padStart(3, "0")}`,
      sessions: Number(row.sessions || 0),
      total_tokens: Number(row.total_tokens || 0),
      cost_usd: Number(row.cost_usd || 0),
      public_project_path_included: Boolean(publicProjectPaths)
    }));

    const recordRows = querySqliteJson(sqliteExecutable, databasePath, `
      SELECT
        id,
        COALESCE(NULLIF(directory, ''), '(unknown)') AS project_path,
        time_created,
        CASE WHEN time_updated > 0 THEN time_updated ELSE time_created END AS time_updated,
        version,
        cost,
        tokens_input,
        tokens_output,
        tokens_reasoning,
        tokens_cache_read,
        tokens_cache_write
      FROM session
      ORDER BY time_created ASC;
    `);
    const sessionRecords = recordRows.map((row) => {
      const recordTokens = normalizeTokenUsage({
        input_tokens: row.tokens_input,
        output_tokens: row.tokens_output,
        reasoning_output_tokens: row.tokens_reasoning,
        cached_input_tokens: Number(row.tokens_cache_read || 0) + Number(row.tokens_cache_write || 0),
        total_tokens: Number(row.tokens_input || 0)
          + Number(row.tokens_output || 0)
          + Number(row.tokens_reasoning || 0)
          + Number(row.tokens_cache_read || 0)
          + Number(row.tokens_cache_write || 0)
      });
      return {
        session_id: `opencode:${row.id}`,
        timestamp: isoFromMs(row.time_created),
        project_path: row.project_path || "(unknown)",
        source: "opencode",
        has_token_usage: recordTokens.total_tokens > 0,
        token_usage: recordTokens.total_tokens > 0 ? recordTokens : null,
        cost_usd: Number(row.cost || 0),
        file_mtime_ms: Number(row.time_updated || row.time_created || 0),
        opencode_version: row.version || null,
        agent: null,
        model: null
      };
    });

    return {
      ...base,
      status: sessions > 0 ? "measured" : "not_found",
      database_found: true,
      database_path: databasePath,
      files: sessions,
      sessions,
      token_sessions: Number(summary.token_sessions || 0),
      trace_window: traceWindow,
      total_token_usage: tokenUsage,
      cost_usd: Number(summary.cost_usd || 0),
      by_source: sessions > 0 ? { opencode: sessions } : {},
      top_projects: topProjects,
      session_records: sessionRecords
    };
  } catch (error) {
    return {
      ...base,
      status: "unavailable",
      database_found: true,
      status_reason: normalizeSqliteError(error)
    };
  }
}

export function collectClaudeCodeStats(options = {}, { publicProjectPaths }) {
  const base = emptyClientStats({
    clientId: "claude_code",
    status: options?.enabled === false ? "not_configured" : "not_found",
    usageSource: "local_claude_code_projects"
  });
  if (options?.enabled === false) return base;

  const projectsDir = options?.projectsDir;
  if (!projectsDir || !fs.existsSync(projectsDir)) {
    return {
      ...base,
      projects_dir_found: false,
      status_reason: "claude_code_projects_dir_not_found"
    };
  }

  const files = collectJsonlFiles(projectsDir);
  if (!files.length) {
    return {
      ...base,
      projects_dir_found: true,
      status_reason: "claude_code_sessions_not_found"
    };
  }

  const byProject = new Map();
  const projectTokens = new Map();
  const sessionRecords = [];
  const totals = zeroTokenUsage();
  let tokenSessions = 0;
  let minTs = null;
  let maxTs = null;

  for (const file of files) {
    let sessionId = path.basename(file, ".jsonl");
    let projectPath = null;
    let source = "claude_code";
    let version = null;
    let sessionMinTs = null;
    let sessionMaxTs = null;
    const sessionTokens = zeroTokenUsage();

    for (const line of readJsonlLines(file)) {
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }

      if (typeof obj.sessionId === "string" && obj.sessionId) sessionId = obj.sessionId;
      if (typeof obj.version === "string" && obj.version) version = obj.version;
      if (typeof obj.entrypoint === "string" && obj.entrypoint) source = obj.entrypoint;

      const projectCandidate = claudeCodeProjectPath(obj);
      if (!projectPath && projectCandidate) projectPath = projectCandidate;

      const timestamp = timestampFromObject(obj);
      if (timestamp) {
        if (!minTs || timestamp < minTs) minTs = timestamp;
        if (!maxTs || timestamp > maxTs) maxTs = timestamp;
        if (!sessionMinTs || timestamp < sessionMinTs) sessionMinTs = timestamp;
        if (!sessionMaxTs || timestamp > sessionMaxTs) sessionMaxTs = timestamp;
      }

      for (const usage of claudeCodeUsageObjects(obj)) {
        const normalized = normalizeClaudeCodeTokenUsage(usage);
        if (normalized.total_tokens <= 0) continue;
        for (const key of Object.keys(sessionTokens)) sessionTokens[key] += normalized[key] || 0;
      }
    }

    const projectKey = projectPath || claudeCodeProjectRefFromFile(file, projectsDir) || "(unknown)";
    const hasTokenUsage = sessionTokens.total_tokens > 0;
    byProject.set(projectKey, (byProject.get(projectKey) || 0) + 1);
    if (hasTokenUsage) {
      tokenSessions += 1;
      for (const key of Object.keys(totals)) totals[key] += sessionTokens[key] || 0;
      projectTokens.set(projectKey, (projectTokens.get(projectKey) || 0) + (sessionTokens.total_tokens || 0));
    }

    let fileMtimeMs = 0;
    try {
      fileMtimeMs = Math.round(fs.statSync(file).mtimeMs);
    } catch {
      fileMtimeMs = 0;
    }

    sessionRecords.push({
      session_id: `claude_code:${sessionId}`,
      timestamp: sessionMinTs || sessionMaxTs || null,
      project_path: projectKey,
      source,
      has_token_usage: hasTokenUsage,
      token_usage: hasTokenUsage ? sessionTokens : null,
      file_mtime_ms: fileMtimeMs,
      claude_code_version: version,
      agent: null,
      model: null
    });
  }

  const topProjects = [...byProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([projectPath, sessions], index) => ({
      agent_client: "claude_code",
      project_ref: publicProjectPaths ? safeProjectName(projectPath) : `claude_code_project_ref_${String(index + 1).padStart(3, "0")}`,
      sessions,
      total_tokens: projectTokens.get(projectPath) || 0,
      public_project_path_included: Boolean(publicProjectPaths)
    }));

  return {
    ...base,
    status: files.length > 0 ? "measured" : "not_found",
    projects_dir_found: true,
    projects_dir: projectsDir,
    files: files.length,
    sessions: files.length,
    token_sessions: tokenSessions,
    trace_window: {
      start: minTs ? minTs.slice(0, 10) : "unknown",
      end: maxTs ? maxTs.slice(0, 10) : "unknown",
      start_timestamp: minTs,
      end_timestamp: maxTs
    },
    total_token_usage: totals,
    by_source: files.length > 0 ? { claude_code: files.length } : {},
    top_projects: topProjects,
    session_records: sessionRecords
  };
}

function mergeClientStats(clients) {
  const clientList = Object.values(clients);
  const tokenUsage = mergeTokenUsage(clientList.map((client) => client.total_token_usage));
  const sessionRecords = clientList.flatMap((client) => client.session_records || []);
  const traceWindow = mergeTraceWindows(clientList.map((client) => client.trace_window));
  const topProjects = clientList
    .flatMap((client) => client.top_projects || [])
    .sort((a, b) => (b.sessions || 0) - (a.sessions || 0))
    .slice(0, 12);
  const measuredClients = clientList
    .filter((client) => client.status === "measured")
    .map((client) => client.client_id);

  return {
    session_roots_count: clients.codex.session_roots_count || 0,
    files: clientList.reduce((sum, client) => sum + (client.files || client.sessions || 0), 0),
    codex_files: clients.codex.files || 0,
    opencode_sessions: clients.opencode.files || 0,
    claude_code_sessions: clients.claude_code.files || 0,
    token_sessions: clientList.reduce((sum, client) => sum + (client.token_sessions || 0), 0),
    trace_window: traceWindow,
    total_token_usage: tokenUsage,
    language_votes: clients.codex.language_votes || { "zh-CN": 0, "en-US": 0 },
    language_sample: clients.codex.language_sample || { user_messages_seen: 0, sampled_characters: 0 },
    by_source: clientList.reduce((merged, client) => ({ ...merged, ...(client.by_source || {}) }), {}),
    top_projects: topProjects,
    session_records: sessionRecords,
    clients,
    measured_clients: measuredClients
  };
}

function emptyClientStats({ clientId, status, usageSource }) {
  return {
    client_id: clientId,
    status,
    files: 0,
    sessions: 0,
    token_sessions: 0,
    trace_window: {
      start: "unknown",
      end: "unknown",
      start_timestamp: null,
      end_timestamp: null
    },
    total_token_usage: zeroTokenUsage(),
    by_source: {},
    top_projects: [],
    session_records: [],
    usage_source: usageSource
  };
}

function querySqliteJson(sqliteExecutable, databasePath, query) {
  const output = execFileSync(sqliteExecutable, ["-json", sqliteUri(databasePath), query], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024
  }).trim();
  return output ? JSON.parse(output) : [];
}

function sqliteUri(databasePath) {
  return `file:${databasePath.replaceAll("#", "%23").replaceAll("?", "%3F")}?mode=ro`;
}

function normalizeSqliteError(error) {
  const message = `${String(error?.message || "")}\n${String(error?.stderr || "")}`;
  if (message.includes("ENOENT")) return "sqlite3_not_found";
  if (/no such table/i.test(message)) return "unsupported_opencode_schema";
  return "opencode_sqlite_read_failed";
}

function claudeCodeProjectPath(obj) {
  const candidates = [
    obj.cwd,
    obj.projectPath,
    obj.project_path,
    obj.workspace,
    obj.workspacePath,
    obj.project?.path,
    obj.project?.cwd
  ];
  return candidates.find((value) => typeof value === "string" && value.trim()) || null;
}

function claudeCodeProjectRefFromFile(file, projectsDir) {
  const relative = path.relative(projectsDir, path.dirname(file));
  if (!relative || relative.startsWith("..")) return null;
  return relative.split(path.sep)[0] || null;
}

function timestampFromObject(obj = {}) {
  const candidates = [obj.timestamp, obj.createdAt, obj.created_at, obj.time];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate) continue;
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function claudeCodeUsageObjects(obj = {}) {
  return [
    obj.usage,
    obj.usage_metadata,
    obj.message?.usage,
    obj.message?.usage_metadata
  ].filter((value) => value && typeof value === "object" && !Array.isArray(value));
}

function normalizeClaudeCodeTokenUsage(usage = {}) {
  const inputTokens = numberFromUsage(usage.input_tokens ?? usage.inputTokens);
  const outputTokens = numberFromUsage(usage.output_tokens ?? usage.outputTokens);
  const cacheReadTokens = numberFromUsage(usage.cache_read_input_tokens ?? usage.cacheReadInputTokens);
  const cacheCreationTokens = usage.cache_creation_input_tokens !== undefined || usage.cacheCreationInputTokens !== undefined
    ? numberFromUsage(usage.cache_creation_input_tokens ?? usage.cacheCreationInputTokens)
    : sumNumericObjectValues(usage.cache_creation);
  const reasoningTokens = numberFromUsage(
    usage.reasoning_output_tokens
      ?? usage.reasoningOutputTokens
      ?? usage.output_token_details?.reasoning_tokens
      ?? usage.outputTokenDetails?.reasoningTokens
      ?? usage.thinking_tokens
  );
  const cachedInputTokens = cacheReadTokens + cacheCreationTokens;
  const totalTokens = numberFromUsage(usage.total_tokens ?? usage.totalTokens)
    || inputTokens + outputTokens + cachedInputTokens + reasoningTokens;

  return {
    total_tokens: totalTokens,
    input_tokens: inputTokens,
    cached_input_tokens: cachedInputTokens,
    output_tokens: outputTokens,
    reasoning_output_tokens: reasoningTokens
  };
}

function numberFromUsage(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function sumNumericObjectValues(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.values(value).reduce((sum, item) => sum + numberFromUsage(item), 0);
}

function normalizeTokenUsage(row = {}) {
  return {
    total_tokens: Number(row.total_tokens || 0),
    input_tokens: Number(row.input_tokens || 0),
    cached_input_tokens: Number(row.cached_input_tokens || 0),
    output_tokens: Number(row.output_tokens || 0),
    reasoning_output_tokens: Number(row.reasoning_output_tokens || 0)
  };
}

function mergeTokenUsage(usages = []) {
  return usages.reduce((total, usage = {}) => {
    for (const key of Object.keys(total)) total[key] += Number(usage[key] || 0);
    return total;
  }, zeroTokenUsage());
}

function mergeTraceWindows(windows = []) {
  const timestamps = windows
    .filter(Boolean)
    .flatMap((window) => [window.start_timestamp, window.end_timestamp])
    .filter(Boolean);
  if (!timestamps.length) {
    return {
      start: "unknown",
      end: "unknown",
      start_timestamp: null,
      end_timestamp: null
    };
  }
  const sorted = timestamps.sort();
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  return {
    start: start.slice(0, 10),
    end: end.slice(0, 10),
    start_timestamp: start,
    end_timestamp: end
  };
}

function traceWindowFromMs(startMs, endMs) {
  const start = isoFromMs(startMs);
  const end = isoFromMs(endMs);
  return {
    start: start ? start.slice(0, 10) : "unknown",
    end: end ? end.slice(0, 10) : "unknown",
    start_timestamp: start,
    end_timestamp: end
  };
}

function isoFromMs(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const date = new Date(numeric);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeProjectName(projectPath) {
  if (!projectPath || projectPath === "(unknown)") return "unknown";
  return path.basename(projectPath) || "root";
}
