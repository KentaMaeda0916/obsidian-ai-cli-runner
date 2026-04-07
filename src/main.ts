import { Plugin, Notice } from "obsidian";
import { AICLIView, VIEW_TYPE_AI_CLI } from "./views/aiCliView";
import { AICLISettingTab } from "./settings";
import { AICLIPluginSettings, DEFAULT_SETTINGS } from "./types";

export default class AICLIPlugin extends Plugin {
  settings!: AICLIPluginSettings;

  async onload() {
    if (process.platform !== "darwin") {
      new Notice("AI CLI Runner: macOS only (Windows/Linux support coming soon).");
      return;
    }
    if (process.arch !== "arm64" && process.arch !== "x64") {
      new Notice("AI CLI Runner: unsupported architecture.");
      return;
    }

    await this.loadSettings();

    this.registerView(VIEW_TYPE_AI_CLI, (leaf) => new AICLIView(leaf, this));

    this.addRibbonIcon("sparkles", "Open AI CLI panel", () => this.openPanel());

    this.addCommand({
      id: "open-ai-cli-panel",
      name: "Open AI CLI panel",
      callback: () => this.openPanel(),
    });

    this.addSettingTab(new AICLISettingTab(this.app, this));
  }

  async openPanel() {
    // Check if a panel is already open
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CLI);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    // Open in bottom split (Cursor-style)
    const leaf = this.app.workspace.getLeaf("split", "horizontal");
    await leaf.setViewState({ type: VIEW_TYPE_AI_CLI, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  closeAllPanels() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CLI);
    for (const leaf of leaves) {
      leaf.detach();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
