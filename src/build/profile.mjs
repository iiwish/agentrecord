import { safePathSegment } from "../core/config.mjs";
import { dimensions, roles } from "./catalog.mjs";
import { unique } from "./utils.mjs";

function getArchetype(roleSignals, abilityModel, stats, identityConfidence) {
  const getScore = (list, id) => list.find((item) => (item.role_id || item.dimension_id) === id)?.score || 40;
  const dominantRole = roleSignals[0] || null;
  const dominantAbility = abilityModel[0] || null;

  const system = getScore(roleSignals, "systems_thinker");
  const product = getScore(roleSignals, "product_builder");
  const reviewer = getScore(roleSignals, "technical_reviewer");
  const operator = getScore(roleSignals, "agent_operator");
  const shipOwner = getScore(roleSignals, "shipping_owner");

  const verify = getScore(abilityModel, "verification_discipline");
  const shipHygiene = getScore(abilityModel, "shipping_hygiene");
  const context = getScore(abilityModel, "context_packaging");
  const goal = getScore(abilityModel, "goal_framing");

  const focus = system >= product ? "S" : "P";
  const execution = reviewer >= operator ? "R" : "O";
  const quality = verify >= shipHygiene ? "V" : "D";
  const scope = context >= goal ? "C" : "M";

  const code = `${focus}${execution}${quality}${scope}`;

  const rigor = Math.max(45, Math.min(99, Math.round((reviewer + verify) / 2) + 6));
  const control = Math.max(45, Math.min(99, Math.round((operator + context) / 2) + 4));
  const strategic = Math.max(45, Math.min(99, Math.round((system + goal) / 2) + 2));
  const closedLoop = Math.max(45, Math.min(99, Math.round((shipOwner + shipHygiene) / 2) + 5));

  const candidates = [
    { val: reviewer, label: "代码质检委" },
    { val: operator, label: "多核驯兽师" },
    { val: verify, label: "无情测试监工" },
    { val: shipOwner, label: "一键闭环机器" },
    { val: system, label: "底层架构信徒" },
    { val: product, label: "精益MVP狂魔" },
    { val: context, label: "上下文包工头" },
    { val: goal, label: "黑话粉碎机" }
  ];
  candidates.sort((a, b) => b.val - a.val);
  const tags = candidates.slice(0, 3).map((c) => `#${c.label}`);

  let traceDays = 1;
  try {
    const start = new Date(stats.trace_window?.start);
    const end = new Date(stats.trace_window?.end);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diff > 0) traceDays = diff;
  } catch {
    traceDays = 42;
  }

  const activeStatus = identityConfidence === "high" ? "99% 高频狂热" : identityConfidence === "medium" ? "85% 默契协从" : "65% 试探磨合";

  const mapping = {
    "SRVC": {
      name: "AI 架构审查官",
      enName: "THE CHIEF JUSTICE",
      tagline: "“代码可以不跑，但测试必须全绿。”",
      enTagline: "No green test, no release.",
      talent: "像素级代码审计，把 AI 治得服服帖帖",
      quote: "“把证据拿出来，没跑过测试别跟我谈交付。”",
      weakness: "宁可在本地写 3 小时规范提示词，也不愿意自己动手改一行 JS。",
      status: "每天都在跟 AI 进行严密的法庭辩论，直至其乖乖跑通所有校验。"
    },
    "SRVM": {
      name: "大局观安全审计员",
      enName: "THE STRATEGIC AUDITOR",
      tagline: "“AI 会撒谎，但系统的边界不会。”",
      enTagline: "AI lies, but system boundaries don't.",
      talent: "宏观系统设计，在脑海中沙盘演练 AI 的执行过程",
      quote: "“你的上下文很漂亮，但这和我们的交付有什么关系？”",
      weakness: "架构图画得很完美，但经常忘记在本地配置环境变量。",
      status: "拿着法槌，看着一打 Agent 跑来跑去，在失控边缘按下 Stop 键。"
    },
    "SROC": {
      name: "全栈控场大师",
      enName: "THE SYSTEM CONTROL MASTER",
      tagline: "“并发 10 个 Agent，是我作为一个指挥官的尊严。”",
      enTagline: "Orchestrating agents is my dignity.",
      talent: "高效打包复杂上下文，让 AI 一次性精准理解系统意图",
      quote: "“我已经打包好了 repo 的 AST 树和 5 个报错日志，去吧。”",
      weakness: "上下文打包太重，经常让 AI 陷入深度死循环并耗尽 Token。",
      status: "双手插袋，看着终端里 agent 的并发日志以 1000 行/秒的速度飞逝。"
    },
    "SROM": {
      name: "系统级 AI 牧羊人",
      enName: "THE ARCHITECT OPERATOR",
      tagline: "“我只负责指明方向，剩下的路由 AI 自己搞定。”",
      enTagline: "I define the vectors; agents find the path.",
      talent: "顶层逻辑清晰，擅长用最简洁的契约指令指派宏大系统",
      quote: "“我们要重构整个后端。去吧，自己跑通 schema 和迁移。”",
      weakness: "过于相信 AI 的自主性，睡醒一觉发现 AI 把测试库全清空了。",
      status: "每天跑着 5 个 autonomous 脚本，感觉自己像是虚拟科技公司 CEO。"
    },
    "SDVC": {
      name: "流水线完美主义者",
      enName: "THE PIPELINE PERFECTER",
      tagline: "“把安全和验证，刻进持续集成的每一秒。”",
      enTagline: "Embed security into every single second of CI.",
      talent: "全自动交付与严格本地验证的双重重锁把关人",
      quote: "“没有自动化脚本保护的交付，只是一盘散沙。”",
      weakness: "本地脚本一报错就陷入强迫症，非要重构到完美才肯吃饭。",
      status: "乐此不疲地编写第 24 个自动化校验挂钩，把发布卫生拉到最满。"
    },
    "SDVM": {
      name: "交付防御之盾",
      enName: "THE SHIELD OF DELIVERY",
      tagline: "“安全交付，是一门克制的艺术。”",
      enTagline: "Safe shipping is an art of restraint.",
      talent: "懂得权衡发布边界与代码质量，用规则防范 AI 暴走",
      quote: "“AI 生成的代码？先过我的脱敏边界和沙箱审查。”",
      weakness: "过于热衷构建安全基础设施，导致产品本体进度被一拖再拖。",
      status: "悠闲地品着咖啡，欣赏 GitHub Actions 运行出的完美绿色勾勾。"
    },
    "SDOC": {
      name: "高频发布狂魔",
      enName: "THE VELOCITY OPERATOR",
      tagline: "“只要我发布得够快，Bug 就追不上我。”",
      enTagline: "If I ship fast enough, bugs can't catch me.",
      talent: "极速环境调度，AI 刚写完代码就已自动推向 staging 环境",
      quote: "“这行过了？马上 build 部署，我们在生产环境看反馈。”",
      weakness: "过于追求交付速度，有时会把评审环节完全变成形式主义。",
      status: "正在疯狂执行一键发布，并在 Slack 里高频 @ 所有人查看更新。"
    },
    "SDOM": {
      name: "云原生大魔王",
      enName: "THE PLATFORM SHAMAN",
      tagline: "“用代码定义一切，用 AI 吞噬架构。”",
      enTagline: "Define everything in code; let AI eat the architecture.",
      talent: "宏观掌控云原生部署与发布流，擅长复杂的多服务编排",
      quote: "“把这个微服务路由到网关，顺便让 AI 生成三套 K8s配置。”",
      weakness: "对底层细节极度不屑，经常因为一个微小的拼写错误导致容器崩溃。",
      status: "正在指挥三个 AI 编写 Helm Charts，嘴里念叨着「声明式基础设施」。"
    },
    "PRVC": {
      name: "像素级体验判官",
      enName: "THE UX GUARDIAN",
      tagline: "“别跟我谈什么底层架构，用户看得到的才算数。”",
      enTagline: "Don't talk architecture; only what users see counts.",
      talent: "像素、排版、动画无一漏网，拥有超群的视觉强迫症",
      quote: "“这个中文字体怎么落了 2 像素？让 AI 重新写一版 CSS 动画。”",
      weakness: "经常为了一个按钮的悬停动画，和 AI 纠缠搏斗一整天。",
      status: "正在严厉审查 CJK 字符的边缘截断和 terminal alignment。"
    },
    "PRVM": {
      name: "产品体验教皇",
      enName: "THE PRODUCT EVANGELIST",
      tagline: "“AI 能理解代码，但我能理解人类的心灵。”",
      enTagline: "AI understands code, but I understand the human soul.",
      talent: "无与伦比的产品嗅觉，确保 AI 的所有产出都符合极致人性",
      quote: "“这个功能链路太反人类了，重新把 user story 梳理一遍。”",
      weakness: "对复杂的底层逻辑不感冒，导致架构层面有时略显混乱。",
      status: "拿着白板笔，给 AI 解释为什么这个「极简设计」能带来 200% 转化率。"
    },
    "PROC": {
      name: "MVP 缝合巨匠",
      enName: "THE SHIELD OF FEASIBILITY",
      tagline: "“缝合，也是一种伟大的、充满生产力的艺术。”",
      enTagline: "Stitching is a great, productive art form.",
      talent: "以肉眼不可见的速度将 AI 的零碎代码粘合成可跑的 Demo",
      quote: "“我把 5 个会话的代码拼在一起了，别动它，它居然能跑！”",
      weakness: "代码内部极其混乱，后人维护时常常发出绝望的叹息。",
      status: "疯狂在多个 chat 窗口中复制粘贴，暗自祈祷 staging 别炸。"
    },
    "PROM": {
      name: "一键出海创客",
      enName: "THE INDIE SHARK",
      tagline: "“今天早上有灵感，明天晚上就上线收费。”",
      enTagline: "Inspired this morning, launched and charging tomorrow night.",
      talent: "极强的商业敏锐度，用 AI 闪电战快速占领长尾流量",
      quote: "“用最快的速度把落地页和支付接上，马上开始投流测试。”",
      weakness: "没有任何代码整洁度可言，遇到 Bug 全靠 AI 进行暴力热修复。",
      status: "一边在推特上吹嘘自己刚用 AI 赚了第一桶金，一边叫 AI 改 landing page。"
    },
    "PDVC": {
      name: "商业验证尖兵",
      enName: "THE FEASIBILITY AUDITOR",
      tagline: "“用最小的成本做最严的测试，不交一分智商税。”",
      enTagline: "Min cost, max testing. No wasted cycles.",
      talent: "砍需求刀法极其狠辣，用精准测试保障最核心的业务闭环",
      quote: "“这个功能暂时不要，我们先用 AI 测通核心买单逻辑。”",
      weakness: "极度讨厌长期技术重构，遇到大型架构改动就想换新坑。",
      status: "正在盯着冒烟测试结果，盘算着今晚的产品发布计划。"
    },
    "PDVM": {
      name: "敏捷产品掌舵人",
      enName: "THE AGILE HELMSMAN",
      tagline: "“方向比速度重要，但速度就是最好的方向。”",
      enTagline: "Direction beats speed, but speed is the best direction.",
      talent: "极其擅长给 AI 定义清晰的目标，并严格控制版本发布节奏",
      quote: "“这版 MVP 体验刚好卡在及格线上，马上开始灰度测试。”",
      weakness: "项目交付后容易失去兴趣，转头开始构思下一个酷炫点子。",
      status: "对 AI 团队下达「不要偏离 MVP，下个迭代再加功能」的冷静指示。"
    },
    "PDOC": {
      name: "闪电战产品经理",
      enName: "THE LIGHTNING BUILDER",
      tagline: "“天下武功，唯快不破。AI，全军出击！”",
      enTagline: "In the land of AI, speed is king. Charge!",
      talent: "带着一打 AI 进行饱和攻击式开发，24小时连发 10 个新功能",
      quote: "“AI 写的原型非常好，再加 3 个页面，今晚我们直接发布。”",
      weakness: "文档严重稀缺，项目维护全靠脑补，AI 稍微改一下就容易迷失。",
      status: "Staging 环境一小时内被他更新了 15 次，开发服务器在尖叫。"
    },
    "PDOM": {
      name: "野性生长创客",
      enName: "THE WILD GROWER",
      tagline: "“我发布，我倾听，我调整。”",
      enTagline: "I launch, I listen, I pivot.",
      talent: "完美将增长直觉转化为 AI 提示词，疯狂生产高转化页面",
      quote: "“只要用户愿意点击，里面的代码就算是用胶水粘的也无所谓。”",
      weakness: "技术债务越滚越大，最终项目重构成本可能会高达天文数字。",
      status: "正在紧盯着数据漏斗，命令 AI 在一分钟内修改主页的大字报标题。"
    }
  };

  const mapped = mapping[code] || mapping["SRVC"];
  const cardTheme = getCardTheme(dominantRole?.role_id, dominantAbility?.dimension_id);
  const signature = buildSignature({ dominantRole, dominantAbility, stats, identityConfidence });

  return {
    code,
    axes: { focus, execution, quality, scope },
    scores: { system, product, reviewer, operator, verify, ship: shipHygiene, context, goal },
    dominant: {
      role_id: dominantRole?.role_id || null,
      role_label: dominantRole?.label || null,
      ability_id: dominantAbility?.dimension_id || null,
      ability_label: dominantAbility?.label || null
    },
    card_theme: cardTheme,
    signature,
    rigor,
    control,
    strategic,
    closedLoop,
    tags,
    traceDays,
    activeStatus,
    ...mapped
  };
}

