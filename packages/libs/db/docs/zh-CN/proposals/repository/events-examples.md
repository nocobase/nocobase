---
title: Repository 与事务生命周期事件示例
description: 从手动通知的现状出发，逐层加入 afterCommit、变更订阅、嵌套写入、批量写、inTransaction、meta 与 values，每一层给出代码、实际收到的事件、SQL 与错误，最后是常见场景的完整写法。
---

# Repository 与事务生命周期事件示例

> 文档状态：设计阶段的示例。第一层与第二层均已实现，当前用法以[事务](../../database/transactions.md)、[Repository 变更事件](../../repository/events.md)和公开类型为准；个别细节与实现不同，例如 `explainRepositoryEvents()` 返回 Promise，差异见[设计文档](./events.md)的“实现与设计的差异”。

本文是 [Repository 与事务生命周期事件](./events.md) 的配套说明，按层次递进：每一节只加入一个概念，前面各层继续生效。设计依据与取舍在设计文档里，这里只讲“写成什么样、收到什么、出错会怎样”。

## 贯穿全文的数据

沿用 [Repository 关系写入](../../repository/relation-mutations.md)的模型：

- `projects.owner`：belongsTo `users`，外键 `projects.ownerId`
- `projects.tasks`：hasMany `tasks`，外键 `tasks.projectId`
- `projects.tags`：belongsToMany `tags`，经 `projectTags(projectId, tagId, role)`，组合唯一键 `(projectId, tagId)`

`projects`：

| id        | name     | status    | ownerId |
| --------- | -------- | --------- | ------- |
| project-1 | 官网改版 | draft     | user-1  |
| project-2 | 内部工具 | published | user-2  |

`tasks`：

| id     | title    | status | points | projectId |
| ------ | -------- | ------ | ------ | --------- |
| task-1 | 设计稿   | open   | 3      | project-1 |
| task-2 | 切图     | done   | 2      | project-1 |
| task-3 | 需求梳理 | open   | 5      | project-2 |

`tags`：`tag-db`、`tag-orm`、`tag-ui`。`projectTags`：`(project-1, tag-db)`。

`users`：`user-1`（Ada）、`user-2`（Bob）。

示例中的 `db` 是 `DatabaseManager`，`connection` 是 `db.connection()`；`projectsTopic` 是用 `realtime.defineTopic(...)` 定义的 realtime 主题。

## 第 0 层：现状

今天要在项目变化后推送 realtime 消息，只能在写入之后手动调用：

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({
    filter: { id: 'project-1' },
    values: { status: 'published' },
  });
  await connection.repository('tasks').updateMany({
    filter: { projectId: 'project-1' },
    values: { status: 'open' },
  });
});
projectsTopic.publish({ projectId: 'project-1' });
```

三个问题：

```ts
// 一、推送写在事务里面：事务后来回滚了，消息已经发出去
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({ filter, values });
  projectsTopic.publish({ projectId: 'project-1' }); // 发早了
  await somethingThatThrows(); // → 回滚，但客户端已经刷新到了不存在的状态
});

// 二、另一处代码也改了 projects，但忘了推送 —— 没有任何报错
await db.repository('projects').updateOne({ filter, values });

// 三、改 projects 时顺带嵌套创建了 task，订阅 tasks 的人不知道
await db.repository('projects').updateOne({
  filter: { id: 'project-1' },
  values: {
    tasks: { create: { id: 'task-9', title: '验收', status: 'open' } },
  },
});
```

第一个问题由第 1 层解决，第二、三个问题由第 2 层起的变更订阅解决。

## 第 1 层：afterCommit

### 在事务中登记

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({
    filter: { id: 'project-1' },
    values: { status: 'published' },
  });
  connection.afterCommit(() =>
    projectsTopic.publish({ projectId: 'project-1' }),
  );
  await somethingThatMayThrow();
});
```

| 结果                                   | 推送         |
| -------------------------------------- | ------------ |
| 事务提交                               | 提交之后发出 |
| `somethingThatMayThrow` 抛错，事务回滚 | 不发出       |
| 提交时数据库报错                       | 不发出       |

回调可以登记在任何位置，包括写入之前；它只关心事务最终是否提交。

### 不在事务中

```ts
connection.afterCommit(() => projectsTopic.publish({ projectId: 'project-1' }));
// 立即开始执行；调用方不等待它完成，出错同样交给 onTransactionCallbackError
```

