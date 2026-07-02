# Architecture

AgentRecord should be a deterministic local CLI first. Skills, hosted pages, and integrations should call the CLI instead of duplicating profile logic.

## Layers

```text
agentrecord
  CLI commands
  config loader
  adapters
  normalizer
  evidence engine
  profile model
  renderer
  validator
  private state
```

## Command Shape

```bash
agentrecord init
agentrecord scan
agentrecord build
agentrecord validate
agentrecord open
```

### `init`

Creates `agentrecord.config.json`.

Responsibilities:

- owner identity
- output directory
- privacy defaults
- locale preference
- enabled adapters
- audience outputs

### `scan`

Finds local agent sources.

Responsibilities:

- detect Codex, opencode, Claude Code, OpenClaw, Hermes
- report adapter capability and trace availability
- avoid reading raw content unless needed for configured extraction

### `build`

Generates the profile.

Responsibilities:

- read config and private state
- load adapter events
- normalize events
- generate evidence cards
- score ability dimensions with confidence
- render JSON, JSONL, Markdown, and HTML
- update private cursors

### `validate`

Checks correctness and privacy.

Responsibilities:

- schema validation
- JSONL validation
- locale parity
- public artifact privacy patterns
- required output presence
- incremental state integrity

### `open`

Opens the local report.

Responsibilities:

- find the latest `index.html`
- optionally run validation first
- use the OS default browser

## Normalized Event Model

Every adapter should map to the same event model.

```json
{
  "agent_client": "codex",
  "event_id": "stable-private-id",
  "timestamp": "2026-06-29T00:00:00.000Z",
  "project_ref": "redacted-or-public-project",
  "task_summary": "public-safe task summary",
  "tool_events": [],
  "verification_events": [],
  "token_or_cost_usage": {},
  "evidence_refs": [],
  "redaction_status": "public-safe"
}
```

Raw session IDs and raw paths belong in `.agentrecord/`, not public artifacts.

## Evidence Model

Evidence cards should be stable and auditable.

```json
{
  "id": "ev_...",
  "level": "E2",
  "title": "Verification discipline",
  "summary": "Public-safe evidence summary.",
  "dimensions": ["verification_discipline"],
  "agent_clients": ["codex"],
  "confidence": "medium",
  "refs": [],
  "privacy": {
    "public_safe": true,
    "redactions": []
  }
}
```

Evidence levels:

- `E1`: external/system evidence, such as tests, CI, commits, releases, screenshots, build logs.
- `E2`: reproducible traces, such as tool calls, diffs, structured logs, commands.
- `E3`: structured summaries, handoffs, review notes, memories.
- `E4`: self-report or unsupported claim.

## Ability Model

The first stable dimensions should be:

- goal framing
- context packaging
- agent delegation
- review judgment
- verification discipline
- failure recovery
- scope control
- shipping hygiene
- product judgment
- collaboration handoff

Scores should remain evidence-bound and include confidence. Avoid market benchmark language until there is enough opt-in comparative data.

## Skill Boundary

The AgentRecord skill should be thin:

- identify user intent
- choose locale and audience flags
- call `agentrecord`
- inspect validation results
- summarize outputs

The skill should not own extraction, scoring, rendering, or validation logic.