function getCardTheme(roleId, abilityId) {
  const byRole = {
    technical_reviewer: {
      id: "audit",
      label: "审查型",
      accent: "#0b695e",
      accentSoft: "#e4f4f2",
      field: "#e1ebd2",
      page: "#f0f3ef",
      gold: "#c28d2e",
      stripGradient: "linear-gradient(180deg, #153f39 0%, #0b695e 35%, #d09a2f 70%, #121816 100%)",
      chipGradient: "linear-gradient(135deg, #f4cc50 0%, #b88308 100%)",
      bannerPattern: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 8px, transparent 8px 16px)"
    },
    agent_operator: {
      id: "operator",
      label: "调度型",
      accent: "#315f8d",
      accentSoft: "#e4eef8",
      field: "#dfe9f5",
      page: "#eff3f7",
      gold: "#b47432",
      stripGradient: "linear-gradient(180deg, #1f3555 0%, #315f8d 35%, #20a9a3 72%, #0e151f 100%)",
      chipGradient: "linear-gradient(135deg, #8bc7ff 0%, #315f8d 100%)",
      bannerPattern: "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)"
    },
    shipping_owner: {
      id: "shipping",
      label: "交付型",
      accent: "#7a3024",
      accentSoft: "#fae8df",
      field: "#f0dfcf",
      page: "#f6f0ea",
      gold: "#c39a31",
      stripGradient: "linear-gradient(180deg, #7a3024 0%, #c84f2f 32%, #c39a31 68%, #21120f 100%)",
      chipGradient: "linear-gradient(135deg, #ffd36b 0%, #b56a20 100%)",
      bannerPattern: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0 5px, transparent 5px 12px)"
    },
    systems_thinker: {
      id: "systems",
      label: "系统型",
      accent: "#394667",
      accentSoft: "#e7ebf3",
      field: "#dde4ed",
      page: "#f1f2f5",
      gold: "#a98c3a",
      stripGradient: "linear-gradient(180deg, #1d2437 0%, #394667 42%, #7f8a59 74%, #10131c 100%)",
      chipGradient: "linear-gradient(135deg, #ccd7e8 0%, #6d7892 100%)",
      bannerPattern: "radial-gradient(circle at 8px 8px, rgba(255,255,255,0.14) 1.5px, transparent 2px)"
    },
    product_builder: {
      id: "product",
      label: "产品型",
      accent: "#8a3f68",
      accentSoft: "#f5e5ee",
      field: "#f1dce8",
      page: "#f7f1f4",
      gold: "#b99028",
      stripGradient: "linear-gradient(180deg, #8a3f68 0%, #c34f7c 35%, #2e9d8c 70%, #171017 100%)",
      chipGradient: "linear-gradient(135deg, #f6aacb 0%, #8a3f68 100%)",
      bannerPattern: "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%)"
    },
    research_synthesizer: {
      id: "research",
      label: "研究型",
      accent: "#5a5f2f",
      accentSoft: "#eef0df",
      field: "#e6e8cf",
      page: "#f4f5ec",
      gold: "#b08837",
      stripGradient: "linear-gradient(180deg, #36391f 0%, #5a5f2f 38%, #9a7a35 70%, #15160c 100%)",
      chipGradient: "linear-gradient(135deg, #d7dca2 0%, #787d3b 100%)",
      bannerPattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10px)"
    },
    collaboration_handoff: {
      id: "handoff",
      label: "交接型",
      accent: "#31615a",
      accentSoft: "#e3f0ed",
      field: "#dbe9e4",
      page: "#eff4f2",
      gold: "#bf8f2a",
      stripGradient: "linear-gradient(180deg, #203b37 0%, #31615a 36%, #bd8f2e 70%, #111817 100%)",
      chipGradient: "linear-gradient(135deg, #9ed1c4 0%, #31615a 100%)",
      bannerPattern: "repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 4px, transparent 4px 14px)"
    }
  };

  if (byRole[roleId]) return byRole[roleId];
  if (abilityId === "product_judgment" || abilityId === "goal_framing") return byRole.product_builder;
  if (abilityId === "failure_recovery") return byRole.technical_reviewer;
  return byRole.agent_operator;
}

