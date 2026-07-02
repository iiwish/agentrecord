const AXIS_CODES = {
  focus: { systems: "S", product: "P" },
  execution: { reviewer: "R", operator: "O" },
  quality: { verification: "V", delivery: "D" },
  scope: { context: "C", goal: "G" }
};

const THEMES = {
  proof_seal: {
    id: "proof_seal",
    label: "Proof seal",
    motif: "proof-seal",
    accent: "#145f54",
    accentSoft: "#e4f3ef",
    field: "#dfece6",
    page: "#f2f5ef",
    gold: "#b8872d",
    stripGradient: "linear-gradient(180deg, #173f39 0%, #145f54 38%, #b8872d 72%, #121816 100%)",
    chipGradient: "linear-gradient(135deg, #f2cf64 0%, #b8872d 100%)",
    bannerPattern: "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 6px, transparent 6px 14px)"
  },
  dossier: {
    id: "dossier",
    label: "Dossier",
    motif: "dossier",
    accent: "#384b68",
    accentSoft: "#e7ecf3",
    field: "#dfe6ee",
    page: "#f2f4f6",
    gold: "#aa8734",
    stripGradient: "linear-gradient(180deg, #1f2a3b 0%, #384b68 42%, #87955f 74%, #11141d 100%)",
    chipGradient: "linear-gradient(135deg, #d7e0ee 0%, #65748e 100%)",
    bannerPattern: "linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)"
  },
  terminal: {
    id: "terminal",
    label: "Terminal ledger",
    motif: "terminal",
    accent: "#285f77",
    accentSoft: "#e4f0f4",
    field: "#dceaf0",
    page: "#eff5f6",
    gold: "#b57e34",
    stripGradient: "linear-gradient(180deg, #173949 0%, #285f77 38%, #1aa092 72%, #0e1518 100%)",
    chipGradient: "linear-gradient(135deg, #86cfe0 0%, #285f77 100%)",
    bannerPattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 10px)"
  },
  release_stamp: {
    id: "release_stamp",
    label: "Release stamp",
    motif: "release-stamp",
    accent: "#7a3328",
    accentSoft: "#fae7df",
    field: "#f0dfcf",
    page: "#f6f0ea",
    gold: "#c39731",
    stripGradient: "linear-gradient(180deg, #7a3328 0%, #b84d31 34%, #c39731 70%, #21120f 100%)",
    chipGradient: "linear-gradient(135deg, #ffd675 0%, #b56b22 100%)",
    bannerPattern: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.10) 0 5px, transparent 5px 12px)"
  },
  product_lens: {
    id: "product_lens",
    label: "Product lens",
    motif: "product-lens",
    accent: "#8a3f68",
    accentSoft: "#f5e5ee",
    field: "#f1dce8",
    page: "#f7f1f4",
    gold: "#b99028",
    stripGradient: "linear-gradient(180deg, #803a62 0%, #b74d78 38%, #2f8f83 72%, #171017 100%)",
    chipGradient: "linear-gradient(135deg, #f5a7c9 0%, #8a3f68 100%)",
    bannerPattern: "linear-gradient(135deg, rgba(255,255,255,0.10) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.10) 75%, transparent 75%)"
  },
  context_map: {
    id: "context_map",
    label: "Context map",
    motif: "context-map",
    accent: "#396457",
    accentSoft: "#e4f0ec",
    field: "#dce9e4",
    page: "#eff4f2",
    gold: "#bc8c2c",
    stripGradient: "linear-gradient(180deg, #203b36 0%, #396457 36%, #bc8c2c 70%, #111817 100%)",
    chipGradient: "linear-gradient(135deg, #9ed1c4 0%, #396457 100%)",
    bannerPattern: "radial-gradient(circle at 8px 8px, rgba(255,255,255,0.16) 1.5px, transparent 2px)"
  },
  goal_compass: {
    id: "goal_compass",
    label: "Goal compass",
    motif: "goal-compass",
    accent: "#64622f",
    accentSoft: "#eef0df",
    field: "#e8e8cf",
    page: "#f4f5ec",
    gold: "#af8335",
    stripGradient: "linear-gradient(180deg, #39371f 0%, #64622f 38%, #9a7635 70%, #15160c 100%)",
    chipGradient: "linear-gradient(135deg, #dbdca2 0%, #78783b 100%)",
    bannerPattern: "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 3px, transparent 3px 12px)"
  },
  route_map: {
    id: "route_map",
    label: "Route map",
    motif: "route-map",
    accent: "#6c466f",
    accentSoft: "#f0e6f1",
    field: "#eadceb",
    page: "#f5f0f6",
    gold: "#a98437",
    stripGradient: "linear-gradient(180deg, #412943 0%, #6c466f 36%, #3f8979 70%, #151018 100%)",
    chipGradient: "linear-gradient(135deg, #c9a6d2 0%, #6c466f 100%)",
    bannerPattern: "repeating-linear-gradient(135deg, rgba(255,255,255,0.09) 0 4px, transparent 4px 14px)"
  }
};

