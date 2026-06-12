---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Nodo de base de conocimientos de IA - Eliminar documento"
description: "Elimina documentos de la base de conocimientos después de eliminar registros de colección."
keywords: "AI knowledge base,workflow,delete document,collection event trigger,NocoBase"
---

# Eliminar documento

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## Introduction

In NocoBase, the **Delete document** node deletes a specified document from an AI knowledge base. In this example, it listens for deletion events in `Answers` and deletes the corresponding document from the target knowledge base by the same `Key` used by Create document, so removed data is no longer retrieved.

The Delete document node is asynchronous. It depends on the `Key` written when the document was created, so it must use the same target knowledge base and the same `Key` rule as the Create and Update document nodes.

## Workflow structure

The example workflow listens for deletion events in `Answers` and deletes the document with the same `Key` from the target knowledge base.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-editable-overview.png)

Where:

- `Collection event` listens for collection deletion
- `Delete document` deletes the document from the target knowledge base

## Before you start

The example uses the target knowledge base and `Key` rule from [Create document](./create-document). Before configuring the workflow, confirm that:

- The Create document workflow is enabled and the target knowledge base contains documents with the same `Key`
- The delete workflow can read this `Key` from trigger data. The example uses the `Answers` record ID
- If you need to review the full synchronization chain, see the workflow responsibilities in [Overview](./)

## Configure the trigger

Select `Collection event` as the trigger. In the trigger configuration:

- Set `Collection` to the collection to listen to, such as `Main / Answers`
- Set `Trigger on` to `After record deleted`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-trigger-config.png)

Deleting a document only needs the document `Key`, so relation fields usually do not need to be preloaded.

## Configure the Delete document node

Add a `Delete document` node after the trigger.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-node-config.png)

Key settings:

The Delete document node only needs to locate the document to delete. It does not need body content, title, or related questions.

| Setting | Example value | Description |
| --- | --- | --- |
| `Knowledge base` | Target knowledge base | Select the same knowledge base used by the Create and Update document nodes. |
| `Key` | `Answers.ID` | Select the exact same field used by the Create document node. The example continues to use the `Answers` record ID so the node deletes the document that corresponds to this answer. |

:::warning Note

The delete node does not look up documents by title or body content. It only locates documents by `Knowledge base` and `Key`. The Create, Update, and Delete workflows must use the same `Key`.

:::

## Next step

After configuring the Delete document node, return to the "Verify the synchronization chain" section in [Overview](./) to verify add, update, and delete in order.
