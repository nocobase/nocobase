---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 更新文档"
description: "使用数据库事件触发器和 AI 知识库更新文档节点，把数据表更新同步到 AI 知识库。"
keywords: "AI 知识库,工作流,更新文档,数据库事件触发器,NocoBase"
---

# 更新文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**更新文档**节点用于在工作流中更新 AI 知识库里的已有文档。在这组示例里，它负责监听 `Answers` 表的更新记录，用和创建文档相同的 `Key` 找到目标知识库里的文档，并用最新字段内容重新写入。

更新文档节点是异步节点。它不是单独使用的入口，需要接在创建文档流程之后，和创建、删除文档节点使用同一个目标知识库和同一套 `Key` 规则。

## 工作流结构

示例工作流监听 `Answers` 表的更新记录，并把最新答案内容同步到目标知识库中的同一篇文档。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-update-editable-overview.png)

其中：

- 「Collection event」负责监听数据表更新
- 「Update document」负责更新目标知识库中同 `Key` 的文档

## 开始之前

下面的示例沿用 [创建文档](./create-document) 中的目标知识库和 `Key` 规则。开始配置前，先确认：

- 创建文档工作流已经启用，并且至少创建过一篇知识库文档
- `Key` 使用稳定且唯一的业务字段，示例中使用 `Answers` 表记录 ID
- 如果更新时也要同步关联问题，需要在触发器里预加载 `questions` 关联字段

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

更新文档节点的参数和 [创建文档](./create-document) 基本一致，通常继续选择同一个目标知识库、同样的分段方式、同样的正文和标题字段。如果需要同步关联问题，也继续使用 `Answers.questions.content`。

这里最需要注意的是「Key」：在更新文档节点中，「Key」是必填参数，并且必须和创建文档节点完全一致。示例继续使用 `Answers.ID`，这样节点才能找到同一篇知识库文档并覆盖它的内容。

:::warning 注意

如果找不到对应 `Key` 的文档，更新会失败。配置前先确保创建文档工作流已经用同一个 `Key` 创建过文档。

:::

## 下一步

完成更新文档节点后，继续配置 [删除文档](./delete-document)。三条工作流都配置好以后，可以回到 [概述](./) 的「验证同步链路」章节，按新增、更新、删除的顺序验证整条同步链路。
