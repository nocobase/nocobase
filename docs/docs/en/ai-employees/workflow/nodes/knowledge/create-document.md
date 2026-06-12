---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Workflow AI knowledge base node - Create document"
description: "Use a collection event trigger and the AI knowledge base Create document node to synchronize newly added records to the AI knowledge base."
keywords: "AI knowledge base,workflow,create document,collection event trigger,NocoBase"
---

# Create document

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## Introduction

In NocoBase, the **Create document** node writes new documents to an AI knowledge base from a workflow. A common pattern is to listen for newly added records and synchronize body text, title, and business primary key fields to the knowledge base. The content can then be searched by RAG or retrieval nodes.

AI knowledge base nodes are asynchronous nodes, so the workflow must use asynchronous execution. Before using them, configure the knowledge base and vector store first.

:::tip Prerequisites

- [Knowledge base](/ai-employees/knowledge-base/knowledge-base)
- [Vector store](/ai-employees/knowledge-base/vector-store)
- [Workflow](/workflow)

:::

## Result

The example workflow listens for new records in the `Answers` collection and synchronizes each answer as a document in `KnowledgeBaseLocal`.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-editable-overview.png)

Where:

- `Collection event` listens for newly added collection records
- `Create document` writes record content to the AI knowledge base

## Configure the trigger

After creating an asynchronous workflow, select `Collection event` as the trigger. In the trigger configuration:

- Set `Collection` to the collection to synchronize, such as `Main / Answers`
- Set `Trigger on` to `After record added`
- If the document needs fields from related collections, preload them in `Preload associations`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-trigger-config.png)

The example preloads the `questions` relation field and writes related questions into `Related questions`.

## Configure the Create document node

Add a `Create document` node after the trigger.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-node-config.png)

Key settings:

- Select the target knowledge base in `Knowledge base`
- Use `Split document` to decide whether to split the document into snippets
- `Related questions` is available when the document is not split
- Set `Document type` to `Text`
- Set `Content` to the body field in trigger data
- Set `Key` to a stable and unique field, such as record ID
- Set `Name` to the title field for easier identification in the document list

:::warning Note

`Key` is used later to update and delete knowledge base documents. Create, update, and delete workflows must use the same Key rule. Usually, the business collection record ID is enough.

:::

## Enable and verify

Save the node and enable the workflow. After you add a record to `Answers`, the workflow runs automatically and creates the corresponding document in the AI knowledge base.

If the new content cannot be retrieved, first check workflow execution history to confirm that the trigger fired and the node succeeded. Then check whether the knowledge base document has finished vectorization.
