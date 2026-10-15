---
title: updateOne：准确更新一条记录
description: 更新准确匹配的一条记录，包含 values、变量、乐观锁、关系写入和零条或多条匹配错误。
---

# updateOne：准确更新一条记录

示例沿用[概览的模型](../overview.md#本组文档的示例模型)，假设 `db` 已配置且 Collection 已存在。每个示例独立运行，写入前请按说明准备数据；方法不会创建 Schema。

可选服务端参数 [`writePolicy`](../write-policy.md) 默认为 `true`，可设置 `false` 拒绝整次写入，或使用对象／同步 callback 限制输入。支持字段、关系操作及嵌套字段的白名单。HTTP API routes 的默认值为 `false`，前端不能传入此参数。

## 参数与返回

- 必填：`filter / values`。
- 可选：`ifVersion / select / context`。
- 返回：`{ record, createdTargets, version? }`。

## 数据前提

```ts
const projects = db.repository('projects');
await projects.createOne({ values: { id: 'project-1', name: 'Original' } });
```

## 更新一条记录

```ts
const result = await projects.updateOne({
  filter: (filter) => filter.string('id').eq('project-1'),
  values: { name: 'Repository usage guide', status: 'active' },
  ifVersion: 1,
  select: (select) => select.fields('id', 'name', 'status', 'version'),
});

console.log(result.record);
console.log(result.version);
```

`filter` 可以是等值简写、Builder 或完整 Filter AST，见 [Filter](../filter.md)。它不一定必须是唯一键条件，但执行时必须恰好命中一条：

- 零条：`RECORD_NOT_FOUND`。
- 多条：`MULTIPLE_RECORDS_MATCHED`，不会更新第一条后返回。
- 版本不一致：`VERSION_CONFLICT`。

`values` 中省略的字段不修改；显式 `null` 表示写入空值，是否允许由字段和数据库约束决定。`context` 可提供根级与嵌套 Filter、Values 变量，不用于传递事务，也不是自动写入的字段集合。

## Conditional optimistic updates

For a scalar `updateOne` with a safe integer `ifVersion`, a complete non-null primary or unconditional unique key that cannot be deferred and is required by the filter, and no matching mutation subscriptions, the Repository can update directly without a preceding `SELECT ... FOR UPDATE`. The locating key must remain unchanged. The original filter, including business conditions and policy scope, remains part of the update; the submitted values and version increment are written together:

```sql
UPDATE projects
SET name = ?, version = version + 1
WHERE id = ? AND version = ?;
```

On success, the Repository reads the selected record in the same transaction. A simple scalar projection requires one UPDATE and one result SELECT, excluding transaction control and metadata queries; relation projections and post-write scope checks can require more reads. The UPDATE still takes the database's normal write lock until the transaction ends, so optimistic concurrency does not promise lock-free execution or eliminate lock waits.

Generated columns cannot serve as unchanged locating keys, because updating another field may change their value. Primary-key deferrability is preserved from physical schema inspection, so a temporarily duplicated deferred key retains the cardinality check. An index whose collation differs from its column, or whose compatibility cannot be established, also retains the original path. SQLite tables with an explicit `COLLATE` clause conservatively use that path for indexed keys because the inspector does not resolve individual column collations from DDL; ordinary tables without that clause retain the optimization.

If no row is updated, a read with the original filter distinguishes `VERSION_CONFLICT` from `RECORD_NOT_FOUND` without revealing a row outside the write scope. Empty values are still invalid, unchanged values still increment the version once, and changing a field used by the policy scope still requires the post-write scope check.

Filters without a provably unique key, relational filters, case-insensitive key comparisons, changes to the locating key, non-numeric versions, nested writes, and observed mutations retain the existing read-before-write flow. `upsertOne` and `deleteOne` retain their existing execution paths. These cases preserve cardinality, relation, event, and version-comparison guarantees rather than promising the same SQL budget as a simple conditional update.

## 普通条件匹配多条时拒绝修改

在空的 projects 中独立执行；此例不依赖上面的 project-1：

```ts
import { RepositoryError } from '@nocobase/db';

const projects = db.repository('projects');
await projects.createMany({
  values: [
    { id: 'multi-a', name: 'A', status: 'draft' },
    { id: 'multi-b', name: 'B', status: 'draft' },
  ],
});
try {
  await projects.updateOne({
    filter: { status: 'draft' },
    values: { status: 'active' },
  });
} catch (error) {
  if (
    !(error instanceof RepositoryError) ||
    error.code !== 'MULTIPLE_RECORDS_MATCHED'
  ) {
    throw error;
  }
}
const unchanged = await projects.count({ filter: { status: 'draft' } });
// unchanged: 2; neither record was updated.
```

如只需修改 A，将 filter 收紧为 `{ id: 'multi-a' }`。如业务明确要求修改所有 draft，使用 updateMany；不要在捕获多条错误后自动扩大操作范围。先 findOne 再使用原来的 `{ status: 'draft' }` 更新，也不能把宽泛条件变成唯一身份。

## 变量与原子更新

```ts
await db
  .repository('tasks')
  .createOne({ values: { id: 'task-1', title: 'First', points: 2 } });
const result = await db.repository('tasks').updateOne({
  filter: { id: 'task-1' },
  values: (v) => ({
    points: (points) => points.increment(v.variable('$input.delta')),
  }),
  context: { input: { delta: 3 } },
  select: (s) => s.fields('id', 'points'),
});
// result.record: { id: 'task-1', points: 5 }
```

必须有可用于定位的完整非空主键或无条件唯一选择器；即使 filter 恰好命中一行，也不意味着无唯一身份模型支持单条更新。Filter 不强制等于唯一键条件，但匹配多条时拒绝修改。

关系 create/connect/disconnect/set/update/upsert/delete 的适用类型及组合限制见[关系写入](../relation-mutations.md)。版本管理见[事务与乐观锁](../transactions.md)。

## 验证依据

行为覆盖见 [safety.test.ts](../../../../tests/integration/repository/identity/safety.test.ts)；公开签名见 [API 参考](../../reference/repository-api.md)。
