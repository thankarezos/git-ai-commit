# git-aic

Generate a git commit message from your staged diff using any AI CLI you already have on your machine (Claude Code, Gemini CLI, Codex, `llm`, Ollama, or a custom command). The message opens in your editor — save to commit, quit without saving to abort.

```
$ git aic -ap "mention the migration"
# (AI runs against your staged diff, message opens in nano)
# Save -> commit. Quit without saving -> abort.
```

## Install

Until this is published to npm, install from source:

```sh
git clone https://github.com/<you>/git-ai-commit.git
cd git-ai-commit
npm link        # symlinks `git-aic` onto your PATH
```

> If `npm link` fails with `EACCES`, set a user-owned npm prefix:
> ```sh
> npm config set prefix ~/.npm-global
> mkdir -p ~/.npm-global
> # add to ~/.bashrc or ~/.zshrc:
> export PATH="$HOME/.npm-global/bin:$PATH"
> ```

Requires **Node 18+**. Because the binary is named `git-aic`, git resolves `git aic` automatically.

## Quick start

```sh
git add <files>
git aic                          # generate, edit, commit
git aic -a                       # stage everything first (git add -A)
git aic -p "be terse"            # add hints to the prompt
git aic -ap "be terse"           # combine -a and -p
git aic --no-commit              # generate + edit only, don't commit
```

First run launches an **interactive wizard** that asks you to pick a provider, editor, and behavior flags, and writes the result to `~/.config/git-aic/config.json`. You can re-run it any time with `git aic --init`.

## Flags

| Flag | Meaning |
|---|---|
| `-a`, `--add` | Run `git add -A` before generating |
| `-p "..."`, `--prompt "..."` | Append extra instructions to the AI prompt |
| `-ap "..."`, `-pa "..."` | Combine `-a` and `-p` |
| `--no-commit` | Generate and edit, but skip the `git commit` |
| `--commit` | Force commit (overrides `commit: false` in config) |
| `--require-edit` | Refuse to commit if the saved message is byte-identical to what the AI produced |
| `--no-require-edit` | Allow committing the AI message unchanged |
| `--init` | Run the interactive setup wizard |
| `--config` | Print the active config path and contents |
| `-h` | Show usage. (`--help` is intercepted by git, so use `-h`.) |

## How it decides to commit

After the AI generates a message, the file opens in your editor:

- **Save** (`Ctrl+X` → `Y` in nano, `:wq` in vim) → commits.
- **Quit without saving** (`Ctrl+X` → `N`, `:q!`) → aborts with `File not saved. Aborted.`
- With `requireEdit: true`, the saved content must additionally differ from the AI's output, otherwise it aborts with `No edit detected. Aborted.`

## Configuration

Stored at `~/.config/git-aic/config.json` (override with `GIT_AIC_CONFIG=/path/to/config.json`):

```json
{
  "provider": {
    "command": "claude",
    "args": ["-p", "{prompt}"]
  },
  "editor": "nano",
  "commit": true,
  "requireEdit": false
}
```

- **`provider.command`** — the binary to invoke.
- **`provider.args`** — argv passed to that binary. `{prompt}` and `{diff}` are placeholders. If neither `{prompt}` nor `{diff}` appear in the args, the prompt is appended as the last arg and the diff is piped on stdin.
- **`editor`** — the editor command (overridden by `$EDITOR` if set).
- **`commit`** — whether to actually `git commit` after editing.
- **`requireEdit`** — require the saved message to differ from the AI output.

### Overriding prompts and cleanup patterns

The wizard (`git aic --init`) writes the full defaults into your config so you can see and edit everything in one place. Any of these fields can be removed, changed, or extended:

- **`prompt`** — array of lines sent to the AI. Include `{extraPrompt}` somewhere if you want `-p "..."` to keep working.
- **`commitMessageTag`** — the XML tag the AI is told to wrap the message in.
- **`removeLinesMatching`** — case-insensitive regex strings; matching lines are stripped from the AI's output.
- **`stopLinesMatching`** — case-insensitive regex strings; lines from the first match onward are dropped (used to cut off AI rambling).

Each field in your user config **replaces** the default if present. If you delete a field entirely, the built-in default from `bin/prompts.json` is used instead.

## Providers

The wizard ships with presets for:

- **Claude Code** — `claude -p "{prompt}"` (reads diff from stdin)
- **Gemini CLI** — `gemini -p "{prompt}"`
- **Codex CLI** — `codex exec --skip-git-repo-check "{prompt}"`
- **llm** (Simon Willison) — `llm "{prompt}"`
- **Ollama** — `ollama run llama3 "{prompt}"`
- **Custom** — type your own `command` and `args`

You can edit `provider` in the config file at any time, or rerun `git aic --init`.

## Customizing the prompt

The base prompt template, the `<commit_message>` tag, and the cleanup patterns live in `bin/prompts.json`. Edit that file to:

- Change tone, rules, or allowed Conventional Commit types in `prompt`.
- Add line patterns to `removeLinesMatching` to strip more AI boilerplate.
- Add line patterns to `stopLinesMatching` to cut off output when the AI starts rambling.

Patterns are case-insensitive JS regex strings.

## License

MIT
