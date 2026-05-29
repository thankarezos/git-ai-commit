import { getConfiguration } from "./prompts.js";

export function cleanCommitMessage(text) {
  const cfg = getConfiguration();
  const remove = (cfg.removeLinesMatching ?? []).map(
    (source) => new RegExp(source, "i")
  );
  const stop = (cfg.stopLinesMatching ?? []).map(
    (source) => new RegExp(source, "i")
  );

  const result = [];

  for (const line of text.split("\n")) {
    if (stop.some((re) => re.test(line))) break;
    if (remove.some((re) => re.test(line))) continue;
    result.push(line);
  }

  return result.join("\n").trim();
}
