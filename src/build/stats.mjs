import fs from "node:fs";
import path from "node:path";

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
    session_records: sessionRecords
  };
}

function safeProjectName(projectPath) {
  if (!projectPath || projectPath === "(unknown)") return "unknown";
  return path.basename(projectPath);
}
