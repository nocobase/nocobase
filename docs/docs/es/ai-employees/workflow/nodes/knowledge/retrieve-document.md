---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Nodo de base de conocimientos de IA - Recuperar documento"
description: "Recupera fragmentos de documentos y pásalos a nodos de empleado de IA posteriores."
keywords: "AI knowledge base,workflow,retrieve document,AI employee,RAG,NocoBase"
---

# Recuperar documento

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## Introduction

In NocoBase, the **Retrieve document** node searches an AI knowledge base in a workflow and returns matched document snippets. It is suitable before an AI employee node: retrieve knowledge base snippets by the user question first, then pass the results to the AI employee so it can answer based on those snippets.

The Retrieve document node is asynchronous. Before using it, configure the knowledge base and make sure it already contains vectorized documents.

:::tip Prerequisites

- [Knowledge base](/ai-employees/knowledge-base/knowledge-base)
- [Create document](./create-document)
- [AI employee node](/ai-employees/workflow/nodes/employee/configuration)

:::

## Result

The example workflow listens for new records in `Questions`, sends the question content to `Retrieve document`, and passes the retrieval result to a downstream `AI employee` node.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-overview.png)

Where:

- `Collection event` receives user questions
- `Retrieve document` retrieves snippets from the knowledge base
- `AI employee` generates an answer based on snippets

## Configure the trigger

Select `Collection event` as the trigger. In the trigger configuration:

- Set `Collection` to the question source collection, such as `Main / Questions`
- Set `Trigger on` to `After record added`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-trigger-config.png)

Each time a question record is added, the workflow automatically enters the retrieval and answer process.

## Configure the Retrieve document node

Add a `Retrieve document` node after the trigger. It is recommended to change the node key to an easy-to-reference name, such as `retrieve_docs`.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-node-config.png)

Key settings:

- Select one or more knowledge bases in `Knowledge base`
- Set `Input matching text` to the user question field
- Set `Top K` to the maximum number of snippets to return
- Set `Score` to the minimum similarity threshold

After execution, the node returns an array of document snippets. Each result contains `id`, `content`, `score`, and `metadata`, sorted by `score` from high to low.

## Pass the result to the AI employee node

In the `AI employee` node, write the retrieval result into the prompt. The example directly references the Retrieve document node output:

```text
User question: {{$context.data.f_b2izf5j4xx0}}

Knowledge base snippets:
{{$jobsMapByNodeKey.retrieve_docs}}

Answer based on the snippets. If the snippets are not enough, explain what is missing.
```

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-retrieve-ai-employee-config.png)

`retrieve_docs` is the key of the retrieval node. If your node key is different, replace it with the actual key.

:::tip

If you only want to pass snippet text, reference the `content` field in the retrieval result through the variable selector. Passing the whole result array also includes `score` and `metadata`, which helps the AI judge source and relevance.

:::

## Enable and verify

Save the node and enable the workflow. After you add a question record to `Questions`, the workflow retrieves knowledge base snippets and passes the result to the AI employee node.

For verification, ask a question that clearly exists in the knowledge base. If the AI employee lacks evidence in its answer, first check the Retrieve document execution result and confirm whether snippets were returned and whether the `Score` threshold is too high.
