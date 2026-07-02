# AgentRecord Roadmap

## North Star

Make AgentRecord the default local record for AI-native work: an auditable, portable profile generated from real agent usage.

The project should win by trust, portability, and usefulness to both humans and future agents. It should not start as a hiring-rank product, because that creates calibration burden before the evidence network exists.

## Milestone 0: Repository Foundation

Status: complete in the v0.1 baseline.

Goal: create a clean package that can become the npm CLI without carrying prototype debt.

- Create npm package skeleton with `agentrecord` binary.
- Keep package private/unpublished until name reservation or first usable CLI decision.
- Document positioning, product principles, architecture, and development plan.
- Decide license before public GitHub release.

Exit criteria:

- `npm run check` passes.
- README explains the product in one minute.
- Development plan names the first shippable loop.

## Milestone 1: Local Codex MVP

Status: complete in the v0.1 baseline.

Goal: generate a useful personal AI work profile from local Codex traces.

Commands:

- `agentrecord init`
- `agentrecord scan`
- `agentrecord build`
- `agentrecord validate`
- `agentrecord open`

Scope:

- Migrate the proven generator logic from `/Users/iiwish/self/runmark-profile`.
- Rename public concepts from Runmark to AgentRecord.
- Normalize Codex traces into a client-neutral event model.
- Keep deterministic generation as the default; no LLM dependency.
- Produce `profile.json`, `evidence.jsonl`, `index.html`, `profile.md`, `redaction-report.md`, and `run-report.md`.
- Support locale resolution with explicit preference, invocation language, agent-language aggregate, system locale, and fallback.
- Preserve incremental state under `.agentrecord/`.

Exit criteria:

- A new user can install `@iiwish/agentrecord`, run `agentrecord init`, `agentrecord build`, and get a local report in under 2 minutes.
- Public artifacts pass privacy validation.
- Re-running the CLI produces a stable incremental update instead of rewriting all evidence.

## Milestone 2: Shareable Proof Page

Status: baseline complete; static-host export remains future work.

Goal: make the local HTML report worth sharing without becoming unserious.

Scope:

- Redesign `index.html` as a screenshot-worthy AI work passport.
- Lead with identity, aggregate token activity, trace span, role spectrum, and cyber-roast calibration copy.
- Add tabbed evidence, agent ledger, and redaction sections without raw trace leakage.
- Keep the HTML as a single-file, no-script, no-external-resource report.
- Keep Chinese and English localization first-class.

Exit criteria:

- The first viewport is understandable without explaining AgentRecord.
- The report contains enough audit detail for a technical reviewer to trust or challenge it.
- No default recruiter or hiring score appears in the core report.

## Milestone 3: Cross-Agent Adapters

Status: partially complete. Codex, opencode, and Claude Code aggregate metadata are supported; OpenClaw, Hermes, and deeper adapter capability reporting remain future work.

Goal: make AgentRecord independent of any single agent vendor.

Adapter order:

1. Codex
2. opencode
3. Claude Code
4. OpenClaw
5. Hermes

Scope:

- Normalize Codex local rollout logs, opencode SQLite metadata, and Claude Code project JSONL metadata into one agent ledger.
- Keep adapter reads aggregate-only by default; raw prompts, raw responses, attachments, tool outputs, and private paths remain excluded.
- Add adapter capability reports so unsupported fields are explicit.
- Show per-agent usage and status in the report.
- Allow users to filter profile evidence by agent client.

Exit criteria:

- At least two agent clients contribute to one profile.
- The same ability model works across clients.
- Missing or weak adapter evidence lowers confidence instead of inventing claims.

## Milestone 4: Agent Context Pack

Status: baseline complete behind explicit `--agent-context`; richer redaction controls remain future work.

Goal: turn the profile into a practical prompt asset for future agents.

Scope:

- Generate `agent-context.md` and `agent-context.json`.
- Include user preferences, collaboration style, review expectations, known strengths, caution zones, and project patterns.
- Keep it evidence-backed and compact enough to paste or load into agents.
- Add redaction controls for sensitive projects and private patterns.

Exit criteria:

- A new coding agent can use the context pack to collaborate better with the user.
- The context pack never exposes raw traces or private project details by default.

## Milestone 5: Hosted Optional Layer

Goal: commercialize without weakening local trust.

Possible paid surfaces:

- Hosted profile page with custom domain and privacy controls.
- Verified static snapshots with signed provenance.
- Team dashboards for private internal AI-work development.
- Adapter packs and enterprise privacy policy enforcement.
- Benchmarking only after enough opt-in data exists.

Non-goals at this stage:

- Public leaderboards.
- Default candidate scoring.
- Market-rank claims.
- Selling raw trace data.

## Success Metrics

- Time to first profile: under 2 minutes.
- Public artifact privacy violations: zero.
- Repeat-run stability: evidence IDs remain stable across runs.
- Share rate: users voluntarily share the generated page or screenshot.
- Agent reuse: users load `agent-context.md` into later sessions.
- Adapter breadth: two or more agent clients per active profile.
