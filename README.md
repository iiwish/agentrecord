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

## Quickstart

After npm install:

```bash
npm install -g @iiwish/agentrecord
agentrecord init --owner <owner> --display-name "Your Name"
agentrecord build --config ./agentrecord.config.json --no-account-usage
agentrecord validate --config ./agentrecord.config.json
agentrecord open --config ./agentrecord.config.json
```

From the source checkout:

```bash
node src/cli.mjs init --owner <owner> --display-name "Your Name"
node src/cli.mjs build --config ./agentrecord.config.json --no-account-usage
node src/cli.mjs validate --config ./agentrecord.config.json
node src/cli.mjs open --config ./agentrecord.config.json
```

The primary product artifact is `profiles/<owner>/index.html`: a single-file, static AI work identity share card for local review or redacted sharing. The first screen highlights a deterministic archetype and share copy, while `profile.json` and `evidence.jsonl` remain the structured truth sources behind every public claim. `profile.md` is a secondary audit draft.

Agent context is opt-in:

```bash
node src/cli.mjs build --config ./agentrecord.config.json --agent-context
```

Default builds generate only the self/share artifacts and do not generate recruiter, job-agent, or employment-decision views.

A privacy-safe starter example is available in `examples/basic/`.

## Commands

```bash
node src/cli.mjs init --dry-run
node src/cli.mjs init --owner <owner> --display-name "Your Name"
node src/cli.mjs scan --config ./agentrecord.config.json
node src/cli.mjs build --config ./agentrecord.config.json
node src/cli.mjs validate --config ./agentrecord.config.json
node src/cli.mjs open --config ./agentrecord.config.json
```

Useful overrides:

```bash
node src/cli.mjs --help
node src/cli.mjs doctor
node src/cli.mjs scan --sessions-dir ~/.codex/sessions
node src/cli.mjs build --owner <owner> --locale zh-CN
node src/cli.mjs build --config ./agentrecord.config.json --display-name "Your Name"
node src/cli.mjs build --config ./agentrecord.config.json --agent-context
```

`owner` is the stable path/id used for `profiles/<owner>/`. `owner_display_name` is the visible name in `profile.json`, `index.html`, Markdown, and optional agent context. Use `--display-name` during `init` or `build` to correct the visible name without changing the output directory. The generated HTML shows static guidance for this correction and does not provide inline editing or in-page saving.

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

Optional explicit outputs:

```text
profiles/<owner>/
  agent-context.md      Public-safe prompt context for future agents
  agent-context.json    Machine-readable agent context pack
```

The default config file is `agentrecord.config.json`. Output defaults to `profiles/<owner>/`, and private state defaults to `profiles/<owner>/.agentrecord/`. AgentRecord is local-first by default; it does not upload, publish, or host generated artifacts.

## First Supported Adapter

The first supported adapter should be Codex local sessions, because it gives enough real usage history to validate the core loop quickly. Claude Code, opencode, OpenClaw, and Hermes should follow once the normalized event model is stable.

## Status

AgentRecord is in the v0.1 CLI baseline and uses package version `0.0.1` for the first conservative npm release candidate. The `build` and `validate` commands provide the minimum local loop: generate `profile.json`, `evidence.jsonl`, `index.html`, `profile.md`, `redaction-report.md`, and `run-report.md`, then verify required artifacts, profile shape, evidence references, locale parity, private state, and public-artifact privacy boundaries.

HTML is the first product artifact. `profiles/<owner>/index.html` opens with the share card and stays backed by the machine-readable profile and evidence files. The HTML remains a single static file with no external resources, no script, no link tag, no `http://` or `https://`, no CSS `url(...)`, and no `@import`. The AgentRecord project source may appear as plain text such as `github.com/iiwish/agentrecord`.
