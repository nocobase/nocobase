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
npm install -g @nocobase/cli@alpha
```

运行 `nb --version` 确认安装成功。

## Step 3：创建工作目录

```bash
mkdir my-nocobase
cd my-nocobase
```

## Step 4：运行 nb init --ui

```bash
nb init --ui
```

![nocobase cli 可视化向导](https://static-docs.nocobase.com/20260424121223.png)

告诉用户：浏览器会自动打开一个本地配置页面，需要用户在里面完成相关的配置操作。如果因为 sandbox 权限等问题无法自动打开浏览器的话，可以把输出的 URL 提供给用户，让用户自己复制到浏览器里打开执行。执行结束后让用户跟你确认后，可以继续后续的步骤。

注意：等待用户在浏览器中完成所有配置。请不要自行帮用户操作和填写任何信息，因为用户可能需要根据自己的环境和需求做出选择。

## Step 5：校验结果

```bash
nb env list
```

确认输出中有已配置的环境，且标记了当前环境（`*`）。

如果用户选择了全新安装，确认应用可访问：访问 `http://localhost:<port>`，默认端口 13000。默认登录账号 `admin@nocobase.com`，密码 `admin123`。

## Step 6：完成

告诉用户安装已完成。

检查项目目录下 `.agent/skills` 是否包含 nocobase 相关的 Skills。如果没有，询问用户是否安装 NocoBase Skills（方便后续让 AI Agent 操作 NocoBase CLI）。如果用户选择安装，执行：

```bash
npx skills add nocobase/skills -y
```

如果用户选择不安装，跳过即可，但是需要提醒用户，如果不安装 Skills 可能会导致后续 AI Agent 操作 NocoBase 受限。

安装了 Skills 的情况下，提示用户重启 AI Agent（比如重启 Claude Code 会话、重新打开 Cursor 等），以加载 Skills。重启后 AI Agent 就能帮你搭建应用、配置页面、管理权限等。

`nb` 的所有命令和参数说明请参阅 [CLI API 参考](../api/cli/cli)。

## 相关链接

- [快速开始](./quick-start.md) — 面向人类用户的安装和配置指南
- [AI 搭建快速开始](../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [AI 开发插件](../ai-dev/index.md) — 用 AI 辅助开发 NocoBase 插件
- [安全与审计](../ai-builder/security) — 认证方式、权限控制和操作审计
- [CLI API 参考](../api/cli/cli) — 所有命令的完整参数说明
- [NocoBase Skills](https://github.com/nocobase/skills) — AI Agent 领域知识包源码