function buildSignature({ dominantRole, dominantAbility, stats, identityConfidence }) {
  const role = dominantRole?.label || "AI 协作操作者";
  const ability = dominantAbility?.label || "本地活跃度";
  const sessions = stats.files || 0;
  const tokens = stats.total_token_usage?.total_tokens || 0;
  const perSession = sessions > 0 ? Math.round(tokens / sessions) : 0;
  const density = perSession >= 20_000_000 ? "深上下文" : sessions >= 300 ? "高频调用" : "稳态记录";
  const confidence = identityConfidence === "medium" || identityConfidence === "high" ? "证据已成型" : "基线画像";
  return `${role} · ${ability} · ${density} · ${confidence}`;
}

export function buildProfile({ config, stats, codexAccountUsage, evidenceCards, report, localeBundle, runMetadata, agentContextEnabled }) {
  const evidenceIds = evidenceCards.map((card) => card.id);
  const roleSignals = buildRoleSignals(evidenceCards, localeBundle);
  const abilityModel = buildAbilityModel(evidenceCards, localeBundle);
  const hasCuratedEvidence = evidenceCards.some((card) => card.id !== "EV-ACTIVITY-METADATA");
  const identityConfidence = hasCuratedEvidence ? "medium" : stats.files > 0 ? "low-medium" : "low";
  const archetype = getArchetype(roleSignals, abilityModel, stats, identityConfidence);
  const topRole = roleSignals[0] || roleSignals.find((item) => item.role_id === "agent_operator");
  const topAbility = abilityModel[0] || abilityModel.find((item) => item.dimension_id === "agent_delegation");
  const topRoleEvidence = topRole?.evidence_ids?.slice(0, 3) || [];

  return {
    schema_version: "agentrecord.profile.v0",
    owner: {
      id: safePathSegment(config.resolved.owner),
      display_name: config.resolved.ownerDisplayName || config.resolved.owner
    },
    generated_at: report.generated_at,
    report,
    archetype,
    work_identity: {
      primary_label: hasCuratedEvidence ? "Evidence-bound AI work operator" : "Local AI-agent activity baseline",
      localized_label: report.locale === "zh-CN" ? (hasCuratedEvidence ? "证据约束的 AI 工作操作者" : "本地 AI Agent 活跃度基线") : null,
      summary: hasCuratedEvidence
        ? `AgentRecord found ${evidenceCards.length} public-safe evidence cards for how this owner frames, delegates, reviews, verifies, and hands off AI-agent work.`
        : `AgentRecord found local Codex activity and generated a conservative baseline profile without curated memory evidence.`,
      strongest_claim: hasCuratedEvidence
        ? `Strongest current signal: ${topRole?.label || "agent operation"} with ${topRole?.confidence || identityConfidence} confidence, supported by ${topRoleEvidence.join(", ") || evidenceIds.slice(0, 2).join(", ")}.`
        : "The defensible claim is repeated local AI-agent usage, not calibrated work quality.",
      confidence: identityConfidence,
      evidence_ids: evidenceIds.slice(0, 6)
    },
    work_role_signals: roleSignals,
    ability_model: abilityModel,
    agent_ledger: {
      clients: [
        {
          client_id: "codex",
          status: stats.files > 0 ? "measured" : "not_found",
          sessions: stats.files,
          token_sessions: stats.token_sessions,
          token_usage: stats.total_token_usage,
          usage_source: "local_codex_logs",
          account_usage: codexAccountUsage || {
            status: "unavailable",
            source: "codex_app_server",
            summary: null,
            daily_usage_buckets: null
          },
          display_usage: buildCodexDisplayUsage(stats, codexAccountUsage),
          trace_window: {
            start: stats.trace_window.start,
            end: stats.trace_window.end
          },
          top_projects: stats.top_projects,
          evidence_count: evidenceCards.length
        },
        { client_id: "claude_code", status: "not_configured" },
        { client_id: "opencode", status: "not_configured" },
        { client_id: "openclaw", status: "not_configured" },
        { client_id: "hermes", status: "not_configured" }
      ]
    },
    evidence_notes: evidenceCards.map((card) => ({
      evidence_id: card.id,
      level: card.level,
      title: card.title,
      summary: card.summary,
      agent_clients: card.agent_clients,
      dimensions: card.dimensions,
      role_signals: card.role_signals,
      confidence: card.confidence,
      refs: card.refs,
      privacy: card.privacy
    })),
    calibration_notes: buildCalibrationNotes({ hasCuratedEvidence, stats, codexAccountUsage }),
    privacy_boundary: {
      local_only_generation: true,
      raw_logs_included: false,
      public_session_ids_included: false,
      public_project_paths_included: config.resolved.privacy.publicProjectPaths,
      public_artifacts: [
        "profile.json",
        "evidence.jsonl",
        "index.html",
        "profile.md",
        "redaction-report.md",
        "run-report.md",
        ...(agentContextEnabled ? ["agent-context.md", "agent-context.json"] : [])
      ],
      excluded_from_public_artifacts: [
        "raw prompts",
        "raw assistant responses",
        "raw session IDs",
        "Codex session file paths",
        "terminal bodies",
        "source bodies",
        "secret-like values"
      ]
    },
    run_metadata: runMetadata
  };
}

