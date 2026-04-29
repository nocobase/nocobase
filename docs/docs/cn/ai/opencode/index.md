---
title: "OpenCode + NocoBase：开源、自由、不被绑定的 NocoBase 搭建方式"
description: "将开源 AI 编程助手 OpenCode 接入 NocoBase，自由选择模型，用自然语言操作你的业务系统。"
keywords: "OpenCode,NocoBase,AI Agent,开源,多模型,Skills,CLI,自然语言"
sidebar: false
---

:::warning 内容撰写中

本页内容还在撰写中，部分章节可能不完整或有变动。

:::

# OpenCode + NocoBase：开源、自由、不被绑定的 NocoBase 搭建方式

[OpenCode](https://github.com/opencode-ai/opencode) 是一个开源的终端 AI Agent——支持 75+ 模型（Claude、GPT、Gemini、DeepSeek 等），不绑定任何供应商，你可以自由选择最适合的模型。把它接入 NocoBase 后，你可以用自然语言创建数据表、搭建页面、配置工作流，同时保持对模型选择和成本的完全控制。

<!-- 需要一张 OpenCode 在终端中操作 NocoBase 的截图 -->

## 什么是 OpenCode

OpenCode 由 Anomaly Innovations 开发（GitHub 140k+ Star），定位是「不绑定供应商的终端 AI Agent」。它用 Go 编写，提供精美的 TUI 界面。核心特点：

- **75+ 模型支持**——Claude、GPT、Gemini、DeepSeek、本地模型等，自由切换
- **零供应商锁定**——自带 API Key，按实际用量付费，不需要额外订阅
- **多 Agent 架构**——内置 Build、Plan、Review、Debug、Docs 五种 Agent 角色
- **隐私优先**——不存储代码或上下文，所有数据留在本地

OpenCode 还支持 VS Code、JetBrains、Zed、Neovim 等编辑器集成，也有独立的桌面应用。

## 为什么选 OpenCode

如果你在选择哪个 AI Agent 来操作 NocoBase，下面是 OpenCode 最适合的场景：

- **不想被单一模型绑定**——今天用 Claude，明天切 GPT，后天试 DeepSeek，一个工具搞定
- **注重成本控制**——自带 API Key 按量付费，支持使用现有的 ChatGPT Plus 订阅
- **对隐私有要求**——代码和上下文不经过第三方，支持本地模型
- **喜欢高度可定制**——YAML 配置自定义 Agent 行为，满足团队特殊需求

## 连接原理

OpenCode 通过以下方式与 NocoBase 协同工作：

```
你（终端 / VS Code / JetBrains / ...）
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills（让 Agent 理解 NocoBase 配置体系）
        │
        └── NocoBase CLI（执行创建、修改、部署等操作）
              │
              └─→ NocoBase 服务（你的业务系统）
```

- **NocoBase Skills**——领域知识包，让 OpenCode 知道怎么操作 NocoBase
- **NocoBase CLI**——命令行工具，实际执行数据建模、页面搭建等操作
- **NocoBase 服务**——你运行中的 NocoBase 实例

## 前置条件

开始之前，确保你准备好了以下环境：

- 已安装 OpenCode（[安装指南](https://opencode.ai/docs/)）
- Node.js >= 22（用于运行 NocoBase CLI 和 Skills）
- 如果已有 NocoBase 实例，**由于 AI 能力迭代快速，目前仅 beta 最新版本支持完整体验，最低版本要求 >= 2.1.0-beta.20，强烈建议更新到最新版本。**

## 快速开始

### 一键 AI 安装

将下方提示词复制给 OpenCode，它会自动完成 NocoBase CLI 安装、初始化和环境配置：

```
帮我安装 NocoBase CLI 并完成初始化：https://docs.nocobase.com/cn/ai/ai-quick-start.md （请直接访问链接内容）
```

### 手动安装

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

浏览器会自动打开可视化配置页面，引导你安装 NocoBase Skills、配置数据库并启动应用。详细步骤请参阅[快速开始](../quick-start.md)。

安装完成后，运行 `nb env list` 确认环境运行状态：

```bash
nb env list
```

确认输出中有已配置的环境，以及运行状态。

## 常见问题

<!-- TODO: 整理 5-8 个常见问题。比如：如何配置不同模型的 API Key、怎么切换模型、如何使用本地模型、Skills 安装失败怎么办等 -->

## 相关链接

- [NocoBase CLI](../quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建快速开始](../../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [OpenCode 官方文档](https://opencode.ai/docs/) — OpenCode 完整使用指南
- [Claude Code + NocoBase](../claude-code/index.md) — Anthropic 官方 AI 编程助手
- [Codex + NocoBase](../codex/index.md) — OpenAI 官方 AI 编程助手
