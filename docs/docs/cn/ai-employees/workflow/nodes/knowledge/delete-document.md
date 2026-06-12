---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 删除文档"
description: "使用数据库事件触发器和 AI 知识库删除文档节点，在数据表记录删除后同步删除知识库文档。"
keywords: "AI 知识库,工作流,删除文档,数据库事件触发器,NocoBase"
---

# 删除文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**删除文档**节点用于从 AI 知识库中删除指定文档。它通常配合数据库事件触发器使用：业务表记录被删除后，工作流用这条记录的 `Key` 删除知识库中对应文档，避免已经移除的数据继续被检索出来。

删除文档节点是异步节点。配置前需要先确认创建文档时使用的 `Key` 规则。

:::tip 前置阅读

- [创建文档](./create-document)
- [更新文档](./update-document)
- [知识库](/ai-employees/knowledge-base/knowledge-base)

:::

## 最终效果

示例工作流监听 `Answers` 表的删除事件，并删除 `KnowledgeBaseLocal` 中同 `Key` 的文档。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-editable-overview.png)

其中：

- 「Collection event」负责监听数据表删除
- 「Delete document」负责从知识库删除文档

## 配置触发器

触发器选择「Collection event」。在触发器配置中：

- 「Collection」选择需要监听的数据表，比如 `Main / Answers`
- 「Trigger on」选择 `After record deleted`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-trigger-config.png)

删除文档只需要找到对应文档的 `Key`，通常不需要预加载关联字段。

## 配置删除文档节点

在触发器后添加「Delete document」节点。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-node-config.png)

关键配置如下：

- 「Knowledge base」选择文档所在知识库
- 「Key」选择和创建文档时一致的字段，比如触发数据里的记录 ID

:::warning 注意

删除节点不会根据标题或正文查找文档，只会根据「Knowledge base」和「Key」定位文档。创建、更新、删除三个流程里的 `Key` 必须一致。

:::

## 启用并验证

保存节点后启用工作流。删除 `Answers` 表中的一条记录后，工作流会自动执行，并从知识库中删除对应文档。

如果删除后仍能检索到旧内容，可以检查工作流执行历史和知识库文档列表，确认删除节点是否成功执行，以及检索结果是否来自其他文档片段。
