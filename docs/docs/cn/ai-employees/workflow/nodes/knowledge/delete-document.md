---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 删除文档"
description: "使用数据库事件触发器和 AI 知识库删除文档节点，在数据表记录删除后同步删除知识库文档。"
keywords: "AI 知识库,工作流,删除文档,数据库事件触发器,NocoBase"
---

# 删除文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**删除文档**节点用于从 AI 知识库中删除指定文档。在这组示例里，它负责监听 `Answers` 表的删除事件，用和创建文档相同的 `Key` 删除目标知识库里的对应文档，避免已经移除的数据继续被检索出来。

删除文档节点是异步节点。它依赖创建文档时写入的 `Key`，所以需要和创建、更新文档节点使用同一个目标知识库和同一套 `Key` 规则。

## 工作流结构

示例工作流监听 `Answers` 表的删除事件，并删除目标知识库中同 `Key` 的文档。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-editable-overview.png)

其中：

- 「Collection event」负责监听数据表删除
- 「Delete document」负责从目标知识库删除文档

## 开始之前

下面的示例沿用 [创建文档](./create-document) 中的目标知识库和 `Key` 规则。开始配置前，先确认：

- 创建文档工作流已经启用，并且目标知识库中存在同 `Key` 的文档
- 删除工作流可以从触发数据中拿到这个 `Key`，示例中使用 `Answers` 表记录 ID
- 如果还没有理解完整同步链路，可以先看 [概述](./) 中的工作流分工

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

删除文档节点只需要定位要删除的文档，不需要重新传入正文、标题或关联问题。

| 配置项 | 示例配置 | 说明 |
| --- | --- | --- |
| 「Knowledge base」 | 目标知识库 | 选择和创建、更新文档节点相同的知识库。 |
| 「Key」 | `Answers.ID` | 选择和创建文档节点完全一致的字段。示例继续使用 `Answers` 表记录 ID，确保删除的是这条答案对应的知识库文档。 |

:::warning 注意

删除节点不会根据标题或正文查找文档，只会根据「Knowledge base」和「Key」定位文档。创建、更新、删除三个流程里的 `Key` 必须一致。

:::

## 下一步

完成删除文档节点后，可以回到 [概述](./) 的「验证同步链路」章节，按新增、更新、删除的顺序验证整条同步链路。
