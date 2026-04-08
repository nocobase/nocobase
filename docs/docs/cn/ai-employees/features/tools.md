---
pkg: "@nocobase/plugin-ai"
title: "AI 员工使用工具"
description: "工具（Tools）定义 AI 员工能力：General tools、Employee-specific tools、Custom tools，技能权限 Ask/Allow 配置。"
keywords: "AI 员工工具,Tools,Ask,Allow,技能权限,NocoBase"
---

# 使用工具

工具（Tools）定义了 AI 员工“能做什么”。

## 工具结构

工具页分为三类：

1. `General tools`：所有 AI 员工共享，通常只读。
2. `Employee-specific tools`：当前员工专属。
3. `Custom tools`：自定义技能，可增删并配置默认权限。

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## 工具权限

工具权限统一为：

- `Ask`：调用前询问确认。
- `Allow`：允许直接调用。

建议：涉及修改数据的工具默认使用 `Ask`。

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## 添加与维护

在工作流模块中创建触发类型为 `AI employee event` 的工作流。

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

在 `Custom tools` 中点击 `Add tool` 添加工作流作为的工具使用，并按业务风险配置权限。

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
