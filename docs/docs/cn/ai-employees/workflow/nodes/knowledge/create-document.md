---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 创建文档"
description: "使用数据库事件触发器和 AI 知识库创建文档节点，把数据表新增数据同步到 AI 知识库。"
keywords: "AI 知识库,工作流,创建文档,数据库事件触发器,NocoBase"
---

# 创建文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**创建文档**节点用于在工作流中向 AI 知识库写入新文档。常见用法是监听数据表新增记录，把记录里的正文、标题、业务主键等字段同步到知识库，后续就可以通过 RAG 或检索节点搜索到这些内容。

AI 知识库节点是异步节点，创建工作流时需要选择异步执行。另外，使用之前需要先配置好知识库和向量存储。

:::tip 前置阅读

- [知识库](/ai-employees/knowledge-base/knowledge-base)
- [向量存储](/ai-employees/knowledge-base/vector-store)
- [工作流](/workflow)

:::

## 最终效果

示例工作流监听 `Answers` 表的新增记录，并把每条答案同步为 `KnowledgeBaseLocal` 里的一个文档。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-editable-overview.png)

其中：

- 「Collection event」负责监听数据表新增数据
- 「Create document」负责把记录内容写入 AI 知识库

## 配置触发器

新建异步工作流后，触发器选择「Collection event」。在触发器配置中：

- 「Collection」选择需要同步的数据表，比如 `Main / Answers`
- 「Trigger on」选择 `After record added`
- 如果文档需要带上关联表里的字段，可以在「Preload associations」里预加载关联字段

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-trigger-config.png)

示例中预加载了 `questions` 关联字段，用来把关联问题写入「Related questions」。

## 配置创建文档节点

在触发器后添加「Create document」节点。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-node-config.png)

关键配置如下：

- 「Knowledge base」选择要写入的知识库
- 「Split document」选择是否把文档拆成多个片段
- 「Related questions」在不拆分文档时可用，用来补充可检索问题
- 「Document type」选择 `Text`
- 「Content」选择触发数据里的正文内容
- 「Key」选择稳定且唯一的字段，比如记录 ID
- 「Name」选择标题字段，方便在知识库文档列表中识别

:::warning 注意

「Key」会作为后续更新和删除知识库文档的依据。创建、更新、删除三个工作流必须使用同一套 Key 规则，通常直接使用业务表记录 ID。

:::

## 启用并验证

保存节点后启用工作流。向 `Answers` 表新增一条记录后，工作流会自动执行，并在 AI 知识库中创建对应文档。

如果没有检索到新增内容，可以先检查工作流执行历史，确认触发器是否触发、节点是否执行成功，再检查知识库文档是否完成向量化。
