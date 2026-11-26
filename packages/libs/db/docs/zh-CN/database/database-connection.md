---
title: DatabaseConnection：连接级能力
description: DatabaseConnection 的 dialect、builder、query、collections、transaction、schemaInspector 和 collectionMetadata。
---

# `DatabaseConnection`：连接级能力

使用 `db.connection()` 获取默认连接，使用 `db.connection(name)` 获取命名连接。

## 常用能力

| API                | 形状       | 名称语义                | 作用                       |
| ------------------ | ---------- | ----------------------- | -------------------------- |
| `dialect`          | 属性       | —                       | 判断数据库方言             |
| `builder`          | 属性       | Collection/Field 逻辑名 | Schema 与 Metadata Builder |
| `query`            | 属性       | Connection 查询标识符   | 数据库层查询和 DML         |
| `repository(name)` | 方法       | Collection/Field 逻辑名 | 记录、关系查询和写入       |
| `collections`      | 属性       | Collection 逻辑名       | 解析和缓存完整 Collection  |
| `transaction(fn)`  | Async 方法 | —                       | 当前连接事务               |

## 专项能力

| API                  | 作用                                    |
| -------------------- | --------------------------------------- |
| `schemaInspector`    | 使用物理 identity 只读检查数据库 Schema |
| `collectionMetadata` | 读取和更新补充 Collection Metadata      |

## 高级和生命周期能力

| API                                          | 作用                                        |
| -------------------------------------------- | ------------------------------------------- |
| `name`                                       | Connection 配置名称                         |
| `driver`                                     | 底层 Node.js driver；不要用它判断数据库类型 |
| `schemaManagement`                           | `managed` 或 `external`                     |
| `capabilities`                               | 当前数据库结构能力                          |
| `schema`                                     | Builder 使用的低层 Schema Adapter           |
| `client()`                                   | 异步获取底层 adapter client，默认是 Knex    |
| `connect()` / `disconnect()` / `reconnect()` | 当前连接生命周期                            |

判断数据库类型使用 `connection.dialect`。`connection.client()` 会绕过高层 Schema guard，不能用于规避 external 模式限制。

## 事务

```ts
await db.connection('analytics').transaction(async (connection) => {
  await connection.query
    .insertInto('events')
    .values({ name: 'checkout' })
    .execute();
});
```

回调参数是当前事务 Connection。所有操作都通过它执行。

## 运行时写入检查

宿主可通过 `connection.addWriteCheck(check)` 在 Repository、QueryAdapter 和 `upsertPhysicalRow()` 执行写语句前校验。检查适用于注册前后创建的表，也适用于后台任务、关系目标表、中间表和批量写入。每个执行写入的进程都要在所用连接上注册。事务、保存点、策略和监听器派生的句柄共享同一注册表。

回调收到连接名、物理表名（不含 schema 或别名）、操作和来源。Repository 写入还会提供逻辑 Collection 名。可用回调收到的当前连接在同一事务内读取状态。抛出异常会阻止本条语句并把异常传给调用方。调用返回的移除函数可注销检查。

迁移和种子上下文、Schema 和 Metadata 管理、`client()` 与原始 SQL，以及数据库触发器或级联操作不经过运行时检查。完整说明见[连接级写入检查](../../api-reference/permissions.md#connection-wide-write-checks)。

## 继续阅读

- [Builder](../builder/overview.md)
- [Query](../query/overview.md)
- [Repository](../repository/overview.md)
- [Collections](../collections/overview.md)
- [事务](./transactions.md)
- [Schema Inspector](../schema-inspector/overview.md)
- [Collection Metadata](../collection-metadata/overview.md)
