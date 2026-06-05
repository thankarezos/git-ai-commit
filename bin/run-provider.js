import { spawnCross, isWindowsShim } from "./spawn.js";

// Keep verbose output readable: show short args verbatim, summarise long ones
// (like the full prompt) by byte size instead of dumping them.
function previewArg(arg) {
  return arg.length > 60 ? `<${Buffer.byteLength(arg)} bytes>` : arg;
}

export function runProvider(provider, prompt, diff, { verbose = false } = {}) {
  if (!provider?.command) {
    throw new Error("Config error: provider.command is required.");
  }

  const args = provider.args ?? [];
  const usesPromptPlaceholder = args.some((arg) => arg.includes("{prompt}"));
  const usesDiffPlaceholder = args.some((arg) => arg.includes("{diff}"));

  let finalArgs;
  let input;

  if (isWindowsShim(provider.command) && !usesDiffPlaceholder) {
    // Batch shims (e.g. claude.cmd) run through cmd.exe, which truncates a
    // command-line argument at the first newline — so the multi-line prompt
    // can't be passed inline. Send the prompt and diff via stdin and drop the
    // inline {prompt}; CLIs like claude read the prompt from stdin when no
    // inline prompt is given.
    finalArgs = args.filter((arg) => arg.trim() !== "{prompt}");
    input = `${prompt}\n\n${diff}`;
  } else {
    finalArgs = args.map((arg) =>
      arg.replaceAll("{prompt}", prompt).replaceAll("{diff}", diff)
    );
    input = usesDiffPlaceholder ? undefined : diff;
    if (!usesPromptPlaceholder) {
      finalArgs.push(prompt);
    }
  }

  if (verbose) {
    const preview = finalArgs.map(previewArg).join(" ");
    console.error(`[verbose] command: ${provider.command} ${preview}`);
    console.error(
      `[verbose] stdin: ${input ? `${Buffer.byteLength(input)} bytes` : "(none)"}`
    );
  }

  // Per-provider Windows spawn options (e.g. { detached: true } for agy).
  // Applied only on Windows; ignored elsewhere.
  const windowsOptions =
    process.platform === "win32" ? provider.windows ?? {} : {};

  const result = spawnCross(provider.command, finalArgs, {
    input,
    encoding: "utf8",
    ...windowsOptions,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `${provider.command} failed.`);
  }

  return result.stdout;
}