这让同一个服务方法不必区分“调用方有没有开事务”：

```ts
async function publishProject(
  connection: DatabaseConnection,
  id: string,
): Promise<void> {
  await connection.repository('projects').updateOne({
    filter: { id },
    values: { status: 'published' },
  });
  connection.afterCommit(() => projectsTopic.publish({ projectId: id }));
}

await publishProject(db.connection(), 'project-1'); // 写完立即推送
await db.transaction((connection) => publishProject(connection, 'project-1')); // 提交后推送
```

### 回滚时做点什么

```ts
await db.transaction(async (connection) => {
  connection.afterRollback((error) => {
    logger.warn({ error, projectId: 'project-1' }, 'publish rolled back');
  });
  await connection.repository('projects').updateOne({ filter, values });
  throw new Error('quota exceeded');
});
// → 事务回滚，日志里有一条 publish rolled back，error 是 quota exceeded
// → transaction() 仍然 reject，错误是 quota exceeded
```

`afterRollback` 只用于记录和清理，不能挽回事务。不在事务中登记时，它被忽略。

### 嵌套事务

```ts
await db.transaction(async (connection) => {
  connection.afterCommit(() => log('outer'));

  await connection.transaction(async (inner) => {
    inner.afterCommit(() => log('inner-ok'));
  }); // savepoint 释放：inner-ok 并入外层，此时还不执行

  await connection
    .transaction(async (inner) => {
      inner.afterCommit(() => log('inner-failed'));
      inner.afterRollback(() => log('inner-rolled-back'));
      throw new Error('skip this step');
    })
    .catch(() => {}); // savepoint 回滚：inner-failed 丢弃，inner-rolled-back 立即执行
});
// 输出顺序：inner-rolled-back、outer、inner-ok
```

只有最外层事务提交后，`afterCommit` 才执行，顺序是登记顺序。

### 回调出错

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({ filter, values });
  connection.afterCommit(() => {
    throw new Error('realtime is down');
  });
  connection.afterCommit(() => log('still runs'));
});
// → 事务已提交，transaction() 正常 resolve
// → 第二个回调照常执行
// → 错误交给 onTransactionCallbackError(error, 'afterCommit')；
//   未配置时 process.emitWarning，code 为 TRANSACTION_CALLBACK_FAILED
```

在连接配置里接上日志：

```ts
defineDatabase({
  connections: {
    main: {
      // ...
      onTransactionCallbackError(error, phase) {
        logger.error({ error, phase }, 'transaction callback failed');
      },
    },
  },
});
```

### 回调里写库

`afterCommit` 执行时事务已经结束，事务 Connection 不能再用：

```ts
await db.transaction(async (connection) => {
  connection.afterCommit(async () => {
    // ✗ QUERY_TRANSACTION_COMPLETED
    await connection.repository('activity').createOne({ values });

    // ✓ 使用根 Connection，或自己开新事务
    await db.repository('activity').createOne({ values });
  });
});
```

### 等待回调

`transaction()` 在所有 `afterCommit` 回调结束后才 resolve（已定），所以测试可以直接断言副作用：

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({ filter, values });
  connection.afterCommit(() =>
    projectsTopic.publish({ projectId: 'project-1' }),
  );
});
expect(published).toEqual([{ projectId: 'project-1' }]);
```

反过来，慢的工作不要直接放在回调里，否则调用方要一直等。把它交给 jobs，见“场景：搜索索引”。

## 第 2 层：订阅变更

第 1 层要求每个写入点自己登记回调，漏写一处就漏一处。变更订阅把“谁关心”集中到一处：

```ts
const off = db.connection().onRepositoryMutation(
  { collections: ['projects'] },
  {
    afterCommit: async (events) => {
      for (const event of events) {
        if (event.granularity !== 'rows') continue;
        for (const change of event.changes) {
          if (change.collection === 'projects') {
            projectsTopic.publish({
              projectId: String(change.key.id),
              kind: change.kind,
            });
          }
        }
      }
    },
  },
);

// 不再需要: off();
```

此后任何地方经 Repository 改了 `projects`，都会推送，包括第 0 层里“忘了推送”的那一处。

### 收到的事件长什么样

```ts
await db.repository('projects').updateOne({
  filter: { id: 'project-1' },
  values: { status: 'published' },
});
```

`afterCommit` 收到一个只含一个事件的数组：

