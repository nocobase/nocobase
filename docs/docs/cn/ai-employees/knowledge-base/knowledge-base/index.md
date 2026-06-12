---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "知识库概述"
description: "知识库用于组织文档、生成分段和向量索引，为 AI 员工的 RAG 检索提供可维护的数据来源。"
keywords: "知识库,AI 知识库,RAG,文档管理,向量索引,NocoBase"
---

# 知识库概述

## 介绍

知识库是 RAG 检索的基础。你可以把产品手册、内部制度、业务术语、FAQ 等文档放进知识库，NocoBase 会把文档转成可检索的分段和向量数据。AI 员工回答问题时，就可以先从知识库里召回相关内容，再把这些内容作为上下文交给大模型。

大部分场景只需要维护 Local 知识库。只有当文档和向量数据已经由外部系统维护时，才需要考虑 Readonly 或 External 知识库。

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-list.png)

## 进入知识库管理

进入「AI employees」插件配置页面，点击「Knowledge base」标签页，就能看到知识库列表。列表中的卡片会展示知识库名称、文档数量、字符数量、被 AI 员工引用的数量，以及启用状态。

点击知识库卡片后，会进入该知识库的详情页。其中：

- 「Documents」用于上传文档、执行向量化、进入分段管理
- 「Hit tests」用于测试检索词能命中哪些分段
- 「Settings」用于调整知识库基本信息、向量存储和默认分段参数

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-detail.png)

## 新建知识库

点击右上角「Add new」可以新建知识库。下拉菜单里会显示三种类型：Local、Readonly 和 External。

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-add-types.png)

三种知识库的能力边界不同：

| 类型 | 适用场景 |
| --- | --- |
| Local | 文档、分段文件和向量数据都由 NocoBase 管理。它支持在界面上传文档，也支持通过工作流节点创建、更新、删除和检索知识库文档 |
| Readonly | 文档和向量数据由外部系统维护，NocoBase 不能在界面或工作流中维护这些数据，只把它作为 RAG 检索的数据源。目前只支持 PGVector 作为向量数据库 |
| External | 文档、向量数据和检索逻辑都由外部系统负责，NocoBase 不能直接维护文档或向量数据。开发者需要提供插件，在插件中实现外部知识库的检索逻辑，比如连接 NocoBase 暂不支持的向量数据库，或调用第三方检索 API |

默认推荐使用 Local 知识库。只有当文档和向量数据已经在外部系统中维护，并且 NocoBase 只需要读取检索结果时，才考虑 Readonly 或 External。

Local 知识库通常需要填写这些信息：

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-local-form.png)

- 「Key」：知识库唯一标识，创建后不可修改
- 「Name」：知识库名称
- 「File storage」：文档和分段文件保存到哪个文件存储
- 「Vector store」：用于生成和检索向量的向量存储
- 「Description」：知识库说明
- 「Split document」「Chunk size」「Chunk overlap」：文档上传后的默认分段参数
- 「Enabled」：是否启用该知识库

:::tip 前置准备

创建 Local 知识库前，需要先准备好两类依赖：文件存储用于保存原始文档和分段文件，配置见 [文件存储引擎](/cn/file-manager/storage/)；向量存储用于生成和检索向量，配置见 [向量数据库](../vector-database) 和 [向量存储](../vector-store)。

:::

## 后续操作

知识库创建完成后，可以按下面的顺序继续配置：

| 我想要…… | 去哪里看 |
| --- | --- |
| 上传文件、查看向量化状态、重新执行向量化 | [文档管理](./documents) |
| 查看、编辑、禁用或删除文档分段 | [分段管理](./segments) |
| 测试一个问题能命中哪些文档分段 | [命中测试](./hit-tests) |
| 修改知识库信息和默认分段参数 | [设置](./settings) |

至此，一个知识库已经具备接入 RAG 的基础条件。接下来可以在 AI 员工设置中启用知识库检索，详细用法见 [RAG 检索](../rag)。
