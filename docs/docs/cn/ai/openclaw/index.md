---
title: "OpenClaw + NocoBase：全网最火 AI Agent 帮你干活"
description: "将全球最受欢迎的开源 AI Agent OpenClaw 接入 NocoBase，通过 Skills 和 CLI 用自然语言操作你的业务系统。"
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,飞书,自然语言"
sidebar: false
---

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

## 接入 NocoBase 后能做什么

通过安装 NocoBase Skills，OpenClaw 就能理解 NocoBase 的配置体系，帮你完成各种搭建和运维任务。

比如你在飞书里跟 OpenClaw 说「帮我创建一张客户表，包含公司名、联系人、电话和跟进状态」，它会自动调用 NocoBase CLI 完成数据建模——不需要打开浏览器，也不需要手动操作界面。

以下是一些典型场景：

| 场景 | 示例指令 |
|------|---------|
| 创建数据表 | 「建一张工单表，包含标题、优先级、负责人和截止日期」 |
| 搭建页面 | 「给工单管理加一个列表页面，支持按优先级筛选」 |
| 配置工作流 | 「新建一个工作流：工单创建后自动通知负责人」 |
| 管理权限 | 「让销售角色只能看到自己的客户数据」 |
| 管理插件 | 「帮我启用导入导出插件」 |
| 定时巡检 | 「每天早上 9 点检查一下系统状态，有异常通知我」 |

:::tip 提示

OpenClaw 通过 NocoBase Skills 和 CLI 与 NocoBase 交互，生成的配置和你手动搭建的完全一致，随时可以在可视化界面里调整。

:::

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

- 一个运行中的 NocoBase 实例（[安装指南](../get-started/quickstart)）
- 已部署的 OpenClaw Agent（[飞书一键部署](https://openclaw.feishu.cn) 或本地部署）
- Node.js 20+（用于运行 NocoBase CLI 和 Skills）

:::warning 注意

安装第三方 Skills 时请注意安全——优先使用官方或可信来源的 Skills，避免安装未经审核的社区技能。

:::

## 快速开始

<!-- TODO: 分三步写，参考飞书 OpenClaw 文章的"一键领虾"结构 -->

### 第一步：在 OpenClaw 中安装 NocoBase Skills

<!-- TODO: 两种方式——直接对话安装（"帮我安装 NocoBase Skills"）和命令行安装（npx skills add nocobase/skills -y）。附安装成功的截图 -->

### 第二步：配置 NocoBase 连接

<!-- TODO: 告诉 OpenClaw 你的 NocoBase 地址和凭据。说明需要提供哪些信息（URL、API Token 或账号密码），附配置对话截图 -->

### 第三步：发送第一条指令

<!-- TODO: 给一个简单的示例指令（比如"帮我创建一张客户表"），展示从发送指令到 NocoBase 出现新数据表的完整过程，附对话截图 + NocoBase 界面截图 -->

## 实际场景演示

<!-- TODO: 挑 2-3 个典型场景，每个场景用"对话指令 → 执行过程 → 最终效果"的结构展示，附截图 -->

### 用自然语言搭建一套工单系统

<!-- TODO: 展示一次对话搭建完整业务模块（数据表 + 页面 + 工作流）的过程，重点体现 OpenClaw 7×24 在线的优势 -->

### 定时巡检与异常通知

<!-- TODO: 展示设置定时任务的对话过程，比如"每天早上 9 点检查系统状态"，以及收到异常通知的效果 -->

## 使用技巧

<!-- TODO: 3-5 条实用建议，比如：如何让 OpenClaw 记住你的偏好、如何在群聊中 @bot 使用、如何查看操作日志等 -->

## 常见问题

<!-- TODO: 整理 5-8 个常见问题，参考飞书文章的 FAQ 结构。比如：Skills 安装失败怎么办、如何更新 Skills 版本、OpenClaw 支持哪些模型、操作出错如何回滚等 -->

## 相关链接

- [NocoBase CLI](../get-started/nocobase-cli) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../ai-builder/index.md) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建](../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [OpenClaw 飞书部署指南](https://openclaw.feishu.cn) — 一键部署 OpenClaw 到飞书
- [Hermes Agent + NocoBase](./hermes-agent) — 自动沉淀技能，越用越懂你的业务系统
- [WorkBuddy + NocoBase](./workbuddy) — 企业微信、飞书、钉钉多平台远程操控 NocoBase
