---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Tổng quan"
description: "Use a knowledge base to organize documents, generate segments and vector indexes, and provide maintainable data sources for AI employee RAG retrieval."
keywords: "knowledge base,AI knowledge base,RAG,document management,vector index,NocoBase"
---

# Tổng quan

## Introduction

A knowledge base is the foundation of RAG retrieval. You can add product manuals, internal policies, business terminology, FAQs, and other documents to a knowledge base. NocoBase converts these documents into searchable segments and vector data. When an AI employee answers a question, it can retrieve related content from the knowledge base first, then send that content to the model as context.

For most scenarios, a Local knowledge base is enough. Only consider Readonly or External knowledge bases when documents and vector data are already maintained by an external system.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-list.png)

## Open knowledge base management

Open the AI employees plugin configuration page and click the Knowledge base tab to view the knowledge base list. Each card shows the knowledge base name, document count, character count, number of AI employee references, and enabled status.

Click a knowledge base card to open its detail page:

- Documents is used to upload documents, run vectorization, and open segment management
- Hit tests is used to test which segments can be matched by a query
- Settings is used to adjust basic information, vector store, and default segmentation parameters

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-detail.png)

## Create a knowledge base

Click Add new in the upper-right corner to create a knowledge base. The menu shows three types: Local, Readonly, and External.

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-add-types.png)

The three knowledge base types have different capability boundaries:

| Type | Use case |
| --- | --- |
| Local | Documents, segment files, and vector data are managed by NocoBase. It supports uploading documents in the UI, and also supports creating, updating, deleting, and retrieving knowledge base documents through workflow nodes |
| Readonly | Documents and vector data are maintained by an external system. NocoBase cannot maintain this data in the UI or workflows, and only uses the knowledge base as a RAG retrieval source. Currently, PGVector is the only supported vector database |
| External | Documents, vector data, and retrieval logic are all handled by an external system. NocoBase cannot directly maintain documents or vector data. Developers need to provide a plugin and implement the retrieval logic in that plugin, such as connecting to a vector database not yet supported by NocoBase or calling a third-party retrieval API. For development details, see [Plugin External Knowledge Base](../dev/external-knowledge-base) |

Local knowledge bases are recommended by default. Only consider Readonly or External when documents and vector data are already maintained outside NocoBase and NocoBase only needs to read retrieval results.

A Local knowledge base usually needs the following information:

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-local-form.png)

- Key: unique identifier of the knowledge base. It cannot be changed after creation
- Name: knowledge base name
- File storage: where original documents and segment files are stored
- Vector store: vector store used to generate and retrieve vectors
- Description: knowledge base description
- Split document, Chunk size, and Chunk overlap: default segmentation parameters used after document upload
- Enabled: whether the knowledge base is enabled

:::tip Prerequisites

Before creating a Local knowledge base, prepare two dependencies: file storage for original documents and segment files, see [File storage](../../../file-manager/storage/); and vector storage for generating and retrieving vectors, see [Vector database](../vector-database) and [Vector store](../vector-store).

:::

## Next steps

| I want to... | Where to go |
| --- | --- |
| Upload files, view vectorization status, and rerun vectorization | [Quản lý tài liệu](./documents) |
| View, edit, disable, or delete document segments | [Quản lý phân đoạn](./segments) |
| Test which segments a question can match | [Kiểm thử truy xuất](./hit-tests) |
| Modify knowledge base information and default segmentation settings | [Cài đặt](./settings) |

At this point, the knowledge base is ready to be connected to RAG. You can enable knowledge base retrieval in AI employee settings. See [RAG retrieval](../rag) for details.
