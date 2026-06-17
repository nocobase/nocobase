---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 创建文档"
description: "使用数据库事件触发器和 AI 知识库创建文档节点，把数据表新增数据同步到 AI 知识库。"
keywords: "AI 知识库,工作流,创建文档,数据库事件触发器,NocoBase"
---

# 创建文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**创建文档**节点用于在工作流中向 AI 知识库写入新文档。在这组示例里，它负责监听 `Answers` 表的新增记录，把答案正文、文档名称、关联问题和稳定的 `Key` 一起写入目标知识库。

AI 知识库节点是异步节点，创建工作流时需要选择异步执行。目标知识库和向量存储需要提前准备好，完整场景见 [概述](./)。

## 工作流结构

示例工作流监听 `Answers` 表的新增记录，并把每条答案同步为目标知识库里的一篇文档。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-editable-overview.png)

其中：

- 「Collection event」负责监听数据表新增数据
- 「Create document」负责把记录内容写入 AI 知识库

## 开始之前

下面的示例沿用 [概述](./) 中的 `Answers` / `Questions` 表和目标知识库。开始配置前，先确认：

- 已创建 Local 知识库，并配置好文件存储和向量存储，相关配置见 [知识库概述](../../../knowledge-base/knowledge-base) 和 [向量存储](../../../knowledge-base/vector-store)
- 已准备 `Answers.questions` 关系字段；如果需要查看表结构，可以回到 [概述](./)
- 工作流使用异步执行；基础用法见 [工作流](../../../../workflow)

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

这些配置会决定工作流创建出来的知识库文档名称、正文内容、分段方式，以及是否带上关联问题。

| 配置项 | 示例配置 | 说明 |
| --- | --- | --- |
| 「Knowledge base」 | 目标知识库 | 选择概述中准备好的同一个 Local 知识库。工作流会在这个知识库的「Documents」列表中创建一篇文档，并进入后续分段和向量化流程。 |
| 「Split document」 | `No` | 控制是否把正文拆成多个分段。示例里一条答案本身就是完整回答，关闭拆分后，整篇文档会作为一个分段，更适合和「Related questions」一起命中同一条答案。 |
| 「Related questions」 | `Answers.questions.content` | 只有关闭「Split document」后才会生效。这里把常见问法写入当前分段的「Related questions」，它不会改写正文，但会参与检索，用来提升同义问法、常见问法的命中效果。 |
| 「Document type」 | `Text` | 使用文本字段创建知识库文档。示例的答案正文来自数据表字段，所以选择 `Text`。如果业务表里保存的是附件或文件地址，再改用 `Attachment`。 |
| 「Content」 | `Answers.Content` | 选择答案正文，作为知识库文档正文。后续在分段管理中看到的「Content」就来自这里。 |
| 「Key」 | `Answers.ID` | 设置知识库文档的唯一标识。示例使用 `Answers` 记录 ID，这样更新和删除工作流可以用同一个 `Key` 精确找到这篇文档。 |
| 「Name」 | `Answers.Title` | 设置知识库文档名称。示例使用答案标题，方便在「Documents」列表中查看文档状态、进入分段管理和做命中测试。 |

如果「Related questions」需要引用关联表字段，触发器里必须先配置「Preload associations」。否则节点执行时只能拿到当前 `Answers` 记录本身，拿不到关联的 `questions` 数据。

:::warning 注意

「Key」会作为后续更新和删除知识库文档的依据。创建、更新、删除三个工作流必须使用同一套 Key 规则，通常直接使用业务表记录 ID。

:::

## 下一步

创建文档工作流是同步链路的起点。继续配置 [更新文档](./update-document) 和 [删除文档](./delete-document) 后，可以回到 [概述](./) 的「验证同步链路」章节，按新增、更新、删除的顺序验证整条同步链路。
