---
title: "AI Agent 安装指南"
description: "面向 AI Agent 的 NocoBase CLI 安装和配置指南，包含环境检查、安装、初始化和校验的完整步骤。"
keywords: "NocoBase CLI,AI Agent,安装,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# AI Agent 安装指南

本页面是面向 AI Agent（比如 Claude Code、Codex、Cursor、Copilot 等）的安装指南。AI Agent 不需要执行 `nb init`（那是交互式的），而是通过 `nb init --ui` 让用户在浏览器中完成配置。

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

![nocobase cli 可视化向导](https://static-docs.nocobase.com/20260421160702.png)

告诉用户：浏览器会自动打开一个本地配置页面，在里面完成以下操作：

- 是否安装 [NocoBase Skills](https://github.com/nocobase/skills)（推荐安装）
- 选择是已有 NocoBase 还是全新安装
- 如果全新安装：选择安装方式（Docker / npm / Git）、配置数据库、设置端口等
- 如果已有 NocoBase：填写 API 地址、选择认证方式（推荐 OAuth）

等待用户在浏览器中完成所有配置。

## Step 5：校验结果

检查 `.nocobase/config.json` 确认环境已配好：

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

如果用户选择不安装，跳过即可。

安装了 Skills 的情况下，提示用户重启 AI Agent（比如重启 Claude Code 会话、重新打开 Cursor 等），以加载 Skills。重启后 AI Agent 就能帮你搭建应用、配置页面、管理权限等。
