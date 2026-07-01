# Report Design

## 设计目标

AgentRecord 的报告不是普通 dashboard，也不是 AI 简历。

它的第一屏是一个可传播的 AI work identity share card，后续内容是可审计的 evidence dossier：

- 第一眼知道这个人如何和 AI Agent 工作，并能截图分享。
- 每个强结论都能追到证据。
- 有传播性，但不夸张、不做人格诊断、不做招聘判断。
- 可以给人看，也可以给 Agent 看。

## 第一屏信息架构

第一屏必须包含：

- Owner。
- 静态展示名。
- 展示名修正说明，指向 config 的 `owner_display_name` 或 CLI 的 `--display-name`。
- Share card archetype。
- Punchline、share subtitle、risk / blind spot sentence。
- 3 个社交标签。
- 轻量证据摘要，例如 evidence count、local sessions、trace days、variant badge。
- 项目源码纯文本：`github.com/iiwish/agentrecord`。
- 纯 CSS visual motif。

建议结构：

```text
AGENTRECORD
Owner: iiwish
Share Card Type: 代码判官 / Systems Proof Reviewer
Punchline: 代码可以乱，但证据链必须闭环。
Tags: #代码洁癖 #证据闭环 #脱敏存证
Proof: 高置信画像 · 24 条证据 · 180 次会话 · 30 天 trace
Subtitle: 把 role signal、能力维度和证据等级放在同一张图里校准。
Calibration: 外部结果证据不足时，本地验证不能被解读为真实世界影响。
Fix Display Name: node src/cli.mjs build --config ./agentrecord.config.json --display-name "Your Name"
Project Source: github.com/iiwish/agentrecord
```

## 视觉方向

关键词：

- passport
- dossier
- proof record
- local ledger
- evidence case file
- share card
- CSS motif
- evidence-backed identity

避免：

- 普通 SaaS 卡片墙。
- 空洞渐变 hero。
- 大量无意义装饰。
- 纯招聘简历风格。
- 排行榜风格。

## Share Card Archetype

Share card archetype 由 4 个二元轴组成，共 16 个基础类型：

- focus: `systems` / `product`
- execution: `reviewer` / `operator`
- quality: `verification` / `delivery`
- scope: `context` / `goal`

每个基础类型包含：

- `code`
- 中文名称
- 英文短名
- punchline
- 3 个社交标签
- share subtitle
- strength sentence
- risk / blind spot sentence
- visual theme id

轻量变体来自证据和分数，不使用 LLM、不联网、不随机：

- `confidence_ready`
- `strong_verification`
- `high_activity`
- `low_external_outcome`

文案风格可以有年度报告式传播感，但必须保持证据约束。它描述的是当前 evidence profile，不是人格类型、职业级别、候选人评分或市场排名。

## Visual Variation

第一屏卡片随 archetype 改变：

- 主色、辅助色、底色和金属色。
- 标签、title、punchline、share subtitle、risk。
- 证据摘要 pill 的内容与顺序。
- 纯 CSS visual motif，例如 proof seal、dossier、terminal ledger、release stamp、product lens、context map、goal compass、route map。

HTML 不引入外部图片、`<script>`、`<link>`、`http://`、`https://`、CSS `url(...)` 或 `@import`。页面可以显示 `github.com/iiwish/agentrecord` 纯文本。所有视觉变化都由内联 CSS 和 profile 数据决定。

## 页面结构

建议顺序：

1. Share card hero。
2. Trace and privacy stamp。
3. Role signal spectrum。
4. Ability map。
5. Agent ledger。
6. Evidence case files。
7. Calibration notes。
8. Redaction report。
9. Export/context links。

## 文案原则

文案要短、有传播性，但必须证据约束。

可用方向：

- Proof of work, not vibes.
- Not a prompt history. A work identity.
- Your AI work record, locally owned.
- AI collaboration leaves a record.
- 不是提示词历史，是工作方式的证据。
- AI 协作留下的，不只是 token，还有工作画像。
- 可分享的是证据，不是原始对话。

避免：

- “AI 大神”。
- “顶级候选人”。
- “秒杀 99%”。
- “自动证明你很强”。

## Role Spectrum

角色不应显示成招聘结论。

建议表达：

```text
Strong signal
Solid signal
Developing signal
Emerging signal
Insufficient evidence
```

每个 role 应显示：

- band。
- confidence。
- top evidence IDs。
- missing evidence。

## Ability Map

可以使用雷达图或矩阵，但必须避免假精确。

建议：

- 内部 `score: 0-100`。
- 页面优先展示 band。
- hover 或详情展示 score 和 confidence。
- 解释 evidence level mix。

## Evidence Case Files

每张 evidence card 应包含：

- evidence ID。
- level。
- title。
- summary。
- supported dimensions。
- agent clients。
- confidence。
- refs。
- privacy note。

不要展示：

- raw prompt。
- raw output。
- raw command body。
- raw source code。

## Agent Context Surface

报告可以提供 `agent-context.md` 下载或展示摘要。

摘要内容：

- collaboration style。
- review expectations。
- task framing preference。
- verification preference。
- risk notes。
- agent handoff notes。

这部分是 AgentRecord 的差异化重点，因为它不是只给人看，也给未来 Agent 使用。

## 中文报告原则

中文不是英文直译，应自然表达。

推荐词：

- AI 工作画像
- 工作证据
- 协作方式
- 证据等级
- 置信度
- 隐私边界
- 角色信号
- 能力维度

避免过度互联网黑话。

## HTML 技术要求

- 单文件静态 HTML 优先。
- 不依赖外网资源。
- 可通过 GitHub Pages 托管。
- 移动端可读。
- 打印/截图效果可接受。
- public artifact validator 可扫描。

## 浏览器检查要求

每次改报告 UI 后检查：

- desktop viewport。
- mobile viewport。
- 首屏是否表达清楚。
- 文本是否溢出。
- 证据卡片是否可读。
- 隐私边界是否明显。
