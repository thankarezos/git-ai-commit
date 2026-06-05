import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, extname, isAbsolute, join } from "node:path";

const isWindows = process.platform === "win32";

// On Windows, a CLI on PATH may be a native executable (`agy.exe`) or a batch
// shim that npm generates for global installs (`claude.cmd`). Native exes can
// be spawned directly and accept multi-line arguments; batch shims must be run
// through cmd.exe, which mangles multi-line arguments. We need to tell them
// apart, so resolve the command to a real file and inspect its extension.
function resolveWindowsCommand(command) {
  if (isAbsolute(command) || command.includes("\\") || command.includes("/")) {
    return { file: command, ext: extname(command).toLowerCase() };
  }

  const pathext = (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD")
    .split(";")
    .filter(Boolean);
  const hasExt = extname(command) !== "";
  const candidates = hasExt ? [command] : pathext.map((ext) => command + ext);
  const dirs = (process.env.PATH || "").split(delimiter).filter(Boolean);

  for (const dir of dirs) {
    for (const candidate of candidates) {
      const full = join(dir, candidate);
      if (existsSync(full)) {
        return { file: full, ext: extname(full).toLowerCase() };
      }
    }
  }

  // Not found on PATH — hand it back unchanged and let spawn surface the error.
  return { file: command, ext: extname(command).toLowerCase() };
}

// Whether a command resolves to a batch/PowerShell shim on Windows (e.g. the
// `claude.cmd` npm installs). Such shims run through cmd.exe, which truncates
// arguments at the first newline — so callers must avoid passing multi-line
// arguments to them. Always false off Windows.
export function isWindowsShim(command) {
  if (!isWindows) return false;
  const { ext } = resolveWindowsCommand(command);
  return ext === ".cmd" || ext === ".bat" || ext === ".ps1";
}

// Quoting for the cmd.exe shell path. With `shell: true` Node concatenates argv
// verbatim instead of quoting it, so we wrap anything containing whitespace or
// shell metacharacters ourselves.
function quoteWinArg(arg) {
  if (arg === "") return '""';
  if (!/[\s"&|<>^()]/.test(arg)) return arg;
  const escaped = arg
    .replace(/(\\*)"/g, '$1$1\\"') // double backslashes before a quote, then escape the quote
    .replace(/(\\*)$/, "$1$1"); // double trailing backslashes so they don't escape the closing quote
  return `"${escaped}"`;
}

// Cross-platform spawnSync. Non-Windows spawns the command directly. On Windows
// native executables are also spawned directly (preserving multi-line args),
// while batch/PowerShell shims are routed through the shell so PATHEXT resolves
// them.
export function spawnCross(command, args = [], options = {}) {
  if (!isWindows) {
    return spawnSync(command, args, options);
  }

  const { file, ext } = resolveWindowsCommand(command);
  const needsShell = ext === ".cmd" || ext === ".bat" || ext === ".ps1";
  // Interactive spawns (the editor) inherit stdio and need a real, visible
  // console; only capturing spawns get the window-suppression flags below.
  // detached and windowsHide map to mutually exclusive console-creation flags
  // (DETACHED_PROCESS vs CREATE_NO_WINDOW), so each path picks exactly one.
  const capturing = options.stdio !== "inherit";

  if (!needsShell) {
    // Native exe. A caller can pass `detached: true` for a CLI that renders to
    // the console device instead of stdout (e.g. agy): detached gives it no
    // console so it falls back to stdout — at the cost of a brief console
    // window. Everything else just gets a hidden console (no window).
    const wantsDetached = capturing && options.detached === true;
    const extra = capturing && !wantsDetached ? { windowsHide: true } : {};
    return spawnSync(file, args, { ...extra, ...options });
  }

  // Batch/PowerShell shim — route through cmd.exe so PATHEXT resolves it.
  // windowsHide (CREATE_NO_WINDOW) gives cmd.exe a hidden console: no popup,
  // and shims like claude write to stdout normally so capture still works.
  // detached would pop a cmd.exe window and shims never need it, so drop it.
  const { detached, ...shimOptions } = options;
  const extra = capturing ? { windowsHide: true } : {};
  return spawnSync(file, args.map(quoteWinArg), {
    ...extra,
    ...shimOptions,
    shell: true,
  });
}
