---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点概述"
description: "介绍工作流 AI 知识库节点的示例场景、数据表结构，以及创建、更新、删除文档节点同步知识库的配合方式。"
keywords: "AI 知识库,工作流,数据库事件触发器,知识库同步,NocoBase"
---

# 概述

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

AI 知识库节点可以让工作流直接管理知识库文档。你可以在业务数据发生变化时，把新增、更新、删除同步到知识库，让知识库内容始终跟业务表保持一致。

这组文档使用一个 Q&A 场景作为示例：后台维护标准答案，以及每条答案对应的常见问法。工作流把答案正文和关联问题一起同步到同一个目标知识库，后续 AI 员工或其他流程就可以基于这些知识库文档使用。

## 示例场景

示例里使用两张业务表：

- `Answers`：保存可同步到知识库的答案内容
- `Questions`：保存答案对应的常见问法

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-overview-collections.png)

其中 `Answers` 是知识库文档的来源表。新增答案时创建知识库文档，修改答案时更新知识库文档，删除答案时删除知识库文档。

`Questions` 不作为独立的知识库文档来源。它通过 `Answers.questions` 关系字段挂在答案下面，用来补充同一条答案可能对应的不同问法。

同步前需要先准备一个 Local 知识库。知识库名称可以按你的环境自行设置，后续创建、更新、删除三条工作流只要选择同一个知识库即可。

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

这组示例的核心是三条同步工作流。它们处理的是同一批 `Answers` 数据，也会写入同一个目标知识库：

| 场景 | 触发方式 | 使用节点 | 作用 |
| --- | --- | --- | --- |
| 新增答案 | `Answers` 表 `After record added` | 「Create document」 | 把新增答案写入 AI 知识库 |
| 更新答案 | `Answers` 表 `After record updated` | 「Update document」 | 用同一个 `Key` 更新知识库文档 |
| 删除答案 | `Answers` 表 `After record deleted` | 「Delete document」 | 用同一个 `Key` 删除知识库文档 |

其中 `Key` 是同步链路里最重要的字段。创建、更新、删除三个流程必须使用同一套 `Key` 规则，示例中直接使用 `Answers` 表记录 ID。

## 操作手册

- [创建文档](./create-document)
- [更新文档](./update-document)
- [删除文档](./delete-document)
- [检索文档](./retrieve-document)

## 验证同步链路

配置完创建、更新、删除三条工作流后，可以用同一条 `Answers` 记录检查完整同步链路。

新增答案后，按下面的顺序检查：

1. 进入目标知识库的「Documents」，确认新增文档已经出现，并且「Status」为 `Success`。详细用法见 [知识库文档管理](../../../knowledge-base/knowledge-base/documents)。
2. 点击该文档的「Segments」，确认分段里的「Related questions」包含 `Answers.questions` 里的常见问法。详细用法见 [分段管理](../../../knowledge-base/knowledge-base/segments)。
3. 进入「Hit tests」，输入答案正文关键词或关联问题，确认可以命中刚同步的答案。详细用法见 [命中测试](../../../knowledge-base/knowledge-base/hit-tests)。

新增同步正常后，继续修改这条 `Answers` 记录，确认目标知识库里的文档内容随之更新。最后删除这条记录，确认目标知识库里的对应文档被删除。
