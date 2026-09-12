---
pkg: '@nocobase/plugin-ai'
title: 'AI 员工使用工具'
description: '工具（Tools）定义 AI 员工能力：General tools、Employee-specific tools、Custom tools，技能权限 Ask/Allow 配置。'
keywords: 'AI 员工工具,Tools,Ask,Allow,技能权限,NocoBase'
---

# 使用工具

工具（Tools）定义了 AI 员工“能做什么”。

## 工具结构

工具页分为三类：

1. `General tools`：所有 AI 员工共享，通常只读。
2. `Employee-specific tools`：当前员工专属。
3. `Custom tools`：通过工作流“AI 员工事件”触发器自定义工具，可增删并配置默认权限。

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## 工具权限

工具权限统一为：

- `Ask`：调用前询问确认。
- `Allow`：允许直接调用。

建议：涉及修改数据的工具默认使用 `Ask`。

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## 工具介绍

### 通用工具

| 工具名称             | 功能描述                                     |
| -------------------- | -------------------------------------------- |
| Form filler          | 将数据填写到指定表单                         |
| Chart generator      | 生成 ECharts 图表 JSON 配置                  |
| Load specific SKILLS | 加载技能及技能所需的工具                     |
| Suggestions          | 根据当前对话内容和上下文，给出下一步行动建议 |

### 专属工具

| 工具名称                     | 功能描述                                     | 所属员工 |
| ---------------------------- | -------------------------------------------- | -------- |
| AI employee task dispatching | 工作调度工具，根据任务类型和员工能力分配任务 | Atlas    |
| List AI employees            | 列出所有可用员工                             | Atlas    |
| Get AI employee              | 获取指定员工的详细信息，包括技能和工具       | Atlas    |

### 自定义工具

在工作流模块中创建触发类型为 `AI employee event` 的工作流。

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

在 `Custom tools` 中点击 `Add tool` 添加工作流作为的工具使用，并按业务风险配置权限。

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
