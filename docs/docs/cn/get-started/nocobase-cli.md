---
title: "NocoBase CLI"
description: "NocoBase CLI 命令行工具：安装、初始化、构建运行、环境管理、升级，支持 AI Agent 协同操作。"
keywords: "NocoBase CLI,nb,命令行,安装,部署,AI Agent,NocoBase"
---

# NocoBase CLI

## 什么是 NocoBase CLI

NocoBase CLI（`nb` 命令）是 NocoBase 的命令行管理工具。你可以用它完成从安装、构建到环境管理的完整流程，也可以配合 AI Agent 使用——让 AI 帮你搭建应用、管理环境、生成插件脚手架。

<!-- 需要一张 NocoBase CLI 和 NocoBase App 关系的架构图 -->

核心能力：

- **环境管理** — 同时管理本地开发、测试、生产等多个 NocoBase 环境
- **安装与构建** — 下载、安装、构建和启动 NocoBase
- **AI Agent 集成** — 通过 Skills 让 AI Agent 理解并操作 NocoBase

## 前置条件

在开始安装前，请确保已满足以下环境要求：

- Node.js >= 20
- Yarn 1.x

如果为全新安装 NocoBase，还需确认以下条件：

- 数据库已准备好，或使用内置 Docker 数据库服务
- Docker（如使用 Docker 方式部署）
- Git（如通过源码方式安装）

## 一键 AI 安装

将下方提示词复制给你的 AI 助手（Claude Code、Codex、Cursor、Trae 等），它会自动完成安装和配置：

```
帮我安装 NocoBase CLI 并启动应用：https://docs.nocobase.com/cn/get-started/nocobase-cli.md
```

如果你想手动安装，继续往下看。

## 快速开始（手动）

适合你自己在终端里操作。

