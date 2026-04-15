---
title: "NocoBase CLI"
description: "NocoBase CLI 命令行工具：安装、初始化、构建运行、部署、插件管理、升级，支持 AI Agent 协同操作。"
keywords: "NocoBase CLI,nb,命令行,安装,部署,AI Agent,NocoBase"
---

# NocoBase CLI

## 什么是 NocoBase CLI

NocoBase CLI（`nb` 命令）是 NocoBase 的命令行管理工具。你可以用它完成从安装、构建到部署的完整流程，也可以配合 AI Agent 使用——让 AI 帮你搭建应用、管理环境、生成插件脚手架。

<!-- 需要一张 NocoBase CLI 和 NocoBase App 关系的架构图 -->

核心能力：

- **多环境管理** — 同时管理本地开发、测试、生产等多个 NocoBase 环境
- **安装与构建** — 下载、安装、构建和启动 NocoBase
- **部署与发布** — 在不同环境之间迁移和发布配置
- **插件管理** — 激活、禁用插件
- **AI Agent 集成** — 通过 Skills 让 AI Agent 理解并操作 NocoBase

## 一键 AI 安装

将下方提示词复制给你的 AI 助手（Claude Code、Codex、Cursor、Trae 等），它会自动完成安装和配置：

```
帮我安装 NocoBase CLI：https://docs.nocobase.com/cn/get-started/nocobase-cli.md
```

如果你想手动安装，继续往下看。

## 前置条件