function buildCodexDisplayUsage(stats, codexAccountUsage) {
  const accountSummary = codexAccountUsage?.status === "measured" ? codexAccountUsage.summary : null;
  if (accountSummary?.lifetime_tokens) {
    return {
      source: "codex_account_usage",
      source_label: codexAccountUsage.source_label || "Codex CLI account usage",
      token_usage: {
        total_tokens: accountSummary.lifetime_tokens,
        peak_daily_tokens: accountSummary.peak_daily_tokens,
        longest_running_turn_sec: accountSummary.longest_running_turn_sec,
        current_streak_days: accountSummary.current_streak_days,
        longest_streak_days: accountSummary.longest_streak_days
      },
      local_sessions: stats.files,
      local_token_usage: stats.total_token_usage
    };
  }

  return {
    source: "local_codex_logs",
    source_label: "Local Codex logs",
    token_usage: {
      total_tokens: stats.total_token_usage?.total_tokens || 0,
      peak_daily_tokens: null,
      longest_running_turn_sec: null,
      current_streak_days: null,
      longest_streak_days: null
    },
    local_sessions: stats.files,
    local_token_usage: stats.total_token_usage
  };
}

function buildRoleSignals(evidenceCards, localeBundle) {
  return roles.map((role) => {
    const cards = evidenceCards.filter((card) => card.role_signals.includes(role.id));
    const evidenceLevelMix = countEvidenceLevels(cards);
    const score = scoreForCards(cards);
    return {
      role_id: role.id,
      label: localeBundle.roles?.[role.id] || role.canonical,
      score,
      band: bandForScore(score),
      confidence: confidenceForCards(cards),
      why: cards.length
        ? `Evidence mix ${formatEvidenceMix(evidenceLevelMix)} across ${cards.length} public-safe evidence card${cards.length === 1 ? "" : "s"}.`
        : "No strong public-safe evidence card supports this role signal yet.",
      evidence_level_mix: evidenceLevelMix,
      evidence_ids: cards.map((card) => card.id),
      missing_evidence: cards.length ? [] : ["More non-volume work evidence is needed before making a stronger claim."]
    };
  }).sort((a, b) => b.score - a.score);
}

