---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "工作流 AI 知识库节点 - 检索文档"
description: "在工作流中使用 AI 知识库检索文档节点，从知识库检索文档片段，并传递给下游 AI 员工节点。"
keywords: "AI 知识库,工作流,检索文档,AI 员工,RAG,NocoBase"
---

# 检索文档

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## 介绍

在 NocoBase 中，**检索文档**节点用于在工作流里搜索 AI 知识库，并返回匹配的文档片段。它适合放在 AI 员工节点之前：先用用户问题检索知识库，再把检索结果传给 AI 员工，让 AI 基于这些片段回答。

检索文档节点是异步节点。使用前需要先配置好知识库，并确保知识库里已有向量化完成的文档。

:::tip 前置阅读

- [知识库](/ai-employees/knowledge-base/knowledge-base)
- [创建文档](./create-document)
- [AI 员工节点](/ai-employees/workflow/nodes/employee/configuration)

:::

## 最终效果

示例工作流监听 `Questions` 表的新增记录，把问题内容传给「Retrieve document」节点，再把检索结果交给下游「AI employee」节点生成回答。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-overview.png)

其中：

- 「Collection event」负责接收用户问题
- 「Retrieve document」负责从知识库检索片段
- 「AI employee」负责基于片段生成回答

## 配置触发器

触发器选择「Collection event」。在触发器配置中：

- 「Collection」选择问题来源表，比如 `Main / Questions`
- 「Trigger on」选择 `After record added`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-trigger-config.png)

这样每新增一条问题记录，工作流就会自动进入检索和回答流程。

## 配置检索文档节点

在触发器后添加「Retrieve document」节点。建议把节点 key 改成容易引用的名称，比如 `retrieve_docs`。

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-node-config.png)

关键配置如下：

- 「Knowledge base」选择一个或多个要检索的知识库
- 「Input matching text」选择用户问题字段
- 「Top K」设置最多返回的片段数量
- 「Score」设置最低相似度阈值

节点执行后会返回一个文档片段数组。每个结果包含 `id`、`content`、`score`、`metadata` 字段，并按 `score` 从高到低排序。

## 传递给 AI 员工节点

在「AI employee」节点中，把检索结果写入提示词。示例里直接引用了检索节点的输出：

```text
User question: {{$context.data.f_b2izf5j4xx0}}

Knowledge base snippets:
{{$jobsMapByNodeKey.retrieve_docs}}

Answer based on the snippets. If the snippets are not enough, explain what is missing.
```

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-ai-employee-config.png)

其中 `retrieve_docs` 是检索节点的 key。如果你的节点 key 不同，需要替换成实际 key。

:::tip

如果只想传递片段正文，可以在变量选择器中引用检索结果里的 `content` 字段。直接传整个结果数组则会同时带上 `score` 和 `metadata`，便于 AI 判断片段来源和相关度。

:::

## 启用并验证

保存节点后启用工作流。向 `Questions` 表新增一条问题记录后，工作流会检索知识库片段，并把结果传给 AI 员工节点。

验证时可以先输入一条知识库中明确存在答案的问题。如果 AI 员工回答缺少依据，优先检查检索节点的执行结果，确认是否返回了片段，以及 `Score` 阈值是否设置过高。
