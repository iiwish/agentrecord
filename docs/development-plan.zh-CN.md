# 开发计划

## 当前判断

AgentRecord 应该先做 npm CLI，而不是先做 Web 产品。

原因：

- 数据在用户本地，CLI 最容易建立信任。
- 生成过程大部分是确定性解析、归一化、证据评分和渲染，不需要默认依赖 LLM。
- 技能、桌面端、Web 托管都可以复用同一个 CLI。
- npm 的分发方式适合 Codex、Claude Code、opencode 这类开发者用户。

## 第一阶段目标

把 `/Users/iiwish/self/runmark-profile` 的可用原型迁移成 `agentrecord` 包。

优先级：

1. 改名和概念统一：Runmark -> AgentRecord。
2. 抽出 CLI 命令结构。
3. 保留现有 Codex 适配能力，并接入 opencode 与 Claude Code 聚合元数据。
4. 保留增量执行和隐私校验。
5. 重做 HTML 首页，让它更像 AI work passport。
6. 把 skill 改成薄封装，只调用 CLI。

## 建议目录结构

```text
agentrecord/
  src/
    cli.mjs
    commands/
      init.mjs
      scan.mjs
      build.mjs
      validate.mjs
      open.mjs
    adapters/
      codex.mjs
      claude-code.mjs
      opencode.mjs
      openclaw.mjs
      hermes.mjs
    core/
      config.mjs
      normalize.mjs
      evidence.mjs
      scoring.mjs
      incremental-state.mjs
      privacy.mjs
    renderers/
      markdown.mjs
      html.mjs
      locale.mjs
    schemas/
      profile.schema.json
      evidence.schema.json
  locales/
    en-US.json
    zh-CN.json
  docs/
  examples/
```

## 迁移顺序

### Step 1: CLI 骨架

- 当前已创建 `src/cli.mjs`。
- 下一步把 `--help`、`doctor`、`init` 做成真实命令。
- 不引入重依赖，先保持 Node 原生能力。

### Step 2: 配置和输出约定

配置文件命名：

```text
agentrecord.config.json
```

默认输出：

```text
profiles/<owner>/
```

私有状态：

```text
profiles/<owner>/.agentrecord/
```

### Step 3: Codex adapter

从原型迁移：

- session metadata 扫描
- token/activity 聚合
- memory/evidence rules
- 语言推断
- 增量 cursor
- privacy redaction

不要一次性重构太多。先让原型能力在新包里跑通。

### Step 4: Profile model

默认输出仍然是个人 AI 工作画像：

- `work_identity`
- `work_role_signals`
- `ability_model`
- `agent_ledger`
- `evidence_notes`
- `calibration_notes`

招聘相关字段不默认输出。

### Step 5: HTML report

要重做，不要延续普通 dashboard 味道。

设计方向：

- 第一屏像 passport / dossier / proof record。
- 强调时间跨度、证据数量、Agent 来源、隐私边界。
- 分数用能力雷达和证据等级支撑。
- 每个 claim 都能追到 evidence card。
- 中英文都要自然，不是机器翻译感。

### Step 6: Skill integration

技能只保留：

- 判断用户想生成/更新/审计画像。
- 根据当前提问语言推断 locale。
- 调用 CLI。
- 检查 validate。
- 给用户解释输出位置和风险。

## 发布节奏

### v0.1

本地 Codex 用户可用。

命令：

- `agentrecord init`
- `agentrecord build`
- `agentrecord validate`

### v0.2

HTML 报告达到可分享质量。

新增：

- `agentrecord open`
- `agentrecord export --static`
- 更强 privacy scanner

### v0.3

多 agent adapter 硬化。

重点是 Codex、opencode、Claude Code 的 schema drift 检测、缺源降级、隐私扫描和 adapter capability 输出。

### v0.4

Agent context pack。

输出：

- `agent-context.md`
- `agent-context.json`

### v1.0

稳定 schema、稳定 adapter API、稳定隐私边界。

## 风险

### 风险 1: 画像像简历自夸

解决：

- 不默认招聘分数。
- 每个结论有证据等级。
- 明确写缺失项和置信度。

### 风险 2: 泄露用户隐私

解决：

- 默认本地。
- 公共产物隐私扫描。
- raw session ID、raw prompt、terminal output、source code 默认不出现在报告里。

### 风险 3: 被大模型或超级 app 吃掉

解决：

- 做跨 Agent、用户自有、可迁移的数据层。
- 不绑定某一个 Agent 厂商。
- 让 AgentRecord 成为“AI 工作记录格式”和本地工具，而不是一个单一前端功能。

### 风险 4: 评分没有可信度

解决：

- 不做市场排名。
- 不输出无校准的绝对能力判断。
- 用 evidence level、confidence、missing evidence 表达不确定性。

## 下一步执行建议

1. 先把 `runmark-profile` 的生成器迁移到 `src/commands/build.mjs`，保持行为一致。
2. 再把名称、schema key、私有状态目录从 runmark 改成 agentrecord。
3. 跑一次你的真实数据，检查输出内容是否仍然偏招聘。
4. 重做 HTML 首页。
5. 决定是否立即抢占 npm 包名。