```json
[
  {
    "operationId": "01J9Z4K6V3S8Q2M7N5P1R0T6WX",
    "connection": "main",
    "collection": "projects",
    "operation": "updateOne",
    "scope": "connection",
    "meta": {},
    "granularity": "rows",
    "changes": [
      {
        "collection": "projects",
        "kind": "updated",
        "key": { "id": "project-1" },
        "fields": ["status"]
      }
    ]
  }
]
```

- `scope: "connection"`：调用方没有开事务，这次调用在 Repository 自己的隐式事务里执行，隐式事务提交后投递。
- `fields` 是写了哪些字段，不是哪些字段的值真的变了。把 `draft` 改成 `draft` 也会出现在这里。
- 没有 `values`：写入值默认不放进事件，见第 6 层。
- 集合有版本字段时，版本字段也会出现在 `fields` 中。

### 一个事务里的多次调用

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({
    filter: { id: 'project-1' },
    values: { status: 'published' },
  });
  await connection.repository('projects').updateOne({
    filter: { id: 'project-2' },
    values: { name: '内部工具 v2' },
  });
});
```

提交后 `afterCommit` 只被调用一次，数组里有两个事件，按发生顺序排列，各自的 `scope` 都是 `"transaction"`。事务回滚时，监听器什么也收不到。

### 不会收到事件的调用

```ts
await db.repository('projects').findMany({ filter: { status: 'draft' } }); // 读取
await db.repository('tasks').updateOne({ filter, values }); // 不在订阅的 collections 里
await db
  .repository('projects')
  .updateOne({ filter: { id: 'project-404' }, values }); // 没命中
```

最后一条：`updateOne` 没有命中任何行时，调用以 `RECORD_NOT_FOUND` 失败，不发事件。

## 第 3 层：嵌套写入

`collections` 匹配的是事件里任意一条变更所在的 Collection，而不只是调用的根 Collection。

```ts
db.connection().onRepositoryMutation(
  { collections: ['tasks'] },
  { afterCommit: (events) => console.dir(events, { depth: null }) },
);

await db.repository('projects').updateOne({
  filter: { id: 'project-1' },
  values: {
    owner: { connect: { id: 'user-2' } },
    tasks: {
      create: { id: 'task-9', title: '验收', status: 'open' },
      disconnect: { id: 'task-2' },
      update: {
        filter: { id: 'task-1' },
        values: { points: { increment: 1 } },
      },
    },
    tags: { connect: [{ id: 'tag-orm' }] },
  },
});
```

订阅的是 `tasks`，调用的是 `projects`，监听器照样收到事件。事件里是这次调用改动的全部行：

```json
{
  "collection": "projects",
  "operation": "updateOne",
  "granularity": "rows",
  "changes": [
    {
      "collection": "projects",
      "kind": "updated",
      "key": { "id": "project-1" },
      "fields": ["ownerId"]
    },
    {
      "collection": "tasks",
      "kind": "created",
      "key": { "id": "task-9" },
      "fields": ["id", "title", "status", "projectId"]
    },
    {
      "collection": "tasks",
      "kind": "updated",
      "key": { "id": "task-2" },
      "fields": ["projectId"]
    },
    {
      "collection": "tasks",
      "kind": "updated",
      "key": { "id": "task-1" },
      "fields": ["points"]
    },
    {
      "collection": "projectTags",
      "kind": "created",
      "key": { "projectId": "project-1", "tagId": "tag-orm" },
      "fields": ["projectId", "tagId"]
    }
  ]
}
```

逐条看：

| 写法                                 | 记为                                                      |
| ------------------------------------ | --------------------------------------------------------- |
| `owner: { connect }`（belongsTo）    | 根记录上外键 `ownerId` 的 `updated`                       |
| `tasks: { create }`（hasMany）       | 目标表的 `created`，`fields` 含外键 `projectId`           |
| `tasks: { disconnect }`（hasMany）   | 目标表的 `updated`，外键置空，`fields` 为 `["projectId"]` |
| `tasks: { update }`                  | 目标表的 `updated`                                        |
| `tags: { connect }`（belongsToMany） | through 表 `projectTags` 的 `created`，键是组合唯一键     |
| `tags: { disconnect }` 或 `set` 移除 | through 表的 `deleted`                                    |
| `tasks: { delete }`                  | 目标表的 `deleted`                                        |

`tags` 表本身没有被写，所以没有 `tags` 的变更；关心“项目的标签变了”的一方应订阅 `projectTags`。

订阅方只关心自己那张表时，自己过滤：

```ts
afterCommit: async (events) => {
  const taskIds = events
    .flatMap((event) => (event.granularity === 'rows' ? event.changes : []))
    .filter((change) => change.collection === 'tasks')
    .map((change) => String(change.key.id));
  await refreshTaskBoards(new Set(taskIds));
};
```

## 第 4 层：批量写

### 默认：拿到每一行的键

```ts
db.connection().onRepositoryMutation(
  { collections: ['tasks'] },
  { afterCommit: (events) => console.dir(events, { depth: null }) },
);