function buildAbilityModel(evidenceCards, localeBundle) {
  return dimensions.map((dimension) => {
    const cards = evidenceCards.filter((card) => card.dimensions.includes(dimension.id));
    const evidenceLevelMix = countEvidenceLevels(cards);
    const score = scoreForCards(cards);
    return {
      dimension_id: dimension.id,
      label: localeBundle.abilities?.[dimension.id] || dimension.canonical,
      score,
      band: bandForScore(score),
      confidence: confidenceForCards(cards),
      evidence_level_mix: evidenceLevelMix,
      evidence_ids: cards.map((card) => card.id),
      missing_evidence: cards.length ? [] : ["No direct public-safe evidence card yet."]
    };
  }).sort((a, b) => b.score - a.score);
}

function countEvidenceLevels(cards) {
  const mix = { E1: 0, E2: 0, E3: 0, E4: 0 };
  for (const card of cards) {
    for (const level of card.level || []) {
      if (Object.hasOwn(mix, level)) mix[level] += 1;
    }
  }
  return mix;
}

export function formatEvidenceMix(mix = {}) {
  return ["E1", "E2", "E3", "E4"]
    .filter((level) => (mix[level] || 0) > 0)
    .map((level) => `${level}:${mix[level]}`)
    .join(" / ") || "none";
}

