# 实施任务拆解

## 当前 v0.1 状态

状态：本地 CLI 主循环、HTML-first share card、展示名修正入口和首发 npm release candidate 可用于人工评审。

当前能力：

- `init` 创建本地配置。
- `scan` 发现本地 Codex trace 来源。
- `build` 生成 `profile.json`、`evidence.jsonl`、`index.html`、`profile.md`、`redaction-report.md`、`run-report.md`。
- `validate` 检查必需产物、profile 结构、evidence 引用、locale parity、私有状态、公共产物隐私边界。
- `open` 默认打开 `profiles/<owner>/index.html`。
- `build --agent-context` 显式生成 `agent-context.md` 和 `agent-context.json`。
- `init --owner <id> --display-name <name>` 写入稳定 owner id 和展示名。
- `build --display-name <name>` 修正本次输出展示名，不改变 `owner.id` 或输出目录。
- `share_card` 由 role signals、ability model、evidence level mix、confidence、agent activity 和 trace window 确定性生成。

当前产品边界：

- npm 首发候选版本为 `0.0.1`，license 为 `MIT`。
- npm package name 为 `@iiwish/agentrecord`，unscoped `agentrecord` 被 npm 判定与既有包名过近。
- npm package binary 为 `agentrecord`，入口为 `src/cli.mjs`。
- `index.html` 是第一产品产物，是可本地打开、可静态分享的单文件 AI work identity share card。
- `profile.json` 和 `evidence.jsonl` 是结构化真相源。
- `profile.md` 是辅助审计稿。
- 默认 audience 为 `self` 和 `share`。
- 默认不生成招聘、职位代理、录用决策、市场位置或未经校准的资历结论。
- 私有 cursor、snapshots 和 state 位于 `profiles/<owner>/.agentrecord/`。
- 公共产物不包含 raw prompt、raw response、raw session ID、Codex session path、terminal output、source body 或 secret-like pattern。
- `index.html` 不包含 `<script>`、`<link>`、`http://`、`https://`、CSS `url(...)`、`@import` 或 `contenteditable`；AgentRecord GitHub 项目来源只能以纯文本展示。

当前发布前检查：

- `npm run check`
- `node src/cli.mjs build --config ./agentrecord.config.json`
- `node src/cli.mjs build --config ./agentrecord.config.json --display-name "iiwish" --no-account-usage`
- `node src/cli.mjs validate --config ./agentrecord.config.json`
- `node src/cli.mjs build --config ./examples/basic/agentrecord.config.example.json --output /tmp/agentrecord-example-profile --no-account-usage`
- `node src/cli.mjs validate --config ./examples/basic/agentrecord.config.example.json --output /tmp/agentrecord-example-profile`
- `npm run smoke:share-card`
- `npm run pack:dry`
- `npm run smoke:install`
- `git diff --check`
- `npm pack --dry-run --json` 输出不包含 `profiles/`、`.agentrecord/` 或 raw trace。

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

状态：实现已收口，等待最终发布前人工验收；不执行真实 npm publish、push 或远程 release。

任务：

- 使用 `0.0.1` 作为保守首发版本。
- 使用 `MIT` license。
- 检查 npm package name。
- 保持 README quickstart 同时覆盖 npm 安装后命令和源码运行方式。
- 提供 privacy-safe basic example。
- 提供安装后 smoke：`npm pack`、临时目录安装、binary/version/init/doctor 验证。
- 执行 `npm pack --dry-run --json` 和 `npm publish --dry-run --access public --json`。

验收：

- 新用户按 README 能跑通。
- 包内容不包含私有文件。
- npm 安装后 binary 正常。
- `profiles/`、`.agentrecord/`、raw trace、私有 session path 不进入 npm package。
