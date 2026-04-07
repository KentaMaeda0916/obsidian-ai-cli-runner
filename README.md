# AI CLI Runner

An [Obsidian](https://obsidian.md) plugin that runs AI CLI tools — Claude Code, aider, and others — in a terminal panel directly inside Obsidian.

> **Platform:** macOS only (Apple Silicon & Intel). Windows/Linux support is planned.

## Features

- Embedded terminal panel (xterm.js + node-pty) — no external terminal needed
- Launch Claude Code, aider, GitHub Copilot CLI, or any custom CLI tool
- Tool selector + launch/stop buttons in a compact toolbar
- Split terminal: open multiple panels side by side
- Drag & drop files from Obsidian into the terminal to insert their path
- Working directory automatically set to the folder of the active note
- Kitty keyboard protocol support (required for Claude Code's TUI)
- Fully configurable: add, edit, or remove tools in Settings

## Requirements

- macOS (Apple Silicon or Intel)
- The CLI tools you want to use must be installed and available in your shell PATH (`.zshrc` / `.zprofile`)

## Installation

### Manual installation

1. Go to the [Releases](https://github.com/KentaMaeda0916/obsidian-ai-cli-runner/releases) page and download `obsidian-ai-cli-runner.zip`
2. Extract the zip and move the `obsidian-ai-cli-runner` folder into `<vault>/.obsidian/plugins/`
3. Reload Obsidian and enable the plugin in **Settings → Community plugins**

## Usage

| Action | How |
|--------|-----|
| Open terminal panel | Command palette → **Open AI CLI panel** |
| Launch a tool | Select from the dropdown → click ▶ |
| Stop a running tool | Click ■ |
| Split terminal | Click the split-columns icon |
| Close panel | Click the trash icon |
| Insert a file path | Drag a file from the file explorer into the terminal |

## Configuration

Go to **Settings → AI CLI Runner** to:

- Set the default tool that opens when a new panel is created
- Add custom tools (any CLI command with optional arguments)
- Edit or delete existing tools

### Example: adding a custom tool

| Field | Value |
|-------|-------|
| Display name | `My Tool` |
| Command | `mytool` |
| Arguments | `--flag value` |

## How it works

The plugin embeds a PTY (pseudo-terminal) via `node-pty` and renders it with `xterm.js`. Each tool is spawned through your login shell (`$SHELL -i -l -c <command>`) so your shell configuration (PATH, aliases, etc.) is fully available.

## Troubleshooting

**"Failed to start \<command\>"**
- Make sure the command is installed: run `which <command>` in Terminal
- Ensure it is in your PATH by checking `.zshrc` or `.zprofile`

**Shift+Enter not working**
- The plugin sends the kitty keyboard protocol escape sequence for Shift+Enter. Make sure you are running a supported version of the CLI tool.

## License

MIT — see [LICENSE](LICENSE)
