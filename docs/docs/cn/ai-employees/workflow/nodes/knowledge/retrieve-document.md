---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 检索文档"
description: "在工作流中使用 AI 知识库检索文档节点，从知识库检索文档片段，并传递给下游 AI 员工节点。"
keywords: "AI 知识库,工作流,检索文档,AI 员工,RAG,NocoBase"
---

# 检索文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**检索文档**节点用于在工作流里搜索 AI 知识库，并返回匹配的文档片段。它适合放在 AI 员工节点之前：先用任务输入检索知识库，再把检索结果传给 AI 员工，作为任务处理的上下文。

检索文档节点是异步节点。使用前需要先配置好知识库，并确保知识库里已有向量化完成的文档。

## 工作流结构

示例工作流监听 `Questions` 表的新增记录，把检索文本传给「Retrieve document」节点，再把检索结果交给下游「AI employee」节点处理任务。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-overview.png)

其中：

- 「Collection event」负责接收任务输入
- 「Retrieve document」负责从知识库检索片段
- 「AI employee」负责基于片段处理任务

实际业务里，AI 员工生成的处理结果通常还需要保存起来，后面会继续接数据库操作节点。这里为了聚焦检索节点，省略了保存结果的后续节点。

## 开始之前

下面的示例是独立的检索流程。开始配置前，先确认：

- 知识库中已经有向量化完成的文档；文档维护方式见 [知识库概述](/ai-employees/knowledge-base/knowledge-base) 和 [创建文档](./create-document)
- 已准备一个用于输入检索文本的数据来源，示例中使用 `Questions` 表
- 下游已经准备好可用的 AI 员工节点，配置方式见 [AI 员工节点](/ai-employees/workflow/nodes/employee/configuration)

## 配置触发器

触发器选择「Collection event」。在触发器配置中：

- 「Collection」选择检索文本来源表，比如 `Main / Questions`
- 「Trigger on」选择 `After record added`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-trigger-config.png)

这样每新增一条输入记录，工作流就会自动进入检索和任务处理流程。

## 配置检索文档节点

在触发器后添加「Retrieve document」节点。建议把节点 key 改成容易引用的名称，比如 `retrieve_docs`。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-node-config.png)

关键配置如下：

- 「Knowledge base」选择一个或多个要检索的知识库
- 「Input matching text」选择检索文本字段
- 「Top K」设置最多返回的片段数量
- 「Score」设置最低相似度阈值

节点执行后会返回一个文档片段数组。每个结果包含 `id`、`content`、`score`、`metadata` 字段，并按 `score` 从高到低排序。

## 传递给 AI 员工节点

在「AI employee」节点中，把检索结果写入提示词。示例里直接引用了检索节点的输出：

```text
Task input: {{$context.data.f_b2izf5j4xx0}}

Knowledge base snippets:
{{$jobsMapByNodeKey.retrieve_docs}}

Use the snippets as context to complete the task. If the snippets are not enough, explain what information is missing.
```

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-ai-employee-config.png)

其中 `retrieve_docs` 是检索节点的 key。如果你的节点 key 不同，需要替换成实际 key。

:::tip

如果只想传递片段正文，可以在变量选择器中引用检索结果里的 `content` 字段。直接传整个结果数组则会同时带上 `score` 和 `metadata`，便于 AI 判断片段来源和相关度。

:::
