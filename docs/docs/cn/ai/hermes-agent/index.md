---
title: "Hermes Agent：越用越懂你的 NocoBase 助手"
description: "将 Hermes Agent 接入 NocoBase，通过跨会话记忆和自动技能沉淀，让 AI 越来越懂你的业务系统。"
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,自动学习,自托管"
sidebar: false
---

:::warning 内容撰写中

本页内容还在撰写中，部分章节可能不完整或有变动。

:::

# Hermes Agent：越用越懂你的 NocoBase 助手

[Hermes Agent](https://github.com/nousresearch/hermes-agent) 是一个自托管的开源 AI Agent——它会把每次成功操作自动沉淀为可复用的技能文档，越用越懂你的系统。把它接入 NocoBase 后，你不仅能用自然语言搭建和管理系统，还能让它逐步学会你的业务惯例和偏好。

<!-- 需要一张 Hermes Agent 操作 NocoBase 的终端或飞书对话截图 -->

## 什么是 Hermes Agent

Hermes Agent 由 Nous Research 开发（GitHub 35.7k Star），核心理念是「用得越久越聪明」。和其他 AI Agent 不同，Hermes 有一套完整的闭环学习机制：

- **跨会话记忆**——基于全文搜索和 LLM 摘要，能回溯数周前的对话上下文
- **自动技能沉淀**——每次成功完成复杂任务后，自动创建可复用的技能文档
- **持续自我改进**——技能在反复使用中不断优化，越用越精准
- **400+ 模型支持**——兼容主流 LLM 提供商，不绑定特定模型

Hermes 支持飞书、Telegram、Discord、Slack 等 8 个平台，也可以直接在终端使用。

:::tip 提示

Hermes Agent 运行在你自己的服务器上，所有数据和记忆本地存储，适合对数据安全有要求的场景。

:::

## 为什么选 Hermes Agent

如果你在选择哪个 AI Agent 来操作 NocoBase，下面是 Hermes 最适合的场景：

- **长期维护同一套系统**——Hermes 的记忆机制让它越用越懂你的业务，不需要每次重新解释上下文
- **团队有自托管需求**——数据完全本地化，不经过第三方云服务
- **需要标准化操作流程**——Hermes 自动沉淀的技能文档可以作为团队的操作手册
- **偏好终端操作**——Hermes 原生支持 CLI 交互，适合技术团队日常使用

## 连接原理

Hermes Agent 通过以下方式与 NocoBase 协同工作：

```
你（飞书 / Telegram / 终端 / ...）
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills（让 Agent 理解 NocoBase 配置体系）
        │
        ├── NocoBase CLI（执行创建、修改、部署等操作）
        │
        └── 记忆 & 技能文档（自动沉淀，持续复用）
              │
              └─→ NocoBase 服务（你的业务系统）
```

和其他 Agent 不同，Hermes 在每次操作后会更新自己的记忆和技能文档。这些信息存储在本地，后续操作中自动复用。

## 前置条件

开始之前，确保你准备好了以下环境：

- 一台运行 Hermes Agent 的服务器（Linux / macOS，Python 3.10+）
- Node.js >= 22（用于运行 NocoBase CLI 和 Skills）
- 如果已有 NocoBase 实例，**由于 AI 能力迭代快速，目前仅 beta 最新版本支持完整体验，最低版本要求 >= 2.1.0-beta.20，强烈建议更新到最新版本。**

Hermes 的安装只需要一行命令：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning 注意

Hermes Agent 需要自行部署和维护。如果你希望零配置开箱即用，可以考虑 [OpenClaw](../openclaw/index.md)（飞书一键部署）或 [WorkBuddy](../workbuddy/index.md)（腾讯托管）。

:::

## 快速开始

### 一键 AI 安装

将下方提示词复制给 Hermes Agent，它会自动完成 NocoBase CLI 安装、初始化和环境配置：

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

<!-- TODO: 整理 5-8 个常见问题。比如：记忆文件存在哪里、如何迁移到新服务器、支持哪些模型、如何清除错误的记忆、Hermes 和 OpenClaw 有什么区别等 -->

## 相关链接

- [NocoBase CLI](../quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建快速开始](../../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) — Hermes Agent 源码和文档
- [OpenClaw + NocoBase](../openclaw/index.md) — 全球最火的开源 AI Agent，飞书一键部署
- [WorkBuddy + NocoBase](../workbuddy/index.md) — 企业微信、飞书、钉钉多平台远程操控 NocoBase
