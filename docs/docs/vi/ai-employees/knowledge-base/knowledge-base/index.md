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

## Create a knowledge base

Click Add new in the upper-right corner to create a knowledge base. Knowledge bases have three types:

| Type | Use case |
| --- | --- |
| Local | Documents, segment files, and vector data are managed by NocoBase |
| Readonly | Documents and vector data are maintained externally, and NocoBase only connects to an existing vector database, mainly for PGVector scenarios |
| External | An external system maintains documents and vector data, and developers extend retrieval logic through vector store plugins |

A Local knowledge base usually needs Key, Name, File storage, Vector store, Description, default segmentation settings, and Enabled status. If there is no available vector store, configure [Vector database](../vector-database) and [Vector store](../vector-store) first.

## Next steps

| I want to... | Where to go |
| --- | --- |
| Upload files, view vectorization status, and rerun vectorization | [Quản lý tài liệu](./documents) |
| View, edit, disable, or delete document segments | [Quản lý phân đoạn](./segments) |
| Test which segments a question can match | [Kiểm thử truy xuất](./hit-tests) |
| Modify knowledge base information and default segmentation settings | [Cài đặt](./settings) |

At this point, the knowledge base is ready to be connected to RAG. You can enable knowledge base retrieval in AI employee settings. See [RAG retrieval](../rag) for details.
