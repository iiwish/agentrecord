<div align="center">

# AgentRecord 🗃️

**Local-first, evidence-backed professional AI work profiles from local agent traces.**

[![npm version](https://img.shields.io/npm/v/@iiwish/agentrecord.svg?style=flat-square&color=33b3ae)](https://www.npmjs.com/package/@iiwish/agentrecord)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=8A2BE2)](LICENSE)
[![Node version](https://img.shields.io/badge/Node->=20-brightgreen.svg?style=flat-square)](package.json)
[![Privacy](https://img.shields.io/badge/Privacy-Local--First%20%7C%20Zero--Leakage-success?style=flat-square&color=10B981)](#privacy-and-trust-by-design)
[![State](https://img.shields.io/badge/State-v0.1%20Baseline-orange?style=flat-square)](#status)

[简体中文](./README.zh-CN.md) | [English](./README.md)

</div>

---

## 📌 What is AgentRecord?

**AgentRecord** turns local AI-agent work traces into a **user-owned, auditable, and privacy-safe AI work profile.**

It is **not** a hiring score, a competitive leaderboard, an arbitrary certification, or a raw prompt-history viewer. The first product surface is a **personal AI work record**: it maps *what* kinds of work you do with agents, *how* you delegate, *how* you review, *how* you verify, and *what evidence* supports those claims.

---

## ⚖️ The Shift: AI-Native Developer Identity

In a software world where AI agents generate a massive portion of pure code lines, the developer's core value is undergoing a fundamental paradigm shift. Your professional excellence is no longer measured solely by keystroke count, but by high-order orchestrational abilities:

1. **Goal Framing & Context Packaging**: How cleanly you articulate complex requirements and supply context to an agent.
2. **Agent Delegation & Coordination**: How effectively you break down hairy problems and orchestrate multiple specialized agents.
3. **Review Judgment & Verification**: How rigorously you check agent output, enforce safety constraints, and catch silent hallucinations.
4. **Failure Recovery & Resilience**: How gracefully you recover from agent errors, trace failures, and iteratively pivot.

**AgentRecord is the local record layer for proving these AI-native engineering strengths.**

---

## 🧩 How It Works

AgentRecord compiles and normalizes your private agent sessions (Codex, opencode, Claude Code, etc.) using a deterministic evidence engine. Your raw conversations, codebases, and secrets **never leave your machine**.

```text
 ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
 │ Codex Session │   │ opencode DB   │   │ Claude Code   │  (Supported Adapters)
 └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
         │                   │                   │
         └───────────┬───────┴───────────────────┘
                     ▼
         ┌───────────────────────────┐
         │     Event Normalizer      │  (Client-neutral event modeling)
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────────┐
         │      Evidence Engine      │  (Deterministic aggregate matching)
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────────┐
         │       Profile Model       │  (Ability scoring & role profiling)
         └───────────┬───────────────┘
                     ▼
   ┌─────────────────┴─────────────────┐
   ▼                                   ▼
 ┌───────────────────────────┐       ┌───────────────────────────┐
 │    index.html Passport    │       │     profile.json/md       │  (Human- & Machine-
 │   (Zero-JS Static Page)   │       │   (Compact Agent Pack)    │   readable artifacts)
 └───────────────────────────┘       └───────────────────────────┘
```

---

<a id="privacy-and-trust-by-design"></a>

## ✨ Key Features

- 🔒 **Privacy-by-Design (Zero-Leakage)**
  - All original prompt texts, raw responses, attachments, terminal logs, absolute private paths, and secrets stay safely hidden. Artifacts only contain public-safe aggregated statistics and redacted evidence cards.
- 🔬 **Evidence Over Claims (Auditability)**
  - No inflated arbitrary ranks. Every single claim, role signal, or competency dimension points back to verified local evidence cards (`evidence.jsonl`).
- 🔄 **Cross-Agent Normalization**
  - Uses pluggable local adapters that process and normalize different agent traces (Codex session directories, opencode SQLite databases, Claude Code project traces) into a stable, unified model.
- ⚡ **Incremental & Deterministic**
  - Processes updates incrementally using private local cursors without rebuilding the history. Built on deterministic algorithms—no LLM dependency required for core profile synthesis.
- 🤖 **Prompt-Ready Agent Context**
  - Generates a compact context pack (`agent-context.md` and `agent-context.json`) that future agents can read in milliseconds to understand your workflows, preferences, and collaboration style.

---

## 🚀 Quickstart

Get up and running locally in under 2 minutes.

### 1. Global NPM Installation
```bash
npm install -g @iiwish/agentrecord
```
*(Or run directly from the source repository by invoking `node src/cli.mjs`)*

### 2. Initialize Config
```bash
agentrecord init --owner <owner_id> --display-name "Your Name"
```
This generates a baseline `agentrecord.config.json` containing output destinations, privacy options, and adapter setups.

### 3. Scan & Build
```bash
# Scan for local agent data sources
agentrecord scan --config ./agentrecord.config.json

# Build your public-safe profile artifacts
agentrecord build --config ./agentrecord.config.json --no-account-usage
```

### 4. Validate & Open
```bash
# Verify integrity, schema structure, and privacy boundaries
agentrecord validate --config ./agentrecord.config.json

# Launch the human-readable passport report in your default browser
agentrecord open --config ./agentrecord.config.json
```

### 🤖 Agent-Native Quickstart (Let Your Agent Do the Work!)

Since you are using an AI agent right now (such as Claude Code, opencode, Codex, etc.), you don't even need to type the commands yourself! Simply copy and paste the prompt below into your agent's chat window, and it will automatically handle the entire setup, scanning, building, validation, and opening loop for you:

```text
You are an expert AI assistant with terminal/command-execution capabilities. I want to generate my AgentRecord work profile. Please perform the following steps autonomously:
1. Detect my git username using `git config user.name` (fallback to my OS username if empty).
2. Install the `@iiwish/agentrecord` package globally (using npm/pnpm/yarn) or run via `npx` if global installation is restricted.
3. Run `agentrecord init --owner local_developer --display-name "[DETECTED_NAME]"` (replace [DETECTED_NAME] with the detected git name).
4. Run `agentrecord scan` to detect all local agent sessions (Codex, Claude Code, opencode, etc.).
5. Run `agentrecord build --no-account-usage` to compile the profile.
6. Run `agentrecord validate` to audit privacy and schemas.
7. Run `agentrecord open` to open my interactive work passport in the default browser.
Once complete, output a brief summary of the generated artifacts.
```

---

## 🛠️ CLI Commands & Overrides

| Command | Description | Key Overrides / Examples |
| :--- | :--- | :--- |
| `init` | Initializes the local configuration schema. | `--owner <id> --display-name "Name" --dry-run` |
| `scan` | Detects supported agent tools and local databases. | `--sessions-dir ~/.codex/sessions` |
| `build` | Generates structured JSON, MD, and HTML profiles. | `--owner <id> --locale zh-CN --agent-context` |
| `validate` | Validates privacy, schemas, and locale completeness. | `--config ./agentrecord.config.json` |
| `open` | Opens the output HTML report safely in your browser. | Opens `profiles/<owner>/index.html` |
| `doctor` | Checks environment, Node version, and database access. | `agentrecord doctor` |

---

## 📂 Expected Artifact Outputs

All generated profile outputs default to `profiles/<owner>/`:

```text
profiles/<owner>/
├── profile.json           # Machine-readable unified AI work profile
├── evidence.jsonl         # Redacted evidence cards mapping actions to confidence
├── index.html             # The Interactive AI Work Passport (single-file, zero-JS, static)
├── profile.md             # Secondary human-readable markdown summary
├── redaction-report.md    # Local privacy boundary audit logs
├── run-report.md          # Incremental compilation summary
└── .agentrecord/          # Private cursor snapshots, timestamps, and cache (DO NOT SHARE)
```

### 🎯 Optional Opt-In Outputs
By passing the `--agent-context` flag during `build`, you can export a highly condensed profile pack designed for direct LLM context windows:
- `agent-context.md`: Human-legible developer-style guide for new agents.
- `agent-context.json`: Compact JSON representation of your operating constraints.

---

## 🔌 Supported Local Adapters

| Adapter | Source Path | Collected Metadata | Privacy Guarantee |
| :--- | :--- | :--- | :--- |
| **Codex** | Local session rollouts | High-level trace aggregations & account token activity. | Excludes raw system prompts, content attachments. |
| **Claude Code** | `~/.claude/projects` | Project count, trace session timestamps, token totals. | Excludes raw prompts, diff fragments, and CLI logs. |
| **opencode** | `~/.local/share/opencode/opencode.db` | Session metadata, trace windows, activity cost, token metrics. | Reads SQLite DB metrics; completely ignores tool output. |

---

<a id="status"></a>

## 🛣️ Roadmap & Milestones

The journey to making AgentRecord the gold standard for AI-native engineering profiles:

- [x] **Milestone 0: Repository Foundation** - Clean CLI package architecture, localization parity, and MIT release metadata.
- [x] **Milestone 1: Local CLI Baseline** - `init / scan / build / validate / open`, Codex local traces, privacy validation, and incremental state.
- [x] **Milestone 2: Shareable Proof Page** - Single-file `index.html` AI work passport with screenshot-ready share cards and editable display name.
- [x] **Milestone 3a: Active Local Adapters** - Codex, opencode, and Claude Code aggregate metadata adapters.
- [ ] **Milestone 3b: Additional Adapters** - OpenClaw, Hermes, and deeper adapter capability reporting.
- [x] **Milestone 4a: Agent Context Pack** - Optional `--agent-context` exports for future agent handoff.

*For full specifications, read [ROADMAP.md](./ROADMAP.md).*

---

## 🤝 Contributing

AgentRecord is open-source and welcomes contributions! To work with the code locally:

```bash
# Clone the repository
git clone https://github.com/iiwish/agentrecord.git
cd agentrecord

# Perform validation checks
npm run check

# Perform dry-run package packing
npm run pack:dry

# Run smoke tests
node scripts/smoke-install.mjs
node scripts/smoke-share-card.mjs
```

Before contributing, please read the [Docs Architecture](./docs/architecture.md) and [Privacy and Trust Specifications](./docs/privacy-and-trust.zh-CN.md).

---

## 📄 License

AgentRecord is licensed under the [MIT License](LICENSE).
