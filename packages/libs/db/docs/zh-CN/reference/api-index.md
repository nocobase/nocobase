---
title: @nocobase/db 公开 API 导航
description: 按公开能力定位 @nocobase/db 的用法文档，并说明各入口的适用范围和类型来源。
---

# `@nocobase/db` 公开 API 导航

本页用于按公开名称找到对应的用法文档，不复制完整接口签名。所有公开 API 都从根入口 `@nocobase/db` 导入；精确参数、返回值和可用导出以 TypeScript 类型声明为准。

## 按能力查找

| 能力                            | 主要公开入口                                                                                                                                    | 用法文档                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 创建和管理连接                  | `createDatabaseManager()`、`DatabaseManager`、`DatabaseConnection`                                                                              | [Database 概览](../database/overview.md)、[连接配置](../database/connections.md)                                  |
| 修改 Collection Schema          | `CollectionBuilder`、`BuilderExecOptions`、`BuilderResult`                                                                                      | [Builder 总览](../builder/overview.md)、[Builder 选项](./builder-options.md)                                      |
| 查询和修改记录                  | `QueryAdapter` 及各 Query 类型                                                                                                                  | [Query 总览](../query/overview.md)、[Query 用法参考](./query-api.md)                                              |
| Collection-aware 记录与关系操作 | `Repository`、Filter/Select/Sort Builder 与 AST                                                                                                 | [Repository](../repository/overview.md)、[Repository API](./repository-api.md)                                    |
| 执行原子操作                    | `DatabaseManager.transaction()`、`DatabaseConnection.transaction()`、`afterCommit()`、`afterRollback()`                                         | [事务](../database/transactions.md)                                                                               |
| 订阅 Repository 写入改动的行    | `DatabaseConnection.onRepositoryMutation()`、`explainRepositoryEvents()`、`defineRepositoryEventMeta()`、`RepositoryMutationEvent`、`RowChange` | [Repository 变更事件](../repository/events.md)                                                                    |
| 读取完整 Collection             | `DatabaseConnection.collections`                                                                                                                | [Collections](../collections/overview.md)                                                                         |
| 检查物理数据库结构              | `SchemaInspector`                                                                                                                               | [Schema Inspector](../schema-inspector/overview.md)                                                               |
| 定义和执行 Migration            | `defineMigration()`、`Migrator`                                                                                                                 | [Migration 概览](../migration/overview.md)                                                                        |
| 定义和执行 Seed                 | `defineSeed()`、`Seeder`                                                                                                                        | [Seed 概览](../seed/overview.md)                                                                                  |
| 声明和管理补充 Metadata         | Metadata Document、Store 与 `connection.collectionMetadata`                                                                                     | [Collection Metadata](../collection-metadata/overview.md)、[Metadata Document](./collection-metadata-document.md) |
| 转换旧 Collection 定义          | `extractLegacyCollectionMetadata()`                                                                                                             | [旧 Collection 定义转换](./legacy-collection-metadata-extraction.md)                                              |

## 按类型主题查找

- Database 配置：[DatabaseConfig](./database-config.md)
- Collection、Field、Relation、Index 和 Constraint：[CollectionDefinition](./collection-definition.md)与 [FieldDefinition](./field-definition.md)
- Builder 输入与结果：[CollectionOperation 结构化执行计划](./collection-operation.md)、[BuilderExecOptions](./builder-options.md)与 [BuilderResult](./builder-result.md)
- Query 组合和终止方式：[Query 用法参考](./query-api.md)
- Metadata 文档与 Store：[Collection Metadata Document](./collection-metadata-document.md)

这些页面解释类型的语义、选择和常见误用，不代替 TypeScript 声明。

## 内部实现边界

Database 与 Transaction Metadata Store、Schema Adapter、Query Knex Adapter、Connection Factory 和 Knex Connection 都是包内实现。业务 Schema 变更使用 Builder，查询使用 `connection.query`；不要自行组合内部实现。

## 非公开或尚不可用

Repository 与 Select/Filter/Sort Builder、AST 已公开。RelationMutationAst 是规范化关系计划类型，不是根级 CRUD 的 relations 选项；当前调用使用 values。findUnique/findFirst/connectOrCreate、原生数组字段等尚未支持，详见 [Repository API](./repository-api.md)。历史提案不作为当前运行时契约。

## 从任务开始

- [任务路由](../agent/task-router.md)
- [整体概览](../overview.md)
- [快速开始](../quick-start.md)
