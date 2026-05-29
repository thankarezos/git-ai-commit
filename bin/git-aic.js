#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import crypto from "node:crypto";
import { runInitWizard } from "./wizard.js";
import { cleanCommitMessage } from "./clean.js";
import { runProvider } from "./run-provider.js";
import { configuration } from "./configuration.js";

const promptTemplate = configuration.prompt.join("\n");
const tagRegex = new RegExp(
  `<${configuration.commitMessageTag}>\\s*([\\s\\S]*?)\\s*<\\/${configuration.commitMessageTag}>`,
  "i"
);

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}

function getConfigPath() {
  return (
    process.env.GIT_AIC_CONFIG ||
    join(homedir(), ".config", "git-aic", "config.json")
  );
}

function loadConfig() {
  const path = getConfigPath();

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Failed to read config: ${path}\n${error.message}`);
  }
}

function parseArgs(argv) {
  let extraPrompt = "";
  let shouldCommit = null;
  let requireEdit = null;
  let printConfig = false;
  let runInit = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "-p" || arg === "--prompt") {
      extraPrompt = argv.slice(i + 1).join(" ");
      break;
    }

    if (arg === "--no-commit") {
      shouldCommit = false;
      continue;
    }

    if (arg === "--commit") {
      shouldCommit = true;
      continue;
    }

    if (arg === "--require-edit") {
      requireEdit = true;
      continue;
    }

    if (arg === "--no-require-edit") {
      requireEdit = false;
      continue;
    }

    if (arg === "--config") {
      printConfig = true;
      continue;
    }

    if (arg === "--init") {
      runInit = true;
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      console.log(`
Usage:
  git aic
  git aic -p "extra prompt"
  git aic --no-commit
  git aic --config
  git aic --init

Examples:
  git aic
  git aic -p "prefer docs(specs), mention Asset Management API"
  git aic --no-commit -p "only generate the message"
  git aic --init                # interactive config wizard

Config:
  ~/.config/git-aic/config.json

Environment:
  GIT_AIC_CONFIG=/path/to/config.json
`);
      process.exit(0);
    }

    extraPrompt += `${arg} `;
  }

  return {
    extraPrompt: extraPrompt.trim(),
    shouldCommit,
    requireEdit,
    printConfig,
    runInit,
  };
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function extractCommitMessage(raw) {
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

function buildPrompt(extraPrompt) {
  const { extraPrompt: token, extraPromptFallback } = configuration.placeholders;
  return promptTemplate.replaceAll(token, extraPrompt || extraPromptFallback);
}


const args = parseArgs(process.argv.slice(2));
const configPath = getConfigPath();

if (args.runInit) {
  await runInitWizard(configPath);
  process.exit(0);
}

if (!existsSync(configPath)) {
  console.log(`No config found at ${configPath}`);
  console.log("Launching first-time setup...");
  await runInitWizard(configPath);
}

const config = loadConfig();

if (args.printConfig) {
  console.log(getConfigPath());
  console.log(JSON.stringify(config, null, 2));
  process.exit(0);
}

const shouldCommit = args.shouldCommit ?? config.commit ?? true;
const requireEdit = args.requireEdit ?? config.requireEdit ?? false;

const insideRepo = run("git", ["rev-parse", "--is-inside-work-tree"]);

if (insideRepo.status !== 0) {
  fail("Not inside a git repository.");
}

const hasStagedChanges = run("git", ["diff", "--cached", "--quiet"]);

if (hasStagedChanges.status === 0) {
  fail("No staged changes found. Use: git add <files>");
}

const diff = run("git", ["diff", "--cached"]);

if (diff.status !== 0) {
  fail(diff.stderr || "Failed to read staged diff.");
}

const prompt = buildPrompt(args.extraPrompt);

let raw;
try {
  raw = runProvider(config.provider, prompt, diff.stdout);
} catch (error) {
  fail(error.message);
}

const message = extractCommitMessage(raw);

if (!message) {
  fail("AI provider returned no valid commit message. Aborted.");
}

const dir = mkdtempSync(join(tmpdir(), "git-aic-"));
const file = join(dir, "COMMIT_EDITMSG");

writeFileSync(file, `${message.trim()}\n`);

const before = sha256(readFileSync(file, "utf8"));
const mtimeBefore = statSync(file).mtimeMs;

const editor = process.env.EDITOR || config.editor || "nano";
const editorResult = spawnSync(editor, [file], {
  stdio: "inherit",
});

if (editorResult.status !== 0) {
  rmSync(dir, { recursive: true, force: true });
  fail("Editor exited with an error. Aborted.");
}

const mtimeAfter = statSync(file).mtimeMs;

if (mtimeAfter === mtimeBefore) {
  rmSync(dir, { recursive: true, force: true });
  fail("File not saved. Aborted.");
}

const edited = readFileSync(file, "utf8");
const after = sha256(edited);

if (requireEdit && before === after) {
  rmSync(dir, { recursive: true, force: true });
  fail("No edit detected. Aborted.");
}

const finalMessage = cleanCommitMessage(edited);

if (!finalMessage.trim()) {
  rmSync(dir, { recursive: true, force: true });
  fail("Commit message is empty. Aborted.");
}

writeFileSync(file, `${finalMessage.trim()}\n`);

console.log();
console.log("Final commit message:");
console.log("---------------------");
console.log(finalMessage.trim());
console.log("---------------------");
console.log();

if (!shouldCommit) {
  rmSync(dir, { recursive: true, force: true });
  process.exit(0);
}

const commit = spawnSync("git", ["commit", "-F", file], {
  stdio: "inherit",
});

rmSync(dir, { recursive: true, force: true });

process.exit(commit.status ?? 1);