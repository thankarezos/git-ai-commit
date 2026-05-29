import { spawnSync } from "node:child_process";

export function runProvider(provider, prompt, diff) {
  if (!provider?.command) {
    throw new Error("Config error: provider.command is required.");
  }

  const args = provider.args ?? [];

  const finalArgs = args.map((arg) =>
    arg
      .replaceAll("{prompt}", prompt)
      .replaceAll("{diff}", diff)
  );

  const usesPromptPlaceholder = args.some((arg) => arg.includes("{prompt}"));
  const usesDiffPlaceholder = args.some((arg) => arg.includes("{diff}"));

  const input = usesDiffPlaceholder ? undefined : diff;

  if (!usesPromptPlaceholder) {
    finalArgs.push(prompt);
  }

  const result = spawnSync(provider.command, finalArgs, {
    input,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `${provider.command} failed.`);
  }

  return result.stdout;
}
