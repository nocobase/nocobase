---
title: "解放双手，用 WorkBuddy 驱动 NocoBase"
description: "通过腾讯 WorkBuddy 远程操控 NocoBase，支持企业微信、飞书、钉钉等多平台接入。"
keywords: "WorkBuddy,NocoBase,AI Agent,腾讯,企业微信,飞书,钉钉,远程操控"
sidebar: false
---

:::warning 内容撰写中

本页内容还在撰写中，部分章节可能不完整或有变动。

:::

# 解放双手，用 WorkBuddy 驱动 NocoBase

[WorkBuddy](https://www.codebuddy.cn) 是腾讯推出的全场景职场 AI 智能体——一句话描述需求，它就能自主规划步骤并执行。把它接入 NocoBase 后，你可以在企业微信、飞书、钉钉等平台远程操控你的业务系统，不用打开浏览器就能完成日常管理操作。

<!-- 需要一张 WorkBuddy 在企业微信中操作 NocoBase 的对话截图 -->

## 什么是 WorkBuddy

WorkBuddy 是腾讯推出的「全场景职场 AI 智能体桌面工作台」。和普通 AI 对话工具不同，WorkBuddy 收到任务后会自动拆解、规划、执行，最终交付一个可验收的结果——不需要你一步步指导。

核心特点：

- **自主规划执行**——收到任务后自动拆解步骤、逐个执行，交付完整结果
- **多平台接入**——支持企业微信、飞书、钉钉、QQ 等国内主流办公平台
- **20+ 内置技能**——文档生成、数据分析、PPT 制作、邮件编辑等开箱即用
- **本地文件操作**——可以读取和处理你授权的本地文件

简单来说，传统 AI 工具给你建议让你自己动手，WorkBuddy 直接帮你做完。

| 传统 AI 对话 | WorkBuddy |
|---|---|
| 只能对话，给建议 | 能实际执行任务 |
| 需要手动操作文件 | 自动操作本地文件 |
| 单步骤简单任务 | 多步骤复杂任务自动拆解 |
| 输出文字回复 | 交付可验收的结果 |

## 为什么选 WorkBuddy

如果你在选择哪个 AI Agent 来操作 NocoBase，下面是 WorkBuddy 最适合的场景：

- **团队使用企业微信 / 飞书 / 钉钉**——WorkBuddy 支持最广泛的国内办公平台，覆盖面最大
- **需要移动端操控 NocoBase**——出门在外随时管理系统，不受设备限制
- **希望开箱即用**——腾讯出品，内置 20+ 技能，配置门槛低
- **侧重任务自动化**——WorkBuddy 擅长把多步骤任务自动拆解执行，适合日常运维和管理

## 连接原理

WorkBuddy 通过以下方式与 NocoBase 协同工作：

```
你（企业微信 / 飞书 / 钉钉 / ...）
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills（让 Agent 理解 NocoBase 配置体系）
        │
        └── NocoBase CLI（执行创建、修改、部署等操作）
              │
              └─→ NocoBase 服务（你的业务系统）
```

你在任意支持的平台上发送指令，WorkBuddy 在后端通过 Skills 和 CLI 完成对 NocoBase 的操作，结果实时推送回你的对话窗口。

## 前置条件

开始之前，确保你准备好了以下环境：

- WorkBuddy 账号（[注册入口](https://www.codebuddy.cn)）
- Node.js >= 22（用于运行 NocoBase CLI 和 Skills）
- 如果已有 NocoBase 实例，**由于 AI 能力迭代快速，目前仅 beta 最新版本支持完整体验，最低版本要求 >= 2.1.0-beta.20，强烈建议更新到最新版本。**

:::warning 注意

WorkBuddy 目前处于快速迭代中，部分功能可能有变化。建议关注 [WorkBuddy 官方文档](https://www.codebuddy.cn/docs/workbuddy/Overview) 获取最新信息。

:::

## 快速开始

### 一键 AI 安装

将下方提示词复制给 WorkBuddy，它会自动完成 NocoBase CLI 安装、初始化和环境配置：

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

<!-- TODO: 整理 5-8 个常见问题。比如：WorkBuddy 支持哪些平台、免费额度多少、如何处理操作失败、多人能否共用同一个 WorkBuddy 操控同一套 NocoBase 等 -->

## 相关链接

- [NocoBase CLI](../quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建快速开始](../../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [WorkBuddy 官方文档](https://www.codebuddy.cn/docs/workbuddy/Overview) — WorkBuddy 完整使用指南
- [OpenClaw + NocoBase](../openclaw/index.md) — 全球最火的开源 AI Agent，飞书一键部署
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — 自动沉淀技能，越用越懂你的业务系统
