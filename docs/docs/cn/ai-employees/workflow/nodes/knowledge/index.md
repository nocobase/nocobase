---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点概述"
description: "介绍工作流 AI 知识库节点的示例场景、数据表结构，以及创建、更新、删除、检索文档节点之间的配合方式。"
keywords: "AI 知识库,工作流,数据库事件触发器,知识库同步,RAG,NocoBase"
---

# 概述

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

AI 知识库节点可以让工作流直接管理知识库文档。你可以在业务数据发生变化时，把新增、更新、删除同步到知识库；也可以在工作流里先检索知识库，再把检索片段交给下游 AI 员工节点。

这组文档使用一个 Q&A 场景作为示例：后台维护标准答案，用户提交问题，工作流把答案同步到 AI 知识库，并在收到问题后检索知识库片段生成回答。

## 示例场景

示例里使用两张业务表：

- `Answers`：保存可同步到知识库的答案内容
- `Questions`：保存用户提交的问题

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-overview-collections.png)

其中 `Answers` 是知识库文档的来源表。新增答案时创建知识库文档，修改答案时更新知识库文档，删除答案时删除知识库文档。

`Questions` 是检索流程的输入表。新增问题时，工作流把问题内容作为检索文本，从知识库找出相关文档片段，再传给 AI 员工节点。

## Answers 表结构

`Answers` 表里主要使用三个字段：

- `Title`：作为知识库文档名称
- `Content`：作为知识库文档正文
- `questions`：关联到 `Questions` 表，用来补充相关问题

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-overview-answers-fields.png)

`questions` 是一个一对多关系字段。它的源表是 `Answers`，目标表是 `Questions`，源键和目标键都使用 `ID`，外键保存在 `Questions` 表中。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-overview-answers-questions-relation.png)

这个关系字段在创建和更新文档时会被预加载。这样可以把关联问题写入「Related questions」，让一条答案不仅能通过正文被检索到，也能通过常见问法被检索到。

:::tip

如果你的知识库文档不需要相关问题，可以不用配置类似 `questions` 的关系字段。只要有稳定的 `Key` 字段和正文内容，就可以完成创建、更新、删除同步。

:::

## 工作流分工

这组示例会拆成四个工作流节点手册：

| 场景 | 触发方式 | 使用节点 | 作用 |
| --- | --- | --- | --- |
| 新增答案 | `Answers` 表 `After record added` | 「Create document」 | 把新增答案写入 AI 知识库 |
| 更新答案 | `Answers` 表 `After record updated` | 「Update document」 | 用同一个 `Key` 更新知识库文档 |
| 删除答案 | `Answers` 表 `After record deleted` | 「Delete document」 | 用同一个 `Key` 删除知识库文档 |
| 提交问题 | `Questions` 表 `After record added` | 「Retrieve document」+「AI employee」 | 检索知识库片段并交给 AI 员工回答 |

其中 `Key` 是同步链路里最重要的字段。创建、更新、删除三个流程必须使用同一套 `Key` 规则，示例中直接使用 `Answers` 表记录 ID。

## 节点文档

- [创建文档](./create-document)
- [更新文档](./update-document)
- [删除文档](./delete-document)
- [检索文档](./retrieve-document)
