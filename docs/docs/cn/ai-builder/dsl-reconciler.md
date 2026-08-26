---
title: "解决方案"
description: "解决方案 Skill 用于从 YAML 配置文件批量搭建 NocoBase 应用。"
keywords: "AI 搭建,解决方案,应用搭建,YAML,批量建表,仪表盘"
---

# 解决方案

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 安装了 NocoBase CLI 并完成了初始化。

:::

:::warning 注意

解决方案功能目前还在测试中，稳定性有限，仅供尝鲜体验。

:::

## 简介

解决方案 Skill 用于从 YAML 配置文件批量搭建 NocoBase 应用——一次性创建数据表、配置页面、生成仪表盘和图表。

适合需要快速搭建整套业务系统的场景，比如 CRM、工单管理、进销存等。


## 能力范围

可以做：

- 根据需求描述设计整套应用方案，包含数据表、页面和仪表盘
- 通过 `structure.yaml` 批量创建数据表和页面
- 通过 `enhance.yaml` 配置弹窗和表单
- 自动生成仪表盘，包含 KPI 卡片和图表
- 增量更新——始终用 `--force` 模式，不会破坏已有数据

不能做：

- 不适合逐字段微调（用[数据建模 Skill](./data-modeling) 更合适）
- 不能做数据迁移或数据导入
- 不能配置权限和工作流（需要配合其他 Skill）

## 提示词示例

### 场景 A：搭建完整系统

```
帮我用 nocobase-dsl-reconciler skill 搭建一个工单管理系统，包含仪表盘、工单列表、用户管理、SLA 配置
```

Skill 会先输出设计方案——列出所有数据表和页面结构，确认后再分轮次执行搭建。

![设计方案](https://static-docs.nocobase.com/20260420100420.png)

![搭建效果](https://static-docs.nocobase.com/20260420100450.png)

### 场景 B：修改已有模块

```
帮我用 nocobase-dsl-reconciler skill 在工单表上添加一个「紧急程度」下拉字段，选项是 P0 到 P3
```

修改 `structure.yaml` 后用 `--force` 更新即可。

### 场景 C：自定义图表

```
帮我用 nocobase-dsl-reconciler skill 把仪表盘上的「本周新增工单」改成「本月新增工单」
```

![自定义图表](https://static-docs.nocobase.com/20260420100517.png)

编辑对应的 SQL 文件，把时间范围从 `'7 days'` 改成 `'1 month'`，然后运行 `--verify-sql` 验证。

## 常见问题

**SQL 验证失败怎么办？**

NocoBase 使用 PostgreSQL，列名必须用驼峰写法并加双引号（比如 `"createdAt"`），日期函数用 `NOW() - '7 days'::interval` 而不是 SQLite 语法。运行 `--verify-sql` 可以在部署前发现这类问题。

**搭建后想微调某个字段怎么办？**

整套搭建用解决方案 Skill，后续微调用[数据建模 Skill](./data-modeling) 或[界面配置 Skill](./ui-builder) 更灵活。

## 相关链接

- [AI 搭建概述](./index.md) — 所有 AI 搭建 Skill 的总览和安装方式
- [数据建模](./data-modeling) — 逐字段微调用数据建模 Skill
- [界面配置](./ui-builder) — 搭建后微调页面和区块布局
