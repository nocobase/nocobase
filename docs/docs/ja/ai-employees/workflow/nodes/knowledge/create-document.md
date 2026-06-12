---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "ワークフロー AI ナレッジベースノード - ドキュメント作成"
description: "コレクションイベントトリガーと作成ノードで、新規データを AI ナレッジベースに同期します。"
keywords: "AI knowledge base,workflow,create document,collection event trigger,NocoBase"
---

# ドキュメント作成

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## Introduction

In NocoBase, the **Create document** node writes new documents to an AI knowledge base from a workflow. In this example, it listens for new records in `Answers` and writes the answer body, document name, related questions, and a stable `Key` to the target knowledge base.

AI knowledge base nodes are asynchronous nodes, so the workflow must use asynchronous execution. Prepare the target knowledge base and vector store first. See [Overview](./) for the full scenario.

## Workflow structure

The example workflow listens for new records in `Answers` and synchronizes each answer as one document in the target knowledge base.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-editable-overview.png)

Where:

- `Collection event` listens for newly added collection records
- `Create document` writes record content to the AI knowledge base

## Before you start

The example uses the `Answers` / `Questions` collections and target knowledge base described in [Overview](./). Before configuring the workflow, confirm that:

- A Local knowledge base has been created, with file storage and vector store configured. See [Knowledge base overview](../../../knowledge-base/knowledge-base) and [Vector store](../../../knowledge-base/vector-store)
- The `Answers.questions` relation field is ready. To review the collection structure, return to [Overview](./)
- The workflow uses asynchronous execution. See [Workflow](../../../../workflow) for the basics

## Configure the trigger

Create an asynchronous workflow and select `Collection event` as the trigger. In the trigger configuration:

- Set `Collection` to the collection to synchronize, such as `Main / Answers`
- Set `Trigger on` to `After record added`
- If the document needs fields from related collections, preload relation fields in `Preload associations`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-trigger-config.png)

The example preloads the `questions` relation field so related questions can be written to `Related questions`.

## Configure the Create document node

Add a `Create document` node after the trigger.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-create-node-config.png)

Key settings:

These settings decide the knowledge base document name, body content, splitting behavior, and whether related questions are included.

| Setting | Example value | Description |
| --- | --- | --- |
| `Knowledge base` | Target knowledge base | Select the same Local knowledge base prepared in the overview. The workflow creates a document in its `Documents` list and then enters splitting and vectorization. |
| `Split document` | `No` | Controls whether the body is split into multiple segments. In this example, one answer is already a complete response. With splitting disabled, the whole document becomes one segment and works better with `Related questions`. |
| `Related questions` | `Answers.questions.content` | Only takes effect when `Split document` is disabled. It writes common phrasings into `Related questions` for the current segment. It does not rewrite the body, but participates in retrieval. |
| `Document type` | `Text` | Creates a knowledge base document from a text field. The example uses a collection field as the answer body, so `Text` is selected. Use `Attachment` if your business collection stores files or file URLs. |
| `Content` | `Answers.Content` | Select the answer body as the knowledge base document body. The `Content` shown in segment management comes from this field. |
| `Key` | `Answers.ID` | Sets the unique identifier of the knowledge base document. The example uses the `Answers` record ID so update and delete workflows can find the same document by the same `Key`. |
| `Name` | `Answers.Title` | Sets the document name. The example uses the answer title, making it easier to identify the document in `Documents`, enter segment management, and run hit tests. |

If `Related questions` references relation fields, configure `Preload associations` in the trigger first. Otherwise, the node can only access the current `Answers` record and cannot read the related `questions` data.

:::warning Note

`Key` is used by the later update and delete workflows. The Create, Update, and Delete workflows must use the same Key rule, usually the business collection record ID.

:::

## Next step

The Create document workflow is the starting point of the synchronization chain. Continue with [Update document](./update-document) and [Delete document](./delete-document), then return to the "Verify the synchronization chain" section in [Overview](./) to verify add, update, and delete in order.
