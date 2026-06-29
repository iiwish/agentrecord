# AgentRecord Docs

这个目录用于承接 AgentRecord 后续新会话开发。新会话开始时，优先读取本文件、`session-context.zh-CN.md` 和当前任务相关规格。

## 推荐阅读顺序

1. `session-context.zh-CN.md`：当前项目状态、关键决策、不能偏离的边界。
2. `product-plan.zh-CN.md`：产品定位和商业化判断。
3. `development-plan.zh-CN.md`：迁移顺序和发布节奏。
4. `mvp-spec.zh-CN.md`：v0.1 要做什么、不做什么。
5. `architecture.md`：技术分层和 CLI 边界。
6. `profile-model.zh-CN.md`：画像、证据、评分、置信度模型。
7. `adapter-spec.zh-CN.md`：Codex 及后续多 Agent adapter 规范。
8. `privacy-and-trust.zh-CN.md`：隐私边界、校验规则和信任原则。
9. `report-design.zh-CN.md`：HTML/Markdown 报告的信息架构和文案方向。
10. `skill-integration.zh-CN.md`：Agent skill 如何调用 CLI。
11. `implementation-tasks.zh-CN.md`：可执行任务拆解和验收标准。
12. `new-session-prompts.zh-CN.md`：后续开新会话可直接复制的提示词。

## 当前核心判断

AgentRecord 应先做本地 npm CLI，而不是先做招聘评分产品或托管 Web 产品。

第一阶段目标是把 `/Users/iiwish/self/runmark-profile` 的可用原型迁移为 `agentrecord` 包，先跑通 Codex 本地数据，生成用户自己的 AI 工作画像和可分享报告。

## 项目边界

- 默认做个人 AI 工作画像，不默认做招聘决策。
- 默认本地执行，不上传原始 trace。
- 默认确定性生成，不依赖 LLM。
- 默认多 Agent 可扩展，不绑定单一厂商。
- 默认结论可审计，每个强 claim 都应能追到 evidence card。

## 常用命令

```bash
cd /Users/iiwish/self/agentrecord
npm run check
npm run pack:dry
node src/cli.mjs doctor
```

## 相关原型

```text
/Users/iiwish/self/runmark-profile
```

原型里已有可迁移能力：

- `scripts/generate-profile.mjs`
- `scripts/validate-profile.mjs`
- `schemas/profile.schema.json`
- `locales/en-US.json`
- `locales/zh-CN.json`
- `references/evidence-rules.json`
- `references/evidence-rules.iiwish.json`
- `profiles/iiwish/*` 生成样例