const BASE_ARCHETYPES = {
  SRVC: {
    code: "SRVC",
    theme_id: "proof_seal",
    copy_zh: {
      name: "代码判官",
      english_short_name: "Systems Proof Reviewer",
      punchline: "口说无凭，把你和 AI 协作的证据链呈上来。",
      tags: ["#代码洁癖", "#证据链闭环", "#零信任玩家"],
      share_subtitle: "把 AI 写的每行代码都当成呈堂证供，绝不放过任何一个未核验的疑点。",
      strength_sentence: "强项是把 role signal、能力维度和证据等级放在同一张图里校准。",
      risk_sentence: "本地验证无懈可击，但要是缺了真实世界反馈，完美闭环也只是一场高墙内的赛博自嗨。"
    },
    copy_en: {
      name: "Systems Proof Reviewer",
      english_short_name: "SPR",
      punchline: "Boundaries first, claims second, evidence always.",
      tags: ["#system-boundary", "#proof-review", "#context-map"],
      share_subtitle: "Turns complex system work into a reviewable proof line.",
      strength_sentence: "Strongest at aligning role signals, ability dimensions, and evidence levels.",
      risk_sentence: "Local proof should not be mistaken for external outcome evidence."
    }
  },
  SRVG: {
    code: "SRVG",
    theme_id: "goal_compass",
    copy_zh: {
      name: "赛博刹车手",
      english_short_name: "Systems Goal Reviewer",
      punchline: "在想清楚怎么死之前，先别急着让 Agent 裸奔。",
      tags: ["#防幻觉先锋", "#无情刹车片", "#冷酷校准器"],
      share_subtitle: "在狂热的 Agent 堆砌中保持绝对冷静，用最硬的测试底线卡死大模型的幻觉。",
      strength_sentence: "强项是把目标、失败条件和验证口径写清楚再进入执行。",
      risk_sentence: "刹车踩得太满容易追尾。过度校准风险，小心被隔壁‘跑起来再说’的草台班子在交付速度上无情超车。"
    },
    copy_en: {
      name: "Systems Goal Reviewer",
      english_short_name: "SGR",
      punchline: "No agent run before the goal is testable.",
      tags: ["#goal-calibration", "#systems", "#verification"],
      share_subtitle: "Converts large goals into testable system decisions.",
      strength_sentence: "Strongest at defining goals, failure conditions, and validation language.",
      risk_sentence: "May spend more time calibrating goals than moving directly to delivery."
    }
  },
  SOVC: {
    code: "SOVC",
    theme_id: "terminal",
    copy_zh: {
      name: "大模型驯兽师",
      english_short_name: "Systems Verification Operator",
      punchline: "只要上下文打包给得足，Agent 别想在我面前装傻。",
      tags: ["#大模型克星", "#上下文重度依赖", "#Token燃烧艺术家"],
      share_subtitle: "用严丝合缝的上下文和高频调度，把狂野的大模型驯化成最听话的流水线小弟。",
      strength_sentence: "强项是把会话密度、上下文包和验证节点连接成稳定工作流。",
      risk_sentence: "Token 烧得比香火还旺，但小心陷入‘疯狂对话却没写出半个可用功能’的赛博内卷。"
    },
    copy_en: {
      name: "Systems Verification Operator",
      english_short_name: "SVO",
      punchline: "Package context, then verify agents back on track.",
      tags: ["#agent-routing", "#context-pack", "#proof-loop"],
      share_subtitle: "Keeps multi-turn agent work aligned with context and checks.",
      strength_sentence: "Strongest at connecting activity, context, and validation checkpoints.",
      risk_sentence: "High activity is collaboration density, not automatic quality proof."
    }
  },
  SOVG: {
    code: "SOVG",
    theme_id: "route_map",
    copy_zh: {
      name: "赛博领航员",
      english_short_name: "Systems Goal Operator",
      punchline: "我不替 Agent 搬砖，我只给它们指明进军路线。",
      tags: ["#高阶指挥官", "#路线拆解大师", "#Agent舵手"],
      share_subtitle: "擅长规划严密的任务路径与依赖图谱，让 Agent 大军指哪打哪，无痛执行。",
      strength_sentence: "强项为复杂任务建立目标顺序、依赖关系和执行节奏。",
      risk_sentence: "在错误的道路上踩油门，跑得越快死得越惨。别因为路线图画得太完美，就漏掉了人工复核。"
    },
    copy_en: {
      name: "Systems Goal Operator",
      english_short_name: "SGO",
      punchline: "Agents get routes, not wishes.",
      tags: ["#route-plan", "#agent-run", "#goal-split"],
      share_subtitle: "Turns system goals into routes agents can keep following.",
      strength_sentence: "Strongest at ordering goals, dependencies, and execution rhythm.",
      risk_sentence: "Without review checkpoints, a clear route can still amplify the wrong direction."
    }
  },
  SRDC: {
    code: "SRDC",
    theme_id: "dossier",
    copy_zh: {
      name: "交付质检大师",
      english_short_name: "Systems Delivery Reviewer",
      punchline: "能上线是基本功，能说清楚为什么可以上线才是真底气。",
      tags: ["#没有Bug能活", "#交付终极把关人", "#安全防线"],
      share_subtitle: "将系统交付、上下文边界和可追溯证据熔炼为一份教科书式的可审计档案。",
      strength_sentence: "强项是在交付前后保留判断依据和可复跑证据。",
      risk_sentence: "交付文档和审计痕迹堪称艺术品，但仍需提防‘说明书写得极其完美，产品本身却没人想用’的尴尬。"
    },
    copy_en: {
      name: "Systems Delivery Reviewer",
      english_short_name: "SDR",
      punchline: "Shipping counts when the proof survives review.",
      tags: ["#delivery-audit", "#context-proof", "#system-close"],
      share_subtitle: "Combines system delivery, evidence, and context boundaries.",
      strength_sentence: "Strongest at preserving rationale and rerunnable proof around delivery.",
      risk_sentence: "External user value still needs evidence beyond local delivery proof."
    }
  },
  SRDG: {
    code: "SRDG",
    theme_id: "release_stamp",
    copy_zh: {
      name: "标尺守望者",
      english_short_name: "Systems Delivery Calibrator",
      punchline: "你管这叫 Done？对不起，回去重新跑。",
      tags: ["#交付铁律", "#无情验收机", "#完美主义判官"],
      share_subtitle: "用最冰冷的目标标尺，无情戳破大模型在任务列表里编造的‘已完成’自嗨。",
      strength_sentence: "强项是让执行完成、验收条件和风险说明保持一致。",
      risk_sentence: "本地编译和单元测试全绿，不代表能经受真实世界的大风大浪，别让你的‘Done’只停留在本地沙盒里。"
    },
    copy_en: {
      name: "Systems Delivery Calibrator",
      english_short_name: "SDC",
      punchline: "Delivery is calibrated against the goal, not the feeling of done.",
      tags: ["#delivery-fit", "#goal-boundary", "#acceptance"],
      share_subtitle: "Keeps system delivery tied to acceptance goals.",
      strength_sentence: "Strongest at aligning completed work, acceptance criteria, and risk notes.",
      risk_sentence: "Without release or user feedback, delivery evidence remains local."
    }
  },
  SODC: {
    code: "SODC",
    theme_id: "terminal",
    copy_zh: {
      name: "流水线厂长",
      english_short_name: "Systems Delivery Operator",
      punchline: "别跟我扯什么宏大情怀，到点必须按时出货。",
      tags: ["#无情出货机器", "#流水线调度狂", "#极客催单员"],
      share_subtitle: "高频且极度稳定地将多会话、多模块的杂乱痕迹揉进标准的发布节拍。",
      strength_sentence: "强项是把上下文交接、命令结果和输出目录边界串起来。",
      risk_sentence: "地扫得再干净，饭难吃还是没客来。本地代码格式再优雅、流水线再顺，也替代不了对产品本身真实价值的判断。"
    },
    copy_en: {
      name: "Systems Delivery Operator",
      english_short_name: "SDO",
      punchline: "Agents advance by context and close by delivery proof.",
      tags: ["#run-control", "#handoff", "#shipping-hygiene"],
      share_subtitle: "Compresses multi-session work into a stable delivery rhythm.",
      strength_sentence: "Strongest at linking handoff context, command results, and output boundaries.",
      risk_sentence: "Shipping hygiene does not replace product judgment when external acceptance is thin."
    }
  },
  SODG: {
    code: "SODG",
    theme_id: "route_map",
    copy_zh: {
      name: "赛博包工头",
      english_short_name: "Systems Delivery Navigator",
      punchline: "大方向我已经画好，剩下的交给 Agent 砖窑满负荷开工。",
      tags: ["#一人顶一队", "#赛博包工头", "#流水线总装工"],
      share_subtitle: "精准锁定大任务的交付节点与依赖关系，把大目标层层剥离，强力推进到底。",
      strength_sentence: "强项是让大任务在多轮 Agent 执行中不丢方向。",
      risk_sentence: "任务排期和依赖链条画得天衣无缝，但小心落入‘PPT式交付’的自嗨，真正的包工头还是要到工地看看砖搬得对不对。"
    },
    copy_en: {
      name: "Systems Delivery Navigator",
      english_short_name: "SDN",
      punchline: "Once the goal is set, the delivery route stays visible.",
      tags: ["#goal-route", "#system-shipping", "#agent-nav"],
      share_subtitle: "Makes goals, dependencies, and delivery nodes inspectable.",
      strength_sentence: "Strongest at keeping large tasks oriented across agent runs.",
      risk_sentence: "Strong route evidence still needs real outcome and user-side proof."
    }
  },
  PRVC: {
    code: "PRVC",
    theme_id: "product_lens",
    copy_zh: {
      name: "像素级找茬家",
      english_short_name: "Product Proof Reviewer",
      punchline: "用户能看到的东西，连一像素的调整都必须有证据支撑。",
      tags: ["#像素级细节控", "#体验至上主义", "#证据截图狂"],
      share_subtitle: "极度执着于用户能感知的体验细节，并用无可置疑的截图和运行日志将它们统统铁证化。",
      strength_sentence: "强项是把可见体验、能力信号和证据等级一起审查。",
      risk_sentence: "本地截图和视觉微调近乎完美，但小心陷入‘自嗨型完美主义’，别忘了真实用户的吐槽才是最硬核的验收标准。"
    },
    copy_en: {
      name: "Product Proof Reviewer",
      english_short_name: "PPR",
      punchline: "Visible product decisions still need proof.",
      tags: ["#product-judgment", "#ux-review", "#evidence-shot"],
      share_subtitle: "Grounds product experience judgment in evidence and checks.",
      strength_sentence: "Strongest at reviewing visible experience, ability signals, and evidence levels together.",
      risk_sentence: "Product judgment needs user outcome evidence beyond local screenshots."
    }
  },
  PRVG: {
    code: "PRVG",
    theme_id: "goal_compass",
    copy_zh: {
      name: "用户意图侦探",
      english_short_name: "Product Goal Reviewer",
      punchline: "先搞清楚用户到底为什么想点这个按钮，再让 AI 敲第一行代码。",
      tags: ["#痛点狙击手", "#体验复盘大师", "#需求终极解构"],
      share_subtitle: "在 AI 盲目输出之前，先把用户真实的痛点、场景和心智模型拆解得一清二楚。",
      strength_sentence: "强项是把需求愿望改写为可被检查的用户目标。",
      risk_sentence: "心智推导逻辑严密，但在拿到真实业务漏斗前，小心掉进‘自己假设的用户痛点’里，那只是闭门造车。"
    },
    copy_en: {
      name: "Product Goal Reviewer",
      english_short_name: "PGR",
      punchline: "Ask why users click before agents code.",
      tags: ["#user-goal", "#product-review", "#validation"],
      share_subtitle: "Aligns product goals, experience assumptions, and validation.",
      strength_sentence: "Strongest at translating wishes into testable user goals.",
      risk_sentence: "Without funnel or user feedback evidence, conclusions should stay conservative."
    }
  },
  POVC: {
    code: "POVC",
    theme_id: "context_map",
    copy_zh: {
      name: "赛博制片人",
      english_short_name: "Product Context Operator",
      punchline: "给 Agent 搭好最顺滑的戏台，剩下的让它自己本色出演。",
      tags: ["#场景好导演", "#产品意图打包者", "#顺滑协作大师"],
      share_subtitle: "绝不只给大模型丢冷冰冰的代码路径，而是将用户真实的场景和产品意图打包塞进它的脑子里。",
      strength_sentence: "强项是把产品意图、上下文和验证项放进同一轮协作。",
      risk_sentence: "戏台搭得四平八稳，剧本也塞得极满，但如果需求本身是伪需求，台本写得再好也是空忙活。"
    },
    copy_en: {
      name: "Product Context Operator",
      english_short_name: "PCO",
      punchline: "Agents need user context, not just file paths.",
      tags: ["#product-context", "#agent-routing", "#experience-check"],
      share_subtitle: "Packages user scenarios into executable and verifiable context.",
      strength_sentence: "Strongest at carrying product intent, context, and checks through one collaboration loop.",
      risk_sentence: "Complete context does not prove the requirement is right."
    }
  },
  POVG: {
    code: "POVG",
    theme_id: "product_lens",
    copy_zh: {
      name: "草台班子总导演",
      english_short_name: "Product Goal Operator",
      punchline: "不管过程多草台，能跑通并解决用户痛点的产品就是神作。",
      tags: ["#草台美学信徒", "#野生创始人", "#MVP狂魔"],
      share_subtitle: "深谙草台美学，擅长在混乱的依赖中迅速剔除杂音，以极限速度交付能跑的 MVP。",
      strength_sentence: "强项是让产品方向在多轮 Agent 执行中保持可见。",
      risk_sentence: "‘能跑通’不等于‘能跑得稳’。追求速度的同时，小心地基太虚，给后续埋下一地不知何时爆炸的暗雷。"
    },
    copy_en: {
      name: "Product Goal Operator",
      english_short_name: "PGO",
      punchline: "Product goals become agent-sized steps.",
      tags: ["#goal-split", "#product-run", "#collab-rhythm"],
      share_subtitle: "Breaks user goals into small steps agents can keep advancing.",
      strength_sentence: "Strongest at keeping product direction visible across agent work.",
      risk_sentence: "Execution speed must be read alongside validation quality."
    }
  },
  PRDC: {
    code: "PRDC",
    theme_id: "dossier",
    copy_zh: {
      name: "买家秀鉴定师",
      english_short_name: "Product Delivery Reviewer",
      punchline: "别光顾着说‘已上线’，用户真正爽到了才算交付成功。",
      tags: ["#真实体验控", "#拒绝画饼", "#交互质量把关人"],
      share_subtitle: "铁面无私地严防死守大模型的‘自嗨型交付’，一切没有落实到真实交互质量的产出都不能通关。",
      strength_sentence: "强项是用证据复核交付是否真的服务产品目标。",
      risk_sentence: "对‘买家秀’的挑剔几近苛刻，但在拿到真实留存和使用数据前，你以为的‘用户爽点’可能只是自欺欺人的幻想。"
    },
    copy_en: {
      name: "Product Delivery Reviewer",
      english_short_name: "PDR",
      punchline: "Shipping is not enough; what users see must be clear.",
      tags: ["#product-shipping", "#experience-proof", "#review-loop"],
      share_subtitle: "Places product delivery, experience evidence, and risk on one page.",
      strength_sentence: "Strongest at reviewing whether delivery actually serves the product goal.",
      risk_sentence: "Without usage data, this is delivery evidence rather than market evidence."
    }
  },
  PRDG: {
    code: "PRDG",
    theme_id: "release_stamp",
    copy_zh: {
      name: "伪需求终结者",
      english_short_name: "Product Delivery Calibrator",
      punchline: "干掉所有自嗨的伪需求，把完成度锁死在最真实的用户价值上。",
      tags: ["#伪需求天敌", "#核心价值对齐", "#硬核验收机器"],
      share_subtitle: "用最硬核的用户目标死磕交付范围，任何偏离核心体验的无用功，在它这里统统零分。",
      strength_sentence: "强项是用产品目标约束交付范围和验收口径。",
      risk_sentence: "粉碎伪需求的刀法很准，但千万别把‘自己的直觉’当成‘用户的呼声’。没有数据佐证，刀法再好也是盲打。"
    },
    copy_en: {
      name: "Product Delivery Calibrator",
      english_short_name: "PDC",
      punchline: "Done is defined by the user goal, not the task list.",
      tags: ["#user-acceptance", "#delivery-fit", "#product-loop"],
      share_subtitle: "Aligns delivered output, user goals, and acceptance proof.",
      strength_sentence: "Strongest at using product goals to constrain scope and acceptance.",
      risk_sentence: "Without user-side feedback, calibration remains local evidence."
    }
  },
  PODC: {
    code: "PODC",
    theme_id: "context_map",
    copy_zh: {
      name: "快手造物主",
      english_short_name: "Product Delivery Operator",
      punchline: "从一个闪现的创意到硬核落地，距离只有一轮 Prompt。",
      tags: ["#造物游戏痴迷者", "#MVP急速雕刻", "#动作派创客"],
      share_subtitle: "享受那种把脑中灵感无情推进到具体产品的造物快感，并顺手留存下每一次高频互动的铁证。",
      strength_sentence: "强项是让多轮 Agent 产品工作保持可追溯和可复查。",
      risk_sentence: "一句话起高楼固然爽快，但‘原型造得快’不代表‘用户留得下’。别让你的高频造物沦为一次性的赛博垃圾。"
    },
    copy_en: {
      name: "Product Delivery Operator",
      english_short_name: "PDO",
      punchline: "Advance the product while preserving context and proof.",
      tags: ["#product-run", "#handoff", "#delivery-record"],
      share_subtitle: "Connects product prototyping, handoff context, and output evidence.",
      strength_sentence: "Strongest at keeping multi-run product work traceable and reviewable.",
      risk_sentence: "Prototype delivery does not automatically prove user value."
    }
  },
  PODG: {
    code: "PODG",
    theme_id: "route_map",
    copy_zh: {
      name: "全栈独行侠",
      english_short_name: "Product Delivery Navigator",
      punchline: "用最野的路子，交最硬的产品。",
      tags: ["#全栈孤勇者", "#硬核出货人", "#野生全栈创客"],
      share_subtitle: "身怀独立开发者的硬核灵魂，一个人就是一支军队，把繁杂的交互路径和产品目标一手拉到终点线。",
      strength_sentence: "强项是保持产品目标、执行路线和交付状态同步。",
      risk_sentence: "走完最野的路、交出最硬的产品确实硬核，但如果在一开始产品方向就偏了，全军覆没的也只有你一个人。"
    },
    copy_en: {
      name: "Product Delivery Navigator",
      english_short_name: "PDN",
      punchline: "Start from user goals and pull agent work to the finish line.",
      tags: ["#goal-delivery", "#product-route", "#agent-collab"],
      share_subtitle: "Splits product goals into a route and calibrates by delivery nodes.",
      strength_sentence: "Strongest at keeping product goals, route, and delivery status synchronized.",
      risk_sentence: "After the route is complete, user feedback is still required."
    }
  }
};

