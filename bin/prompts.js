import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export const defaults = JSON.parse(
  readFileSync(join(here, "prompts.json"), "utf8")
);

let merged = defaults;

export function applyUserOverrides(userConfig = {}) {
  merged = {
    ...defaults,
    prompt: userConfig.prompt ?? defaults.prompt,
    commitMessageTag: userConfig.commitMessageTag ?? defaults.commitMessageTag,
    placeholders: defaults.placeholders,
    removeLinesMatching:
      userConfig.removeLinesMatching ?? defaults.removeLinesMatching,
    stopLinesMatching:
      userConfig.stopLinesMatching ?? defaults.stopLinesMatching,
  };
}

export function getConfiguration() {
  return merged;
}
