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

- **Node.js >= 22**（运行 `node -v` 检查）
- **Yarn 1.x**（运行 `yarn -v` 检查）。如果没有，通过 `npm install -g yarn` 安装
- **Git**（运行 `git --version` 检查）。如果没有，通过 [Git 官网](https://git-scm.com/) 安装
- **Docker**（如果用户需要用 Docker 方式安装 NocoBase）。运行 `docker -v` 检查，如果没有，并且用户需要使用 Docker，则引导用户通过 [Docker 官网](https://www.docker.com/get-started/) 安装，否则跳过。

如果前置环境不满足，告诉用户需要先安装缺失的依赖，并提供安装链接和简单的安装指导。确认所有前置环境都满足后，继续下一步安装 CLI。

## Step 2：安装 CLI

如果用户环境里已经安装了 NocoBase CLI（运行 `nb --version` 检查），直接进入下一步。如果没有，运行以下命令安装：

```bash
npm install -g @nocobase/cli@beta
```

运行 `nb --version` 确认安装成功。

## Step 3：运行初始化命令

**⚠️ 重要：你必须严格运行下面这条命令，不得修改、替换或省略 `--ui` 参数。不要尝试用"非交互模式"或者自行拼参数来"加速"这个过程——`--ui` 是唯一正确的初始化方式。**

```bash
nb init --ui
```

这条命令会启动一个浏览器可视化向导，用户需要在浏览器里完成所有配置（包括安装方式、数据库、管理员账号等）。你作为 AI Agent 的职责是：

1. **只运行 `nb init --ui`**，不附加任何额外参数
2. **告诉用户**浏览器会自动打开一个本地配置页面，需要在里面完成配置
3. **如果浏览器无法自动打开**（比如沙箱权限限制），把命令输出的 URL 提供给用户，让用户手动复制到浏览器打开
4. **等待用户确认**配置已完成，再继续下一步。这个命令默认会有 30 分钟的超时时间，超时时间内请不要重复运行这个命令。

## Step 4：校验结果

```bash
nb env list
```

确认输出中有已配置的环境，以及运行状态。然后提醒用户可以打开正在运行的 NocoBase 实例 URL，用配置的账号、密码登录。

## Step 5：完成

告诉用户安装已完成。CLI 配置保存在全局目录（默认 `~/.nocobase/`），AI Agent 可以在任意目录下访问，无需进入特定工作目录。
