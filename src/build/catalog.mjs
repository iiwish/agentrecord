
const supportedLocales = ["en-US", "zh-CN"];

const dimensions = [
  { id: "goal_framing", canonical: "Goal Framing" },
  { id: "context_packaging", canonical: "Context Packaging" },
  { id: "agent_delegation", canonical: "Agent Delegation" },
  { id: "review_judgment", canonical: "Review Judgment" },
  { id: "verification_discipline", canonical: "Verification Discipline" },
  { id: "failure_recovery", canonical: "Failure Recovery" },
  { id: "scope_control", canonical: "Scope Control" },
  { id: "shipping_hygiene", canonical: "Shipping Hygiene" },
  { id: "product_judgment", canonical: "Product Judgment" },
  { id: "collaboration_handoff", canonical: "Collaboration Handoff" }
];

const roles = [
  { id: "product_builder", canonical: "Product Builder" },
  { id: "technical_reviewer", canonical: "Technical Reviewer" },
  { id: "agent_operator", canonical: "Agent Operator" },
  { id: "shipping_owner", canonical: "Shipping Owner" },
  { id: "systems_thinker", canonical: "Systems Thinker" },
  { id: "research_synthesizer", canonical: "Research Synthesizer" },
  { id: "collaboration_handoff", canonical: "Collaboration Handoff" }
];

const dimensionByCanonical = new Map(dimensions.map((item) => [item.canonical.toLowerCase(), item.id]));
const roleByCanonical = new Map(roles.map((item) => [item.canonical.toLowerCase(), item.id]));
roleByCanonical.set("delivery owner", "shipping_owner");
roleByCanonical.set("ai agent operator", "agent_operator");
roleByCanonical.set("software engineer", "systems_thinker");

export { supportedLocales, dimensions, roles, dimensionByCanonical, roleByCanonical };
