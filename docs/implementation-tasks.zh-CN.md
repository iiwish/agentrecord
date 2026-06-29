# 实施任务拆解

## Phase 0: 当前骨架

状态：已完成。

已完成：

- 创建 `/Users/iiwish/self/agentrecord`。
- 创建 npm package skeleton。
- 创建 `agentrecord` binary。
- 创建初始文档。
- 初始化 git repo。

检查命令：

```bash
npm run check
npm run pack:dry
```

## Phase 1: CLI 命令结构

目标：把单文件 CLI 拆成真实命令入口。

任务：

- 创建 `src/commands/init.mjs`。
- 创建 `src/commands/scan.mjs`。
- 创建 `src/commands/build.mjs`。
- 创建 `src/commands/validate.mjs`。
- 创建 `src/commands/doctor.mjs`。
- 创建 `src/core/args.mjs` 或轻量参数解析。
- 更新 `src/cli.mjs` 做 command router。

验收：

- `node src/cli.mjs --help` 正常。
- `node src/cli.mjs doctor` 正常。
- `node src/cli.mjs init --dry-run` 能输出将要创建的 config。
- 未知命令有明确错误码和提示。

## Phase 2: Config 和目录约定

目标：稳定配置和输出边界。

任务：

- 定义 `agentrecord.config.json` schema。
- 支持默认配置。
- 支持 CLI override。
- 支持环境变量 override。
- 支持 output directory。
- 支持 owner。
- 支持 locale 和 label mode。
- 支持 privacy options。

验收：

- `agentrecord init` 创建可读配置。
- `agentrecord build --config ./agentrecord.config.json` 能读取配置。
- 缺配置时有合理默认行为。

## Phase 3: 迁移 Codex adapter

目标：把 `runmark-profile` 中已验证的 Codex 能力迁移过来。

任务：

- 读取原型 `scripts/generate-profile.mjs`。
- 抽出 Codex session discovery。
- 抽出 token/activity 聚合。
- 抽出 memory file 读取。
- 抽出 evidence rules 匹配。
- 把输出改为 normalized events。

验收：

- `agentrecord scan` 能识别 Codex trace 来源。
- `agentrecord build` 能生成 activity baseline。
- 无 memory 文件也能生成最低可用 profile。

## Phase 4: Evidence 和 Profile Model

目标：建立可审计画像模型。

任务：

- 创建 `src/core/evidence.mjs`。
- 创建 `src/core/scoring.mjs`。
- 创建 `src/schemas/profile.schema.json`。
- 创建 `src/schemas/evidence.schema.json`。
- 把 evidence IDs 做成稳定生成。
- 把 confidence 和 missing evidence 写入 profile。

验收：

- `profile.json` 结构稳定。
- `evidence.jsonl` 每行可验证。
- profile 中每个强 claim 能追到 evidence card。

## Phase 5: Renderer

目标：生成可信、可分享、可读的报告。

任务：

- 迁移 Markdown renderer。
- 重做 HTML renderer。
- 引入 locale 文件。
- 实现中英文输出。
- 实现第一屏 passport/dossier 风格。
- 实现 evidence drill-down。

验收：

- `index.html` 本地打开可读。
- 第一屏解释 identity、trace window、evidence count、privacy boundary。
- 不出现普通 SaaS dashboard 堆卡片感。

## Phase 6: Validator

目标：把隐私和质量变成强门槛。

任务：

- 迁移 `validate-profile.mjs`。
- 检查 schema。
- 检查 JSONL。
- 检查 public artifact privacy。
- 检查 locale key parity。
- 检查 required artifacts。
- 检查 private state 不被写入 public artifact。

验收：

- `agentrecord validate` 失败时能指出文件和原因。
- 常见敏感模式会触发失败。

## Phase 7: Agent Context Pack

目标：让 profile 真正服务未来 Agent。

任务：

- 设计 `agent-context.md`。
- 设计 `agent-context.json`。
- 输出用户偏好、协作风格、审查标准、常见项目类型、风险偏好。
- 控制长度，适合直接作为 agent prompt context。

验收：

- 新 Agent 读取 context 后能知道如何和用户协作。
- 不包含 raw trace 和私有源码。

## Phase 8: 发布准备

目标：准备 npm/GitHub 首发。

任务：

- 决定 license。
- 检查 npm package name。
- 完善 README quickstart。
- 添加 examples。
- 添加 minimal tests。
- 执行 `npm pack --dry-run --json`。
- 决定是否发布 `0.1.0` 或先 `0.0.1` 占名。

验收：

- 新用户按 README 能跑通。
- 包内容不包含私有文件。
- npm 安装后 binary 正常。
