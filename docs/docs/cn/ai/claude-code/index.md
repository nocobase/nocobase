---
title: "Claude Code + NocoBase：最强 AI 大脑，你的 NocoBase 首席架构师"
description: "将 Anthropic 官方 AI 编程助手 Claude Code 接入 NocoBase，通过 Skills 和 CLI 用自然语言操作你的业务系统。"
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,自然语言"
sidebar: false
---

:::warning 内容撰写中

本页内容还在撰写中，部分章节可能不完整或有变动。

:::

# Claude Code + NocoBase：最强 AI 大脑，你的 NocoBase 首席架构师

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 是 Anthropic 推出的官方 AI 编程助手——直接在终端里运行，能理解你的整个代码库，帮你完成从编码到系统搭建的各种任务。把它接入 NocoBase 后，你可以用自然语言创建数据表、搭建页面、配置工作流，享受最强大的 AI 模型带来的搭建体验。

<!-- 需要一张 Claude Code 在终端中操作 NocoBase 的截图 -->

## 什么是 Claude Code

Claude Code 是 Anthropic 推出的 CLI 形态的 AI Agent，背后是 Claude 系列模型。它直接运行在终端里，能理解项目上下文并执行操作。核心特点：

- **顶级模型能力**——基于 Claude Opus / Sonnet，在代码理解和生成方面表现领先
- **终端原生**——直接在终端运行，和开发者的工作流无缝衔接
- **项目感知**——自动理解项目结构、依赖关系和代码规范
- **多工具协同**——支持读写文件、执行命令、搜索代码等操作

Claude Code 还支持 VS Code、JetBrains 等 IDE 集成，也可以作为独立的桌面应用和 Web 应用使用。

## 为什么选 Claude Code

如果你在选择哪个 AI Agent 来操作 NocoBase，下面是 Claude Code 最适合的场景：

- **追求最强模型能力**——Claude 系列模型在复杂推理和代码生成方面表现出色
- **开发者日常工作流**——终端原生，和你的 IDE、Git、npm 等工具无缝配合
- **需要深度理解项目**——Claude Code 会自动分析项目结构，给出符合上下文的建议
- **同时做搭建和开发**——既能帮你搭建 NocoBase 应用，也能帮你开发自定义插件

## 连接原理

Claude Code 通过以下方式与 NocoBase 协同工作：

```
你（终端 / VS Code / JetBrains / ...）
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills（让 Agent 理解 NocoBase 配置体系）
        │
        └── NocoBase CLI（执行创建、修改、部署等操作）
              │
              └─→ NocoBase 服务（你的业务系统）
```

- **NocoBase Skills**——领域知识包，让 Claude Code 知道怎么操作 NocoBase
- **NocoBase CLI**——命令行工具，实际执行数据建模、页面搭建等操作
- **NocoBase 服务**——你运行中的 NocoBase 实例

## 前置条件

开始之前，确保你准备好了以下环境：

- 已安装 Claude Code（`npm install -g @anthropic-ai/claude-code`）
- Node.js >= 22（用于运行 NocoBase CLI 和 Skills）
- 如果已有 NocoBase 实例，需要版本 >= 2.1.0-alpha.22

## 快速开始

### 一键 AI 安装

将下方提示词复制给 Claude Code，它会自动完成 NocoBase CLI 安装、初始化和环境配置：

```
帮我安装 NocoBase CLI：https://docs.nocobase.com/cn/ai/ai-quick-start.md
```

### 手动安装

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

浏览器会自动打开可视化配置页面，引导你安装 NocoBase Skills、配置数据库并启动应用。详细步骤请参阅[快速开始](../quick-start.md)。

安装完成后，运行 `nb ps` 确认环境运行状态：

```bash
nb ps
```

确认输出中有已配置的环境，以及运行状态。

## 常见问题

<!-- TODO: 整理 5-8 个常见问题。比如：如何配置 API Key、Claude Code 支持哪些模型、如何在 VS Code 中使用、Skills 安装失败怎么办等 -->

## 相关链接

- [NocoBase CLI](../quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建快速开始](../../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code) — Claude Code 完整使用指南
- [OpenClaw + NocoBase](../openclaw/index.md) — 全球最火的开源 AI Agent，飞书一键部署
- [Codex + NocoBase](../codex/index.md) — OpenAI 官方 AI 编程助手
- [OpenCode + NocoBase](../opencode/index.md) — 开源、支持 75+ 模型的终端 AI Agent