await db.repository('tasks').updateMany({
  filter: { projectId: 'project-1', status: 'open' },
  values: { status: 'done' },
});
```

```json
{
  "collection": "tasks",
  "operation": "updateMany",
  "granularity": "rows",
  "changes": [
    {
      "collection": "tasks",
      "kind": "updated",
      "key": { "id": "task-1" },
      "fields": ["status"]
    },
    {
      "collection": "tasks",
      "kind": "updated",
      "key": { "id": "task-9" },
      "fields": ["status"]
    }
  ]
}
```

为了知道改了哪些行，执行方式变了。没有订阅时是一条语句：

```sql
UPDATE tasks SET status = 'done' WHERE project_id = 'project-1' AND status = 'open';
```

有订阅时，先锁住匹配的行，再按主键更新，两步在一个隐式事务里（PostgreSQL 示意）：

```sql
BEGIN;
SELECT id FROM tasks WHERE project_id = 'project-1' AND status = 'open' FOR UPDATE;
UPDATE tasks SET status = 'done' WHERE id IN ('task-1', 'task-9');
COMMIT;
```

这条路径不依赖 `RETURNING`，MySQL 上也一样能拿到键。代价只由有订阅的 Collection 承担。

### 只想知道“变了”：`keys: false`

缓存失效这类场景只需要知道某张表变了，不需要具体是哪些行：

```ts
db.connection().onRepositoryMutation(
  { collections: ['tasks'], keys: false },
  { afterCommit: () => cache.deleteByTag('tasks') },
);

await db.repository('tasks').updateMany({
  filter: { projectId: 'project-1' },
  values: { status: 'done' },
});
```

```json
{
  "collection": "tasks",
  "operation": "updateMany",
  "granularity": "count",
  "count": 3
}
```

批量写保持一条语句，不加锁。注意：

- 单行写（`createOne`、`updateOne`、`upsertOne`、`deleteOne`）本来就知道键，`keys: false` 时仍然是 `granularity: "rows"`。
- 只要还有另一个订阅没有声明 `keys: false`，批量写就会走加锁路径，此时所有订阅都收到 `rows`。
- 要读 `changes` 前必须先判断 `granularity`，TypeScript 会强制这一点。

### `createMany` 与 `deleteMany`

```ts
await db.repository('tasks').createMany({
  values: [
    { id: 'task-10', title: 'A', status: 'open' },
    { id: 'task-11', title: 'B', status: 'open' },
  ],
});
// changes: task-10 created, task-11 created

await db.repository('tasks').deleteMany({ filter: { status: 'done' } });
// 先锁行取键，再按键删除；changes 中每行一条 deleted
```

`createMany` 本来是一条多行 `INSERT`，拿不到数据库生成的自增主键。有订阅时改走逐行或带返回值的插入路径。

### 查看会怎么执行

```ts
db.connection().explainRepositoryEvents({
  collection: 'tasks',
  operation: 'updateMany',
});
```

```json
{
  "subscriptions": [
    {
      "id": "search-index",
      "keys": true,
      "values": false,
      "phases": ["afterCommit"]
    },
    {
      "id": "task-cache",
      "keys": false,
      "values": false,
      "phases": ["afterCommit"]
    }
  ],
  "strategy": "lock-then-write-by-key",
  "granularity": "rows",
  "implicitTransaction": true
}
```

订阅可以在注册时带一个 `id`，便于在这里辨认。Repository 的 debug 日志也会输出同样的判断。

## 第 5 层：inTransaction

`afterCommit` 在提交之后，适合通知外部。有些工作必须和写入一起成功或一起失败，比如审计日志、跨表不变量，这时用 `inTransaction`。

### 同事务写审计日志

```ts
db.connection().onRepositoryMutation(
  { collections: ['projects', 'tasks'] },
  {
    inTransaction: async (event, connection) => {
      if (event.granularity !== 'rows') return;
      await connection.repository('auditLogs').createMany({
        values: event.changes.map((change) => ({
          operationId: event.operationId,
          collection: change.collection,
          kind: change.kind,
          recordKey: change.key,
          fields: change.fields ?? [],
        })),
      });
    },
  },
);
```

- `connection` 是本次调用所在的事务 Connection。用它写入，审计行和业务数据一起提交。
- 写 `auditLogs` 本身也会产生事件；`auditLogs` 不在这个订阅的 `collections` 里，所以不会自己触发自己。

### 抛错就回滚

```ts
db.connection().onRepositoryMutation(
  { collections: ['tasks'] },
  {
    inTransaction: async (event, connection) => {
      const open = await connection.repository('tasks').count({
        filter: { projectId: 'project-1', status: 'open' },
      });
      if (open > 20)
        throw new Error('A project cannot have more than 20 open tasks.');
    },
  },
);

