# AI CLI Runner

一款 [Obsidian](https://obsidian.md) 插件，可在 Obsidian 内置的终端面板中直接运行 Claude Code、aider 等 AI CLI 工具。

> **支持平台：** 仅限 macOS（Apple Silicon 和 Intel）。Windows/Linux 支持正在规划中。

**[English](../README.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md)**

---

## 功能特性

- 内置终端面板（xterm.js + node-pty）— 无需外部终端
- 启动 Claude Code、aider、GitHub Copilot CLI 或任意自定义 CLI 工具
- 工具选择器 + 启动/停止按钮的紧凑工具栏
- 分屏终端：并排打开多个面板
- 从 Obsidian 文件浏览器拖放文件到终端以插入文件路径
- 工作目录自动设置为当前活动笔记所在的文件夹
- 支持 Kitty 键盘协议（Claude Code TUI 所需）
- 完全可配置：在设置中添加、编辑或删除工具

## 系统要求

- macOS（Apple Silicon 或 Intel）
- 需要使用的 CLI 工具必须已安装并在 Shell PATH 中可用（`.zshrc` / `.zprofile`）

## 安装

### 手动安装

1. 前往 [Releases](https://github.com/KentaMaeda0916/obsidian-ai-cli-runner/releases) 页面下载 `obsidian-ai-cli-runner.zip`
2. 解压 zip 文件，将 `obsidian-ai-cli-runner` 文件夹移动到 `<vault>/.obsidian/plugins/`
3. 重新加载 Obsidian，在 **设置 → 第三方插件** 中启用插件
4. 点击 ▶ 启动工具 — 所需的原生二进制文件将在首次使用时自动下载

> 无需代码签名步骤或移除隔离属性。

## 使用方法

| 操作 | 方式 |
|------|------|
| 打开终端面板 | 点击左侧边栏的 ✨ 图标，或命令面板 → **Open AI CLI panel** |
| 启动工具 | 从下拉菜单选择 → 点击 ▶ |
| 停止运行中的工具 | 点击 ■ |
| 分屏终端 | 点击分列图标 |
| 关闭面板 | 点击回收站图标 |
| 插入文件路径 | 从文件浏览器拖放文件到终端 |

## 配置

前往 **设置 → AI CLI Runner** 可以：

- 设置创建新面板时打开的默认工具
- 添加自定义工具（任意 CLI 命令及可选参数）
- 编辑或删除现有工具

### 添加自定义工具示例

| 字段 | 值 |
|------|-----|
| 显示名称 | `My Tool` |
| 命令 | `mytool` |
| 参数 | `--flag value` |

## 工作原理

插件通过 `node-pty` 嵌入 PTY（伪终端），使用 `xterm.js` 进行渲染。每个工具通过登录 Shell（`$SHELL -i -l -c <command>`）启动，因此 Shell 配置（PATH、别名等）完全可用。

首次启动时，会从插件的 GitHub Releases 下载一个小型原生二进制文件（`pty.node`）。这避免了捆绑预签名二进制文件时出现的 macOS Gatekeeper 问题，且仅下载一次。

## 故障排除

**首次启动时显示 "Failed to download pty binary"**
- 检查网络连接
- 插件仅在首次启动时从 GitHub 下载小型原生二进制文件

**显示 "Failed to start \<command\>"**
- 确认命令已安装：在终端运行 `which <command>`
- 检查 `.zshrc` 或 `.zprofile` 确保命令在 PATH 中

**Shift+Enter 无效**
- 插件为 Shift+Enter 发送 Kitty 键盘协议转义序列。请确保使用支持该协议的 CLI 工具版本。

## 许可证

MIT — 参见 [LICENSE](../LICENSE)
