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

- **Node.js 22**（运行 `node -v` 检查）。如果没有，引导用户通过 [nvm](https://github.com/nvm-sh/nvm)、[fnm](https://github.com/Schniz/fnm) 或 [Node.js 官网](https://nodejs.org/) 安装
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

在第三步创建或者选择的工作目录里运行这个命令（该命令默认有 30 分钟超时时间，请不要中途打断，以及不要重复运行）：

```bash
nb init --ui
```

![nocobase cli 可视化向导](https://static-docs.nocobase.com/20260424121223.png)

告诉用户：浏览器会自动打开一个本地配置页面，需要用户在里面完成相关的配置操作。如果因为 sandbox 权限等问题无法自动打开浏览器的话，可以把输出的 URL 提供给用户，让用户自己复制到浏览器里打开执行。执行结束后让用户跟你确认后，可以继续后续的步骤。

注意：

- `nb init --ui` 这个命令超时时间 30 分钟，运行中不能打断。如果用户在 30 分钟内没有完成浏览器里的配置，CLI 会自动退出。这个命令退出前，请不要重复运行。
- 如果沙箱里 URL 打不开时先提示提权，拒绝后把 URL给用户
- 用户自己填写浏览器里的安装表单，agent 只负责提示和引导
- 等待用户在浏览器中完成所有配置。请不要自行帮用户操作和填写任何信息，因为用户可能需要根据自己的环境和需求做出选择。

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
