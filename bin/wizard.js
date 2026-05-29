import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { PROVIDER_PRESETS, EDITOR_PRESETS } from "./presets.js";
import { defaults } from "./prompts.js";

export async function runInitWizard(path) {
  const rl = createInterface({ input, output });

  console.log();
  console.log("git-aic config wizard");
  console.log("=====================");
  console.log(`Target: ${path}`);

  if (existsSync(path)) {
    const answer = (await rl.question("Config already exists. Overwrite? [y/N]: "))
      .trim()
      .toLowerCase();
    if (answer !== "y" && answer !== "yes") {
      console.log("Aborted.");
      rl.close();
      process.exit(0);
    }
  }

  const provider = await pickProvider(rl);
  const editor = await pickEditor(rl);

  console.log();
  const commitAnswer = (
    await rl.question("Auto-commit after editing the message? [Y/n]: ")
  ).trim().toLowerCase();
  const commit = commitAnswer !== "n" && commitAnswer !== "no";

  const requireEditAnswer = (
    await rl.question("Require the message to be edited before commit? [y/N]: ")
  ).trim().toLowerCase();
  const requireEdit = requireEditAnswer === "y" || requireEditAnswer === "yes";

  rl.close();

  const config = {
    provider,
    editor,
    commit,
    requireEdit,
    prompt: defaults.prompt,
    commitMessageTag: defaults.commitMessageTag,
    removeLinesMatching: defaults.removeLinesMatching,
    stopLinesMatching: defaults.stopLinesMatching,
  };

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");

  console.log();
  console.log(`Wrote: ${path}`);
  console.log(JSON.stringify(config, null, 2));
}

async function pickProvider(rl) {
  console.log();
  console.log("Choose a provider:");
  PROVIDER_PRESETS.forEach((preset, index) => {
    const argsPreview = preset.args.join(" ");
    console.log(`  ${index + 1}) ${preset.name}  (${preset.command} ${argsPreview})`);
  });
  console.log(`  ${PROVIDER_PRESETS.length + 1}) Custom`);

  while (true) {
    const choice = (await rl.question(`Provider [1-${PROVIDER_PRESETS.length + 1}]: `)).trim();
    const index = Number.parseInt(choice, 10) - 1;

    if (index >= 0 && index < PROVIDER_PRESETS.length) {
      const preset = PROVIDER_PRESETS[index];
      return { command: preset.command, args: preset.args };
    }

    if (index === PROVIDER_PRESETS.length) {
      const command = (await rl.question("Command (e.g. claude): ")).trim();

      if (!command) {
        console.log("Command cannot be empty.");
        continue;
      }

      const argsRaw = (
        await rl.question('Args (space-separated, use {prompt} and {diff} as placeholders) [-p "{prompt}"]: ')
      ).trim();
      const args = argsRaw ? argsRaw.split(/\s+/) : ["-p", "{prompt}"];
      return { command, args };
    }

    console.log("Invalid choice.");
  }
}

async function pickEditor(rl) {
  console.log();
  console.log("Choose an editor:");
  EDITOR_PRESETS.forEach((preset, index) => {
    console.log(`  ${index + 1}) ${preset}`);
  });
  console.log(`  ${EDITOR_PRESETS.length + 1}) Custom`);

  while (true) {
    const choice = (
      await rl.question(`Editor [1-${EDITOR_PRESETS.length + 1}, default 1]: `)
    ).trim();

    if (choice === "") {
      return EDITOR_PRESETS[0];
    }

    const index = Number.parseInt(choice, 10) - 1;

    if (index >= 0 && index < EDITOR_PRESETS.length) {
      return EDITOR_PRESETS[index];
    }

    if (index === EDITOR_PRESETS.length) {
      const custom = (await rl.question("Editor command: ")).trim();

      if (!custom) {
        console.log("Editor cannot be empty.");
        continue;
      }

      return custom;
    }

    console.log("Invalid choice.");
  }
}
