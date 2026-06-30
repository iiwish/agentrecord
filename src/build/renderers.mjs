import { formatEvidenceMix } from "./profile.mjs";
import { esc, formatCompactNumber, formatNumber } from "./utils.mjs";

export function renderMarkdown(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  const codex = profile.agent_ledger.clients.find((client) => client.client_id === "codex") || {};
  const displayUsage = codex.display_usage || {};
  const displayTokens = displayUsage.token_usage?.total_tokens || codex.token_usage?.total_tokens || 0;
  return `# ${profile.owner.display_name} ${t("title")}

${t("subtitle")}

- ${t("generated")}: ${profile.generated_at}
- ${t("trace_window")}: ${codex.trace_window?.start || "unknown"} to ${codex.trace_window?.end || "unknown"}
- ${t("sessions")}: ${formatNumber(codex.sessions || 0, profile.report.locale)}
- ${t("token_activity")}: ${formatNumber(displayTokens, profile.report.locale)} (${displayUsage.source_label || "local"})
- ${t("evidence")}: ${formatNumber(profile.evidence_notes.length, profile.report.locale)}

## ${t("identity")}

${profile.work_identity.summary}

Strongest evidence-backed claim: ${profile.work_identity.strongest_claim}

Confidence: ${profile.work_identity.confidence}

Evidence IDs: ${profile.work_identity.evidence_ids.join(", ") || "none"}

## ${t("role_signals")}

${profile.work_role_signals.map((role) => `- ${role.label}: ${role.band}, ${role.confidence}. ${role.why} Evidence: ${role.evidence_ids.join(", ") || "none"}`).join("\n")}

## ${t("ability_model")}

${profile.ability_model.map((ability) => `- ${ability.label}: ${ability.band}, ${ability.confidence}. Evidence mix: ${formatEvidenceMix(ability.evidence_level_mix)}. Evidence: ${ability.evidence_ids.join(", ") || "none"}`).join("\n")}

## ${t("agent_ledger")}

${profile.agent_ledger.clients.map((client) => `- ${client.client_id}: ${client.status}${Number.isFinite(client.sessions) ? `, ${formatNumber(client.sessions, profile.report.locale)} sessions` : ""}`).join("\n")}

Token usage and session counts are activity-density context, not direct proof of ability.

## ${t("evidence")}

${profile.evidence_notes.map((card) => `### ${card.evidence_id}: ${card.title}

- Level: ${card.level.join(", ")}
- Confidence: ${card.confidence}
- Summary: ${card.summary}
- Refs: ${card.refs.map(formatPublicRef).join("; ")}
`).join("\n")}

## ${t("calibration")}

${profile.calibration_notes.map((note) => `- ${note.severity}: ${note.summary}`).join("\n")}

## ${t("privacy_boundary")}

${t("public_safe")}

${t("not_hiring")}
`;
}

