# 新会话提示词

这些提示词用于后续新建会话时直接复制。每次使用前先让新会话读取 `docs/README.md` 和 `docs/session-context.zh-CN.md`。

## 继续开发 CLI 骨架

```text
请在 /Users/iiwish/self/agentrecord 中继续开发 AgentRecord。先阅读 docs/README.md、docs/session-context.zh-CN.md、docs/development-plan.zh-CN.md 和 docs/implementation-tasks.zh-CN.md。目标是完成 Phase 1：把 src/cli.mjs 拆成真实命令结构，实现 doctor、init、scan 的基础版本，并保持 npm run check 通过。请不要发布 npm，不要迁移全部原型，只做这一阶段。
```

## 迁移 runmark-profile 生成器

```text
请在 /Users/iiwish/self/agentrecord 中继续开发 AgentRecord。先阅读 docs/README.md、docs/session-context.zh-CN.md、docs/mvp-spec.zh-CN.md、docs/profile-model.zh-CN.md 和 docs/privacy-and-trust.zh-CN.md。然后参考 /Users/iiwish/self/runmark-profile，把 generate-profile 和 validate-profile 的核心能力迁移到 agentrecord build/validate。要求先跑通 Codex 本地数据，保持默认输出是个人 AI 工作画像，不默认生成招聘评分。
```

## 设计并实现 profile schema

```text
请在 /Users/iiwish/self/agentrecord 中设计 AgentRecord v0.1 profile schema。先阅读 docs/profile-model.zh-CN.md、docs/privacy-and-trust.zh-CN.md 和 docs/adapter-spec.zh-CN.md。请创建 schemas 或 src/schemas 下的 JSON Schema，并更新 validate 命令。重点是 work_identity、work_role_signals、ability_model、agent_ledger、evidence_notes、calibration_notes、privacy_boundary、run_metadata。
```

## 重做 HTML 报告

```text
请在 /Users/iiwish/self/agentrecord 中重做 AgentRecord HTML 报告。先阅读 docs/report-design.zh-CN.md、docs/product-plan.zh-CN.md 和 docs/profile-model.zh-CN.md。目标是把 index.html 做成 AI work passport，而不是普通 dashboard。必须保持单文件静态、无外网依赖、可本地打开、移动端可读，并且所有强 claim 都能追到 evidence card。
```

## 做 privacy validator

```text
请在 /Users/iiwish/self/agentrecord 中实现 AgentRecord privacy validator。先阅读 docs/privacy-and-trust.zh-CN.md 和 docs/mvp-spec.zh-CN.md。目标是 agentrecord validate 能检查 public artifacts 是否包含 raw prompt、raw session ID、Codex session path、terminal output、source code、secret-like patterns，并给出具体文件和原因。
```

## 做 Codex adapter

```text
请在 /Users/iiwish/self/agentrecord 中实现 Codex adapter。先阅读 docs/adapter-spec.zh-CN.md、docs/session-context.zh-CN.md 和 /Users/iiwish/self/runmark-profile/SKILL.md。目标是自动发现本地 Codex sessions，生成 normalized events，支持 token/activity 聚合和增量 cursor。不要公开 raw conversation、raw session ID、terminal output 或 source code。
```

## 做 Agent context pack

```text
请在 /Users/iiwish/self/agentrecord 中设计并实现 agent-context.md 和 agent-context.json 输出。先阅读 docs/profile-model.zh-CN.md、docs/skill-integration.zh-CN.md 和 docs/product-plan.zh-CN.md。目标是让未来 Agent 能理解用户的协作方式、偏好、验证标准和风险边界。不要包含 raw trace 或私有项目细节。
```

## 准备 npm 发布

```text
请在 /Users/iiwish/self/agentrecord 中准备 AgentRecord npm 发布。先阅读 docs/session-context.zh-CN.md、README.md 和 ROADMAP.md。请重新检查 npm 上 agentrecord 名称是否可用，完善 package.json、README quickstart、license、files 白名单，并执行 npm pack --dry-run --json。不要发布，除非我明确要求。
```

## 做产品定位 review

```text
请从世界一流产品经理角度 review /Users/iiwish/self/agentrecord 的项目定位。先阅读 docs/product-plan.zh-CN.md、docs/mvp-spec.zh-CN.md、README.md 和 ROADMAP.md。请重点判断：是否应该继续坚持个人 AI 工作画像、是否过早靠近招聘、哪些文案有传播性但不损害可信度、MVP 是否足够尖锐。
```
