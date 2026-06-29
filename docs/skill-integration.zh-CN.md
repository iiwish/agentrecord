# Skill Integration

## 原则

AgentRecord skill 应该是薄封装。

不应该在 skill 里长期维护：

- trace extraction。
- evidence scoring。
- profile rendering。
- privacy validation。

这些逻辑应该放在 npm CLI 中，保证 Codex、Claude Code、opencode 等环境调用同一套实现。

## Skill 职责

Skill 负责：

- 判断用户是否想生成、更新、审计 AgentRecord。
- 选择 locale。
- 选择 audience。
- 调用 `agentrecord` CLI。
- 检查命令结果。
- 摘要输出位置。
- 告知隐私风险或 validate failure。

## Locale 策略

优先级：

1. 用户明确指定语言。
2. 当前调用 skill 的语言。
3. 配置文件。
4. 私有 preference。
5. agent conversation aggregate。
6. 系统 locale。
7. fallback `en-US`。

实践建议：

- 用户用中文请求“生成中文报告”时，传 `--locale zh-CN`。
- 用户用中文请求“生成英文报告”时，传 `--locale en-US`。
- 用户没有指定报告语言时，可以把当前请求语言作为 `--invocation-locale`。

## Audience 策略

默认：

```text
self,share
```

显式请求时才开启：

```text
hiring
job-agent
```

未来建议把 `agent-context` 作为独立输出，不和 hiring 绑定。

## Skill 工作流

```text
1. 读取用户请求。
2. 确认项目路径或输出路径。
3. 推断 locale/audience。
4. 执行 agentrecord scan 或 doctor。
5. 执行 agentrecord build。
6. 执行 agentrecord validate。
7. 如果失败，解释具体失败和修复建议。
8. 如果成功，给出 artifact 路径和摘要。
```

## 示例命令

```bash
agentrecord doctor
agentrecord scan
agentrecord build --owner iiwish --invocation-locale zh-CN
agentrecord validate --owner iiwish
```

如果用户明确要求招聘视图：

```bash
agentrecord build --owner iiwish --audiences self,share,hiring
```

如果用户明确要求给求职 Agent 使用：

```bash
agentrecord build --owner iiwish --audiences self,share,agent-context
```

## Skill 输出口径

成功时：

- 说明生成了哪些 artifact。
- 说明 validate 是否通过。
- 说明隐私边界。
- 说明下一步可以打开哪个 HTML。

失败时：

- 不要笼统说失败。
- 指出哪个文件、哪个校验、为什么失败。
- 给出可执行修复建议。

## 未来 Skill 文件

建议创建：

```text
skills/agentrecord/SKILL.md
```

Skill frontmatter：

```yaml
---
name: agentrecord
description: Generate, update, audit, and render a local-first AgentRecord AI work profile from AI-agent usage traces.
---
```

正文应引用 CLI，而不是复制核心逻辑。
