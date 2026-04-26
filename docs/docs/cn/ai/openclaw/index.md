---
title: "OpenClaw + NocoBase：全网最火 AI Agent 帮你干活"
description: "将全球最受欢迎的开源 AI Agent OpenClaw 接入 NocoBase，通过 Skills 和 CLI 用自然语言操作你的业务系统。"
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,飞书,自然语言"
sidebar: false
---

:::warning 内容撰写中

本页内容还在撰写中，部分章节可能不完整或有变动。

:::

# OpenClaw + NocoBase：全网最火 AI Agent 帮你干活

[OpenClaw](https://github.com/openclaw/openclaw) 是全球最受欢迎的开源 AI Agent 框架——不只是聊天，还能真正动手执行任务。把它接入 NocoBase 后，你可以用自然语言创建数据表、搭建页面、配置工作流，甚至让它 7×24 小时自主运行，持续维护你的业务系统。

<!-- 需要一张 OpenClaw 在飞书中操作 NocoBase 的对话截图 -->

## 什么是 OpenClaw

OpenClaw 是由开发者 Peter Steinberger 创建的开源 AI Agent 框架，当下全球最火的 AI Agent 项目之一（GitHub 300k+ Star）。它的定位是「能动手做事的 AI 助手」。和 ChatGPT、Claude 这类对话工具不同，OpenClaw 有四个核心特点：

- **执行能力**——接收自然语言指令后自动完成任务，不只是给你建议
- **跨会话记忆**——能记住你的偏好和使用习惯，越用越顺手
- **Skills 生态**——通过安装 Skills 扩展能力，像给助手「教新技能」
- **7×24 小时运行**——支持定时任务、主动汇报，不需要你一直盯着

OpenClaw 支持飞书、Telegram、Discord 等 26+ 平台，你可以在日常办公的工具里直接和它对话。飞书用户还可以一键部署，不需要任何技术基础。

## 为什么选 OpenClaw

如果你在选择哪个 AI Agent 来操作 NocoBase，下面是 OpenClaw 最适合的场景：

- **需要零门槛上手**——飞书用户可以一键部署，不需要自己搭服务器
- **团队使用飞书办公**——OpenClaw 和飞书深度集成，消息流式生成、群聊 @bot 等体验都很顺畅
- **需要 7×24 小时在线**——OpenClaw 部署在云端，不受本地电脑状态影响
- **看重社区生态**——OpenClaw 拥有最大的 Skills 社区，除了 NocoBase 之外还有大量其他技能可用

## 连接原理

OpenClaw 通过以下方式与 NocoBase 协同工作：

```
你（飞书 / Telegram / ...）
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills（让 Agent 理解 NocoBase 配置体系）
        │
        └── NocoBase CLI（执行创建、修改、部署等操作）
              │
              └─→ NocoBase 服务（你的业务系统）
```

- **NocoBase Skills**——领域知识包，让 OpenClaw 知道怎么操作 NocoBase
- **NocoBase CLI**——命令行工具，实际执行数据建模、页面搭建等操作
- **NocoBase 服务**——你运行中的 NocoBase 实例

## 前置条件

开始之前，确保你准备好了以下环境：

- 已部署的 OpenClaw Agent（[飞书一键部署](https://openclaw.feishu.cn) 或本地部署）
- Node.js >= 22（用于运行 NocoBase CLI 和 Skills）
- 如果已有 NocoBase 实例，需要版本 >= 2.1.0-alpha.22

:::warning 注意

安装第三方 Skills 时请注意安全——优先使用官方或可信来源的 Skills，避免安装未经审核的社区技能。

:::

## 快速开始

### 一键 AI 安装

将下方提示词复制给 OpenClaw，它会自动完成 NocoBase CLI 安装、初始化和环境配置：

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

<!-- TODO: 整理 5-8 个常见问题。比如：Skills 安装失败怎么办、如何更新 Skills 版本、OpenClaw 支持哪些模型、操作出错如何回滚等 -->

## 相关链接

- [NocoBase CLI](../quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建快速开始](../../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [OpenClaw 飞书部署指南](https://openclaw.feishu.cn) — 一键部署 OpenClaw 到飞书
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — 自动沉淀技能，越用越懂你的业务系统
- [WorkBuddy + NocoBase](../workbuddy/index.md) — 企业微信、飞书、钉钉多平台远程操控 NocoBase
