---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Workflow AI-Wissensdatenbank-Knoten - Dokument aktualisieren"
description: "Synchronisiere aktualisierte Datensätze mit dem Knoten Dokument aktualisieren in die AI-Wissensdatenbank."
keywords: "AI knowledge base,workflow,update document,collection event trigger,NocoBase"
---

# Dokument aktualisieren

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## Introduction

In NocoBase, the **Update document** node updates existing documents in an AI knowledge base from a workflow. It is commonly used with collection event triggers: after a business record is changed, the workflow finds the knowledge base document by the same `Key` and rewrites it with the latest fields.

The Update document node is asynchronous. Before configuring it, finish the knowledge base, vector store, and Create document workflow setup.

:::tip Prerequisites

- [Create document](./create-document)
- [Knowledge base](/ai-employees/knowledge-base/knowledge-base)
- [Vector store](/ai-employees/knowledge-base/vector-store)

:::

## Result

The example workflow listens for updates in `Answers` and synchronizes the latest answer content to the same document in `KnowledgeBaseLocal`.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-update-editable-overview.png)

Where:

- `Collection event` listens for collection updates
- `Update document` updates the document with the same `Key` in the knowledge base

## Configure the trigger

Select `Collection event` as the trigger. In the trigger configuration:

- Set `Collection` to the collection to monitor, such as `Main / Answers`
- Set `Trigger on` to `After record updated`
- Use `Changed fields` to limit triggering fields when needed, such as title or content changes only
- If the node needs related fields, preload them in `Preload associations`

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-update-trigger-config.png)

If `Changed fields` is not selected, any field change triggers this workflow.

## Configure the Update document node

Add an `Update document` node after the trigger.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-update-node-config.png)

Key settings:

- Select the document knowledge base in `Knowledge base`
- Use `Split document` to decide whether to split snippets again
- `Related questions` is available when the document is not split
- Set `Document type` to `Text`
- Set `Content` to the updated body content
- Set `Key` to exactly the same field used when creating the document
- Set `Name` to the title field

:::warning Note

`Update document` requires `Key`. If no document with the corresponding `Key` exists, the update fails. Before configuring it, make sure the Create document workflow has created documents with the same `Key`.

:::

## Enable and verify

Save the node and enable the workflow. After you update a record in `Answers`, the workflow runs automatically and updates the document with the same `Key` in the knowledge base.

For verification, change a phrase that is easy to retrieve, then use knowledge base retrieval or a workflow Retrieve document node to confirm the returned snippet is the latest content.
