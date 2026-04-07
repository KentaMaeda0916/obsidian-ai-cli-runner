export interface AIToolConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  icon?: string;
}

export interface AICLIPluginSettings {
  tools: AIToolConfig[];
  defaultToolId: string;
}

export const DEFAULT_TOOLS: AIToolConfig[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    command: "claude",
    args: [],
    icon: "terminal",
  },
  {
    id: "aider",
    name: "Aider",
    command: "aider",
    args: [],
    icon: "terminal",
  },
  {
    id: "gh-copilot",
    name: "Copilot CLI",
    command: "gh",
    args: ["copilot", "suggest"],
    icon: "terminal",
  },
];

export const DEFAULT_SETTINGS: AICLIPluginSettings = {
  tools: DEFAULT_TOOLS,
  defaultToolId: "claude-code",
};
