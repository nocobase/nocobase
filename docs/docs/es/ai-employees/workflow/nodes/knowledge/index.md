---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Resumen de nodos de base de conocimientos de IA en flujos de trabajo"
description: "Presenta escenarios, estructura de tablas y la coordinación entre crear, actualizar, eliminar y recuperar documentos."
keywords: "AI knowledge base,workflow,collection event trigger,knowledge base synchronization,RAG,NocoBase"
---

# Resumen

<PluginInfo name="ai-knowledge-base"></PluginInfo>

## Introduction

AI knowledge base nodes allow workflows to manage knowledge base documents directly. When business data changes, you can synchronize added, updated, and deleted records to the knowledge base. You can also retrieve knowledge base snippets in a workflow and pass them to downstream AI employee nodes.

This documentation uses a Q&A scenario as an example: administrators maintain standard answers, users submit questions, workflows synchronize answers to the AI knowledge base, and then retrieve snippets to generate answers.

## Example scenario

The example uses two business collections:

- `Answers`: stores answer content that can be synchronized to the knowledge base
- `Questions`: stores questions submitted by users

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-overview-collections.png)

`Answers` is the source collection for knowledge base documents. When an answer is added, a document is created. When an answer is changed, the document is updated. When an answer is deleted, the document is removed.

`Questions` is the input collection for retrieval. When a question is added, the workflow uses the question as matching text, retrieves related snippets from the knowledge base, and passes them to an AI employee node.

## Answers collection structure

`Answers` mainly uses three fields:

- `Title`: used as the knowledge base document name
- `Content`: used as the knowledge base document body
- `questions`: relation to the `Questions` collection for related questions

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-overview-answers-fields.png)

`questions` is a one-to-many relation field. Its source collection is `Answers`, target collection is `Questions`, both source key and target key use `ID`, and the foreign key is stored in `Questions`.

![](https://static-docs.nocobase.com/ai-employees/workflow/knowledge/2026-06-12/kb-overview-answers-questions-relation.png)

This relation field is preloaded when creating and updating documents. It writes related questions into `Related questions`, so one answer can be retrieved not only by body text but also by common question phrasings.

:::tip

If your knowledge base documents do not need related questions, you do not need a relation field like `questions`. A stable `Key` field and body content are enough for create, update, and delete synchronization.

:::

## Workflow responsibilities

The example is split into four workflow node guides:

| Scenario | Trigger | Node | Purpose |
| --- | --- | --- | --- |
| Add answer | `Answers` collection `After record added` | `Create document` | Write the new answer to the AI knowledge base |
| Update answer | `Answers` collection `After record updated` | `Update document` | Update the document by the same `Key` |
| Delete answer | `Answers` collection `After record deleted` | `Delete document` | Delete the document by the same `Key` |
| Submit question | `Questions` collection `After record added` | `Retrieve document` + `AI employee` | Retrieve snippets and pass them to an AI employee |

`Key` is the most important field in the synchronization chain. Create, update, and delete workflows must use the same `Key` rule. The example directly uses the record ID of the `Answers` collection.

## Node documents

- [Create document](./create-document)
- [Update document](./update-document)
- [Delete document](./delete-document)
- [Retrieve document](./retrieve-document)
