---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 更新文档"
description: "使用数据库事件触发器和 AI 知识库更新文档节点，把数据表更新同步到 AI 知识库。"
keywords: "AI 知识库,工作流,更新文档,数据库事件触发器,NocoBase"
---

# 更新文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**更新文档**节点用于在工作流中更新 AI 知识库里的已有文档。它适合和数据库事件触发器配合：业务表记录被修改后，用同一个 `Key` 找到知识库文档，并用最新字段内容重新写入。

更新文档节点是异步节点。配置工作流前，需要先完成知识库、向量存储，以及创建文档工作流的配置。

:::tip 前置阅读

- [创建文档](./create-document)
- [知识库](/ai-employees/knowledge-base/knowledge-base)
- [向量存储](/ai-employees/knowledge-base/vector-store)

:::

## 最终效果

示例工作流监听 `Answers` 表的更新记录，并把最新答案内容同步到 `KnowledgeBaseLocal` 中同一个文档。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-update-editable-overview.png)

其中：

- 「Collection event」负责监听数据表更新
- 「Update document」负责更新知识库中同 `Key` 的文档

## 配置触发器

触发器选择「Collection event」。在触发器配置中：

- 「Collection」选择需要监听的数据表，比如 `Main / Answers`
- 「Trigger on」选择 `After record updated`
- 「Changed fields」可按需限制触发字段，比如只监听标题或正文变化
- 如果节点需要使用关联字段，可以在「Preload associations」里预加载关联字段

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-update-trigger-config.png)

如果不选择「Changed fields」，任意字段变化都会触发该工作流。

## 配置更新文档节点

在触发器后添加「Update document」节点。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-update-node-config.png)

关键配置如下：

- 「Knowledge base」选择文档所在知识库
- 「Split document」选择是否重新拆分文档片段
- 「Related questions」在不拆分文档时可用
- 「Document type」选择 `Text`
- 「Content」选择更新后的正文内容
- 「Key」选择和创建文档时完全一致的字段
- 「Name」选择标题字段

:::warning 注意

「Update document」节点要求 `Key` 必填。如果找不到对应 `Key` 的文档，更新会失败。配置前先确保创建文档工作流已经用同一个 `Key` 创建过文档。

:::

## 启用并验证

保存节点后启用工作流。修改 `Answers` 表中的一条记录后，工作流会自动执行，知识库中同 `Key` 的文档会被更新。

验证时可以先修改一段容易检索的内容，然后用知识库检索或工作流检索节点确认返回片段已经变成最新内容。