await db.repository('tasks').createOne({
  values: {
    id: 'task-21',
    title: '第 21 个',
    status: 'open',
    projectId: 'project-1',
  },
});
// → createOne reject，错误是 "A project cannot have more than 20 open tasks."
// → task-21 没有写入（隐式事务回滚）
// → 任何订阅的 afterCommit 都收不到这次调用
```

### 调用方自己开了事务

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({ filter, values });
  await connection.repository('tasks').createOne({ values: task21 }); // inTransaction 抛错
});
// → 整个事务回滚，projects 的修改也没有了
```

调用方在事务中时，Repository 复用这个事务，不为每次调用单独建 savepoint，所以监听器失败会让整个事务失败。不要捕获后继续提交：

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({ filter, values });
  try {
    await connection.repository('tasks').createOne({ values: task21 });
  } catch {
    // ✗ 不要这样做：失败的那次调用可能已经写了一部分，提交会把半成品留下
  }
});
```

确实需要“这一步失败、其余继续”，显式开一个嵌套事务：

```ts
await db.transaction(async (connection) => {
  await connection.repository('projects').updateOne({ filter, values });
  await connection
    .transaction((inner) =>
      inner.repository('tasks').createOne({ values: task21 }),
    )
    .catch((error) => logger.warn({ error }, 'task skipped'));
  // savepoint 回滚：task-21 和它的审计行都没有；projects 的修改照常提交
});
```

### 写入前的检查，改在写入后做

“项目还有未完成的任务就不许删除”这类规则，在 `inTransaction` 里检查写入后的状态：

```ts
db.connection().onRepositoryMutation(
  { id: 'projects-delete-guard', collections: ['projects'] },
  {
    inTransaction: async (event, connection) => {
      if (event.granularity !== 'rows') return;
      for (const change of event.changes) {
        if (change.collection !== 'projects' || change.kind !== 'deleted')
          continue;
        const hasOpenTasks = await connection.repository('tasks').exists({
          filter: { projectId: String(change.key.id), status: 'open' },
        });
        if (hasOpenTasks) {
          throw new Error(
            `Close all tasks of ${String(change.key.id)} before deleting it.`,
          );
        }
      }
    },
  },
);