> **给 AI 助手的提示：** 如果你是正在帮用户安装的 AI Agent，请直接跳转到[快速开始（AI Agent）](#快速开始ai-agent)，那里包含你需要执行的所有步骤。

### 第一步：安装 CLI

```bash
npm install -g @nocobase/cli@alpha
```

安装完成后，运行 `nb --version` 确认安装成功。

### 第二步：创建工作目录

```bash
mkdir my-nocobase
cd my-nocobase
```

### 第三步：初始化

三种方式任选：

**交互式向导（终端）**

```bash
nb init
```

在终端里逐步引导你完成配置：是否安装 [NocoBase Skills](https://github.com/nocobase/skills)、是否已有 NocoBase、安装方式选择等。

**可视化向导（浏览器）**

```bash
nb init --ui
```

会在本地启动一个临时 HTTP 服务并打开浏览器，在可视化界面里完成所有配置。

**一键安装**

```bash
nb init -y
```

跳过所有提示，使用默认配置：自动安装 Skills、用 Docker 方式安装 NocoBase、端口 13000。

安装完成后，打开浏览器访问 `http://localhost:13000`，默认的登录账号和密码：

- 邮箱：`admin@nocobase.com`
- 密码：`admin123`

:::tip 提示

不确定选哪种安装方式？Docker 最简单，数据库已经内置，适合快速体验。如果你需要开发插件或深度定制，用 create-nocobase-app 或 Git 源码安装（需要自己准备数据库，推荐 PostgreSQL）。

:::

`nb init` 背后实际执行了多个步骤——安装 Skills、下载 NocoBase（`nb download`）、安装（`nb install`）和配置环境（`nb env add`）。如果你后续需要单独执行这些操作，可以查看下面的[命令参考](#命令参考)。

## 快速开始（AI Agent）

适合通过 AI Agent（比如 Claude Code、Codex、Cursor、Copilot 等）协助安装。AI Agent 不需要执行 `nb init`（那是交互式的），而是通过 `nb init --ui` 让用户在浏览器中完成配置。

### Step 1：检查前置环境

确认用户已安装以下依赖：

- **Node.js v20 及以上**（运行 `node -v` 检查）。如果没有，引导用户通过 [nvm](https://github.com/nvm-sh/nvm)、[fnm](https://github.com/Schniz/fnm) 或 [Node.js 官网](https://nodejs.org/) 安装
- **Yarn 1.x**（运行 `yarn -v` 检查）。如果没有，通过 `npm install -g yarn` 安装
- **Git**（运行 `git --version` 检查）。如果没有，通过 [Git 官网](https://git-scm.com/) 安装
- **Docker**（如果用户需要用 Docker 方式安装 NocoBase）。运行 `docker -v` 检查，如果没有，引导用户通过 [Docker 官网](https://www.docker.com/get-started/) 安装

### Step 2：安装 CLI

```bash
npm install -g @nocobase/cli@alpha
```

运行 `nb --version` 确认安装成功。

### Step 3：创建工作目录

```bash
mkdir my-nocobase
cd my-nocobase
```

### Step 4：运行 nb init --ui

```bash
nb init --ui
```

告诉用户：浏览器会自动打开一个本地配置页面，在里面完成以下操作：

- 是否安装 [NocoBase Skills](https://github.com/nocobase/skills)（推荐安装）
- 选择是已有 NocoBase 还是全新安装
- 如果全新安装：选择安装方式（Docker / npm / Git）、配置数据库、设置端口等
- 如果已有 NocoBase：填写 API 地址、选择认证方式（推荐 OAuth）

等待用户在浏览器中完成所有配置。

### Step 5：校验结果

检查 `.nocobase/config.json` 确认环境已配好：

```bash
nb env list
```

确认输出中有已配置的环境，且标记了当前环境（`*`）。

如果用户选择了全新安装，确认应用可访问：访问 `http://localhost:<port>`，默认端口 13000。默认登录账号 `admin@nocobase.com`，密码 `admin123`。

### Step 6：完成

告诉用户安装已完成。如果安装了 Skills，提示用户重启 AI Agent（比如重启 Claude Code 会话、重新打开 Cursor 等），以加载 Skills。重启后 AI Agent 就能帮你搭建应用、配置页面、管理权限等。

## 构建与运行

### 本地环境

```bash
# 构建
nb build

# 启动（生产模式）
nb start

# 启动（开发模式，支持热更新）
nb dev
```

### 远程环境

远程环境需要通过 `--env` 指定环境名：

```bash
nb start --env=test
```

<!-- TODO: 补充端口配置、日志查看等详细说明 -->

## 升级

```bash
nb upgrade
```

<!-- TODO: 补充升级的详细流程和注意事项 -->

## 命令参考

### 初始化与安装

| 命令 | 说明 |
|------|------|
| `nb init` | 初始化工作目录（交互式向导） |
| `nb init --ui` | 初始化工作目录（浏览器可视化向导） |
| `nb init -y` | 初始化工作目录（跳过提示，使用默认配置） |
| `nb install` | 安装 NocoBase |
| `nb download` | 下载 NocoBase 源码或镜像 |
| `nb self-update` | 更新 NocoBase CLI 到最新版本 |

### 环境管理

| 命令 | 说明 |
|------|------|
| `nb env add` | 添加环境配置 |
| `nb env list` | 列出所有环境 |
| `nb env use <name>` | 切换当前环境 |
| `nb env auth [name]` | OAuth 认证 |
| `nb env update [name]` | 刷新环境运行时信息 |
| `nb env remove <name>` | 移除环境 |

### 构建与运行

| 命令 | 说明 |
|------|------|
| `nb build` | 构建 |
| `nb start` | 启动（生产模式） |
| `nb dev` | 启动（开发模式） |
| `nb upgrade` | 升级 |

### 脚手架

| 命令 | 说明 |
|------|------|
| `nb scaffold plugin <pkg>` | 生成插件脚手架 |
| `nb scaffold migration <name>` | 生成升级脚本脚手架 |

### API 操作

| 命令 | 说明 |
|------|------|
| `nb api resource list` | 列出资源记录 |
| `nb api resource get` | 获取单条记录 |
| `nb api resource create` | 创建记录 |
| `nb api resource update` | 更新记录 |
| `nb api resource destroy` | 删除记录 |
| `nb api resource query` | 聚合查询 |

<!-- TODO: 补充每个命令的详细参数和示例 -->

## 相关链接

- [AI 搭建](/cn/ai-builder) — 用 AI 从零搭建 NocoBase 应用，覆盖数据建模、界面配置到发布管理的全流程
- [AI 员工](/cn/ai-employees) — 与 AI 员工并肩协作，参与系统搭建、数据分析、翻译等业务场景
- [AI 开发](/cn/ai-dev) — 用 AI 辅助 NocoBase 插件开发，覆盖从脚手架到业务逻辑的全流程
- [安装方式和版本对比](/cn/get-started/quickstart) — 了解 NocoBase 的不同安装方式和版本通道（后续会逐步被 NocoBase CLI 替代）
- [插件开发](/cn/plugin-development) — 学习如何创建、发布与维护自定义插件
