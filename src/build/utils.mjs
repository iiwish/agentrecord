import fs from "node:fs";
import { createHash } from "node:crypto";

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJsonlLines(file) {
  try {
    return fs.readFileSync(file, "utf8").split(/\n/).filter(Boolean);
  } catch {
    return [];
  }
}

export function hashObject(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function stableTimestamp(value) {
  return String(value || new Date().toISOString()).replace(/[:.]/g, "-");
}

export function snakeId(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function formatNumber(value, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(value || 0);
}

export function formatCompactNumber(value, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    notation: "compact"
  }).format(value || 0);
}

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
