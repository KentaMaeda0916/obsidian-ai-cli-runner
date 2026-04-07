import * as path from "path";
import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import type { IPty } from "node-pty";
import type AICLIPlugin from "../main";
import type { AIToolConfig } from "../types";

export const VIEW_TYPE_AI_CLI = "ai-cli-view";

export class AICLIView extends ItemView {
  private term!: Terminal;
  private fit!: FitAddon;
  private ptyProcess?: IPty;
  private resizeObserver?: ResizeObserver;
  private currentToolId?: string;
  private displayName = "AI CLI";
  private kittyKeyboardMode = 0;

  constructor(leaf: WorkspaceLeaf, private plugin: AICLIPlugin) {
    super(leaf);
  }

  // --- Lifecycle ---

  getViewType() {
    return VIEW_TYPE_AI_CLI;
  }
  getDisplayText() {
    return this.displayName;
  }
  getIcon() {
    return "terminal";
  }

  async onOpen() {
    // Remove unwanted header elements (← →, ... menu, tab dropdown)
    const leafContent = this.containerEl;
    leafContent.querySelector(".view-header")?.remove();

    const tabContainer = leafContent.closest(".workspace-tabs")
      ?.querySelector(".workspace-tab-header-container");
    if (tabContainer) {
      tabContainer.querySelector(".workspace-tab-header-tab-list")?.remove();
      tabContainer.querySelector(".workspace-tab-header-spacer")?.remove();
    }

    this.contentEl.empty();

    // Toolbar
    const toolbar = this.contentEl.createDiv({ cls: "ai-cli-toolbar" });
    this.buildToolbar(toolbar);

    // Terminal container
    const root = this.contentEl.createDiv({ cls: "ai-cli-terminal" });

    this.term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontSize: 14,
      fontFamily: "'SF Mono', 'Menlo', monospace",
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#d4d4d4",
      },
    });

    this.fit = new FitAddon();
    this.term.loadAddon(this.fit);
    this.term.open(root);

    // Shift+Enter: send kitty-encoded Shift+Enter, block all event types
    this.term.attachCustomKeyEventHandler((e) => {
      if (e.key === "Enter" && e.shiftKey) {
        if (e.type === "keydown" && this.ptyProcess) {
          this.ptyProcess.write("\x1b[13;2u");
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    });

    // xterm -> PTY (register once; forwards to current process)
    this.term.onData((data: string) => {
      try {
        this.ptyProcess?.write(data);
      } catch {
        // Process may have exited
      }
    });

    // Delay fit to ensure DOM is ready
    setTimeout(() => this.fit.fit(), 50);

    // Resize tracking
    this.resizeObserver = new ResizeObserver(() => {
      this.fit.fit();
      if (this.ptyProcess) {
        try {
          this.ptyProcess.resize(this.term.cols, this.term.rows);
        } catch {
          // Process may have exited
        }
      }
    });
    this.resizeObserver.observe(root);

    // Drag & drop: insert file path into terminal
    root.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    root.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const filePath = this.resolveDroppedPath(e);
      if (filePath && this.ptyProcess) {
        this.ptyProcess.write(`'${filePath}'`);
      }
    });

    // Welcome message
    this.term.writeln("AI CLI Runner ready. Select a tool and click ▶ to start.");
  }

  async onClose() {
    this.resizeObserver?.disconnect();
    this.stopProcess();
    this.term?.dispose();
  }

  // --- UI construction ---

  private buildToolbar(toolbar: HTMLElement) {
    const tools = this.plugin.settings.tools;

    // Tool selector
    const select = toolbar.createEl("select");
    for (const tool of tools) {
      const opt = select.createEl("option", { text: tool.name, value: tool.id });
      if (tool.id === this.plugin.settings.defaultToolId) {
        opt.selected = true;
      }
    }
    this.currentToolId = select.value;
    select.addEventListener("change", () => {
      this.currentToolId = select.value;
    });

    // Launch button
    const launchBtn = toolbar.createEl("button", { attr: { "aria-label": "Launch" } });
    setIcon(launchBtn, "play");
    launchBtn.addEventListener("click", () => {
      const tool = tools.find((t) => t.id === this.currentToolId);
      if (tool) this.launchTool(tool);
    });

    // Stop button
    const stopBtn = toolbar.createEl("button", { attr: { "aria-label": "Stop" } });
    setIcon(stopBtn, "square");
    stopBtn.addEventListener("click", () => this.stopProcess());

    // Spacer
    toolbar.createDiv({ cls: "toolbar-spacer" });

    // Split button
    const splitBtn = toolbar.createEl("button", { attr: { "aria-label": "Split terminal" } });
    setIcon(splitBtn, "columns-2");
    splitBtn.addEventListener("click", () => this.splitPanel());

    // Close panel button
    const closeAllBtn = toolbar.createEl("button", { attr: { "aria-label": "Close panel" } });
    setIcon(closeAllBtn, "trash");
    closeAllBtn.addEventListener("click", () => this.leaf.detach());
  }

  // --- Process management ---

  launchTool(tool: AIToolConfig) {
    if (this.ptyProcess) {
      const ok = window.confirm(
        `"${this.displayName}" is still running. Kill it and start "${tool.name}"?`
      );
      if (!ok) return;
    }
    this.stopProcess();

    // Update tab name to the tool's display name
    this.displayName = tool.name;
    (this.leaf as any).updateHeader();

    const cwd = this.getWorkingDirectory();

    this.term.writeln(`\r\n--- Starting ${tool.name} ---`);
    this.term.writeln(`$ ${tool.command} ${tool.args.join(" ")}\r\n`);

    try {
      const pluginDir = path.join(
        this.getVaultBasePath(),
        ".obsidian",
        "plugins",
        this.plugin.manifest.id,
      );
      const ptyPath = path.join(pluginDir, "node_modules", `node-pty-${process.arch}`);
      const shell = process.env.SHELL || "/bin/zsh";
      const cmdLine = [tool.command, ...tool.args].join(" ");
      const pty = require(ptyPath);

      this.ptyProcess = pty.spawn(shell, ["-i", "-l", "-c", cmdLine], {
        name: "xterm-256color",
        cols: this.term.cols,
        rows: this.term.rows,
        cwd,
        env: process.env as Record<string, string>,
      });

      // PTY -> xterm (with kitty keyboard protocol interception)
      this.ptyProcess!.onData((data: string) => {
        const processed = this.handleKittyProtocol(data);
        this.term.write(processed);
      });

      // Process exit
      this.ptyProcess!.onExit(({ exitCode }: { exitCode: number }) => {
        this.term.writeln(`\r\n--- Process exited (code: ${exitCode}) ---`);
        this.ptyProcess = undefined;
      });
    } catch (err) {
      this.term.writeln(`\r\nError: Failed to start ${tool.command}`);
      this.term.writeln(`${err}`);
      this.term.writeln(
        "Make sure the command is installed and node-pty is properly built."
      );
    }
  }

  private stopProcess() {
    if (this.ptyProcess) {
      try {
        this.ptyProcess.kill();
      } catch {
        // Already dead
      }
      this.ptyProcess = undefined;
    }
  }

  private async splitPanel() {
    const newLeaf = this.app.workspace.getLeaf("split", "vertical");
    await newLeaf.setViewState({ type: VIEW_TYPE_AI_CLI, active: true });
    this.app.workspace.revealLeaf(newLeaf);
  }

  // --- Kitty keyboard protocol ---

  /**
   * Intercept kitty keyboard protocol sequences from the application.
   * - \x1b[>Xu  = push mode (enable with flags X)
   * - \x1b[<u   = pop mode (disable)
   * - \x1b[?u   = query current mode → respond with \x1b[?Xu
   */
  private handleKittyProtocol(data: string): string {
    // Push mode: \x1b[>Xu where X is flags
    const pushMatch = data.match(/\x1b\[>(\d+)u/);
    if (pushMatch) {
      this.kittyKeyboardMode = parseInt(pushMatch[1], 10);
      data = data.replace(/\x1b\[>\d+u/g, "");
    }

    // Pop mode: \x1b[<u or \x1b[<Xu
    if (data.includes("\x1b[<u") || /\x1b\[<\d*u/.test(data)) {
      this.kittyKeyboardMode = 0;
      data = data.replace(/\x1b\[<\d*u/g, "");
    }

    // Query mode: \x1b[?u → respond with current mode
    if (data.includes("\x1b[?u")) {
      this.ptyProcess?.write(`\x1b[?${this.kittyKeyboardMode}u`);
      data = data.replace(/\x1b\[\?u/g, "");
    }

    return data;
  }

  // --- Utilities ---

  private getVaultBasePath(): string {
    return (this.app.vault.adapter as any).basePath;
  }

  private getWorkingDirectory(): string {
    try {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        return path.join(this.getVaultBasePath(), path.dirname(activeFile.path));
      }
      return this.getVaultBasePath() ?? process.cwd();
    } catch {
      return process.cwd();
    }
  }

  private resolveDroppedPath(e: DragEvent): string | null {
    const basePath = this.getVaultBasePath();

    // Obsidian internal drag: "text/plain" contains the vault-relative path
    const obsidianPath = e.dataTransfer?.getData("text/plain");
    if (obsidianPath && !obsidianPath.startsWith("/") && !obsidianPath.startsWith("http")) {
      return path.join(basePath, obsidianPath);
    }

    // OS file drag: "Files" contains the absolute path
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      return (files[0] as any).path ?? files[0].name;
    }

    return null;
  }
}
