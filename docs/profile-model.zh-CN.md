# Profile Model

## 设计目标

AgentRecord 的画像模型要服务三个场景：

1. 用户自己理解 AI 工作方式。
2. 未来 Agent 读取用户画像，改善协作。
3. 外部读者查看可审计的公开摘要。

模型不能只服务招聘，因为那会过早引入无校准评分。

## 顶层结构

```json
{
  "schema_version": "0.1.0",
  "owner": {},
  "work_identity": {},
  "work_role_signals": [],
  "ability_model": {},
  "agent_ledger": {},
  "evidence_notes": [],
  "calibration_notes": [],
  "privacy_boundary": {},
  "run_metadata": {}
}
```

## Work Identity

描述用户当前最有证据支持的 AI 工作身份。

字段建议：

```json
{
  "primary_label": "AI-native product builder",
  "localized_label": "AI 原生产品建造者",
  "summary": "Evidence-bound public summary.",
  "strongest_claim": "Most defensible claim.",
  "confidence": "medium",
  "evidence_ids": ["ev_..."]
}
```

要求：

- 不能写成夸张头衔。
- 必须能被 evidence 支撑。
- 要显示 confidence。

## Role Signals

角色信号不是招聘结论，而是工作倾向。

建议角色：

- `product_builder`
- `technical_reviewer`
- `agent_operator`
- `shipping_owner`
- `systems_thinker`
- `research_synthesizer`
- `collaboration_handoff`

字段：

```json
{
  "role_id": "technical_reviewer",
  "label": "Technical Reviewer",
  "band": "strong",
  "confidence": "medium",
  "why": "Evidence-bound explanation.",
  "evidence_ids": ["ev_..."],
  "missing_evidence": []
}
```

Band 建议：

- `emerging`
- `developing`
- `solid`
- `strong`
- `exceptional_signal`

不要使用：

- `hire`
- `no_hire`
- `top_1_percent`
- `senior`
- `staff`
- `principal`

这些需要外部校准或组织语境。

## Ability Model

能力维度应跨 Agent client 稳定。

默认维度：

- `goal_framing`
- `context_packaging`
- `agent_delegation`
- `review_judgment`
- `verification_discipline`
- `failure_recovery`
- `scope_control`
- `shipping_hygiene`
- `product_judgment`
- `collaboration_handoff`

字段：

```json
{
  "dimension_id": "verification_discipline",
  "label": "Verification Discipline",
  "score": 72,
  "band": "solid",
  "confidence": "medium",
  "evidence_level_mix": {
    "E1": 1,
    "E2": 4,
    "E3": 2,
    "E4": 0
  },
  "evidence_ids": ["ev_..."],
  "missing_evidence": ["More CI/release evidence would raise confidence."]
}
```

分数是内部呈现辅助，不是市场排名。对外文案优先展示 band 和 evidence。

## Evidence Notes

Evidence 是系统可信度的核心。

```json
{
  "id": "ev_20260629_codex_verification_001",
  "level": "E2",
  "title": "Repeated validation after code changes",
  "summary": "Public-safe summary.",
  "agent_clients": ["codex"],
  "dimensions": ["verification_discipline", "shipping_hygiene"],
  "role_signals": ["technical_reviewer"],
  "confidence": "medium",
  "refs": [],
  "privacy": {
    "public_safe": true,
    "redacted_fields": []
  }
}
```

证据等级：

- `E1`: 外部或系统证据，如 tests、CI、commits、release、screenshots、build logs。
- `E2`: 可复现 trace，如 tool calls、diffs、structured logs、commands。
- `E3`: 结构化总结，如 handoff、review notes、memory summaries。
- `E4`: 自述或弱支撑 claim。

## Calibration Notes

用于避免自夸和误读。

应包含：

- 哪些结论证据强。
- 哪些结论证据弱。
- 哪些场景不能外推。
- 哪些能力还缺少证据。

示例：

```json
{
  "type": "missing_evidence",
  "summary": "The profile has strong local agent-work traces but limited external release evidence.",
  "affected_dimensions": ["shipping_hygiene"],
  "severity": "medium"
}
```

## Agent Ledger

展示多 Agent 使用情况。

```json
{
  "clients": [
    {
      "client_id": "codex",
      "status": "measured",
      "sessions": 128,
      "token_usage": {},
      "trace_window": {},
      "evidence_count": 24
    },
    {
      "client_id": "claude_code",
      "status": "not_configured"
    }
  ]
}
```

要求：

- 未支持 client 不能假装测量过。
- client-level usage 可见，但不能让 token usage 直接变成能力分。

## Hiring Optional Layer

招聘视图如果后续启用，必须作为独立 audience，不进入默认 profile。

允许输出：

- evidence brief
- role fit band
- confidence
- missing evidence
- interview questions

禁止输出：

- hire/no hire
- market rank
- salary guess
- protected-class inference
- unsupported seniority claim
