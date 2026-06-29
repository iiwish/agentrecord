# AgentRecord

AgentRecord turns local AI-agent work traces into a user-owned, auditable AI work profile.

It is not a hiring score, leaderboard, certification, or prompt-history viewer. The first product surface is a personal AI work record: what kinds of work you do with agents, how you delegate, how you review, how you verify, and what evidence supports those claims.

## Positioning

AgentRecord is a local-first record layer for AI-native work.

- **For users:** a private, inspectable profile of how they work with Codex, Claude Code, opencode, OpenClaw, Hermes, and other agents.
- **For agents:** a compact, prompt-ready work profile that future agents can use to understand the user's preferences, strengths, constraints, and collaboration style.
- **For sharing:** a redacted proof page that shows evidence-backed work identity without exposing raw conversations, prompts, secrets, terminal output, or source code.

## Product Principles

- **User-owned by default:** local files first, export second, hosted services optional.
- **Evidence over claims:** scores and labels must point back to evidence cards and confidence levels.
- **No raw trace leakage:** public artifacts never include raw prompts, raw session IDs, secrets, terminal output, or private source files.
- **Cross-agent model:** individual clients are adapters; the profile model is stable across tools.
- **Incremental runs:** repeated runs update the profile without rewriting history.
- **No default hiring decision:** recruiter or hiring views are optional audience layers, not the core product.

## CLI

```bash
node src/cli.mjs init --dry-run
node src/cli.mjs init --owner <owner>
node src/cli.mjs scan --config ./agentrecord.config.json
node src/cli.mjs build --config ./agentrecord.config.json
node src/cli.mjs validate --config ./agentrecord.config.json
```

Useful overrides:

```bash
node src/cli.mjs --help
node src/cli.mjs doctor
node src/cli.mjs scan --sessions-dir ~/.codex/sessions
node src/cli.mjs build --owner <owner> --locale zh-CN
```

## Expected Outputs

```text
profiles/<owner>/
  profile.json          Machine-readable AI work profile
  evidence.jsonl        Redacted evidence cards
  index.html            Human-readable local/share report
  profile.md            Markdown report
  redaction-report.md   Privacy boundary audit
  run-report.md         Incremental run summary
  .agentrecord/         Private state, cursors, snapshots
```

The default config file is `agentrecord.config.json`. Output defaults to `profiles/<owner>/`, and private state defaults to `profiles/<owner>/.agentrecord/`. AgentRecord is local-first by default; it does not upload, publish, or host generated artifacts.

## First Supported Adapter

The first supported adapter should be Codex local sessions, because it gives enough real usage history to validate the core loop quickly. Claude Code, opencode, OpenClaw, and Hermes should follow once the normalized event model is stable.

## Status

This repository is at planning skeleton stage. The existing prototype lives in `/Users/iiwish/self/runmark-profile` and should be migrated into this package in small steps.
