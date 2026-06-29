# v0.1 MVP 规格

## MVP 目标

让一个高频 Codex 用户可以在本地运行 AgentRecord，并在 2 分钟内得到可信的个人 AI 工作画像。

## 用户故事

作为一个 AI Agent 高频使用者，我希望 AgentRecord 能读取我本地的 Codex 使用记录，生成一个我能自查、能分享、也能给未来 Agent 使用的 AI 工作画像，而且不会泄露原始对话、代码和敏感路径。

## MVP 命令

v0.1 必须支持：

```bash
agentrecord init
agentrecord build
agentrecord validate
```

建议同时支持：

```bash
agentrecord doctor
agentrecord scan
```

`open` 可以放到 v0.2。

## 输入

### 必需输入

- 本地 Codex session 目录，默认自动发现。
- owner 名称，默认从系统用户名或 config 获取。

### 可选输入

- Codex memory 文件。
- evidence rules。
- owner-specific evidence rules overlay。
- locale。
- output directory。
- privacy setting。

## 输出

默认输出：

```text
profiles/<owner>/
  profile.json
  evidence.jsonl
  index.html
  profile.md
  redaction-report.md
  run-report.md
  .agentrecord/
```

可选输出：

```text
profiles/<owner>/
  profile.<locale>.md
  index.<locale>.html
  agent-context.md
  agent-context.json
```

v0.1 可暂缓 `agent-context.*`，但 schema 设计不能阻碍后续加入。

## 默认 profile 内容

必须包含：

- `work_identity`
- `work_role_signals`
- `ability_model`
- `agent_ledger`
- `evidence_notes`
- `calibration_notes`
- `privacy_boundary`
- `run_metadata`

默认不包含：

- hiring decision
- market rank
- candidate score
- recruiter recommendation
- public leaderboard data

## 验收标准

### 功能验收

- `agentrecord init` 能创建 `agentrecord.config.json`。
- `agentrecord build` 能读取 Codex 数据并生成 profile。
- `agentrecord validate` 能检查 schema、JSONL、locale、隐私模式和必需 artifact。
- 重复运行不会重写所有 evidence ID。
- 没有新增数据时，run report 能明确显示 no significant delta。

### 隐私验收

公共 artifact 不包含：

- raw session UUID
- raw Codex session path
- raw prompt
- raw assistant response
- terminal output body
- source code body
- secrets

### 产品验收

- 首页第一屏能解释“这个人如何和 AI Agent 工作”。
- 结论有 evidence 和 confidence 支撑。
- 报告不会像自夸简历。
- 中文和英文至少一种语言自然可读，另一种不阻碍使用。

## 暂不做

- 用户系统和登录。
- 云端同步。
- 招聘评分。
- 公共排行榜。
- 浏览器插件。
- 多人团队仪表盘。
- LLM 自动润色默认开启。
