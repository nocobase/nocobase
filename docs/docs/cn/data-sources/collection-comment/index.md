---
pkg: "@nocobase/plugin-comments"
title: "评论表"
description: "评论表存储业务记录的评论、回复和反馈，支持富文本内容、用户追踪、多级评论和评论区块。"
keywords: "评论表,评论功能,富文本评论,多级评论,Collection Comment,NocoBase"
---

# 评论表

## 介绍

评论表适合保存围绕业务记录产生的讨论、反馈和批注。比如任务评论、审批意见、文章评论、客户反馈都可以用评论表保存。

评论表通常不单独作为主业务表使用。更常见的做法是：先创建评论表，再在业务表中配置关系字段，最后在业务记录的详情或弹窗中添加评论区块。

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## 适用场景

评论表适合这些业务场景：

- 任务、需求、缺陷的协作讨论
- 审批单、工单、合同的处理意见
- 文章、知识库、公告的评论
- 客户反馈、售后跟进、内部备注

## 使用流程

评论表通常配合业务表和评论区块使用：

1. 创建评论表，用来保存评论内容、回复关系、创建人、创建时间等信息。
2. 在业务表中创建关系字段，关联到评论表。比如在「任务」表中关联「任务评论」表。
3. 在业务表的详情页或弹窗中添加评论区块。
4. 用户在评论区块中发表评论或回复，评论数据会写入评论表，并关联到当前业务记录。
5. 根据业务需要配置评论表权限，控制谁可以查看、创建或删除评论。

## 创建配置

在主数据库中点击「Create collection」，选择「Comment collection」可以创建评论表。

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称，比如「任务评论」「审批意见」「文章评论」。 |
| Collection name | 数据表的标识名称，用于 API、关系字段、权限、工作流等内部引用。 |
| Inherits | 选择要继承的父表。只有主数据库是 PostgreSQL 时可见。 |
| Categories | 数据表分类。分类只影响数据表管理界面的组织方式，不改变数据表结构。 |
| Description | 数据表说明。可以写这个评论表服务于哪个业务对象、由谁维护、评论权限怎么设计。 |
| Preset fields | 预设字段。创建评论表时建议保留系统字段和评论表内置字段。 |

### 内置字段

评论表创建后通常包含这些内置字段。评论区块主要依赖 `content`、`createdBy` 和 `createdAt` 展示评论内容、评论人和评论时间。

| 字段 | 字段名 | 说明 |
| --- | --- | --- |
| ID | `id` | 默认主键字段，用于唯一标识一条评论记录。 |
| 评论内容 | `content` | 保存用户输入的评论正文，默认使用 Markdown Vditor 组件。 |
| 创建时间 | `createdAt` | 自动记录评论创建时间，评论区块会用它展示评论时间。 |
| 创建人 | `createdBy` | 自动记录发表评论的用户，评论区块会用它展示评论人。 |
| 更新时间 | `updatedAt` | 自动记录评论最后一次更新的时间。 |
| 更新人 | `updatedBy` | 自动记录最后一次更新评论的用户。 |
| 空间 | `space` | 启用[多空间插件](../../multi-app/multi-space/index.md)后可用，用于按空间隔离数据。没有启用多空间时不会出现。 |

:::warning 注意

评论表内置字段通常由评论区块维护，不建议随意删除或改成其他业务含义。如果需要保存评论分类、处理状态等信息，可以新增业务字段。

:::

### 主键字段

评论表和普通表一样需要主键字段。评论区块会通过主键定位评论记录和回复关系。

如果评论表没有主键，需要在编辑数据表时设置「Record unique key」，否则评论区块可能无法正确查看、回复或删除评论。

## 建立关联关系
在业务表中创建关系字段，关联到评论表
![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## 页面配置使用

评论表通常通过评论区块使用。你可以在业务表的详情页、弹窗或记录页中添加评论区块，让用户围绕当前记录发表评论。

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| 配置位置 | 用途 |
| --- | --- |
| [详情区块](../../interface-builder/blocks/data-blocks/details.md) | 在业务记录详情中展示评论入口。 |
| [表单区块](../../interface-builder/blocks/data-blocks/form.md) | 配合业务表编辑流程使用评论关系字段。 |
| 评论区块 | 展示评论列表、发表评论和回复评论。 |

## 编辑配置

在数据表列表中，点击评论表右侧的「Edit」，可以修改数据表显示名称、分类、说明、简单分页模式和「Record unique key」等配置。

评论表上线后，不建议随意调整评论内容字段和回复关系字段。评论区块、权限、工作流和 API 可能会依赖这些字段。

## 删除数据表

在数据表列表中，点击评论表右侧的「Delete」，可以删除评论表。

删除评论表会删除评论记录、回复关系和相关 Collection 元数据。删除前先确认业务表中的关系字段、评论区块、权限、工作流和 API 是否仍然依赖它。

:::danger 警告

删除评论表会让已有业务记录失去评论数据。评论通常承载协作过程和处理意见，操作前先确认是否需要备份或归档。

:::

## 相关链接

- [普通表](../data-source-main/general-collection.md) — 查看通用配置和区块使用方式
- [关系字段](../data-modeling/collection-fields/associations/index.md) — 了解业务表与评论表的关联方式
- [评论插件](../../plugins/@nocobase/plugin-comments/index.md) — 查看评论区块和评论能力
- [多空间](../../multi-app/multi-space/index.md) — 了解空间字段和空间隔离能力
