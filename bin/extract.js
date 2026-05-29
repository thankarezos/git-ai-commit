import { getConfiguration } from "./prompts.js";
import { cleanCommitMessage } from "./clean.js";

export function extractCommitMessage(raw) {
  const cfg = getConfiguration();
  const tagRegex = new RegExp(
    `<${cfg.commitMessageTag}>\\s*([\\s\\S]*?)\\s*<\\/${cfg.commitMessageTag}>`,
    "i"
  );
  const tagMatch = raw.match(tagRegex);

  if (tagMatch?.[1]) {
    return cleanCommitMessage(tagMatch[1]);
  }

  const lines = raw.split("\n");
  const startIndex = lines.findIndex((line) =>
    /^[a-z]+(\([^)]+\))?!?: /.test(line.trim())
  );

  if (startIndex === -1) {
    return "";
  }

  return cleanCommitMessage(lines.slice(startIndex).join("\n"));
}
