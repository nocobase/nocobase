---
title: "NocoBase CLI"
description: "NocoBase CLI 命令行工具：安装、初始化、构建运行、环境管理、升级，支持 AI Agent 协同操作。"
keywords: "NocoBase CLI,nb,命令行,安装,部署,AI Agent,NocoBase"
sidebar: false
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

- Node.js 22
- Yarn 1.x

如果已有 NocoBase 实例，需要版本 >= 2.1.0-alpha.21。

如果为全新安装 NocoBase，还需确认以下条件：

- 数据库已准备好（PostgreSQL、MySQL、MariaDB 任选其一），或使用内置 Docker 数据库服务
- Docker（如使用 Docker 方式部署）
- Git（如通过源码方式安装）

## 一键 AI 安装

将下方提示词复制给你的 AI 助手（Claude Code、Codex、Cursor、Trae 等），它会自动完成安装和配置：

```
安装 NocoBase CLI 并快速开始 AI 搭建：https://docs.nocobase.com/cn/get-started/nocobase-cli.md
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

在终端里逐步引导你完成配置：是否安装 [NocoBase Skills](https://github.com/nocobase/skills)（推荐安装）、是否已有 NocoBase、安装方式选择等。

:::tip 提示

如果初始化时跳过了 Skills 安装，后续可以随时手动补装：

```bash
npx skills add nocobase/skills -y
```

安装后重启 AI Agent（比如重启 Claude Code 会话、重新打开 Cursor 等）即可生效。

:::

**可视化向导（浏览器）**

```bash
nb init --ui
```

会在本地启动一个临时 HTTP 服务并打开浏览器，在可视化界面里完成所有配置。

![nocobase cli 可视化向导](https://static-docs.nocobase.com/20260421160702.png)

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

- **Node.js 22**（运行 `node -v` 检查）。如果没有，引导用户通过 [nvm](https://github.com/nvm-sh/nvm)、[fnm](https://github.com/Schniz/fnm) 或 [Node.js 官网](https://nodejs.org/) 安装
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

![nocobase cli 可视化向导](https://static-docs.nocobase.com/20260421160702.png)

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

告诉用户安装已完成。

检查项目目录下 `.agent/skills` 是否包含 nocobase 相关的 Skills。如果没有，询问用户是否安装 NocoBase Skills（方便后续让 AI Agent 操作 NocoBase CLI）。如果用户选择安装，执行：

```bash
npx skills add nocobase/skills -y
```

如果用户选择不安装，跳过即可。

安装了 Skills 的情况下，提示用户重启 AI Agent（比如重启 Claude Code 会话、重新打开 Cursor 等），以加载 Skills。重启后 AI Agent 就能帮你搭建应用、配置页面、管理权限等。

## 接下来

### 管理应用环境

如果你需要管理已有的 NocoBase 实例（比如测试环境、生产环境），或者管理多个环境之间的切换，请参阅 [环境管理](../ai-builder/env-bootstrap)——涵盖环境检查、添加环境、升级和故障诊断。

### 开始 AI 搭建

用自然语言描述需求，AI 帮你完成数据建模、页面搭建、工作流编排——从一句话到一整套业务系统。请参阅 [AI 搭建快速开始](../ai-builder/index.md)。

### 继续 AI 开发插件

如果你需要开发自定义插件，AI 同样能帮上忙——从脚手架生成到组件代码、业务逻辑，覆盖插件开发的完整流程。请参阅 [AI 开发插件](../ai-dev/index.md)。

### 使用 AI 员工

在 NocoBase 界面里直接和 AI 员工协作——数据分析、生成报告、翻译、决策辅助，不需要离开业务系统。请参阅 [AI 员工](../ai-employees/index.md)。

### 命令参考

所有 `nb` 命令的完整参数说明请参阅 [CLI API 参考](../api/cli/cli)。

## 相关链接

- [AI 搭建](../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [AI 开发插件](../ai-dev/index.md) — 用 AI 辅助开发 NocoBase 插件
- [AI 员工](../ai-employees/index.md) — 在业务界面中与 AI 协作
- [环境管理](../ai-builder/env-bootstrap) — 环境检查、添加环境、升级和故障诊断
- [CLI API 参考](../api/cli/cli) — 所有命令的完整参数说明
- [安装方式和版本对比](./quickstart) — NocoBase 的不同安装方式和版本通道
