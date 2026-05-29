import { configuration } from "./promts.js";

const removePatterns = (configuration.removeLinesMatching ?? []).map(
  (source) => new RegExp(source, "i")
);
const stopPatterns = (configuration.stopLinesMatching ?? []).map(
  (source) => new RegExp(source, "i")
);

export function cleanCommitMessage(text) {
  const result = [];

  for (const line of text.split("\n")) {
    if (stopPatterns.some((re) => re.test(line))) break;
    if (removePatterns.some((re) => re.test(line))) continue;
    result.push(line);
  }

  return result.join("\n").trim();
}
