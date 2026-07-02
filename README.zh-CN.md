<div align="center">

# AgentRecord 🗃️

**本地优先、证据支撑的 AI 工作记录，从本地 Agent Trace 生成专业的 AI 协作画像。**

[![npm version](https://img.shields.io/npm/v/@iiwish/agentrecord.svg?style=flat-square&color=33b3ae)](https://www.npmjs.com/package/@iiwish/agentrecord)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=8A2BE2)](LICENSE)
[![Node version](https://img.shields.io/badge/Node->=20-brightgreen.svg?style=flat-square)](package.json)
[![Privacy](https://img.shields.io/badge/Privacy-Local--First%20%7C%20Zero--Leakage-success?style=flat-square&color=10B981)](#隐私边界与信任原则-privacy-by-design)
[![State](https://img.shields.io/badge/State-v0.1%20Baseline-orange?style=flat-square)](#当前状态)

[简体中文](./README.zh-CN.md) | [English](./README.md)

</div>

---

## 📌 什么是 AgentRecord？

**AgentRecord** 是一款本地优先的 AI 原生工作记录工具，它能够将您本地 AI Agent（智能体）的运行轨迹（Traces）转化为**用户自主所有、可审计、且隐私安全的 AI 工作画像。**

它**不是**一个招聘评分器、也不是竞技排行榜、更不是某种生硬的资质认证或纯粹的 Prompt 历史浏览器。它的首要产品形态是一个**个人 AI 工作档案**：它客观映射了您与 Agent 协同工作的真实面貌——包括您处理的工作类型、调度 Agent 的方式、评审与验证的习惯，以及支撑这些能力的底层关键证据（Evidence）。

---

## 🚀 快速上手

只需两分钟，即可在本地跑通完整流程。

### 🤖 Agent 原生快速上手（让您的 Agent 代劳！）

既然您当前正在使用 AI Agent（如 Claude Code、opencode、Codex 等），您可以直接让它执行一条命令：

```text
你是一个可以执行终端命令的 AI 助手。请帮我在本机生成 AgentRecord 工作画像。

执行这条命令：
`npx -y @iiwish/agentrecord@latest generate --open --no-account-usage`

不要上传原始对话、代码、密钥或本地 trace 文件。完成后告诉我 validate 是否通过，以及生成的 `index.html` 在哪里。

可选：如果我提供了展示名，就在命令后加上 `--display-name "<展示名>"`；否则直接使用默认展示名。
```

### 手动 CLI 快速上手

#### 1. 生成你的画像
```bash
npx -y @iiwish/agentrecord@latest generate --open --no-account-usage
```
这条命令会在需要时初始化本地配置，生成画像，校验隐私与 Schema 边界，并打开生成的 HTML 报告。

*(也可以先全局安装 `npm install -g @iiwish/agentrecord`，再运行 `agentrecord generate --open --no-account-usage`。)*

#### 2. 进阶：初始化配置文件
```bash
agentrecord init --owner <owner_id> --display-name "您的名字"
```
这将在当前目录下生成基础的 `agentrecord.config.json` 配置文件，其中定义了输出路径、隐私开关及启用的适配器。

#### 3. 进阶：数据扫描与画像编译
```bash
# 扫描本地已安装 Agent 的数据源
agentrecord scan --config ./agentrecord.config.json

# 编译生成安全的本地画像产物
agentrecord build --config ./agentrecord.config.json --no-account-usage
```

#### 4. 进阶：隐私验证与报告查看
```bash
# 自动校验数据完整性、架构 Schema 以及隐私边界
agentrecord validate --config ./agentrecord.config.json

# 在默认浏览器中安全打开人类易读的“工作护照” HTML 报告
agentrecord open --config ./agentrecord.config.json
```

---

## ⚖️ 范式转变：AI 原生时代的开发者身份

在 AI Agent 已经能够代劳大部分纯代码行编写的软件世界中，开发者的核心价值正在发生根本性的范式转移。您的专业优秀程度，不再仅仅通过键盘敲击量来衡量，而是体现在更高维度的“人机协同调度”与“架构把控”能力上：

1. **目标定义与上下文打包 (Goal Framing & Context Packaging)**：您能否清晰、精准地界定复杂需求，并为 Agent 提供完备且高质量的上下文。
2. **Agent 调度与分解 (Agent Delegation & Coordination)**：面对棘手的难题，您能否将其优雅拆解，并高效调度多个专属 Agent 协同作战。
3. **评审判断与验证纪律 (Review Judgment & Verification Discipline)**：您能否以极高的专业标准去检查 Agent 的输出、实施安全约束、并敏锐捕获那些隐蔽的 AI 幻觉。
4. **故障恢复与范围控制 (Failure Recovery & Scope Control)**：在 Agent 陷入死循环或发生运行错误时，您能否优雅地引导其恢复、追踪失效源、并在迭代中快速调整方向。

**AgentRecord 正是用来记录、沉淀和证明这些 AI 原生工程能力的本地核心设施。**

---

## 🧩 工作原理

AgentRecord 通过确定性的证据引擎（Evidence Engine），编译并归一化您本地的私有 Agent 会话（如 Codex、opencode、Claude Code 等）。在这个过程中，您的原始对话、源代码以及敏感密钥**始终留在您的本地机器，绝不外泄**。

```text
 ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
 │ Codex 会话     │   │ opencode 数据库│   │ Claude Code   │  (支持的本地 Adapter)
 └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
         │                   │                   │
         └───────────┬───────┴───────────────────┘
                     ▼
         ┌───────────────────────────┐
         │     事件归一化 Normalizer   │  (屏蔽客户端差异的通用事件模型)
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────────┐
         │     确定性证据引擎 Engine    │  (本地指标与行为分析)
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────────┐
         │     能力与角色画像 Model     │  (多维能力评分与角色信号构建)
         └───────────┬───────────────┘
                     ▼
   ┌─────────────────┴─────────────────┐
   ▼                                   ▼
 ┌───────────────────────────┐       ┌───────────────────────────┐
 │    index.html 工作护照    │       │     profile.json/md       │  (可读、机器可解析
 │   (无 JS 的超轻量静态页面) │       │   (对 Agent 友好的上下文)  │   的双重交付产物)
 └───────────────────────────┘       └───────────────────────────┘
```

---

<a id="隐私边界与信任原则-privacy-by-design"></a>

## ✨ 核心特性

- 🔒 **原生隐私隔离 (Zero-Leakage)**
  - 所有的原始 Prompt 文本、Raw 回复、附件、终端日志、本地绝对路径以及密钥均会被彻底剥离与遮蔽。最终公开产物仅包含公开安全的聚合统计指标和已去敏感的证据卡片（Evidence Cards）。
- 🔬 **证据驱动的客观论证 (Auditability)**
  - 杜绝膨胀、凭空捏造的虚高评分。每一个画像维度、角色信号或胜任力 claim，均必须溯源至本地验证过的结构化证据卡片 (`evidence.jsonl`)。
- 🔄 **跨 Agent 归一化**
  - 提供即插即用的本地适配器（Adapters），能够自动读取并归一化不同 Agent 的运行留痕（如 Codex 会话目录、opencode SQLite 数据库、Claude Code 项目 Trace 等），聚合至统一的模型中。
- ⚡ **增量执行与确定性算法**
  - 依托本地私有游标（Cursors）实现增量编译，无需重写历史。整个分析流程基于确定性算法逻辑构建——核心画像合成不依赖任何外部大模型（LLM）API。
- 🤖 **对 Agent 友好的上下文包**
  - 可一键导出极度浓缩的上下文卡片（`agent-context.md` 和 `agent-context.json`），以便未来新的 Agent 实例在几毫秒内吞入，立即洞悉您的协同偏好、协作规范与工作风格。

---

## 🛠️ CLI 命令行与覆写

| 命令 | 功能说明 | 常用参数与示例 |
| :--- | :--- | :--- |
| `generate` | 需要时初始化配置，构建画像，校验产物，并可选打开 HTML 报告。 | `--open --config <file> --owner <id> --display-name "名字" --no-account-usage` |
| `init` | 初始化本地配置 Schema。 | `--dry-run --owner <id> --display-name "名字" --profiles-dir <dir> --output <dir>` |
| `scan` | 探测支持的 Agent 工具及其本地数据库。 | `--config <file> --sessions-dir <dir> --opencode-db <file> --claude-code-projects-dir <dir>` |
| `build` | 编译生成 JSON、MD 及 HTML 画像。 | `--config <file> --owner <id> --locale zh-CN --display-name "名字" --agent-context --no-account-usage --account-usage-timeout-ms <ms> --sessions-dir <dir> --opencode-db <file> --opencode-data-dir <dir> --no-opencode --claude-code-projects-dir <dir> --no-claude-code` |
| `validate` | 校验隐私安全性、Schema 规范及国际化对齐。 | `--config ./agentrecord.config.json` |
| `open` | 在浏览器中安全打开生成的 HTML 护照页面。 | `--config <file> --owner <owner>` |
| `doctor` | 检测运行环境、Node 版本以及数据库访问权限。 | `agentrecord doctor` |

---

## 📂 预期产出产物

所有编译生成的画像文件，默认均存放于 `profiles/<owner>/` 目录下：

```text
profiles/<owner>/
├── profile.json           # 机器可读的归一化 AI 工作画像
├── evidence.jsonl         # 遮蔽敏感信息后的证据链（映射协作行为与置信度）
├── index.html             # AI 工作护照（单文件、无外部依赖、零 JS、支持截图分享）
├── profile.md             # 人类易读的 Markdown 报告摘要
├── redaction-report.md    # 隐私边界审计报告（详细记录脱敏规则生效情况）
├── run-report.md          # 增量运行摘要
└── .agentrecord/          # 私有游标快照、时间戳和本地缓存（严禁公开分享）
```

### 🎯 可选导出项
在 `build` 时通过传入 `--agent-context` 标志，可以额外导出专门为大模型 Context Window 优化的高度压缩上下文包：
- `agent-context.md`：人类可读的“开发者协同风格指南”，可供新 Agent 快速阅读。
- `agent-context.json`：机器可读的协同限制与能力契约。

---

## 🔌 支持的本地 Adapter

| 适配器 (Adapter) | 默认源路径 | 收集的元数据 | 隐私安全保证 |
| :--- | :--- | :--- | :--- |
| **Codex** | 本地会话 Rollouts 目录 | 高级 Trace 聚合指标及账户级别 Token 活跃度。 | 剔除原始系统 Prompt、文件附件等实体内容。 |
| **Claude Code** | `~/.claude/projects` | 项目计数、Trace 窗时间戳、Token 消耗总量。 | 不读取任何具体的代码 Diffs、Prompt 以及控制台输出。 |
| **opencode** | `~/.local/share/opencode/opencode.db` | 会话元数据、运行时间、Token 流量及费用指标。 | 仅进行 SQLite 指标提取，完全忽略工具执行实体内容。 |

---

<a id="当前状态"></a>

## 🛣️ 路线图与里程碑

让 AgentRecord 成为 AI 原生工程画像行业标准演进路线：

- [x] **Milestone 0: 奠定仓库基石** - 建立清晰的 CLI 包结构、国际化对齐和 MIT 发布元数据。
- [x] **Milestone 1: 本地 CLI 基线** - 跑通 `init / scan / build / validate / open`、Codex 本地 trace、隐私校验和增量状态。
- [x] **Milestone 2: 可分享的 AI 工作护照** - 交付单文件 `index.html`、可截图分享卡片和可直接编辑的展示名。
- [x] **Milestone 3a: 已接入本地 Adapter** - Codex、opencode、Claude Code 聚合元数据适配器。
- [ ] **Milestone 3b: 更多 Adapter** - OpenClaw、Hermes 和更完整的 adapter capability 报告。
- [x] **Milestone 4a: Agent 协同上下文包** - 通过 `--agent-context` 可选导出后续 Agent 交接上下文。

*阅读 [ROADMAP.md](./ROADMAP.md) 获取更详细的研发里程碑规范。*

---

## 🤝 参与贡献

AgentRecord 拥抱并感谢开源社区的每一份贡献！若您想在本地进行开发或测试：

```bash
# 克隆仓库
git clone https://github.com/iiwish/agentrecord.git
cd agentrecord

# 执行基础语法与类型校验
npm run check

# 进行干跑打包校验
npm run pack:dry

# 运行冒烟测试
npm run smoke:install
npm run smoke:share-card
npm run smoke:card-diversity
```

在提交贡献前，请确保您已阅读 [架构规格设计](./docs/architecture.md) 及 [隐私与信任准则](./docs/privacy-and-trust.zh-CN.md)。

---

## 📄 开源许可

AgentRecord 采用 [MIT 许可证](LICENSE) 开源。
