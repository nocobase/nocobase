---
title: "解放双手，用 WorkBuddy 驱动 NocoBase"
description: "通过腾讯 WorkBuddy 远程操控 NocoBase，支持企业微信、飞书、钉钉等多平台接入。"
keywords: "WorkBuddy,NocoBase,AI Agent,腾讯,企业微信,飞书,钉钉,远程操控"
sidebar: false
---

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

## 接入 NocoBase 后能做什么

通过安装 NocoBase Skills，WorkBuddy 就能远程操控你的 NocoBase 系统。你在出差、开会、甚至通勤路上，都可以通过手机上的企业微信或飞书给 WorkBuddy 发消息，让它帮你完成操作。

比如你在外面开会，突然需要给系统加一张新表。掏出手机跟 WorkBuddy 说「帮我建一张会议室预订表，包含日期、时间段、参会人和会议主题」，几分钟后就搞定了——回到办公室打开 NocoBase 就能直接用。

以下是一些典型场景：

| 场景 | 说明 |
|------|------|
| 移动端远程操作 | 在手机上通过企业微信 / 飞书操控 NocoBase，不需要打开电脑 |
| 跨平台统一入口 | 团队用不同办公平台也能统一操控同一套 NocoBase |
| 批量数据处理 | 让 WorkBuddy 帮你批量更新、整理 NocoBase 中的数据 |
| 快速报告生成 | 从 NocoBase 提取数据，自动生成分析报告或周报 |
| 多步骤任务一口气搞定 | 「建一张表、加个列表页、配个审批流」——一句话全搞定 |

:::tip 提示

WorkBuddy 通过 NocoBase Skills 和 CLI 与 NocoBase 交互，生成的配置和你手动搭建的完全一致，随时可以在可视化界面里调整。

:::

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

- 一个运行中的 NocoBase 实例（[安装指南](../get-started/quickstart)）
- WorkBuddy 账号（[注册入口](https://www.codebuddy.cn)）
- Node.js 20+（用于运行 NocoBase CLI 和 Skills）

:::warning 注意

WorkBuddy 目前处于快速迭代中，部分功能可能有变化。建议关注 [WorkBuddy 官方文档](https://www.codebuddy.cn/docs/workbuddy/Overview) 获取最新信息。

:::

## 快速开始

<!-- TODO: 分三步写 -->

### 第一步：在 WorkBuddy 中安装 NocoBase Skills

<!-- TODO: 说明如何在 WorkBuddy 桌面工作台中安装 NocoBase Skills，附操作截图 -->

### 第二步：配置 NocoBase 连接

<!-- TODO: 告诉 WorkBuddy 你的 NocoBase 地址和凭据。附配置界面或对话截图 -->

### 第三步：从手机发送第一条指令

<!-- TODO: 在企业微信或飞书上发送一条简单指令（比如"帮我建一张会议室预订表"），展示从手机发送到 NocoBase 出现结果的完整过程。附手机截图 + NocoBase 界面截图 -->

## 各平台接入指南

<!-- TODO: 分平台写简要接入步骤，每个平台 3-5 步，附关键步骤截图 -->

### 企业微信

<!-- TODO: 在企业微信中找到 WorkBuddy、授权、开始对话的步骤 -->

### 飞书

<!-- TODO: 在飞书中接入 WorkBuddy 的步骤 -->

### 钉钉

<!-- TODO: 在钉钉中接入 WorkBuddy 的步骤 -->

## 实际场景演示

<!-- TODO: 挑 2-3 个典型场景，重点体现 WorkBuddy 的"移动端远程操控"和"多步骤自动拆解"特色 -->

### 出差途中远程加表加页面

<!-- TODO: 展示在手机上通过企业微信发送指令，WorkBuddy 自动创建数据表和页面的完整过程。强调不用打开电脑 -->

### 一句话搭建完整业务模块

<!-- TODO: 展示 WorkBuddy 收到复杂指令后自动拆解为多个步骤执行的过程，比如"建一个请假管理，包含申请表单、审批流程和统计报表" -->

## 使用技巧

<!-- TODO: 3-5 条实用建议，比如：如何让 WorkBuddy 处理批量数据、如何利用内置技能生成分析报告、如何在不同平台间切换等 -->

## 常见问题

<!-- TODO: 整理 5-8 个常见问题。比如：WorkBuddy 支持哪些平台、免费额度多少、如何处理操作失败、多人能否共用同一个 WorkBuddy 操控同一套 NocoBase 等 -->

## 相关链接

- [NocoBase CLI](../get-started/nocobase-cli) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../ai-builder/index.md) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建](../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [WorkBuddy 官方文档](https://www.codebuddy.cn/docs/workbuddy/Overview) — WorkBuddy 完整使用指南
- [OpenClaw + NocoBase](./openclaw) — 全球最火的开源 AI Agent，飞书一键部署
- [Hermes Agent + NocoBase](./hermes-agent) — 自动沉淀技能，越用越懂你的业务系统
