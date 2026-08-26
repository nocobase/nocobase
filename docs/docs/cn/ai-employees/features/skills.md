---
pkg: '@nocobase/plugin-ai'
title: 'AI 员工使用技能'
description: '技能（Skills）是 AI 员工专业领域知识指南：General skills、Employee-specific skills。'
keywords: 'AI 员工技能,Skills,NocoBase'
---

# 使用技能

技能（Skills）是提供给 AI 员工的专业领域知识指南，指导 AI 员工使用多个工具处理专业领域任务。

目前技能不支持自定义，仅由系统预置。

## 技能结构

技能页分为两类：

1. `General skills`：所有 AI 员工共享，通常只读。
2. `Employee-specific skills`：当前员工专属。

![](https://static-docs.nocobase.com/202604230832639.png)

## 技能介绍

### 通用技能

| 技能名称                 | 功能描述                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Data metadata            | 获取系统数据模型，数据表、字段信息等元数据，帮助 AI 员工理解业务上下文。           |
| Data query               | 查询数据表中的数据，支持条件过滤、聚合查询等功能，帮助 AI 员工获取业务数据。       |
| Business analysis report | 根据业务数据生成分析报告，支持多维度分析和可视化，帮助 AI 员工进行业务洞察。       |
| Document search          | 搜索和读取预置的文档内容，帮助 AI 员工完成基于文档的工作，目前主要是编写 JS 代码。 |

### 专属技能

| 技能名称           | 功能描述                             | 所属员工 |
| ------------------ | ------------------------------------ | -------- |
| Data modeling      | 数据建模技能，理解和构建业务数据模型 | Orin     |
| Frontend developer | 编写和测试前端区块的 JS 代码         | Nathan   |