export const SHARE_CARD_ARCHETYPES = Object.freeze(BASE_ARCHETYPES);

export function buildShareCard({ roleSignals, abilityModel, stats, identityConfidence, evidenceCards, locale }) {
  const roleScore = scoreReader(roleSignals, "role_id");
  const abilityScore = scoreReader(abilityModel, "dimension_id");

  const axisScores = {
    systems: weightedAverage([
      roleScore("systems_thinker"),
      abilityScore("context_packaging"),
      abilityScore("scope_control")
    ]),
    product: weightedAverage([
      roleScore("product_builder"),
      abilityScore("product_judgment"),
      abilityScore("goal_framing")
    ]),
    reviewer: weightedAverage([
      roleScore("technical_reviewer"),
      abilityScore("review_judgment"),
      abilityScore("failure_recovery")
    ]),
    operator: weightedAverage([
      roleScore("agent_operator"),
      abilityScore("agent_delegation"),
      abilityScore("collaboration_handoff")
    ]),
    verification: weightedAverage([
      abilityScore("verification_discipline"),
      abilityScore("failure_recovery"),
      roleScore("technical_reviewer")
    ]),
    delivery: weightedAverage([
      roleScore("shipping_owner"),
      abilityScore("shipping_hygiene"),
      abilityScore("scope_control")
    ]),
    context: weightedAverage([
      abilityScore("context_packaging"),
      abilityScore("collaboration_handoff"),
      roleScore("collaboration_handoff")
    ]),
    goal: weightedAverage([
      abilityScore("goal_framing"),
      abilityScore("product_judgment"),
      roleScore("product_builder")
    ])
  };

  const axes = {
    focus: axisScores.systems >= axisScores.product ? "systems" : "product",
    execution: axisScores.reviewer >= axisScores.operator ? "reviewer" : "operator",
    quality: axisScores.verification >= axisScores.delivery ? "verification" : "delivery",
    scope: axisScores.context >= axisScores.goal ? "context" : "goal"
  };
  const code = `${AXIS_CODES.focus[axes.focus]}${AXIS_CODES.execution[axes.execution]}${AXIS_CODES.quality[axes.quality]}${AXIS_CODES.scope[axes.scope]}`;
  const base = BASE_ARCHETYPES[code] || BASE_ARCHETYPES.SRVC;
  const copy = locale === "zh-CN" ? base.copy_zh : base.copy_en;
  const zhCopy = base.copy_zh;
  const enCopy = base.copy_en;
  const theme = THEMES[base.theme_id] || THEMES.proof_seal;
  const variants = buildVariants({ evidenceCards, stats, identityConfidence, axisScores, locale });
  const statRows = buildStatRows({ axes, axisScores, abilityModel, locale });
  const traceDays = countTraceDays(stats.trace_window);
  const dominantRole = roleSignals[0] || null;
  const dominantAbility = abilityModel[0] || null;
  const abilityOrder = abilityOrderForAxes(axes);

  return {
    code,
    axes,
    axis_scores: axisScores,
    name: copy.name,
    chinese_name: zhCopy.name,
    english_name: enCopy.name,
    english_short_name: enCopy.english_short_name,
    enName: locale === "zh-CN" ? zhCopy.english_short_name : enCopy.english_short_name,
    punchline: copy.punchline,
    tagline: copy.punchline,
    enTagline: enCopy.punchline,
    share_subtitle: copy.share_subtitle,
    signature: copy.share_subtitle,
    strength_sentence: copy.strength_sentence,
    risk_sentence: copy.risk_sentence,
    tags: copy.tags,
    social_tags: copy.tags,
    visual_theme_id: theme.id,
    card_theme: theme,
    variants,
    variant_badges: variants.map((variant) => variant.label),
    variant_note: variants[0]?.sentence || copy.strength_sentence,
    stat_rows: statRows,
    ability_order: abilityOrder,
    traceDays,
    activeStatus: variants[0]?.label || (locale === "zh-CN" ? "证据基线" : "Evidence baseline"),
    rigor: clampPercent(axisScores.verification),
    control: clampPercent(axisScores.operator),
    strategic: clampPercent(axisScores.systems),
    closedLoop: clampPercent(axisScores.delivery),
    dominant: {
      role_id: dominantRole?.role_id || null,
      role_label: dominantRole?.label || null,
      ability_id: dominantAbility?.dimension_id || null,
      ability_label: dominantAbility?.label || null
    }
  };
}