await db.repository('projects').deleteOne({ filter: { id: 'project-1' } });
// → reject：Close all tasks of project-1 before deleting it.
// → project-1 没有被删除（隐式事务回滚）
```

为什么不在写入前检查：

- 检查失败时，删除和这次调用的其他写入一起回滚，不会留下删了一半的状态。并发事务同时插入新任务的情况，仍取决于隔离级别与外键约束，这一点和在业务代码里手写检查一样。
- 经由其他 Collection 嵌套删除项目时，事件里同样有 `projects` 的 `deleted`，规则不会被绕过。
- 批量 `deleteMany` 也逐行检查，因为订阅存在时批量删除会先取到每一行的键。

代价是被拒绝的删除已经执行过一次再回滚。对于拒绝很常见的规则，调用方可以先自己查一次给出友好提示，但最终的保证仍以 `inTransaction` 为准。

### 监听器里的写入还会触发事件

```ts
db.connection().onRepositoryMutation(
  { collections: ['tasks'] },
  {
    inTransaction: async (event, connection) => {
      if (event.granularity !== 'rows') return;
      // 有任务变化的草稿项目自动转为进行中
      for (const projectId of await projectIdsOf(connection, event.changes)) {
        await connection.repository('projects').updateMany({
          filter: { id: projectId, status: 'draft' },
          values: { status: 'active' },
        });
      }
    },
  },
);
```

`projects` 的这次更新会产生新事件，`parentOperationId` 是触发它的 `tasks` 调用的 `operationId`：

```json
{
  "operationId": "01J9Z4N0B6...",
  "parentOperationId": "01J9Z4MZQ1...",
  "collection": "projects",
  "operation": "updateMany"
}
```

两张表的监听器互相写对方，就会无限循环。嵌套超过上限（默认 8 层）时抛错：

```text
RepositoryError: Repository event listeners nested writes deeper than 8 levels.
code: REPOSITORY_EVENT_RECURSION
```

`afterCommit` 监听器经它收到的 Connection 写入时同样计入深度。区别是超限发生在提交之后：调用方正常返回，超限的那次写入失败，错误交给 `onRepositoryEventError`。

## 第 6 层：meta 与 values

### 用 meta 传操作者

事件里没有“谁做的”。需要审计时，由调用方用 meta 传进来：

```ts
// 定义一次，通常放在插件的 shared 模块里
export const auditMeta = defineRepositoryEventMeta<{
  actorId: string;
  reason?: string;
}>('audit');

// 调用方
await db.repository('projects').updateOne({
  filter: { id: 'project-1' },
  values: { status: 'archived' },
  meta: [auditMeta({ actorId: 'user-1', reason: '项目结束' })],
});

// 监听器
inTransaction: async (event, connection) => {
  const audit = auditMeta.read(event); // { actorId: string; reason?: string } | undefined
  await connection.repository('auditLogs').createOne({
    values: {
      operationId: event.operationId,
      actorId: audit?.actorId ?? 'system',
    },
  });
};
```

- 不同插件各用自己的命名空间，互不覆盖；`read` 返回的类型来自定义处，不需要断言。
- meta 跟着这次调用的全部变更走，包括嵌套写入改到的 `tasks` 和 `projectTags`。
- 监听器自己发起的写入不继承 meta。要继承，显式传：`meta: [auditMeta(audit)]`。
- meta 不是 `context`。`context` 是 Filter 与 Values 里 `v.variable()` 的变量来源，不会进入事件；meta 只给监听器看，不影响写什么、能不能写。

### 用 values 拿写入值

默认事件只有字段名。需要值时显式开启：

```ts
db.connection().onRepositoryMutation(
  { collections: ['projects'], values: true },
  {
    afterCommit: (events) => {
      for (const event of events) {
        if (event.granularity !== 'rows') continue;
        for (const change of event.changes) {
          if (change.values?.status === 'published')
            notifyFollowers(change.key.id);
        }
      }
    },
  },
);
```

```json
{
  "collection": "projects",
  "kind": "updated",
  "key": { "id": "project-1" },
  "fields": ["status"],
  "values": { "status": "published" }
}
```

- `values` 是这次调用写入的逻辑值，不是写之前的值；它不能回答“从什么改成了什么”。
- 数据库生成的默认值、触发器改的值不在里面。需要完整的新记录，按 `key` 自己读。
- `values: true` 的订阅越少越好：密码、令牌等字段也会原样进入事件。

## 常见场景

### 场景：realtime 推送

```ts
export class ProjectsRealtimeProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-projects:realtime';
  private off?: () => void;

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(realtimeServiceToken)) return;
    const topic = container
      .resolve(realtimeServiceToken)
      .defineTopic<{ projectId: string; kind: RowChangeKind }, 'public'>(
        'projects',
        {
          audience: 'public',
        },
      );

    this.off = container
      .resolve(databaseManagerToken)
      .connection()
      .onRepositoryMutation(
        { id: 'projects-realtime', collections: ['projects'] },
        {
          afterCommit: (events) => {
            for (const change of rowChanges(events, 'projects')) {
              topic.publish({
                projectId: String(change.key.id),
                kind: change.kind,
              });
            }
          },
        },
      );
  }

  public override async shutdown(): Promise<void> {
    this.off?.();
  }
}

