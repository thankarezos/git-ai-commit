export const PROVIDER_PRESETS = [
  {
    name: "Claude Code",
    command: "claude",
    args: ["-p", "{prompt}"]
  },
  {
    name: "Gemini CLI",
    command: "gemini",
    args: ["-p", "{prompt}"]
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

export const EDITOR_PRESETS = ["nano", "vim", "nvim", "code --wait", "micro", "hx"];
