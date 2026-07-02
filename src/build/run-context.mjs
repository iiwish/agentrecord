import fs from "node:fs";
import path from "node:path";

import { readJsonIfExists } from "../core/config.mjs";
import { ensureDir, stableTimestamp } from "./utils.mjs";
import { sumTokenUsage, zeroTokenUsage } from "./stats.mjs";

export function buildRunContext({ config, stats, generatedAt, reset }) {
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
      data_sources: {
        codex_session_roots: config.resolved.codex.sessionRoots,
        opencode_database_configured: Boolean(config.resolved.opencode?.databasePath),
        claude_code_projects_configured: Boolean(config.resolved.claudeCode?.projectsDir),
        measured_clients: stats.measured_clients || []
      },
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
