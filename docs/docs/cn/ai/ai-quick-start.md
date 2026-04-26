---
title: "AI Agent 安装指南"
description: "面向 AI Agent 的 NocoBase CLI 安装和配置指南，包含环境检查、安装、初始化和校验的完整步骤。"
keywords: "NocoBase CLI,AI Agent,安装,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# AI Agent 安装指南

本页面是面向 AI Agent（比如 Claude Code、Codex、Cursor、Copilot 等）的 NocoBase CLI 安装和初始化指南。

如果你是人类用户，请参阅 [快速开始](./quick-start.md)。

## Step 1：检查前置环境

确认用户已安装以下依赖：

- **Node.js >= 22**（运行 `node -v` 检查）。如果当前版本低于 22：
  1. 先检查用户系统中是否已安装 Node 版本管理工具（依次运行 `nvm --version`、`fnm --version`、`volta --version`）
  2. 如果检测到其中任一工具，直接用它切换到 Node.js 22（例如 `nvm install 22 && nvm use 22`、`fnm install 22 && fnm use 22`、`volta install node@22`）
  3. 如果没有版本管理工具，引导用户通过 [Node.js 官网](https://nodejs.org/) 下载安装 Node.js >= 22
- **Yarn 1.x**（运行 `yarn -v` 检查）。如果没有，通过 `npm install -g yarn` 安装
- **Git**（运行 `git --version` 检查）。如果没有，通过 [Git 官网](https://git-scm.com/) 安装
- **Docker**（如果用户需要用 Docker 方式安装 NocoBase）。运行 `docker -v` 检查，如果没有，引导用户通过 [Docker 官网](https://www.docker.com/get-started/) 安装

## Step 2：安装 CLI

```bash
npm install -g @nocobase/cli@beta
```

运行 `nb --version` 确认安装成功。

## Step 3：创建工作目录

询问用户是否以当前目录作为工作目录？需要告诉用户如果以当前目录作为工作目录，后续 CLI 会在当前目录下创建 `.nocobase` 、`.agents` 等相关文件、文件夹。如果用户选择不以当前目录作为工作目录，则提示用户你会在当前目录默认创建一个 `my-nocobase` 的目录作为工作目录，并在里面进行后续的 CLI 初始化和配置。如果用户同意就继续：

```bash
mkdir my-nocobase
cd my-nocobase
```

如果用户不同意，则需要用户提供一个目录路径，你会在用户提供的目录下进入下一步初始化。

## Step 4：运行 nb init --ui

**⚠️ 重要：你必须严格运行下面这条命令，不得修改、替换或省略 `--ui` 参数。禁止使用 `nb init` 的任何其他参数组合（如 `--yes`、`--env`、`--source`、`--version`、`--builtin-db` 等）来代替 `--ui`。不要尝试用"非交互模式"或者自行拼参数来"加速"这个过程——`--ui` 是唯一正确的初始化方式。**

在第三步创建或者选择的工作目录里运行：

```bash
nb init --ui
```

![nocobase cli 可视化向导](https://static-docs.nocobase.com/20260424121223.png)

这条命令会启动一个浏览器可视化向导，用户需要在浏览器里完成所有配置（包括安装方式、数据库、管理员账号等）。你作为 AI Agent 的职责是：

1. **只运行 `nb init --ui`**，不附加任何额外参数
2. **告诉用户**浏览器会自动打开一个本地配置页面，需要在里面完成配置
3. **如果浏览器无法自动打开**（比如沙箱权限限制），把命令输出的 URL 提供给用户，让用户手动复制到浏览器打开
4. **等待用户确认**配置已完成，再继续下一步

禁止事项：

- **禁止**自行拼接 `nb init` 的其他参数来替代 `--ui`
- **禁止**帮用户选择安装方式、数据库类型、填写账号密码等——这些都由用户在浏览器里自己操作
- **禁止**中途打断或重复运行此命令（超时时间 30 分钟，命令退出前不要重复执行）

## Step 5：校验结果

```bash
nb ps
```

确认输出中有已配置的环境，以及运行状态。然后提醒用户可以打开正在运行的 NocoBase 实例 URL，用配置的账号、密码登录。


## Step 6：完成

告诉用户安装已完成。如果用户是使用图形化界面的 AI Agent（比如 Claude Code Desktop、Cursor、Codex App 等），需要把 CLI 初始化的目录（如 `my-nocobase`）添加为工具的工作目录，这样 AI Agent 才能访问到 CLI 配置和 NocoBase 的运行环境等信息。这些都需要告知用户。

`nb` 的所有命令和参数说明请参阅 [NocoBase CLI 参考](../api/cli/cli)。

## 相关链接

- [快速开始](./quick-start.md) — 面向人类用户的安装和配置指南
- [AI 搭建快速开始](../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [AI 开发插件](../ai-dev/index.md) — 用 AI 辅助开发 NocoBase 插件
- [安全与审计](../ai-builder/security) — 认证方式、权限控制和操作审计
- [NocoBase CLI 参考](../api/cli/cli) — 所有命令的完整参数说明
- [NocoBase Skills](https://github.com/nocobase/skills) — AI Agent 领域知识包源码