function scoreForCards(cards) {
  if (!cards.length) return 40;
  const onlyBaseline = cards.every((card) => card.id === "EV-ACTIVITY-METADATA");
  const levelWeight = cards.reduce((sum, card) => sum
    + (card.level.includes("E1") ? 11 : 0)
    + (card.level.includes("E2") ? 7 : 0)
    + (card.level.includes("E3") ? 3 : 0)
    + (card.level.includes("E4") ? 1 : 0), 0);
  const categorySpread = new Set(cards.map((card) => card.category).filter(Boolean)).size;
  const baseline = onlyBaseline ? 52 : 45;
  const score = baseline + Math.sqrt(levelWeight) * 3.6 + categorySpread * 3.5 + cards.length * 1.5;
  return Math.max(45, Math.min(96, Math.round(score)));
}

function bandForScore(score) {
  if (score >= 78) return "strong";
  if (score >= 68) return "solid";
  if (score >= 56) return "developing";
  return "emerging";
}

function confidenceForCards(cards) {
  const levels = unique(cards.flatMap((card) => card.level || []));
  if (levels.includes("E1") && levels.includes("E2")) return "high";
  if (levels.includes("E2")) return "medium";
  if (levels.includes("E3")) return "medium";
  return cards.length ? "low-medium" : "low";
}

