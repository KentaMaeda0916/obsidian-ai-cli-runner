import { App, PluginSettingTab, Setting } from "obsidian";
import type AICLIPlugin from "./main";
import type { AIToolConfig } from "./types";

export class AICLISettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: AICLIPlugin) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "AI CLI Runner Settings" });

    // Default tool selector
    new Setting(containerEl)
      .setName("Default tool")
      .setDesc("Tool to select by default when opening a panel")
      .addDropdown((dropdown) => {
        for (const tool of this.plugin.settings.tools) {
          dropdown.addOption(tool.id, tool.name);
        }
        dropdown.setValue(this.plugin.settings.defaultToolId);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultToolId = value;
          await this.plugin.saveSettings();
        });
      });

    // Tool list
    containerEl.createEl("h3", { text: "Allowed AI CLI Tools" });
    containerEl.createEl("p", {
      text: "Only tools listed here can be launched from the panel.",
      cls: "setting-item-description",
    });

    for (const tool of this.plugin.settings.tools) {
      this.renderToolSetting(containerEl, tool);
    }

    // Add new tool button
    new Setting(containerEl).addButton((btn) => {
      btn.setButtonText("Add tool").onClick(async () => {
        const newTool: AIToolConfig = {
          id: `custom-${Date.now()}`,
          name: "New Tool",
          command: "",
          args: [],
          icon: "terminal",
        };
        this.plugin.settings.tools.push(newTool);
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }

  private renderToolSetting(containerEl: HTMLElement, tool: AIToolConfig) {
    const setting = new Setting(containerEl)
      .setName(tool.name)
      .setDesc(`Command: ${tool.command} ${tool.args.join(" ")}`.trim());

    // Edit button
    setting.addButton((btn) => {
      btn.setIcon("pencil").setTooltip("Edit").onClick(() => {
        this.showEditModal(tool);
      });
    });

    // Delete button (don't allow deleting if only one tool)
    if (this.plugin.settings.tools.length > 1) {
      setting.addButton((btn) => {
        btn.setIcon("trash").setTooltip("Delete").onClick(async () => {
          this.plugin.settings.tools = this.plugin.settings.tools.filter(
            (t) => t.id !== tool.id
          );
          if (this.plugin.settings.defaultToolId === tool.id) {
            this.plugin.settings.defaultToolId =
              this.plugin.settings.tools[0].id;
          }
          await this.plugin.saveSettings();
          this.display();
        });
      });
    }
  }

  private showEditModal(tool: AIToolConfig) {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: `Edit: ${tool.name}` });

    new Setting(containerEl).setName("Display name").addText((text) => {
      text.setValue(tool.name).onChange((value) => {
        tool.name = value;
      });
    });

    new Setting(containerEl).setName("Command").addText((text) => {
      text.setPlaceholder("e.g. claude").setValue(tool.command).onChange((value) => {
        tool.command = value;
      });
    });

    new Setting(containerEl)
      .setName("Arguments")
      .setDesc("Space-separated arguments")
      .addText((text) => {
        text
          .setPlaceholder("e.g. --model opus")
          .setValue(tool.args.join(" "))
          .onChange((value) => {
            tool.args = value.trim() ? value.trim().split(/\s+/) : [];
          });
      });

    new Setting(containerEl)
      .addButton((btn) => {
        btn.setButtonText("Save").setCta().onClick(async () => {
          await this.plugin.saveSettings();
          this.display();
        });
      })
      .addButton((btn) => {
        btn.setButtonText("Cancel").onClick(() => {
          this.display();
        });
      });
  }
}
