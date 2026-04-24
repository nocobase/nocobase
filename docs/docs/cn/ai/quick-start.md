---
title: "快速开始"
description: "NocoBase CLI 命令行工具：安装、初始化、构建运行、环境管理，几分钟内完成 NocoBase 的安装和配置。"
keywords: "NocoBase CLI,nb,命令行,安装,部署,快速开始"
sidebar: false
---

# 快速开始

以前，AI Agent 很难理解 NocoBase 的体系——没有标准的工具让它接入、读取和操作 NocoBase 的数据表、页面和工作流等等。

现在，NocoBase 全面支持 AI Agent 协同——你可以用自然语言完成数据建模、页面搭建、工作流编排、权限配置，甚至开发自定义插件。无论你使用 Claude Code、Codex、Cursor 还是其他 AI 工具，都可以通过以下两个基础组件与 NocoBase 协同工作：

- **[NocoBase CLI](../api/cli/cli)**——命令行工具（`nb` 命令），负责安装、管理和连接 NocoBase 应用。AI Agent 通过 CLI 执行创建数据表、搭建页面、管理环境等实际操作。
- **[NocoBase Skills](https://github.com/nocobase/skills)**——领域知识包，让 AI Agent 理解 NocoBase 的配置体系和开发规范。涵盖数据建模、界面配置、工作流管理、权限配置、插件开发等能力域。NocoBase CLI 在初始化过程中（`nb init`）会自动引导安装 Skills，不需要手动安装。

安装 CLI 并完成初始化后，AI Agent 就能直接操作你的 NocoBase 应用。

## 什么是 NocoBase CLI

NocoBase CLI（`nb` 命令）是一个用于在本地初始化、连接和管理 NocoBase 应用的命令行工具，支持让 AI Agent 连接并使用 NocoBase。

核心能力：

- **初始化与安装** — 一条命令完成 NocoBase 的下载、安装和启动
- **环境管理** — 同时管理本地开发、测试、生产等多个 NocoBase 环境
- **AI Agent 集成** — 通过 Skills 让 AI Agent 理解并操作 NocoBase

## 前置条件

在开始安装前，请确保已满足以下环境要求：

- Node.js 22
- Yarn 1.x

如果已有 NocoBase 实例，需要版本 >= 2.1.0-alpha.22。

如果为全新安装 NocoBase，还需确认以下条件：

- 数据库已准备好（PostgreSQL、MySQL、MariaDB 任选其一），或使用内置 Docker 数据库服务
- Docker（如使用 Docker 方式部署）
- Git（如通过源码方式安装）

## 一键 AI 安装

将下方提示词复制给你的 AI 助手（Claude Code、Codex、Cursor、Trae 等），它会自动完成安装和配置：

```
安装 NocoBase CLI 并快速开始 AI 搭建：https://docs.nocobase.com/cn/ai/ai-quick-start.md
```

如果你想手动安装，继续往下看。

## 手动安装

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

`nb init` 背后实际执行了多个步骤——安装 Skills、下载 NocoBase（`nb download`）、安装（`nb install`）和配置环境（`nb env add`）。如果你后续需要单独执行这些操作，可以查看 [CLI API 参考](../api/cli/cli)。

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
- [安装方式和版本对比](../get-started/quickstart) — NocoBase 的不同安装方式和版本通道
