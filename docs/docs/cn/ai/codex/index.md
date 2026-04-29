---
title: "用 Codex 操作 NocoBase，搭建开发两不误"
description: "将 OpenAI 官方 AI 编程助手 Codex 接入 NocoBase，通过 Skills 和 CLI 用自然语言操作你的业务系统。"
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,自然语言"
sidebar: false
---

:::warning 内容撰写中

本页内容还在撰写中，部分章节可能不完整或有变动。

:::

# 用 Codex 操作 NocoBase，搭建开发两不误

[Codex](https://github.com/openai/codex) 是 OpenAI 推出的官方 AI 编程助手——在终端里运行，能读写代码、执行命令、帮你完成从编码到系统搭建的各种任务。把它接入 NocoBase 后，你可以用自然语言创建数据表、搭建页面、配置工作流，借助 GPT 系列模型的能力快速搭建业务系统。

<!-- 需要一张 Codex 在终端中操作 NocoBase 的截图 -->

## 什么是 Codex

Codex 是 OpenAI 推出的 CLI 形态的 AI Agent，背后是 GPT 系列模型（包括 o3、o4-mini 等）。它在本地沙箱环境中运行，能安全地执行代码和命令。核心特点：

- **GPT 系列加持**——基于 OpenAI 最新模型，擅长代码生成和任务规划
- **沙箱执行**——在隔离的沙箱中运行命令，安全可控
- **多模态理解**——支持文本、图片等多种输入，能理解截图中的 UI 布局
- **灵活的自主级别**——从建议模式到全自动模式，你来决定 AI 的自主程度

## 为什么选 Codex

如果你在选择哪个 AI Agent 来操作 NocoBase，下面是 Codex 最适合的场景：

- **已在使用 OpenAI 生态**——如果你有 ChatGPT Plus/Pro 订阅或 OpenAI API Key，Codex 是最自然的选择
- **看重安全性**——沙箱执行机制确保 AI 的操作不会意外影响你的系统
- **需要灵活控制**——可以根据任务复杂度切换自主级别，简单任务全自动、敏感操作需确认
- **喜欢 OpenAI 模型风格**——GPT 系列在任务规划和分步执行方面有自己的优势

## 连接原理

Codex 通过以下方式与 NocoBase 协同工作：

```
你（终端 / ...）
  │
  └─→ Codex
        │
        ├── NocoBase Skills（让 Agent 理解 NocoBase 配置体系）
        │
        └── NocoBase CLI（执行创建、修改、部署等操作）
              │
              └─→ NocoBase 服务（你的业务系统）
```

- **NocoBase Skills**——领域知识包，让 Codex 知道怎么操作 NocoBase
- **NocoBase CLI**——命令行工具，实际执行数据建模、页面搭建等操作
- **NocoBase 服务**——你运行中的 NocoBase 实例

## 前置条件

开始之前，确保你准备好了以下环境：

- 已安装 Codex（`npm install -g @openai/codex`）
- Node.js >= 22（用于运行 NocoBase CLI 和 Skills）
- 如果已有 NocoBase 实例，**由于 AI 能力迭代快速，目前仅 beta 最新版本支持完整体验，最低版本要求 >= 2.1.0-beta.20，强烈建议更新到最新版本。**

## 快速开始

### 一键 AI 安装

将下方提示词复制给 Codex，它会自动完成 NocoBase CLI 安装、初始化和环境配置：

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

<!-- TODO: 整理 5-8 个常见问题。比如：如何配置 OpenAI API Key、Codex 支持哪些模型、自主级别怎么选、Skills 安装失败怎么办等 -->

## 相关链接

- [NocoBase CLI](../quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建快速开始](../../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [Codex GitHub](https://github.com/openai/codex) — Codex 源码和文档
- [Claude Code + NocoBase](../claude-code/index.md) — Anthropic 官方 AI 编程助手
- [OpenCode + NocoBase](../opencode/index.md) — 开源、支持 75+ 模型的终端 AI Agent