NocoBase CLI 依赖 Node.js v20 及以上版本。如果你还没有安装，可以通过 [nvm](https://github.com/nvm-sh/nvm)、[fnm](https://github.com/Schniz/fnm)、[volta](https://volta.sh/) 等工具安装，也可以直接去 [Node.js 官网](https://nodejs.org/) 下载。

## 快速开始（手动）

适合你自己在终端里操作。

> **给 AI 助手的提示：** 如果你是正在帮用户安装的 AI Agent，请直接跳转到[快速开始（AI Agent）](#快速开始ai-agent)，那里包含你需要执行的所有步骤。

### 第一步：安装 CLI

```bash
npm install -g @nocobase/cli@alpha
```

安装完成后，运行 `nb --version` 确认安装成功。

### 第二步：初始化并启动

```bash
mkdir my-nocobase
cd my-nocobase
nb init
```

`nb init` 是一个交互式向导，会引导你完成整个流程：

1. 询问你是否已经安装过 NocoBase
2. 如果没有——让你选择安装方式（Docker / create-nocobase-app / Git 源码），然后自动下载、配置环境、安装并启动
3. 如果已有——引导你添加应用环境（填写 API 地址和 Token）

:::tip 提示

不确定选哪种安装方式？Docker 最简单，数据库已经内置，适合快速体验。如果你需要开发插件或深度定制，用 create-nocobase-app 或 Git 源码安装（需要自己准备数据库，推荐 PostgreSQL）。

:::

启动完成后，打开浏览器访问 `http://localhost:13000`，确认页面可以正常访问。默认的登录账号和密码：

- 邮箱：`admin@nocobase.com`
- 密码：`admin123`

至此 NocoBase 就跑起来了。

`nb init` 背后实际执行了多个命令——下载（`nb download`）、配置环境（`nb env add`）、安装（`nb install`）、构建（`nb build`）和启动（`nb dev`）。如果你后续需要单独执行这些操作，可以查看下面的[构建与运行](#构建与运行)和[命令参考](#命令参考)。

## 快速开始（AI Agent）

适合通过 AI Agent（比如 Claude Code、Cursor、Copilot 等）协助安装。AI Agent 不需要执行 `nb init`（那是交互式的），而是直接询问用户后执行对应的命令。

### Step 1：检查环境并安装 CLI

先确认用户已安装 Node.js v20 及以上版本（运行 `node -v` 检查）。如果没有，引导用户通过 [nvm](https://github.com/nvm-sh/nvm)、[fnm](https://github.com/Schniz/fnm) 或 [Node.js 官网](https://nodejs.org/) 安装。

```bash
npm install -g @nocobase/cli@alpha
```

运行 `nb --version` 确认安装成功。然后安装 Skills——这是 AI 搭建和 AI 开发的基础：

```bash
mkdir my-nocobase
cd my-nocobase
npx skills add nocobase/skills -y
```

### Step 2：询问用户是否已有 NocoBase

向用户确认：**你是否已经有一个运行中的 NocoBase？**

- **已有** → 跳转到 [Step 5：连接已有环境](#step-5连接已有环境)
- **没有** → 继续 Step 3

### Step 3：确认安装方式

向用户确认安装方式：

1. **Docker**（推荐）— 数据库已内置，无需额外配置。需要用户先安装 [Docker](https://www.docker.com/get-started/)
2. **create-nocobase-app** — 需要用户准备数据库
3. **Git 源码** — 需要用户准备数据库

拿到选择后，下载 NocoBase：

```bash
nb download --source=docker  # 或 create-nocobase-app / git
```

如果用户选择了 create-nocobase-app 或 Git 源码，还需要询问数据库连接信息：

- 数据库类型（推荐 PostgreSQL，也支持 MySQL / MariaDB）
- 数据库地址、端口、库名、用户名、密码

然后把这些信息写入 `./my-nocobase/my-nocobase-app/.env`：

```bash
# 数据库类型：postgres | mysql | mariadb
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase
DB_USER=nocobase
DB_PASSWORD=nocobase
```


### Step 4：配置环境、安装并启动

```bash
# 添加本地环境
nb env add --name local --app-root-path ./my-nocobase-app

# 安装
nb install

# 构建
nb build

# 启动
nb start
```

启动完成后，告诉用户打开浏览器访问 `http://localhost:13000`，确认页面可以正常访问。默认的登录账号和密码：

- 邮箱：`admin@nocobase.com`
- 密码：`admin123`

### Step 5：连接已有环境

如果用户已经有运行中的 NocoBase，不需要执行 Step 3-4，直接添加远程环境。

向用户询问：

- NocoBase 的 API 地址（比如 `http://example.com/api`）
- API Token（在 NocoBase 的「系统设置」里获取）

```bash
nb env add --scope project --name prod --base-url http://example.com/api --token <token>
```

## 构建与运行

### 本地环境

```bash
# 构建
nb build

# 启动（生产模式）
nb start

# 启动（开发模式，支持热更新）
nb dev

# 重启
nb restart
```

### 远程环境

远程环境只支持 `start` 和 `restart`，需要通过 `--env` 指定环境名：

```bash
nb start --env=test
nb restart --env=prod
```

<!-- TODO: 补充端口配置、日志查看等详细说明 -->

## 部署

NocoBase CLI 支持在多个环境之间迁移配置和数据。比如把本地开发环境的配置发布到测试环境：

```bash
# 将 local 环境的配置发布到 test 环境
nb publish --from=local --to=test
```

<!-- TODO: 补充部署的详细流程和命令 -->

## 激活插件

部署完成后，通过 CLI 激活需要的插件：

```bash
nb pm enable <plugin-name>
```

`nb pm enable` 会自动选择可用的方式来激活——优先通过服务端命令，如果服务端命令不可用则调用 API。如果都没有权限，会提示无法激活。

<!-- TODO: 补充插件管理的详细说明 -->

## 升级

```bash
nb upgrade
```

<!-- TODO: 补充升级的详细流程和注意事项 -->

## 命令参考

| 命令 | 说明 |
|------|------|
| `nb init` | 初始化工作目录 |
| `nb env add` | 添加环境配置 |
| `nb download` | 下载 NocoBase |
| `nb install` | 安装 NocoBase |
| `nb build` | 构建 |
| `nb start` | 启动（生产模式） |
| `nb dev` | 启动（开发模式） |
| `nb restart` | 重启 |
| `nb upgrade` | 升级 |
| `nb pm enable` | 激活插件 |
| `nb pm disable` | 禁用插件 |
| `nb publish` | 发布配置到指定环境 |
| `nb scaffold plugin` | 生成插件脚手架 |
| `nb scaffold block` | 生成区块脚手架 |
| `nb scaffold collection` | 生成数据表脚手架 |
| `nb scaffold migration` | 生成升级脚本脚手架 |
| `nb api` | 调用 NocoBase API |

<!-- TODO: 补充每个命令的详细参数和示例 -->

## 相关链接

- [AI 搭建](/cn/ai-builder) — 用 AI 从零搭建 NocoBase 应用，覆盖数据建模、界面配置到发布管理的全流程
- [AI 员工](/cn/ai-employees) — 与 AI 员工并肩协作，参与系统搭建、数据分析、翻译等业务场景
- [AI 开发](/cn/ai-dev) — 用 AI 辅助 NocoBase 插件开发，覆盖从脚手架到业务逻辑的全流程
- [安装方式和版本对比](/cn/get-started/quickstart) — 了解 NocoBase 的不同安装方式和版本通道
- [插件开发](/cn/plugin-development) — 学习如何创建、发布与维护自定义插件