function buildCalibrationNotes({ hasCuratedEvidence, stats, codexAccountUsage }) {
  const notes = [
    {
      type: "privacy_boundary",
      severity: "high",
      summary: "Public artifacts are generated from aggregate metadata and curated summaries only; raw conversation payloads remain excluded."
    },
    {
      type: "activity_not_ability",
      severity: "medium",
      summary: "Token usage and session counts are activity-density context, not direct proof of ability."
    },
    {
      type: "adapter_coverage",
      severity: "medium",
      summary: `Codex is the only measured adapter in this run; ${stats.files} local rollout files were scanned.`
    },
    {
      type: "missing_evidence",
      severity: hasCuratedEvidence ? "low" : "medium",
      summary: hasCuratedEvidence
        ? "The profile still needs external outcomes before making stronger public claims."
        : "No curated memory evidence was available, so the profile stays at activity-baseline strength."
    }
  ];
  notes.push({
    type: "account_usage_boundary",
    severity: codexAccountUsage?.status === "measured" ? "low" : "medium",
    summary: codexAccountUsage?.status === "measured"
      ? "Codex account-level token usage was read through the local Codex CLI app-server; local session counts still come from auditable local traces."
      : "Codex account-level usage was unavailable, so public token totals fall back to auditable local traces."
  });
  return notes;
}