function scoreReader(items, key) {
  return (id) => items.find((item) => item[key] === id)?.score || 40;
}

function weightedAverage(values) {
  const safeValues = values.map((value) => Number(value)).filter(Number.isFinite);
  if (!safeValues.length) return 40;
  return Math.round(safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length);
}

function clampPercent(value) {
  return Math.max(10, Math.min(100, Math.round(Number(value) || 0)));
}

function countTraceDays(traceWindow = {}) {
  const start = Date.parse(traceWindow.start);
  const end = Date.parse(traceWindow.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

function buildVariants({ evidenceCards, stats, identityConfidence, axisScores, locale }) {
  const isZh = locale === "zh-CN";
  const levels = new Set(evidenceCards.flatMap((card) => card.level || []));
  const variants = [];

  if (identityConfidence === "high" || identityConfidence === "medium") {
    variants.push({
      id: "confidence_ready",
      label: isZh ? "证据已成型" : "Evidence ready",
      sentence: isZh ? "当前分享文案来自已匹配的公开安全证据卡。" : "Share copy is backed by matched public-safe evidence cards."
    });
  }

  if (levels.has("E1") || axisScores.verification >= 68) {
    variants.push({
      id: "strong_verification",
      label: isZh ? "验证强信号" : "Verification signal",
      sentence: isZh ? "验证相关能力在当前证据中排位靠前。" : "Verification-related ability ranks high in this evidence set."
    });
  }

  const totalTokens = stats.total_token_usage?.total_tokens || 0;
  if ((stats.files || 0) >= 100 || totalTokens >= 10_000_000) {
    variants.push({
      id: "high_activity",
      label: isZh ? "高活动密度" : "High activity",
      sentence: isZh ? "本地 Agent 协作密度较高，但不直接等同于能力评分。" : "Local agent collaboration density is high, but it is not a capability score."
    });
  }

  if (!levels.has("E1")) {
    variants.push({
      id: "low_external_outcome",
      label: isZh ? "外部结果待补" : "Outcome proof pending",
      sentence: isZh ? "外部发布、用户反馈或第三方结果证据仍需补充。" : "External release, user feedback, or third-party outcome evidence is still limited."
    });
  }

  return variants.slice(0, 3);
}

function buildStatRows({ axes, axisScores, abilityModel, locale }) {
  const isZh = locale === "zh-CN";
  const labels = {
    systems: isZh ? "系统感" : "Systems",
    product: isZh ? "产品感" : "Product",
    reviewer: isZh ? "复核力" : "Review",
    operator: isZh ? "调度力" : "Operation",
    verification: isZh ? "验证力" : "Verification",
    delivery: isZh ? "交付力" : "Delivery",
    context: isZh ? "上下文" : "Context",
    goal: isZh ? "目标感" : "Goal"
  };
  const preferred = [
    axes.focus,
    axes.execution,
    axes.quality,
    axes.scope,
    ...abilityOrderForAxes(axes)
  ];
  const seen = new Set();
  const rows = [];

  for (const key of preferred) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (Object.hasOwn(axisScores, key)) {
      rows.push({ id: key, label: labels[key], score: clampPercent(axisScores[key]) });
    } else {
      const ability = abilityModel.find((item) => item.dimension_id === key);
      if (ability) rows.push({ id: key, label: ability.label, score: clampPercent(ability.score) });
    }
    if (rows.length >= 4) break;
  }

  return rows;
}

function abilityOrderForAxes(axes) {
  const focusOrder = axes.focus === "systems"
    ? ["context_packaging", "scope_control", "failure_recovery"]
    : ["product_judgment", "goal_framing", "scope_control"];
  const qualityOrder = axes.quality === "verification"
    ? ["verification_discipline", "review_judgment", "failure_recovery"]
    : ["shipping_hygiene", "collaboration_handoff", "agent_delegation"];
  const scopeOrder = axes.scope === "context"
    ? ["context_packaging", "collaboration_handoff"]
    : ["goal_framing", "product_judgment"];
  return [...new Set([...focusOrder, ...qualityOrder, ...scopeOrder])];
}
