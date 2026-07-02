# Adapter Spec

## 目标

AgentRecord 要支持多个 AI Agent 客户端，但 profile model 不能被某个客户端绑定。

Adapter 的职责是把各客户端本地数据转成统一事件模型，不负责最终评分和渲染。

## Adapter 顺序

建议顺序：

1. Codex
2. opencode
3. Claude Code
4. OpenClaw
5. Hermes

Codex、opencode 和 Claude Code 是当前本地 CLI 基线已接入的数据源。

## Adapter 接口

每个 adapter 应提供：

```js
export async function detect(options) {}
export async function scan(options) {}
export async function loadEvents(options) {}
export function getCapabilities() {}
```

### `detect`

判断本地是否存在该客户端 trace。

返回：

```json
{
  "client_id": "codex",
  "found": true,
  "paths": [],
  "confidence": "high"
}
```

### `scan`

只做元数据扫描，不生成 profile。

返回：

```json
{
  "client_id": "codex",
  "status": "available",
  "session_count": 120,
  "trace_window": {
    "from": "2026-06-01T00:00:00.000Z",
    "to": "2026-06-29T00:00:00.000Z"
  },
  "capabilities": {}
}
```

### `loadEvents`

读取并归一化事件。

返回：

```json
[
  {
    "agent_client": "codex",
    "event_id": "private-stable-id",
    "timestamp": "2026-06-29T00:00:00.000Z",
    "project_ref": "redacted-project",
    "task_summary": "Public-safe summary.",
    "tool_events": [],
    "verification_events": [],
    "token_or_cost_usage": {},
    "evidence_refs": [],
    "redaction_status": "public-safe"
  }
]
```

### `getCapabilities`

说明 adapter 能提供什么证据。

```json
{
  "client_id": "codex",
  "supports_token_usage": true,
  "supports_tool_events": true,
  "supports_verification_events": true,
  "supports_memory_file": true,
  "supports_cost": false,
  "raw_content_required": false
}
```

## Normalized Event 要求

必须有：

- `agent_client`
- `event_id`
- `timestamp`
- `redaction_status`

建议有：

- `project_ref`
- `task_summary`
- `tool_events`
- `verification_events`
- `token_or_cost_usage`
- `evidence_refs`

不能公开：

- raw session ID
- raw absolute path
- raw prompt
- raw response
- raw terminal output
- source code
- secrets

## Codex Adapter v0.1 范围

迁移自 `runmark-profile`：

- 自动发现 `~/.codex/sessions`。
- 支持通过 config 指定 sessions dir。
- 聚合 session count、trace window、token usage。
- 从 memory 文件提取 public-safe evidence。
- 支持 evidence rules 和 owner overlay。
- 支持 incremental cursor。

暂不做：

- 完整恢复 raw conversation。
- 上传 trace。
- 对 terminal output 做语义分析。
- 自动读取私有源码内容。

## opencode Adapter v0.1 范围

- 自动发现 `~/.local/share/opencode/opencode.db`。
- 支持通过 config 的 `opencode.database_path`、环境变量 `AGENTRECORD_OPENCODE_DB` 或 CLI 的 `--opencode-db` 指定数据库。
- 只读取 SQLite `session` 和 `project` 的聚合元数据，包括 session count、trace window、token usage、cost 和脱敏项目引用。
- 不读取 `message.data`、`part.data`、`session_input.prompt` 或 tool output body。
- 缺少 `sqlite3` 命令或 schema 不兼容时，adapter 返回 `unavailable`，不阻断 Codex 画像生成。

暂不做：

- opencode message/part 正文语义分析。
- opencode tool 调用细节恢复。
- opencode prompt 摘要公开展示。

## Claude Code Adapter v0.1 范围

- 自动发现 `~/.claude/projects`。
- 支持通过 config 的 `claude_code.projects_dir`、环境变量 `AGENTRECORD_CLAUDE_CODE_PROJECTS_DIR` 或 CLI 的 `--claude-code-projects-dir` 指定项目会话目录。
- 只读取项目 JSONL 的聚合元数据和 usage 字段，包括 session count、trace window、token usage 和脱敏项目引用。
- 只从 `usage`、`usage_metadata`、`message.usage`、`message.usage_metadata` 读取 token 字段。
- 不读取 `message.content`、attachment body、tool output body 或 raw transcript body。
- 缺少项目目录时，adapter 返回 `not_found`，不阻断 Codex 或 opencode 画像生成。

暂不做：

- Claude Code 对话正文语义分析。
- Claude Code tool 调用细节恢复。
- Claude Code prompt 摘要公开展示。
- 读取 `~/.claude/transcripts` 等非项目会话缓存。

## 多 Adapter 合并原则

同一 profile 可以包含多个 client。

合并规则：

- 相同 evidence 不应重复计分。
- 不同 client 的同类证据可提高 confidence。
- client 缺失只影响对应 confidence，不应编造数据。
- 报告里应允许按 client 过滤或查看来源。

## Adapter 风险

### 数据格式变化

解决：

- adapter 版本化。
- scan 输出 capability。
- validate 提示 unsupported format。

### 隐私泄露

解决：

- raw data 只进私有状态。
- public renderer 只吃 redacted event/evidence。
- validator 扫 public artifacts。

### token 误用

解决：

- token 只作为 activity density。
- 不把 token 数量直接转成能力高低。
