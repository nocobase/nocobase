---
title: "Hermes Agent：越用越懂你的 NocoBase 助手"
description: "将 Hermes Agent 接入 NocoBase，通过跨会话记忆和自动技能沉淀，让 AI 越来越懂你的业务系统。"
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,自动学习,自托管"
sidebar: false
---

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

## 接入 NocoBase 后能做什么

Hermes Agent 通过安装 NocoBase Skills 获得操作 NocoBase 的能力。和其他 Agent 的关键区别是——Hermes 会自动记住你的系统结构和使用习惯。

比如你让 Hermes 帮你搭建了一套客户管理模块，它会把这次操作的步骤、你的偏好（字段命名风格、页面布局习惯等）记录下来。下次你说「再搭一个供应商管理」，它已经知道你喜欢怎么组织数据和页面了。

以下是一些典型场景：

| 场景 | 说明 |
|------|------|
| 记住你的搭建风格 | 第一次搭建后，Hermes 会记住你的字段命名习惯、布局偏好，下次自动沿用 |
| 自动生成操作手册 | 完成复杂搭建后，自动沉淀为可复用的操作文档 |
| 跨天连续工作 | 今天讨论的需求细节，下周接着聊时 Hermes 还记得 |
| 定时运维 | 设置定时任务，比如每天自动检查数据一致性并推送报告 |
| 子任务委派 | 复杂任务自动拆分给子 Agent 并行执行，提升效率 |

### 闭环学习是怎么工作的

Hermes 的学习机制可以用一个例子来说明：

1. 你让 Hermes 搭建一套工单管理系统——数据表、列表页、表单、工作流一步到位
2. 搭建成功后，Hermes 自动把这次操作写成一份技能文档，记录具体步骤和你的偏好
3. 下次你说「搭一个类似的设备管理系统」，Hermes 直接复用这份技能文档，速度更快、风格更一致
4. 如果你在第二次搭建时给了新的反馈（比如「表格默认按创建时间倒序」），技能文档会自动更新

这个循环会持续运转——用得越多，Hermes 对你的系统和偏好理解越深。

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

- 一个运行中的 NocoBase 实例（[安装指南](../get-started/quickstart)）
- 一台运行 Hermes Agent 的服务器（Linux / macOS，Python 3.10+）
- Node.js 20+（用于运行 NocoBase CLI 和 Skills）

Hermes 的安装只需要一行命令：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning 注意

Hermes Agent 需要自行部署和维护。如果你希望零配置开箱即用，可以考虑 [OpenClaw](./openclaw)（飞书一键部署）或 [WorkBuddy](./workbuddy)（腾讯托管）。

:::

## 快速开始

<!-- TODO: 分三步写，参考飞书 Hermes Agent 文章的"三步接入"结构 -->

### 第一步：初始化 Hermes 并连接消息平台

<!-- TODO: 运行 hermes setup，选择模型、配置 API Key、选择消息平台（飞书/Telegram 等）。附终端截图，标注关键选择项 -->

### 第二步：安装 NocoBase Skills

<!-- TODO: 两种方式——对话安装（"请帮我安装 NocoBase Skills"）和命令行安装。说明 Hermes 安装 Skills 后会自动写入技能文档。附安装成功截图 -->

### 第三步：配置 NocoBase 连接并测试

<!-- TODO: 告诉 Hermes 你的 NocoBase 地址和凭据，发送一条测试指令验证连接。附对话截图 + NocoBase 界面截图 -->

## 实际场景演示

<!-- TODO: 挑 2-3 个典型场景，重点体现 Hermes 的"闭环学习"特色——第一次操作 vs 第二次同类操作的对比 -->

### 首次搭建客户管理模块

<!-- TODO: 展示从零搭建的完整对话过程。Hermes 完成后会自动沉淀技能文档，截图展示生成的技能文档内容 -->

### 复用经验搭建供应商管理

<!-- TODO: 展示第二次搭建类似模块时，Hermes 自动复用之前的经验，速度更快、风格更一致。对比两次操作的差异 -->

### 跨天连续工作

<!-- TODO: 展示隔天再次对话时，Hermes 仍然记得之前的上下文和决策，不需要重新解释。附对话截图 -->

## 飞书集成指南

<!-- TODO: 参考飞书文章的详细步骤——hermes setup 选择飞书、扫码连接、创建机器人、消息配对、安装飞书 CLI（lark-cli auth login）。每步附截图 -->

## 使用技巧

<!-- TODO: 3-5 条实用建议，比如：如何查看和编辑 Hermes 沉淀的技能文档、如何手动触发记忆更新、如何设置定时任务、子 Agent 委派的使用场景等 -->

## 常见问题

<!-- TODO: 整理 5-8 个常见问题。比如：记忆文件存在哪里、如何迁移到新服务器、支持哪些模型、如何清除错误的记忆、Hermes 和 OpenClaw 有什么区别等 -->

## 相关链接

- [NocoBase CLI](../get-started/nocobase-cli) — 安装和管理 NocoBase 的命令行工具
- [NocoBase Skills](../ai-builder/index.md) — 可安装到 AI Agent 中的领域知识包
- [AI 搭建](../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) — Hermes Agent 源码和文档
- [OpenClaw + NocoBase](./openclaw) — 全球最火的开源 AI Agent，飞书一键部署
- [WorkBuddy + NocoBase](./workbuddy) — 企业微信、飞书、钉钉多平台远程操控 NocoBase
