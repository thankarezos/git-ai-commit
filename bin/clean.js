import { getConfiguration } from "./prompts.js";

let patterns = null;

function buildPatterns() {
  const cfg = getConfiguration();
  return {
    remove: (cfg.removeLinesMatching ?? []).map((source) => new RegExp(source, "i")),
    stop: (cfg.stopLinesMatching ?? []).map((source) => new RegExp(source, "i")),
  };
}

export function cleanCommitMessage(text) {
  if (!patterns) patterns = buildPatterns();
  const { remove, stop } = patterns;
  const result = [];

  for (const line of text.split("\n")) {
    if (stop.some((re) => re.test(line))) break;
    if (remove.some((re) => re.test(line))) continue;
    result.push(line);
  }

  return result.join("\n").trim();
}
