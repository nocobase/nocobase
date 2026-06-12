---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Node Knowledge Base AI workflow - Hapus dokumen"
description: "Hapus dokumen Knowledge Base setelah record koleksi dihapus."
keywords: "AI knowledge base,workflow,delete document,collection event trigger,NocoBase"
---

# Hapus dokumen

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## Introduction

In NocoBase, the **Delete document** node deletes a specified document from an AI knowledge base. It is usually used with a collection event trigger: after a business record is deleted, the workflow deletes the corresponding knowledge base document by the record `Key`, so removed data will no longer be retrieved.

The Delete document node is asynchronous. Before configuring it, confirm the `Key` rule used when creating documents.

:::tip Prerequisites

- [Create document](./create-document)
- [Update document](./update-document)
- [Knowledge base](/ai-employees/knowledge-base/knowledge-base)

:::

## Result

The example workflow listens for delete events in `Answers` and deletes the document with the same `Key` in `KnowledgeBaseLocal`.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-editable-overview.png)

Where:

- `Collection event` listens for collection deletion
- `Delete document` removes the document from the knowledge base

## Configure the trigger

Select `Collection event` as the trigger. In the trigger configuration:

- Set `Collection` to the collection to monitor, such as `Main / Answers`
- Set `Trigger on` to `After record deleted`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-trigger-config.png)

Deleting a document only needs the document `Key`, so related fields usually do not need to be preloaded.

## Configure the Delete document node

Add a `Delete document` node after the trigger.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-delete-node-config.png)

Key settings:

- Select the document knowledge base in `Knowledge base`
- Set `Key` to the same field used when creating the document, such as the record ID from trigger data

:::warning Note

The delete node does not search documents by title or content. It only locates documents by `Knowledge base` and `Key`. The `Key` used in create, update, and delete workflows must be consistent.

:::

## Enable and verify

Save the node and enable the workflow. After you delete a record in `Answers`, the workflow runs automatically and removes the corresponding document from the knowledge base.

If old content can still be retrieved after deletion, check workflow execution history and the knowledge base document list to confirm that the delete node succeeded and that the retrieval result is not from another document snippet.
