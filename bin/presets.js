export const PROVIDER_PRESETS = [
  {
    name: "Claude Code",
    command: "claude",
    args: ["-p", "{prompt}"]
  },
  {
    name: "Antigravity CLI",
    command: "agy",
    args: ["-p", "{prompt}"],
    // agy renders to the Windows console device instead of stdout, so it can
    // only be captured when spawned with no console (detached). This pops a
    // brief console window on Windows; CLIs that write to stdout don't need it.
    windows: { detached: true }
  },
  {
    name: "Codex CLI",
    command: "codex",
    args: ["exec", "--skip-git-repo-check", "{prompt}"]
  },
  {
    name: "OpenCode",
    command: "opencode",
    args: ["run", "{prompt}"]
  },
  {
    name: "llm (Simon Willison)",
    command: "llm",
    args: ["{prompt}"]
  },
  {
    name: "Ollama (llama3)",
    command: "ollama",
    args: ["run", "llama3", "{prompt}"]
  }
];

export const EDITOR_PRESETS = ["nano", "vim", "nvim", "code --wait", "micro", "hx", "notepad"];
