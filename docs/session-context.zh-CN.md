# 新会话上下文

## 当前状态

项目路径：

```text
/Users/iiwish/self/agentrecord
```

当前是 npm CLI 骨架阶段，尚未发布 npm，尚未迁移原型生成器。

已存在：

- `package.json`
- `src/cli.mjs`
- `README.md`
- `ROADMAP.md`
- `docs/`

已验证：

```bash
npm run check
npm run pack:dry
```

## 项目来源

项目从 `runmark-profile` 原型演进而来。

原型路径：

```text
/Users/iiwish/self/runmark-profile
```

原型已经跑通过用户真实数据，具备：

- Codex 本地 session 聚合。
- Codex memory/evidence rules。
- 增量执行。
- profile JSON/Markdown/HTML 输出。
- 中英文 locale。
- 隐私校验。
- optional hiring/job-agent artifact。

AgentRecord 的新方向是把这些能力产品化为 npm CLI，并把 skill 变成薄封装。

## 关键产品决策

### 1. 默认不是招聘产品

默认输出是用户自己的 AI 工作画像，招聘视图只能作为显式开启的可选 audience。

原因：

- 招聘评分需要跨用户、跨岗位、跨公司校准。
- 早期直接输出高分会损害可信度。
- 用户自己的 work identity 和 agent context 更容易先成立。

### 2. 不输出无校准的绝对分数

画像可以包含能力评分、角色信号、证据强度、置信度，但要避免市场排名和“录用建议”。

评分原则：

- 证据驱动。
- 显示 confidence。
- 显示 missing evidence。
- token usage 只能作为 activity density，不是能力证明。

### 3. 本地优先

默认所有原始 trace 留在本地。公共 artifact 不应包含：

- raw prompt
- raw conversation
- raw session ID
- terminal output
- source code
- secrets
- private absolute paths

### 4. CLI 是核心，skill 是调用层

业务逻辑应该在 npm CLI 中：

- adapter
- normalizer
- evidence engine
- scoring
- renderer
- validator

skill 只做：

- 识别用户意图。
- 推断 locale/audience。
- 调用 CLI。
- 检查结果。
- 汇报输出位置和风险。

## 命名

最终选名：

```text
AgentRecord
```

npm 包名建议：

```text
agentrecord
```

CLI 命令：

```bash
agentrecord
```

原因：

- 更像基础设施和记录层。
- 比 `AgentPrint` 更少冲突。
- 比 `Runmark` 更贴近 Agent 使用记录。
- 比 `AgentStamp` 更少认证暗示。

发布前必须重新检查 npm 名称可用性，因为 registry 状态可能变化。

## 后续第一优先级

第一优先级不是设计托管站点，而是迁移 v0.1 CLI：

1. 创建真实 command 结构。
2. 迁移 `runmark-profile` generator。
3. 改名 Runmark -> AgentRecord。
4. 私有状态从 `.runmark/` 改为 `.agentrecord/`。
5. 跑通 `agentrecord build`。
6. 跑通 `agentrecord validate`。
7. 用用户真实数据生成第一版 AgentRecord profile。

## 判断标准

每次新会话完成任务前至少检查：

- `npm run check`
- 相关命令是否能跑。
- public artifact 是否没有明显隐私泄露。
- 是否偏离“个人 AI 工作画像”核心定位。
