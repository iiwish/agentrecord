import path from "node:path";

import { normalizeLocale, readJsonIfExists } from "../core/config.mjs";
import { supportedLocales } from "./catalog.mjs";
import { repoRoot } from "./paths.mjs";

export function resolveReportSettings(config, stats, generatedAt) {
  let locale = config.resolved.report.locale;
  let languageSource = "config";
  let confidence = locale === "auto" ? "low" : "explicit";

  if (locale === "auto") {
    const agentLocale = inferAgentConversationLocale(stats);
    if (agentLocale) {
      locale = agentLocale.locale;
      languageSource = "agent_conversation_language";
      confidence = agentLocale.confidence;
    } else {
      locale = normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale, config.resolved.report.fallbackLocale);
      if (locale === "auto") locale = config.resolved.report.fallbackLocale;
      languageSource = "system_locale";
      confidence = "medium";
    }
  }

  if (!supportedLocales.includes(locale)) {
    locale = config.resolved.report.fallbackLocale;
    languageSource = "fallback_locale";
    confidence = "low";
  }

  return {
    locale_requested: config.resolved.report.locale,
    locale,
    fallback_locale: config.resolved.report.fallbackLocale,
    label_mode: config.resolved.report.labelMode,
    language_source: languageSource,
    language_confidence: confidence,
    schema_language: "en-US",
    audiences: config.resolved.report.audiences.filter((audience) => ["self", "share"].includes(audience)),
    default_audience: "self",
    supported_locales: supportedLocales,
    agent_language_votes: stats.language_votes,
    agent_language_sample: stats.language_sample,
    generated_at: generatedAt
  };
}

function inferAgentConversationLocale(stats) {
  const zh = stats.language_votes?.["zh-CN"] || 0;
  const en = stats.language_votes?.["en-US"] || 0;
  const total = zh + en;
  if (total < 3) return null;
  const locale = zh >= en ? "zh-CN" : "en-US";
  const share = Math.max(zh, en) / total;
  if (share < 0.6) return null;
  return { locale, confidence: share >= 0.8 ? "high" : "medium" };
}

export function loadLocaleBundle(locale) {
  return readJsonIfExists(path.join(repoRoot, "locales", `${locale}.json`))
    || readJsonIfExists(path.join(repoRoot, "locales", "en-US.json"))
    || { ui: {}, roles: {}, abilities: {}, html_lang: "en" };
}