function rowChanges(
  events: readonly RepositoryMutationEvent[],
  collection: string,
): RowChange[] {
  return events
    .flatMap((event) => (event.granularity === 'rows' ? event.changes : []))
    .filter((change) => change.collection === collection);
}
```

在 `boot` 注册、`shutdown` 取消，和其他 Provider 管理资源的方式一致。

### 场景：缓存失效

```ts
connection.onRepositoryMutation(
  { id: 'tags-cache', collections: ['tags', 'projectTags'], keys: false },
  { afterCommit: () => cache.delete('tags:all') },
);
```

在提交之后失效，避免并发读取在提交前把旧数据重新填回缓存。`keys: false` 让批量写不必加锁。

这里的 `cache` 必须是各节点共享的缓存（例如 Redis 后端）。如果是进程内存缓存，多节点部署下只有执行写入的那个节点会被清理，见“多节点部署”。

### 场景：搜索索引

索引更新慢，不要在 `afterCommit` 里直接做，交给 jobs：

```ts
connection.onRepositoryMutation(
  { id: 'search-index', collections: ['projects', 'tasks'] },
  {
    afterCommit: async (events) => {
      const keys = new Set(
        events
          .flatMap((event) =>
            event.granularity === 'rows' ? event.changes : [],
          )
          .map((change) => `${change.collection}:${String(change.key.id)}`),
      );
      for (const key of keys) await executor.addJob(new ReindexJob({ key }));
    },
  },
);
```

已知局限：提交成功、但 `addJob` 之前进程崩溃，这次更新就漏掉了。不能漏的场景，等[第三层 outbox](./events.md)，或者先在 `inTransaction` 里写一行待处理记录、由定时任务补偿。

### 场景：替代手动的提交后通知

授权插件目前要求“持有事务的调用方在提交后调用 `notifyAssignmentsChanged`”。改用第 1 层之后，服务自己登记（简化示意，不是现有代码）：

```ts
// 之前：服务绑定事务时什么也不做，靠调用方记得在提交后再调一次
async assignRole(subject: string, roleId: string): Promise<void> {
  await this.store.assign(subject, roleId);
  if (!this.boundToTransaction) await this.notifyAssignmentsChanged(subject);
}

// 之后：不管有没有事务，都交给 Connection
async assignRole(subject: string, roleId: string): Promise<void> {
  await this.store.assign(subject, roleId);
  this.connection.afterCommit(() => this.notifyAssignmentsChanged(subject));
}
```

调用方删掉提交后的那行手动调用即可。

### 场景：删除用户时清理关联数据

用户插件目前给每个模块开了 `onDelete(userId, connection)` 钩子。用 `inTransaction` 可以由各模块自己订阅：

```ts
connection.onRepositoryMutation(
  { id: 'projects-owner-cleanup', collections: ['users'] },
  {
    inTransaction: async (event, connection) => {
      if (event.granularity !== 'rows') return;
      const removed = event.changes
        .filter(
          (change) =>
            change.collection === 'users' && change.kind === 'deleted',
        )
        .map((change) => String(change.key.id));
      for (const userId of removed) {
        await connection.repository('projects').updateMany({
          filter: { ownerId: userId },
          values: { ownerId: null },
        });
      }
    },
  },
);
```

清理失败时，用户删除一起回滚。

### 场景：同步写入的审计日志

见第 5 层与第 6 层：`inTransaction` 写审计行，操作者来自 `auditMeta`，同一调用的全部审计行共享 `operationId`。

## 多节点部署

事件只在执行写入的那个进程里投递。应用部署成多个节点时：

```ts
// 节点 A 和节点 B 都在 boot 时注册了同一个订阅
connection.onRepositoryMutation(
  { id: 'tags-local-cache', collections: ['tags'], keys: false },
  { afterCommit: () => localMemoryCache.clear() },
);

// 请求落在节点 A
await db
  .repository('tags')
  .updateOne({ filter: { id: 'tag-db' }, values: { label: 'Database' } });
