import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 15000;

export async function readCodexAccountUsage(options = {}) {
  const enabled = options.enabled !== false;
  if (!enabled) {
    return {
      status: "disabled",
      source: "codex_app_server",
      summary: null,
      daily_usage_buckets: null
    };
  }

  const executable = options.executable || "codex";
  const timeoutMs = Number.isFinite(Number(options.timeoutMs))
    ? Math.max(1000, Number(options.timeoutMs))
    : DEFAULT_TIMEOUT_MS;

  try {
    const result = await callCodexAppServer({ executable, timeoutMs });
    const usage = normalizeUsage(result.usage);
    return {
      status: usage.summary ? "measured" : "unavailable",
      source: "codex_app_server",
      source_label: "Codex CLI account usage",
      account: normalizeAccount(result.account),
      summary: usage.summary,
      daily_usage_buckets: usage.daily_usage_buckets,
      status_reason: usage.summary ? null : "account_usage_unavailable"
    };
  } catch (error) {
    return {
      status: "unavailable",
      source: "codex_app_server",
      source_label: "Codex CLI account usage",
      account: null,
      summary: null,
      daily_usage_buckets: null,
      status_reason: sanitizeReason(error)
    };
  }
}

function callCodexAppServer({ executable, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, ["app-server"], {
      stdio: ["pipe", "pipe", "ignore"]
    });

    let nextId = 1;
    let buffer = "";
    const pending = new Map();
    const results = {};
    let settled = false;

    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGTERM");
      if (error) reject(error);
      else resolve(value);
    };

    const timer = setTimeout(() => finish(new Error("timeout")), timeoutMs);

    const send = (method, params, key) => {
      const id = nextId;
      nextId += 1;
      pending.set(id, key);
      const message = params === undefined ? { id, method } : { id, method, params };
      child.stdin.write(`${JSON.stringify(message)}\n`);
    };

    const notify = (method, params = {}) => {
      child.stdin.write(`${JSON.stringify({ method, params })}\n`);
    };

    const maybeDone = () => {
      if (results.account !== undefined && results.usage !== undefined) {
        finish(null, results);
      }
    };

    child.on("error", (error) => finish(error));
    child.on("exit", (code) => {
      if (!settled && code !== 0) finish(new Error(`app_server_exit_${code}`));
    });

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          continue;
        }

        if (message.id == null) continue;
        const key = pending.get(message.id);
        if (!key) continue;

        if (message.error) {
          results[key] = { error: message.error };
        } else {
          results[key] = message.result || null;
        }

        if (key === "initialize") {
          notify("initialized");
          send("account/read", {}, "account");
          send("account/usage/read", undefined, "usage");
        }

        maybeDone();
      }
    });

    send("initialize", {
      clientInfo: {
        name: "agentrecord",
        title: "AgentRecord",
        version: "0.0.0"
      },
      capabilities: {
        experimentalApi: true
      }
    }, "initialize");
  });
}

function normalizeUsage(raw) {
  if (!raw || raw.error) return { summary: null, daily_usage_buckets: null };
  const sourceSummary = raw.summary || {};
  const summary = {
    lifetime_tokens: nullableNumber(sourceSummary.lifetimeTokens),
    peak_daily_tokens: nullableNumber(sourceSummary.peakDailyTokens),
    longest_running_turn_sec: nullableNumber(sourceSummary.longestRunningTurnSec),
    current_streak_days: nullableNumber(sourceSummary.currentStreakDays),
    longest_streak_days: nullableNumber(sourceSummary.longestStreakDays)
  };
  const hasSummary = Object.values(summary).some((value) => value !== null);
  const dailyBuckets = Array.isArray(raw.dailyUsageBuckets)
    ? raw.dailyUsageBuckets.map((bucket) => ({
        start_date: String(bucket.startDate || ""),
        tokens: nullableNumber(bucket.tokens) || 0
      })).filter((bucket) => bucket.start_date)
    : null;

  return {
    summary: hasSummary ? summary : null,
    daily_usage_buckets: dailyBuckets
  };
}

function normalizeAccount(raw) {
  const account = raw?.account;
  if (!account || raw.error) return null;
  return {
    type: account.type || null,
    plan_type: account.planType || null,
    email_included: false
  };
}

function nullableNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function sanitizeReason(error) {
  const message = String(error?.message || error || "unknown");
  if (message === "timeout") return "timeout";
  if (message.startsWith("app_server_exit_")) return message;
  if (message.includes("ENOENT")) return "codex_not_found";
  return "codex_app_server_unavailable";
}