export function renderHtml(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  const isZh = profile.report.locale === "zh-CN";
  const codex = profile.agent_ledger.clients.find((client) => client.client_id === "codex") || {};
  const clients = profile.agent_ledger.clients || [];
  const measuredClients = clients.filter((client) => client.status === "measured").map((client) => client.client_id);

  const archetype = profile.archetype || {
    code: "SRVC",
    name: "AI 架构审查官",
    enName: "THE CHIEF JUSTICE",
    tagline: "“代码可以不跑，但测试必须全绿。”",
    talent: "像素级代码审计，把 AI 治得服服帖帖",
    quote: "“把证据拿出来，没跑过测试别跟我谈交付。”",
    weakness: "宁可在本地写 3 小时规范提示词，也不愿意自己动手改一行 JS。",
    status: "每天都在跟 AI 进行严密的法庭辩论，直至其乖乖跑通所有校验。",
    rigor: 92,
    control: 76,
    strategic: 85,
    closedLoop: 88,
    tags: ["#代码质检委", "#无情测试监工", "#提示词洁癖"],
    traceDays: 42,
    activeStatus: "85% 默契协从"
  };
  const cardTheme = archetype.card_theme || {
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
  };

  const formatChineseCompact = (value) => {
    if (value >= 1e8) return `${(value / 1e8).toFixed(1)} 亿字`;
    if (value >= 1e4) return `${(value / 1e4).toFixed(0)} 万字`;
    return `${value} 字`;
  };
  const formatDuration = (seconds) => {
    const totalSeconds = Math.max(0, Number(seconds) || 0);
    if (!totalSeconds) return null;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (isZh) return hours > 0 ? `${hours} 小时 ${minutes} 分` : `${minutes} 分`;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  const displayUsage = codex.display_usage || {};
  const displayTokenUsage = displayUsage.token_usage || {};
  const displayTokens = displayTokenUsage.total_tokens || codex.token_usage?.total_tokens || 0;
  const hasAccountUsage = displayUsage.source === "codex_account_usage";
  const longestTask = formatDuration(displayTokenUsage.longest_running_turn_sec);
  const currentStreakDays = displayTokenUsage.current_streak_days;
  const longestStreakDays = displayTokenUsage.longest_streak_days;

  const copy = isZh ? {
    productMark: "AGENTRECORD / 智能体协同数字身份证",
    proofStamp: "本地加密生成",
    identityLabel: "AI 协作身份",
    strongestClaim: "最强事实存证结论",
    traceWindow: "Trace 活跃区间",
    agentClients: "Agent 客户端",
    evidenceCount: "证据卡片数",
    confidence: "画像置信度",
    privacy: "数据隐私边界",
    sections: {
      roles: "工作角色倾向",
      abilities: "核心能力维度",
      ledger: "智能体活动台账",
      evidence: "脱敏存证卷宗",
      calibration: "偏差校准说明",
      redaction: "数据安全隔离边界"
    },
    roleIntro: "角色信号由真实行为证据链推导，表示在 AI 协作中的技术倾斜与团队定位。",
    abilityIntro: "能力模型呈现多维度的调度习惯。雷达排序分数仅用于组内加权，不构成外部评价。",
    ledgerIntro: "智能体台账客观记录会话规模与活跃度，属于行为密度，不直接等同于技术水平。",
    evidenceIntro: "案卷仅保留可审计的轻量脱敏存证（Case File），绝不泄漏任何核心业务逻辑与隐私数据。",
    redactionIntro: "公开报告可放心用于简历展示或社交分享，原始 Trace 和私有会话数据将永远锁在本地。",
    measured: "已接入测量",
    pending: "未配置适配器",
    sessions: "会话",
    localThreads: "本地线程",
    accountTokens: "账号 Token",
    accountOverview: "账号总览",
    localAudited: "本地可审计",
    longestTask: "最长任务",
    streakDays: "连续天数",
    tokenActivity: "Token 活跃度",
    refs: "事实证据索引",
    evidenceIds: "证据 ID",
    missing: "拼图缺口",
    excluded: "数据脱敏：已被物理擦除的敏感内容",
    artifacts: "存证输出：生成的公开静态制品",
    generated: "生成日期",
    noEvidence: "暂无直接证据支持",
    noMissing: "完美覆盖，暂无明确能力短板"
  } : {
    productMark: "AGENTRECORD / AI WORKER BADGE",
    proofStamp: "LOCAL PROOF STAMP",
    identityLabel: "AI Work Identity",
    strongestClaim: "Strongest Claim",
    traceWindow: "Trace Active Window",
    agentClients: "Agent Clients",
    evidenceCount: "Evidence Cards",
    confidence: "Profile Confidence",
    privacy: "Privacy Boundary",
    sections: {
      roles: "Role Signals",
      abilities: "Ability Dimensions",
      ledger: "Agent Activity Ledger",
      evidence: "Evidence Case Files",
      calibration: "Calibration Notes",
      redaction: "Redaction Boundaries"
    },
    roleIntro: "Role signals indicate your work tendencies derived from evidence, not standard seniority.",
    abilityIntro: "Ability dimensions showcase operational precision. Internal scores are for relative ranking, not absolute scale.",
    ledgerIntro: "Sessions and token activity show interaction density, not a direct proxy for competency.",
    evidenceIntro: "Each case file retains only safe, non-identifying trace references and abstract audit summaries.",
    redactionIntro: "Public artifacts are built for local review or static sharing. Raw conversation histories never leave your machine.",
    measured: "measured",
    pending: "not configured",
    sessions: "sessions",
    localThreads: "local threads",
    accountTokens: "account tokens",
    accountOverview: "account overview",
    localAudited: "local audit",
    longestTask: "longest task",
    streakDays: "streak days",
    tokenActivity: "token activity",
    refs: "Audit Refs",
    evidenceIds: "Evidence IDs",
    missing: "Gaps",
    excluded: "Redacted: Excluded from public artifacts",
    artifacts: "Artifacts: Generated public-safe files",
    generated: "Generated",
    noEvidence: "No direct evidence yet",
    noMissing: "Pristine coverage, no explicit gap"
  };

  const clientSummary = measuredClients.length
    ? measuredClients.map((client) => `${client}: ${copy.measured}`).join(" / ")
    : clients.map((client) => `${client.client_id}: ${client.status}`).join(" / ") || "none";
  const traceWindow = `${codex.trace_window?.start || "unknown"} -> ${codex.trace_window?.end || "unknown"}`;
  const heroEvidenceIds = profile.work_identity.evidence_ids?.slice(0, 4) || [];
  const streakSource = hasAccountUsage && Number.isFinite(longestStreakDays)
    ? `<em class="stats-source">${isZh ? `最长 ${longestStreakDays} 天` : `longest ${longestStreakDays}d`}</em>`
    : "";

  return `<!doctype html>
<html lang="${esc(localeBundle.html_lang || profile.report.locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(profile.owner.display_name)} @ AgentRecord</title>
  <style>
    :root {
      color-scheme: light;
      --page: ${esc(cardTheme.page)};
      --sheet: #ffffff;
      --ink: #0a0f0d;
      --muted: #4d5d56;
      --line: #0a0f0d;
      --steel: #1b2621;
      --field: ${esc(cardTheme.field)};
      --accent: ${esc(cardTheme.accent)};
      --accent-soft: ${esc(cardTheme.accentSoft)};
      --stamp: #b82d22;
      --gold: ${esc(cardTheme.gold)};
      --case: #fafcf9;
      --strip-gradient: ${cardTheme.stripGradient};
      --chip-gradient: ${cardTheme.chipGradient};
      --banner-pattern: ${cardTheme.bannerPattern};
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    }
    * { box-sizing: border-box; }
    html { background: var(--page); }
    body {
      margin: 0;
      background-color: var(--page);
      background-image:
        linear-gradient(rgba(10, 15, 13, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(10, 15, 13, 0.035) 1px, transparent 1px);
      background-size: 20px 20px;
      color: var(--ink);
      padding: 0 16px;
    }
    main { width: min(1200px, 100%); margin: 0 auto; padding: 40px 0 80px; }

    /* SINGLE PANEL WRAPPER FOR SHARABLE CARD */
    .share-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 32px;
      padding: 10px 0;
    }

    /* THE CARD (AI WORKER BADGE) */
    .badge-card {
      max-width: 540px;
      width: 100%;
      border: 3.5px solid var(--line);
      border-radius: 16px;
      box-shadow: 10px 10px 0 var(--line);
      background: var(--sheet);
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* Holographic Edge Strip */
    .holo-strip {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 14px;
      background: var(--strip-gradient);
      opacity: 0.85;
      border-right: 2px solid var(--line);
      z-index: 10;
    }

    .badge-body {
      padding: 30px 28px 24px 44px; /* extra left padding for holo-strip */
      position: relative;
    }

    /* Golden chip */
    .chip-container {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 24px;
    }
    .card-chip {
      width: 44px;
      height: 32px;
      background: var(--chip-gradient);
      border: 2px solid var(--line);
      border-radius: 6px;
      position: relative;
      box-shadow: inset 1px 1px 1px rgba(255,255,255,0.45), 2.5px 2.5px 0 rgba(0,0,0,0.15);
    }
    .card-chip::after {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(11,16,13,0.12) 5px, rgba(11,16,13,0.12) 6px);
      border-radius: 4px;
    }
    .card-header-meta {
      text-align: right;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      color: var(--muted);
      text-transform: uppercase;
      line-height: 1.3;
    }

    /* Badge Holder Name & Tags */
    .holder-name {
      font-size: 34px;
      font-weight: 900;
      margin: 0 0 8px 0;
      letter-spacing: -1.5px;
      color: var(--ink);
      line-height: 1.0;
    }
    .holder-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 24px;
    }
    .holder-tag {
      background: var(--field);
      border: 1.5px solid var(--line);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 800;
      color: var(--steel);
      box-shadow: 1px 1px 0 var(--line);
    }

    /* Character Archetype Banner */
    .archetype-banner {
      background: var(--accent);
      color: #ffffff;
      border: 2.5px solid var(--line);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 3.5px 3.5px 0 var(--line);
      position: relative;
      overflow: hidden;
    }
    .archetype-banner::after {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--banner-pattern);
      background-size: 16px 16px;
      pointer-events: none;
    }
    .archetype-label {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.85;
      margin-bottom: 4px;
    }
    .archetype-title {
      font-size: 24px;
      font-weight: 950;
      margin: 0;
      line-height: 1.2;
    }

    /* Quote style */
    .badge-quote {
      font-style: italic;
      color: var(--steel);
      border-left: 3.5px solid var(--accent);
      padding-left: 14px;
      font-size: 14.5px;
      line-height: 1.5;
      margin-bottom: 14px;
      font-weight: 700;
    }
    .signature-line {
      border: 1.5px solid var(--line);
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--steel);
      padding: 8px 11px;
      margin-bottom: 24px;
      box-shadow: 2px 2px 0 var(--line);
      display: grid;
      grid-template-columns: 74px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
    }
    .signature-line span {
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: var(--accent);
      white-space: nowrap;
    }
    .signature-line b {
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    /* RPG Attributes Panel */
    .rpg-section-title {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 2px;
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 12px;
      border-bottom: 1.5px dashed rgba(10, 15, 13, 0.15);
      padding-bottom: 4px;
    }
    .rpg-panel {
      display: grid;
      gap: 12px;
      margin-bottom: 28px;
    }
    .rpg-row {
      display: grid;
      grid-template-columns: 85px 1fr 45px;
      gap: 14px;
      align-items: center;
    }
    .rpg-label {
      font-size: 13.5px;
      font-weight: 900;
      color: var(--ink);
    }
    .rpg-track {
      height: 12px;
      border: 2px solid var(--line);
      background: var(--page);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    .rpg-fill {
      height: 100%;
      background: repeating-linear-gradient(-45deg, var(--gold), var(--gold) 4px, #a37c22 4px, #a37c22 8px);
      border-right: 1.5px solid var(--line);
    }
    .rpg-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      font-weight: 900;
      text-align: right;
      color: var(--ink);
    }

    /* Battle Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 28px;
    }
    .stats-item {
      border: 1.5px solid var(--line);
      border-radius: 8px;
      background: var(--case);
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 68px;
      box-shadow: 3px 3px 0 var(--line);
    }
    .stats-item span {
      font-size: 10px;
      font-weight: 800;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stats-item b {
      font-size: 17px;
      font-weight: 900;
      color: var(--ink);
      margin-top: 4px;
    }
    .stats-source {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      max-width: 100%;
      margin-top: 6px;
      border: 1px solid rgba(10, 15, 13, 0.22);
      border-radius: 5px;
      padding: 1px 5px;
      font-size: 8.5px;
      line-height: 1.25;
      font-weight: 900;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--accent);
      background: #fff;
      overflow-wrap: anywhere;
    }

    /* Card stamp & Barcode */
    .card-footer-strip {
      display: flex;
      justify-content: space-between;
      align-items: end;
      border-top: 2px dashed rgba(10, 15, 13, 0.15);
      padding-top: 20px;
    }
    .card-stamp {
      border: 3px double var(--stamp);
      color: var(--stamp);
      border-radius: 4px;
      padding: 4px 10px;
      transform: rotate(-3deg);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      background: rgba(184, 45, 34, 0.02);
      box-shadow: inset 0 0 0 1px var(--stamp);
    }
    .card-barcode-box {
      text-align: right;
    }
    .card-barcode {
      display: inline-block;
      height: 26px;
      width: 120px;
      background: repeating-linear-gradient(90deg, var(--ink), var(--ink) 1.5px, transparent 1.5px, transparent 4.5px, var(--ink) 4.5px, var(--ink) 5.5px, transparent 5.5px, transparent 8.5px);
      opacity: 0.85;
    }
    .card-serial {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 9px;
      letter-spacing: 1.5px;
      color: var(--muted);
      margin-top: 2px;
      text-transform: uppercase;
    }

    /* Card MRZ Zone */
    .card-mrz {
      background: var(--page);
      border-top: 2.5px solid var(--line);
      padding: 12px 12px 12px 24px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      line-height: 1.4;
      letter-spacing: 2px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
    }

    /* SCROLL DOWN PROMPT */
    .scroll-prompt {
      text-align: center;
      margin: 16px 0 40px;
      font-size: 13px;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: 1px;
      text-transform: uppercase;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-4px); }
      60% { transform: translateY(-2px); }
    }

    /* AUDIT DETAILS (DOWNSTREAM LEDGER) */
    .dossier-section { margin-top: 24px; padding: clamp(20px, 4vw, 36px); background: var(--sheet); }
    .section-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .36fr); gap: 24px; align-items: end; margin-bottom: 28px; border-bottom: 2px dashed #dce2dc; padding-bottom: 16px; }
    .kicker { color: var(--accent); margin-bottom: 6px; font-size: 13px; font-family: ui-monospace, monospace; }
    h2 { margin: 0; font-size: clamp(24px, 4vw, 42px); line-height: 1.0; letter-spacing: -1px; overflow-wrap: anywhere; font-weight: 900; }
    .section-head p { margin: 0; color: var(--muted); line-height: 1.5; font-size: 14px; font-weight: 600; }

    .signal-list, .ability-list, .ledger-list, .case-list, .note-list, .boundary-grid { display: grid; gap: 12px; }
    .signal-row, .ability-row, .ledger-row, .case-file, .note-file, .boundary-panel { min-width: 0; border: 2px solid var(--line); border-radius: 10px; background: #fafdfa; padding: 20px; box-shadow: 4px 4px 0 var(--line); transition: all 0.15s ease; }
    .signal-row:hover, .ability-row:hover, .ledger-row:hover, .case-file:hover { transform: translate(-1.5px, -1.5px); box-shadow: 5.5px 5.5px 0 var(--line); }

    .signal-row, .ability-row, .ledger-row { display: grid; grid-template-columns: minmax(180px, .55fr) minmax(0, 1fr) minmax(140px, .24fr); gap: 20px; align-items: center; }
    .name { font-weight: 900; font-size: 19px; overflow-wrap: anywhere; color: var(--ink); }
    .meta, .small { color: var(--muted); font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; font-weight: 600; }

    /* Sliders / Vintage Analog Meters */
    .band-track { height: 14px; border: 2px solid var(--line); background: var(--field); overflow: hidden; border-radius: 4px; }
    .band-fill {
      height: 100%;
      background: repeating-linear-gradient(
        -45deg,
        var(--accent),
        var(--accent) 7px,
        #128c7f 7px,
        #128c7f 14px
      );
      border-right: 2px solid var(--line);
    }

    .pill-line { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .pill { border: 1px solid var(--line); border-radius: 6px; padding: 4px 10px; background: #f0f6f1; color: var(--steel); font-size: 11px; font-weight: 800; overflow-wrap: anywhere; box-shadow: 1px 1px 0 var(--line); }

    .ledger-row { grid-template-columns: minmax(140px, .3fr) minmax(0, 1fr) minmax(160px, .28fr); }
    .case-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }

    /* Index Cards with Watermark */
    .case-file {
      background: var(--case);
      position: relative;
    }
    .case-file::after {
      content: "CONFIDENTIAL";
      position: absolute;
      bottom: 12px;
      right: 16px;
      font-size: 18px;
      font-weight: 950;
      color: rgba(184, 45, 34, 0.04);
      transform: rotate(-12deg);
      letter-spacing: 2px;
      pointer-events: none;
      font-family: ui-monospace, monospace;
    }
    .case-title { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
    .case-title b { font-size: 18px; line-height: 1.25; overflow-wrap: anywhere; font-weight: 900; color: var(--ink); }
    .case-id { color: var(--accent); font-size: 12px; font-weight: 900; overflow-wrap: anywhere; font-family: ui-monospace, monospace; }
    .case-file p, .note-file p, .boundary-panel p { margin: 10px 0 0; color: var(--muted); line-height: 1.5; overflow-wrap: anywhere; font-size: 13.5px; font-weight: 600; }
    .case-file p b { color: var(--ink); }

    .boundary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .boundary-panel { background: var(--case); }
    ul.clean { margin: 10px 0 0; padding: 0; list-style: none; color: var(--muted); line-height: 1.6; font-size: 13px; font-weight: 600; }
    ul.clean li { overflow-wrap: anywhere; padding-left: 14px; position: relative; margin-bottom: 4px; }
    ul.clean li::before { content: "▪"; position: absolute; left: 0; color: var(--accent); font-size: 8px; top: 1px; }

    @media (max-width: 960px) {
      main { width: 100%; padding-top: 16px; }
      .hero, .section-head, .case-list, .boundary-grid { grid-template-columns: 1fr; }
      .signal-row, .ability-row, .ledger-row { grid-template-columns: 1fr; gap: 14px; }
      h1 { font-size: clamp(32px, 8vw, 48px); }
    }

    /* Clean CSS Tabs & Linear Aesthetic */
    .tab-input { display: none; }
    .tab-nav-wrapper {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin: 20px 0 32px 0;
      flex-wrap: wrap;
    }
    .tab-label {
      background: var(--sheet);
      border: 2px solid var(--line);
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 850;
      color: var(--steel);
      cursor: pointer;
      box-shadow: 3px 3px 0 var(--line);
      transition: all 0.15s ease-in-out;
      user-select: none;
    }
    .tab-label:hover {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--line);
    }
    .tab-content {
      display: none;
      animation: tabFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    #tab-specialties:checked ~ .tab-nav-wrapper label[for="tab-specialties"],
    #tab-evidence:checked ~ .tab-nav-wrapper label[for="tab-evidence"],
    #tab-ledger:checked ~ .tab-nav-wrapper label[for="tab-ledger"],
    #tab-redaction:checked ~ .tab-nav-wrapper label[for="tab-redaction"] {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--line);
      box-shadow: 1px 1px 0 var(--line);
      transform: translate(2px, 2px);
    }
    #tab-specialties:checked ~ #content-specialties,
    #tab-evidence:checked ~ #content-evidence,
    #tab-ledger:checked ~ #content-ledger,
    #tab-redaction:checked ~ #content-redaction {
      display: block;
    }
    @keyframes tabFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Specialty Split Columns */
    .specialty-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 850px) {
      .specialty-columns { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <!-- GORGEOUS SHARABLE BADGE CARD -->
    <div class="share-container">
      <div class="badge-card variant-${esc(cardTheme.id)}">
        <!-- Rainbow edge border decoration -->
        <div class="holo-strip"></div>

        <div class="badge-body">
          <!-- Card top header -->
          <div class="chip-container">
            <div class="card-chip"></div>
            <div class="card-header-meta">
              <div>${esc(copy.productMark)}</div>
              <div style="font-weight:900; color:var(--ink);">${esc(copy.generated)} ${esc(profile.generated_at.slice(0, 10))}</div>
            </div>
          </div>

          <!-- Holder name -->
          <h1 class="holder-name">${esc(profile.owner.display_name)}</h1>

          <!-- Witty programmer-specific tags -->
          <div class="holder-tags">
            ${archetype.tags.map((tag) => `<span class="holder-tag">${esc(tag)}</span>`).join("\n")}
          </div>

          <!-- Character Archetype Banner -->
          <div class="archetype-banner">
            <div class="archetype-label">${isZh ? "AI 协同职业倾向" : "COLLABORATION ARCHETYPE"}</div>
            <h2 class="archetype-title">${esc(archetype.name)} / <span style="font-size:16px; opacity:0.85;">${esc(archetype.enName)}</span></h2>
          </div>

          <!-- Quote -->
          <div class="badge-quote">
            ${esc(isZh ? archetype.tagline : archetype.enTagline)}
          </div>
          <div class="signature-line">
            <span>${isZh ? "主导信号" : "Signal"}</span>
            <b>${esc(archetype.signature || `${archetype.dominant?.role_label || archetype.name} · ${archetype.dominant?.ability_label || cardTheme.label}`)}</b>
          </div>

          <!-- RPG Attributes Slider Panel -->
          <div class="rpg-section-title">${isZh ? "驯化属性倾向 / OPERATOR STATS" : "OPERATOR ATRIBUTES"}</div>
          <div class="rpg-panel">
            <div class="rpg-row">
              <div class="rpg-label">${isZh ? "防错严谨度" : "Audit Rigor"}</div>
              <div class="rpg-track"><div class="rpg-fill" style="width:${archetype.rigor}%"></div></div>
              <div class="rpg-value">${archetype.rigor}%</div>
            </div>
            <div class="rpg-row">
              <div class="rpg-label">${isZh ? "高频操控欲" : "Control"}</div>
              <div class="rpg-track"><div class="rpg-fill" style="width:${archetype.control}%"></div></div>
              <div class="rpg-value">${archetype.control}%</div>
            </div>
            <div class="rpg-row">
              <div class="rpg-label">${isZh ? "顶层大局观" : "Strategy"}</div>
              <div class="rpg-track"><div class="rpg-fill" style="width:${archetype.strategic}%"></div></div>
              <div class="rpg-value">${archetype.strategic}%</div>
            </div>
            <div class="rpg-row">
              <div class="rpg-label">${isZh ? "冷血闭环值" : "Execution"}</div>
              <div class="rpg-track"><div class="rpg-fill" style="width:${archetype.closedLoop}%"></div></div>
              <div class="rpg-value">${archetype.closedLoop}%</div>
            </div>
          </div>

          <!-- Battle Stats Grid -->
          <div class="rpg-section-title">${isZh ? "调教战绩统计 / INTERACTION BATTLE RECORDS" : "BATTLE STATS"}</div>
          <div class="stats-grid">
            <div class="stats-item">
              <span>${esc(copy.localThreads)}</span>
              <b>${formatNumber(codex.sessions || 0, profile.report.locale)} 次</b>
              <em class="stats-source">${esc(copy.localAudited)}</em>
            </div>
            <div class="stats-item">
              <span>${esc(hasAccountUsage ? copy.accountTokens : copy.tokenActivity)}</span>
              <b>${formatChineseCompact(displayTokens)}</b>
              <em class="stats-source">${esc(hasAccountUsage ? copy.accountOverview : copy.localAudited)}</em>
            </div>
            <div class="stats-item">
              <span>${esc(hasAccountUsage ? copy.longestTask : (isZh ? "驯化周期" : "Trace Active"))}</span>
              <b>${esc(hasAccountUsage && longestTask ? longestTask : `${archetype.traceDays} 天`)}</b>
            </div>
            <div class="stats-item">
              <span>${esc(hasAccountUsage ? copy.streakDays : (isZh ? "当前状态" : "Active Status"))}</span>
              <b style="color:var(--accent);">${esc(hasAccountUsage && Number.isFinite(currentStreakDays) ? `${currentStreakDays} 天` : archetype.activeStatus)}</b>${streakSource}
            </div>
          </div>

          <!-- Card barcode and stamp -->
          <div class="card-footer-strip">
            <div class="card-stamp">${esc(copy.proofStamp)}</div>
            <div class="card-barcode-box">
              <div class="card-barcode"></div>
              <div class="card-serial">AR-${esc(archetype.code)}-${esc(profile.owner.id.toUpperCase())}</div>
            </div>
          </div>
        </div>

        <!-- Passport MRZ zone -->
        <div class="card-mrz">
          P&lt;CHN&lt;${esc(profile.owner.id.toUpperCase())}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>
          AR&lt;${esc(archetype.code)}&lt;${esc(formatCompactNumber(displayTokens, "en-US").toUpperCase())}&lt;${esc(codex.sessions || 0)}&lt;EVI&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </div>
      </div>
    </div>

    <!-- Bounce prompt to scroll -->
    <div class="scroll-prompt">
      ▼ ${isZh ? "向下滚动解密：底层技术审计链 & 事实证据卷宗" : "Scroll to inspect: low-level audit trace & evidence dossiers"}
    </div>

    <!-- Clean CSS Tabs for Progressive Disclosure -->
    <input type="radio" name="tabs" id="tab-specialties" checked class="tab-input">
    <input type="radio" name="tabs" id="tab-evidence" class="tab-input">
    <input type="radio" name="tabs" id="tab-ledger" class="tab-input">
    <input type="radio" name="tabs" id="tab-redaction" class="tab-input">

    <div class="tab-nav-wrapper">
      <label for="tab-specialties" class="tab-label">${isZh ? "🌟 协作特长" : "Specialties"}</label>
      <label for="tab-evidence" class="tab-label">${isZh ? "📁 事实存证" : "Evidence"}</label>
      <label for="tab-ledger" class="tab-label">${isZh ? "🔌 智能体台账" : "Ledger"}</label>
      <label for="tab-redaction" class="tab-label">${isZh ? "🛡️ 数据合规墙" : "Redaction"}</label>
    </div>

    <!-- TAB CONTENT 1: SPECIALTIES -->
    <div class="tab-content" id="content-specialties">
      <div class="specialty-columns">
        <!-- 01 / ROLE SIGNALS -->
        <section class="dossier-section" style="margin-top:0;">
          <div class="section-head">
            <div><div class="kicker">01 / ${esc(copy.identityLabel)}</div><h2>${esc(copy.sections.roles)}</h2></div>
            <p>${esc(copy.roleIntro)}</p>
          </div>
          <div class="signal-list">
            ${profile.work_role_signals.slice(0, 3).map((role) => {
              const barSegments = Math.round(role.score / 10);
              let segmentHtml = "";
              for (let i = 0; i < 10; i++) {
                const isActive = i < barSegments;
                const color = role.score >= 78 ? "var(--accent)" : "var(--gold)";
                segmentHtml += `<div class="segment-block" style="flex:1; height:100%; background: ${isActive ? color : "var(--field)"}; border-right: 1.5px solid var(--line); transition: background 0.2s ease;"></div>`;
              }
              return `<article class="signal-row" style="grid-template-columns: minmax(130px, 0.45fr) minmax(0, 1fr); padding: 16px; margin-bottom: 8px;">
                <div>
                  <div class="name" style="font-size:17.5px;">${esc(role.label)}</div>
                  <div class="meta" style="font-family:ui-monospace,monospace; font-size:11.5px; letter-spacing:0.5px;">${esc(role.role_id)}</div>
                </div>
                <div>
                  <div class="meta" style="font-weight:800; color:var(--accent); text-transform:uppercase; font-size:11px; letter-spacing:0.5px; margin-bottom:6px;">
                    <span class="pill" style="box-shadow:none; padding:1px 5px; background:var(--accent-soft); color:var(--accent); border-color:var(--accent); margin-right:4px; font-size:10px;">${esc(role.band).toUpperCase()}</span>
                    置信度: ${esc(role.confidence).toUpperCase()}
                  </div>
                  <div class="segment-track" style="display:flex; height:10px; border:2px solid var(--line); border-radius:4px; overflow:hidden; background:var(--field); margin-bottom:8px;">
                    ${segmentHtml}
                  </div>
                  <div class="pill-line" style="margin-top:4px;">${(role.evidence_ids.length ? role.evidence_ids.slice(0, 3) : [copy.noEvidence]).map((id) => `<span class="pill" style="font-family:ui-monospace,monospace; font-size:10.5px; padding:2px 6px;">${esc(id)}</span>`).join("")}</div>
                </div>
              </article>`;
            }).join("\n")}
          </div>
        </section>

        <!-- 02 / ABILITIES -->
        <section class="dossier-section" style="margin-top:0;">
          <div class="section-head">
            <div><div class="kicker">02 / ${esc(copy.sections.abilities)}</div><h2>${esc(copy.sections.abilities)}</h2></div>
            <p>${esc(copy.abilityIntro)}</p>
          </div>
          <div class="ability-list">
            ${profile.ability_model.slice(0, 3).map((ability) => {
              const bandLower = String(ability.band).toLowerCase();
              let ratingText = "●●○○○ [入门]";
              let ratingColor = "var(--muted)";
              if (bandLower === "strong") {
                ratingText = "●●●●● [精通]";
                ratingColor = "var(--accent)";
              } else if (bandLower === "solid") {
                ratingText = "●●●●○ [熟练]";
                ratingColor = "var(--gold)";
              } else if (bandLower === "developing") {
                ratingText = "●●●○○ [掌握]";
                ratingColor = "var(--ink)";
              }
              return `<article class="ability-row" style="grid-template-columns: minmax(130px, 0.45fr) minmax(0, 1fr); padding: 16px; margin-bottom: 8px;">
                <div>
                  <div class="name" style="font-size:17.5px;">${esc(ability.label)}</div>
                  <div class="meta" style="font-family:ui-monospace,monospace; font-size:11.5px; letter-spacing:0.5px;">${esc(ability.dimension_id)}</div>
                </div>
                <div>
                  <div class="meta" style="font-weight:800; color:${ratingColor}; font-size:11.5px; margin-bottom:6px; font-family:ui-monospace,monospace;">
                    ${ratingText}
                  </div>
                  <div class="band-track" aria-hidden="true" style="height:10px;"><div class="band-fill" style="width:${ability.score}%"></div></div>
                  <div class="pill-line" style="margin-top:4px;">${(ability.evidence_ids.length ? ability.evidence_ids.slice(0, 3) : [copy.noEvidence]).map((id) => `<span class="pill" style="font-family:ui-monospace,monospace; font-size:10.5px; padding:2px 6px;">${esc(id)}</span>`).join("")}</div>
                </div>
              </article>`;
            }).join("\n")}
          </div>
        </section>
      </div>
    </div>

    <!-- TAB CONTENT 2: EVIDENCE -->
    <div class="tab-content" id="content-evidence">
      <section class="dossier-section" style="margin-top:0;">
        <div class="section-head">
          <div><div class="kicker">03 / ${esc(copy.sections.evidence)}</div><h2>脱敏存证事实卷宗</h2></div>
          <p>${esc(copy.evidenceIntro)}</p>
        </div>
        <div class="case-list">
          ${profile.evidence_notes.slice(0, 3).map((card) => `<div class="case-card-wrapper" style="margin-top:10px;">
            <div class="case-tab" style="display:inline-block; background:var(--field); border:2px solid var(--line); border-bottom:none; border-radius:6px 6px 0 0; padding:4px 12px; font-family:ui-monospace,monospace; font-size:11px; font-weight:900; color:var(--steel); margin-bottom:-2px; position:relative; z-index:2; box-shadow: 2px 0 0 rgba(0,0,0,0.05);">${esc(card.evidence_id)}</div>

            <article class="case-file" style="margin-top:0; border-top-left-radius:0; z-index:1; position:relative; padding: 20px;">
              <div class="case-title">
                <b style="font-size:17.5px;">${esc(card.title)}</b>
              </div>
              <div class="pill-line" style="margin-top:8px;">
                <span class="pill" style="background:#fff; font-family:ui-monospace,monospace;">等级: ${esc(card.level.join(" / "))}</span>
                <span class="pill" style="background:#fff; color:var(--accent); border-color:var(--accent); font-weight:800;">${isZh ? `置信度: ${card.confidence === "high" ? "高" : card.confidence === "medium" ? "中" : "低"}` : `${esc(card.confidence).toUpperCase()} CONFIDENCE`}</span>
                ${card.agent_clients.map((client) => `<span class="pill" style="background:#fff; font-family:ui-monospace,monospace;">${esc(client)}</span>`).join("")}
              </div>
              <p style="margin-top:12px; line-height:1.6; font-size:13.5px; color:var(--muted); font-weight:600;">${esc(card.summary)}</p>

              <p style="font-size:12.5px; margin-top:16px; font-family:ui-monospace,monospace; background:rgba(0,0,0,0.02); border:1px dashed rgba(0,0,0,0.1); padding:8px 12px; border-radius:6px;">
                <b style="color:var(--accent); font-family:ui-sans-serif,sans-serif;">${esc(copy.refs)}:</b> <span style="color:var(--muted); font-weight:700;">$ cat trace.log | grep "${esc(card.refs.map(formatPublicRef).join(" | "))}"</span>
              </p>
            </article>
          </div>`).join("\n")}
        </div>
      </section>
    </div>

    <!-- TAB CONTENT 3: LEDGER -->
    <div class="tab-content" id="content-ledger">
      <section class="dossier-section" style="margin-top:0;">
        <div class="section-head">
          <div><div class="kicker">04 / ${esc(copy.sections.ledger)}</div><h2>${esc(copy.sections.ledger)}</h2></div>
          <p>${esc(copy.ledgerIntro)}</p>
        </div>
        <div class="ledger-list">
          ${clients.map((client) => {
            const isMeasured = client.status === "measured";
            const clientDisplayUsage = client.display_usage || {};
            const clientDisplayTokens = clientDisplayUsage.token_usage?.total_tokens || client.token_usage?.total_tokens || 0;
            const clientHasAccountUsage = clientDisplayUsage.source === "codex_account_usage";
            const sessionText = Number.isFinite(client.sessions)
              ? `<span style="font-family:ui-monospace,monospace; font-size:14px; color:var(--ink);">${formatNumber(client.sessions, profile.report.locale)}</span> ${copy.sessions}`
              : copy.pending;
            const traceText = client.trace_window
              ? ` · <span style="font-family:ui-monospace,monospace; font-size:12.5px; color:var(--muted);">${client.trace_window.start} -> ${client.trace_window.end}</span>`
              : "";
            const evidenceText = Number.isFinite(client.evidence_count)
              ? `<span style="color:var(--accent); font-size:13px;">${formatNumber(client.evidence_count, profile.report.locale)}</span> ${copy.evidenceCount}`
              : "";
            const tokenText = clientDisplayTokens
              ? ` · <span style="color:var(--gold); font-size:13px;">${formatCompactNumber(clientDisplayTokens, profile.report.locale)}</span> ${clientHasAccountUsage ? copy.accountOverview : copy.tokenActivity}`
              : "";
            return `<article class="ledger-row" style="border-left: 5px solid ${isMeasured ? "var(--accent)" : "var(--field)"};">
              <div>
                <div class="name" style="font-family:ui-monospace,monospace; letter-spacing:-0.5px; display:flex; align-items:center; gap:8px;">
                  ${esc(client.client_id)}
                </div>
                <div class="meta" style="display:flex; align-items:center; gap:6px; font-weight:800; font-size:11.5px; color:${isMeasured ? "var(--accent)" : "var(--muted)"};">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${isMeasured ? "var(--accent)" : "#cbd4cc"}; border:1px solid var(--line);"></span>
                  ${isMeasured ? (isZh ? "已在线适配 / ACTIVE" : "ACTIVE") : (isZh ? "未挂载 / OFFLINE" : "OFFLINE")}
                </div>
              </div>
              <div class="meta" style="font-weight:700;">
                ${sessionText}${traceText}
              </div>
              <div class="small" style="font-family:ui-monospace,monospace; font-weight:800; text-align:right;">${evidenceText}${tokenText}</div>
            </article>`;
          }).join("\n")}
        </div>
      </section>
    </div>

    <!-- TAB CONTENT 4: REDACTION -->
    <div class="tab-content" id="content-redaction">
      <section class="dossier-section" style="margin-top:0;">
        <div class="section-head">
          <div><div class="kicker">05 / ${esc(copy.sections.redaction)}</div><h2>数据隔离与合规红线</h2></div>
          <p>${esc(copy.redactionIntro)}</p>
        </div>

        <div class="boundary-grid" style="margin-bottom:24px;">
          <article class="boundary-panel" style="border-top: 4px solid var(--stamp); background:linear-gradient(180deg, #ffffff, #fffbfb);">
            <div class="name" style="color:var(--stamp); font-size:16px; display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">🛑</span> ${esc(copy.excluded)}
            </div>
            <ul class="clean" style="margin-top:14px;">${profile.privacy_boundary.excluded_from_public_artifacts.map((item) => `<li style="color:var(--muted); font-weight:600;"><span style="font-family:ui-monospace,monospace; font-weight:800; color:var(--stamp);">$ redacted:</span> ${esc(item)}</li>`).join("\n")}</ul>
          </article>
          <article class="boundary-panel" style="border-top: 4px solid var(--accent); background:linear-gradient(180deg, #ffffff, #fafdfa);">
            <div class="name" style="color:var(--accent); font-size:16px; display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">🛡️</span> ${esc(copy.artifacts)}
            </div>
            <ul class="clean" style="margin-top:14px;">${profile.privacy_boundary.public_artifacts.map((item) => `<li style="color:var(--muted); font-weight:600;"><span style="font-family:ui-monospace,monospace; font-weight:800; color:var(--accent);">$ write:</span> ${esc(item)}</li>`).join("\n")}</ul>
            <p style="margin-top:18px; font-size:12.5px; border-top:1.5px dashed rgba(0,0,0,0.08); padding-top:12px; color:var(--muted);"><b>${esc(copy.confidence)}:</b> <span style="font-family:ui-monospace,monospace; font-weight:800; color:var(--accent);">${esc(profile.work_identity.confidence).toUpperCase()}</span> · <b>${esc(copy.evidenceIds)}:</b> <span style="font-family:ui-monospace,monospace; color:var(--muted); font-size:11.5px;">${esc(profile.work_identity.evidence_ids.join(", "))}</span></p>
          </article>
        </div>

        <div class="note-list">
          ${profile.calibration_notes.map((note) => {
            const isHigh = note.severity === "high";
            const isMed = note.severity === "medium";
            const stripeColor = isHigh ? "var(--stamp)" : isMed ? "var(--gold)" : "var(--accent)";
            const stripeHtml = isHigh || isMed
              ? `
              <div style="position:absolute; left:0; top:0; bottom:0; width:4px; background:repeating-linear-gradient(45deg, ${stripeColor}, ${stripeColor} 4px, #000 4px, #000 8px); opacity:0.15;"></div>`
              : "";
            return `<article class="note-file" style="border-left: 6px solid ${stripeColor}; position:relative; overflow:hidden;">${stripeHtml}
              <div class="case-title" style="padding-left:${isHigh || isMed ? "6px" : "0"};">
                <b style="font-family:ui-monospace,monospace; font-size:14px; letter-spacing:0.5px; color:var(--ink);">${esc(note.type).toUpperCase()}</b>
                <span class="pill" style="background:${isHigh ? "#fff5f4" : isMed ? "#fffdf0" : "#f4faf7"}; color:${stripeColor}; border-color:currentColor; font-size:11px; padding:2px 8px; font-weight:800;">${esc(note.severity).toUpperCase()}</span>
              </div>
              <p style="padding-left:${isHigh || isMed ? "6px" : "0"}; margin-top:8px; line-height:1.55; color:var(--muted); font-size:13.5px; font-weight:600;">${esc(note.summary)}</p>
            </article>`;
          }).join("\n")}
        </div>
      </section>
    </div>
  </main>
</body>
</html>`;
}

export function renderAgentContextJson(profile) {
  const topRoles = profile.work_role_signals.slice(0, 5);
  const topAbilities = profile.ability_model.slice(0, 6);
  return {
    schema_version: "agentrecord.agent_context.v0",
    generated_at: profile.generated_at,
    owner: {
      id: profile.owner.id,
      display_name: profile.owner.display_name
    },
    locale: profile.report.locale,
    work_identity: {
      label: profile.work_identity.primary_label,
      summary: profile.work_identity.summary,
      strongest_claim: profile.work_identity.strongest_claim,
      confidence: profile.work_identity.confidence,
      evidence_ids: profile.work_identity.evidence_ids
    },
    collaboration_style: [
      "Prefers evidence-bound execution with clear scope, explicit assumptions, and concrete validation.",
      "Values direct status reporting, reviewable diffs, and preserving unrelated user work.",
      "Works well with agents that separate product claims, implementation evidence, and residual risk."
    ],
    verification_preferences: [
      "Run the narrowest meaningful command first, then expand validation when shared behavior or release readiness is affected.",
      "Report command outcomes plainly, including skipped or unavailable checks.",
      "Treat green tests as necessary but not sufficient when privacy, packaging, or public artifacts are in scope."
    ],
    scope_control: [
      "Keep default outputs local-first and self/share oriented.",
      "Do not introduce employment-decision, leaderboard, or unsupported seniority conclusions into default artifacts.",
      "Keep private state under the profile-local private state directory and public artifacts redacted."
    ],
    risk_boundaries: profile.privacy_boundary.excluded_from_public_artifacts,
    handoff_preferences: [
      "Lead with verdict, changed files, validation evidence, privacy risk, and residual risk.",
      "Use evidence IDs when referencing strong claims.",
      "Make blockers concrete instead of guessing."
    ],
    role_signals: topRoles.map((role) => ({
      role_id: role.role_id,
      label: role.label,
      band: role.band,
      confidence: role.confidence,
      evidence_mix: formatEvidenceMix(role.evidence_level_mix),
      evidence_ids: role.evidence_ids,
      missing_evidence: role.missing_evidence
    })),
    ability_model: topAbilities.map((ability) => ({
      dimension_id: ability.dimension_id,
      label: ability.label,
      band: ability.band,
      confidence: ability.confidence,
      evidence_mix: formatEvidenceMix(ability.evidence_level_mix),
      evidence_ids: ability.evidence_ids,
      missing_evidence: ability.missing_evidence
    })),
    evidence_summary: profile.evidence_notes.map((card) => ({
      evidence_id: card.evidence_id,
      level: card.level,
      title: card.title,
      summary: card.summary,
      confidence: card.confidence,
      agent_clients: card.agent_clients,
      dimensions: card.dimensions,
      role_signals: card.role_signals
    })),
    calibration_notes: profile.calibration_notes,
    privacy_boundary: {
      local_only_generation: profile.privacy_boundary.local_only_generation,
      raw_logs_included: profile.privacy_boundary.raw_logs_included,
      public_session_ids_included: profile.privacy_boundary.public_session_ids_included,
      public_project_paths_included: profile.privacy_boundary.public_project_paths_included
    }
  };
}

export function renderAgentContextMarkdown(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  const context = renderAgentContextJson(profile);
  return `# AgentRecord Agent Context Pack

Generated: ${profile.generated_at}
Owner: ${profile.owner.display_name}
Locale: ${profile.report.locale}

This context pack is a compact, public-safe summary for future agents. It does not include raw traces, private project details, raw session IDs, terminal output, source bodies, or secret-like values.

## Work Identity

${profile.work_identity.primary_label}

${profile.work_identity.summary}

Strongest evidence-backed claim: ${profile.work_identity.strongest_claim}

Confidence: ${profile.work_identity.confidence}

Evidence IDs: ${profile.work_identity.evidence_ids.join(", ") || "none"}

## Collaboration Style

${context.collaboration_style.map((item) => `- ${item}`).join("\n")}

## Verification Preferences

${context.verification_preferences.map((item) => `- ${item}`).join("\n")}

## Scope Control

${context.scope_control.map((item) => `- ${item}`).join("\n")}

## Handoff Preferences

${context.handoff_preferences.map((item) => `- ${item}`).join("\n")}

## ${t("role_signals")}

${context.role_signals.map((role) => `- ${role.label}: ${role.band}, ${role.confidence}. Evidence mix: ${role.evidence_mix}. Evidence: ${role.evidence_ids.join(", ") || "none"}`).join("\n")}

## ${t("ability_model")}

${context.ability_model.map((ability) => `- ${ability.label}: ${ability.band}, ${ability.confidence}. Evidence mix: ${ability.evidence_mix}. Evidence: ${ability.evidence_ids.join(", ") || "none"}`).join("\n")}

## Evidence Summary

${context.evidence_summary.map((card) => `- ${card.evidence_id}: ${card.title}. ${card.level.join(" / ")} · ${card.confidence}. ${card.summary}`).join("\n")}

## ${t("calibration")}

${profile.calibration_notes.map((note) => `- ${note.severity}: ${note.summary}`).join("\n")}

## ${t("privacy_boundary")}

${t("public_safe")}
`;
}

export function renderRedactionReport(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  return `# Redaction Report

Generated: ${profile.generated_at}
Owner: ${profile.owner.display_name}

## Included

- Aggregate Codex session counts.
- Aggregate token activity.
- Codex account-level token usage when available through the local Codex CLI app-server.
- Redacted project references.
- Public evidence IDs and public-safe summaries.
- Evidence refs at summary level.

## Excluded

${profile.privacy_boundary.excluded_from_public_artifacts.map((item) => `- ${item}`).join("\n")}

## Boundary

${t("public_safe")}

${t("not_hiring")}
`;
}

export function renderRunReport(profile, localeBundle) {
  const t = (key) => localeBundle.ui?.[key] || key;
  const run = profile.run_metadata;
  const codex = profile.agent_ledger.clients.find((client) => client.client_id === "codex") || {};
  const accountUsage = codex.account_usage || {};
  const deltaStatus = run.changed_sessions_this_run === 0
    ? "no significant delta"
    : run.new_sessions_this_run > 0
      ? "new local sessions detected"
      : "existing local sessions updated; this can happen when an active session continues accumulating token metadata";
  return `# AgentRecord Run Report

Generated: ${profile.generated_at}

## ${t("run_metadata")}

- Mode: ${run.mode}
- Run count: ${run.run_count}
- Previous generated at: ${run.previous_generated_at || "none"}
- Reset requested: ${run.reset ? "yes" : "no"}
- New sessions this run: ${run.new_sessions_this_run}
- Updated sessions this run: ${run.updated_sessions_this_run}
- Changed sessions this run: ${run.changed_sessions_this_run}
- Delta status: ${deltaStatus}
- Token delta this run: ${run.token_delta_this_run.total_tokens}
- Total sessions seen: ${run.total_sessions_seen}
- Total token-accounted sessions seen: ${run.total_token_sessions_seen}
- Codex account usage: ${accountUsage.status || "unavailable"}${accountUsage.status_reason ? ` (${accountUsage.status_reason})` : ""}
- Public session IDs included: ${run.public_session_ids_included ? "yes" : "no"}
- Private state present: ${run.private_state_present ? "yes" : "no"}

## Privacy

Public artifacts do not include raw session IDs or raw local trace paths.
`;
}

function formatPublicRef(ref) {
  if (ref.type === "memory") return `${ref.source}:${ref.start_line}-${ref.end_line}`;
  return ref.source || ref.type || "ref";
}
