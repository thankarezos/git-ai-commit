import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function getConfigPath() {
  return (
    process.env.GIT_AIC_CONFIG ||
    join(homedir(), ".config", "git-aic", "config.json")
  );
}

export function loadConfig() {
  const path = getConfigPath();

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read config: ${path}\n${error.message}`);
  }
}
