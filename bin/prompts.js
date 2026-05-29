import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export const defaults = JSON.parse(
  readFileSync(join(here, "prompts.json"), "utf8")
);

let merged = defaults;

export function mergeConfig(base, userConfig = {}) {
  return {
    ...base,
    prompt: userConfig.prompt ?? base.prompt,
    commitMessageTag: userConfig.commitMessageTag ?? base.commitMessageTag,
    placeholders: base.placeholders,
    removeLinesMatching:
      userConfig.removeLinesMatching ?? base.removeLinesMatching,
    stopLinesMatching:
      userConfig.stopLinesMatching ?? base.stopLinesMatching,
  };
}

export function applyUserOverrides(userConfig = {}) {
  merged = mergeConfig(defaults, userConfig);
}

export function getConfiguration() {
  return merged;
}