// → 节点 A 的监听器执行，A 的内存缓存被清空
// → 节点 B 什么也没收到，B 的内存缓存里还是旧的 label
```

按消费方区分：

| 监听器做的事                      | 多节点下 | 原因                                   |
| --------------------------------- | -------- | -------------------------------------- |
| `inTransaction` 写审计行          | 正确     | 写进共享的数据库                       |
| `afterCommit` 投递 jobs           | 正确     | 任务只需执行一次，由哪个节点投递都一样 |
| `afterCommit` 清共享缓存（Redis） | 正确     | 缓存本身是共享的                       |
| `afterCommit` 推送 realtime       | 视部署   | realtime 服务自身能跨节点分发时正确    |
| `afterCommit` 清进程内存缓存      | 错误     | 其他节点的缓存不会被清理               |

最后一类不要用事件解决，改用共享缓存。也不要用 `@nocobase/queue` 去“广播”：它是工作队列，每条消息只由一个消费者处理，其他节点同样收不到。

## 迁移与 Seed

迁移和 Seed 任务执行期间不发出 Repository 事件：

```ts
export default defineSeed({
  name: 'project-templates',
  async run(context) {
    await context.repository('projects').createMany({
      values: [{ id: 'project-template', name: '项目模板', status: 'draft' }],
    });
    // → 即使 projects 有订阅，这里也不会产生事件，也不会因订阅改变批量写的执行方式
  },
});
```

原因是任务在安装、升级时执行，监听器依赖的 realtime、jobs 等服务可能还没启动；迁移的结果也不应取决于当时注册了哪些监听器。

如果某个监听器维护的是派生数据（审计、搜索索引、统计），Seed 写入的数据不会经过它：

- 需要的派生数据由 Seed 自己显式写出；或者
- 提供一个重建任务，在应用启动后按需执行（例如“重建搜索索引”）。

任务上下文里的 Connection 是受限接口，也不提供第 1 层的 `afterCommit`。任务需要的后续动作，由任务自己显式完成。

## 不会产生事件的写法

| 写法                                                | 为什么没有事件                                 | 怎么办                              |
| --------------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| `connection.query.updateTable('tasks')...execute()` | 绕过 Repository                                | 需要事件就用 Repository             |
| `connection.client()` 拿 Knex 直接写                | 同上                                           | 同上                                |
| 数据库外键 `ON DELETE CASCADE` 删除的子行           | 数据库自己删的，db 不知道                      | 在 Repository 层显式删除子行        |
| 迁移与 Seed 执行期间的任何写入，包括 Repository     | 任务期间事件关闭                               | 派生数据由任务自己写，或启动后重建  |
| 其他节点上的写入                                    | 事件只在执行写入的进程内投递                   | 见“多节点部署”                      |
| 事务回调里用外层 `db.repository(...)` 写            | 有事件，但不属于这个事务，事务回滚时它照样提交 | 事务内只用回调参数里的 `connection` |
| `updateOne` 没有命中行                              | 调用以 `RECORD_NOT_FOUND` 失败，没有改动       | —                                   |

## 错误语义速查

| 出错的位置                   | 调用方看到                   | 已做的写入                 | 其他监听器                                             |
| ---------------------------- | ---------------------------- | -------------------------- | ------------------------------------------------------ |
| `inTransaction`              | 调用 reject，原始错误        | 随事务回滚                 | 后续 `inTransaction` 与这次调用的 `afterCommit` 不执行 |
| `afterCommit` 监听器         | 正常返回                     | 已提交，不受影响           | 照常执行；错误交给 `onRepositoryEventError`            |
| 第 1 层 `afterCommit` 回调   | 正常返回                     | 已提交，不受影响           | 照常执行；错误交给 `onTransactionCallbackError`        |
| `afterRollback` 回调         | 原始错误，不被替换           | 已回滚                     | 照常执行；错误交给 `onTransactionCallbackError`        |
| `inTransaction` 嵌套超过上限 | `REPOSITORY_EVENT_RECURSION` | 随事务回滚                 | —                                                      |
| `afterCommit` 嵌套超过上限   | 正常返回                     | 已提交；超限的那次写入失败 | 照常执行；错误交给 `onRepositoryEventError`            |

## 小结

- 只是“提交后通知一下”，用 `connection.afterCommit`。
- 不想让每个写入点都记得通知，用 `onRepositoryMutation` 的 `afterCommit`。
- 必须和写入一起成功或失败，用 `inTransaction`，写库用它给的 Connection。
- 要拒绝某次写入，在 `inTransaction` 里检查写入后的状态并抛错；要改值，不用事件。
- 事件只在本进程内投递；迁移与 Seed 期间不发事件。
- 只需要知道“变了”，加 `keys: false`；需要写入值，加 `values: true`，并想清楚敏感字段。
- 需要知道是谁做的，用 meta。
- 不能丢的消费方，不要只靠 `afterCommit`。
