# Privacy And Trust

## 信任主张

AgentRecord 的可信度来自三个原则：

1. 原始数据本地优先。
2. 公开结论证据可追溯。
3. 隐私边界可验证。

如果失去这些原则，项目会退化成普通 AI 简历生成器。

## 默认隐私边界

公共 artifact 不得包含：

- 原始 prompt。
- 原始 assistant response。
- 原始 terminal output。
- 原始 source code。
- 原始 session ID。
- 原始 session 文件路径。
- secrets、tokens、keys。
- 默认未允许的绝对路径。
- 私有客户名、仓库名、项目代号。

## 私有状态

私有状态目录：

```text
profiles/<owner>/.agentrecord/
```

可包含：

- processed session cursor。
- private session ID hash map。
- snapshots。
- preferences。
- adapter cache。

必须被 git ignore。

## Public Artifact

公共 artifact：

```text
profile.json
evidence.jsonl
index.html
profile.md
redaction-report.md
run-report.md
agent-context.md
agent-context.json
```

这些文件默认应可以分享，但仍应通过 validator 检查。

## Redaction Strategy

### Project Path

默认：

```text
/Users/name/private/project
```

应转为：

```text
private-project
```

或：

```text
project_ref: redacted
```

除非用户显式设置：

```json
{
  "privacy": {
    "public_project_paths": true
  }
}
```

### Session ID

raw session ID 只存在私有状态。

公共 artifact 可以使用稳定 public evidence ID：

```text
ev_20260629_codex_verification_001
```

### Task Summary

task summary 必须是 public-safe 的概述，不能复制原始用户请求。

## Validation Rules

`agentrecord validate` 至少检查：

- schema 是否有效。
- JSONL 是否每行有效。
- 必需 artifacts 是否存在。
- locale keys 是否完整。
- public artifact 是否包含敏感模式。
- `.agentrecord/` 是否没有被打包或公开引用。
- evidence refs 是否能解析。

敏感模式示例：

- UUID-like raw session id。
- `/Users/<name>/.../.codex/sessions`。
- `sk-`、`ghp_` 等常见 token prefix。
- `BEGIN PRIVATE KEY`。
- `"role":"user"` raw message payload。
- 大段 shell output。

## Evidence Trust

证据等级：

- `E1`: 外部或系统证据，可信度最高。
- `E2`: 可复现 trace。
- `E3`: 结构化总结。
- `E4`: 自述。

报告展示时应明确证据等级。低等级证据不能支撑强结论。

## Anti-Hype Rules

禁止默认输出：

- “顶级候选人”。
- “强烈建议录用”。
- “超过 99% 开发者”。
- “Staff/Principal 级别”。
- “市场领先”。

除非未来有真实校准数据，否则这些都是不可信 claims。

## User Control

用户应能控制：

- locale。
- 输出目录。
- 是否公开项目名。
- 是否启用 hiring audience。
- 是否启用 agent context。
- 是否启用 owner-specific evidence rules。
- 是否 reset private cursor。

## Hosted Layer Boundary

未来如果做托管服务，默认仍应是用户主动上传 redacted artifacts，而不是上传 raw trace。

托管服务可以做：

- 静态页面托管。
- 自定义域名。
- 访问控制。
- 签名快照。
- provenance 校验。

托管服务不应做：

- 默认收集 raw conversation。
- 默认跨用户训练。
- 出售 trace。
