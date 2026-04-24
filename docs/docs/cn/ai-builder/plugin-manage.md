---
title: "插件管理"
description: "插件管理 Skill 用于查看、启用和停用 NocoBase 插件。"
keywords: "AI 搭建,插件管理,插件启用,插件停用"
---

# 插件管理

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 安装了 NocoBase CLI 并完成了初始化。

:::

## 简介

插件管理 Skill 用于查看、启用和停用 NocoBase 插件——它会自动识别本地或远程环境，选择合适的执行后端，并通过读回校验确保操作成功。


## 能力范围

- 查看插件目录和启用状态。
- 启用插件。
- 停用插件。

## 提示词示例

### 场景 A：查看插件状态

提示词模式
```
当前环境都有哪些插件
```
命令行模式
```
nb pm list
```

会列出所有插件及其启用状态、版本信息。

![查看插件状态](https://static-docs.nocobase.com/20260417150510.png)

### 场景 B：启用插件

提示词模式
```
帮我启用本地化插件
```
命令行模式
```
nb pm enable <本地化>
```

Skill 会按顺序启用，每次启用后读回校验确认 `enabled=true`。

![启用插件](https://static-docs.nocobase.com/20260417153023.png)

### 场景 C：禁用插件

提示词模式
```
帮我禁用本地化插件
```
命令行模式
```
nb pm disable  <本地化>
```

![禁用插件](https://static-docs.nocobase.com/20260417173442.png)

## 常见问题

**插件启用后没生效怎么办？**

部分插件启用后需要重启应用才能生效。Skill 会在结果中提示是否需要重启。

## 相关链接

- [AI 搭建概述](./index.md) — 所有 AI 搭建 Skill 的总览和安装方式
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
