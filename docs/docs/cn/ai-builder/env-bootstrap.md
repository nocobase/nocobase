---
title: "环境管理"
description: "环境管理 Skill 负责 NocoBase 的应用安装、升级、停止、启动和多环境管理，比如开发环境、测试环境、线上环境等——从「还没装 NocoBase」到「可以登录使用」。"
keywords: "AI 搭建,环境管理,安装,升级,Docker"
---

# 环境管理

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 安装了 NocoBase CLI 并完成了初始化。

:::

## 简介

环境管理 Skill 负责 NocoBase 的应用安装、升级、停止、启动和多环境管理，比如开发环境、测试环境、线上环境等——从「还没装 NocoBase」到「可以登录使用」。


## 能力范围

- 查询 Nocobase 环境和状态
- 添加、删除、切换 Nocobase 实例环境
- Nocobase 实例的安装、升级、停止、启动


## 提示词示例

### 场景 A：环境状态查询
提示词模式
```
当前有哪些 Nocobase 实例？我现在在哪个环境？
```
命令行模式
```
nb env list
```

### 场景 B：添加已有环境
:::tip 前置条件

需要已有 Nocobase 实例，无论是本地还是远程

:::

提示词模式
```
帮我添加 dev 环境 http://localhost:13000
```
命令行模式
```
nb env add <dev> --base-url http://localhost:13000/api
```
### 场景 C：安装新的 Nocobase 实例
:::tip 前置条件

安装 Nocobase 最方便快捷是使用 Docker 模式，执行前请确保你本机上安装了 Node、Docker、Yarn 必备环境

:::

提示词模式
```
帮我安装 Nocobase
```
命令行模式
```
nb init --ui
```

### 场景 D：实例升级

提示词模式
```
帮我将当前实例升级到最新
```
命令行模式
```
nb upgrade
```

### 场景 E：实例停止

提示词模式
```
帮我将当前实例停止
```
命令行模式
```
nb stop
```

### 场景 E：实例启动

提示词模式
```
帮我将当前实例启动
```
命令行模式
```
nb start
```

## 常见问题

**安装完成后发现不能体验 AI 搭建相关的能力怎么办？**

目前所有 AI 搭建的能力都在 alpha 镜像，确认是否使用了这个镜像安装，如果不是可以升级到这个镜像。

**Docker 启动报端口冲突怎么办？**

换一个端口（比如 `port=14000`），或者先停掉占用 13000 端口的进程。Skill 的预检阶段会主动提示端口冲突。

## 相关链接

- [AI 搭建概述](./index.md) — 所有 AI 搭建 Skill 的总览和安装方式
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
