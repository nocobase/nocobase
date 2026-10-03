---
title: Repository 变更事件
description: 用 onRepositoryMutation 订阅经 Repository 写入改动的行，包括嵌套关系写入；理解 inTransaction 与 afterCommit 两个阶段、批量写的执行策略、meta、values、递归上限和不产生事件的写入。
---

# Repository 变更事件

一次 Repository 写入调用可能改动多张表：根记录、嵌套关系的目标记录、外键和 through 行。`connection.onRepositoryMutation()` 让关心某些 Collection 的代码集中订阅这些改动，而不必在每个写入点手动通知。每次写入调用产生一个事件，事件里是这次调用改动的全部行。

只需要在提交后做事、且知道自己在哪里写入时，用更简单的 [`afterCommit`](../database/transactions.md)。需要“无论谁、从哪里改了这些表都要知道”时，用本页的订阅。

## 订阅

```ts
const off = db.connection().onRepositoryMutation(
  { id: 'project-board', collections: ['projects', 'tasks'] },
  {
    afterCommit: async (events) => {
      for (const event of events) {
        if (event.granularity !== 'rows') continue;
        for (const change of event.changes) {
          if (change.collection === 'tasks') {
            boardTopic.publish({
              taskId: String(change.key.id),
              kind: change.kind,
            });
          }
        }
      }
    },
  },
);

// 不再需要时
off();
```

| 选项          | 默认    | 说明                                                                                                                            |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `collections` | 必填    | 要观察的 Collection 逻辑名，不能为空。事件的根 Collection 或任意一条变更落在其中即匹配，包括嵌套写入的目标和 through Collection |
| `id`          | 无      | 诊断用名称，出现在 `explainRepositoryEvents()` 结果和 `onRepositoryEventError` 的 context 中                                    |
| `keys`        | `true`  | 是否需要批量写的行键。`false` 表示批量写只要行数，见“执行策略”                                                                  |
| `values`      | `false` | 是否在变更中附带写入的值，见“values”                                                                                            |

监听器至少提供一个：

| 监听器                             | 时机                                 | 收到                                                      |
| ---------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| `inTransaction(event, connection)` | 本次调用的写入全部完成后、事务结束前 | 一个事件和本次调用所在的事务 Connection                   |
| `afterCommit(events, connection)`  | 最外层事务提交之后                   | 该事务内匹配本订阅的全部事件（按发生顺序）和根 Connection |

订阅登记在根 Connection 上，并由它的所有事务 Connection 共享。通过事务 Connection 或 Policy 绑定的 Connection 调用 `onRepositoryMutation()`，登记的仍是整个 Connection 的订阅，不只是那个事务；它在 `off()` 之前一直有效。不同 Connection 的订阅互不相干；`DatabaseManager` 不提供跨 Connection 的订阅。

## 事件结构

```ts
await db.repository('projects').updateOne({
  filter: { id: 'project-1' },
  values: {
    owner: { connect: { id: 'user-2' } },
    tasks: {
      create: { id: 'task-9', title: '验收' },
      disconnect: { id: 'task-2' },
    },
    tags: { connect: [{ id: 'tag-orm' }] },
  },
});
```

```json
{
  "operationId": "5c0f…",
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
      "fields": ["ownerId", "version"]
    },
    {
      "collection": "tasks",
      "kind": "created",
      "key": { "id": "task-9" },
      "fields": ["id", "title", "projectId"]
    },
    {
      "collection": "tasks",
      "kind": "updated",
      "key": { "id": "task-2" },
      "fields": ["projectId"]
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

| 字段                | 说明                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `operationId`       | 每次调用唯一                                                                                        |
| `parentOperationId` | 只在 `inTransaction` 监听器经其 Connection 写入时出现，指向触发它的调用                             |
| `collection`        | 调用的根 Collection；变更可以落在别的 Collection                                                    |
| `operation`         | `createOne`、`createMany`、`updateOne`、`upsertOne`、`updateMany`、`deleteOne`、`deleteMany`        |
| `scope`             | 调用方自己开了事务时为 `transaction`，否则为 `connection`（Repository 自己的隐式事务或单条语句）    |
| `meta`              | 调用方传入的元数据，见“meta”                                                                        |
| `granularity`       | `rows` 时有 `changes`；`count` 时只有 `count`。读取 `changes` 前必须先判断，TypeScript 会强制这一点 |

每条变更 `RowChange`：

| 字段         | 说明                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `collection` | 被写的 Collection 逻辑名                                                                                                          |
| `kind`       | `created`、`updated`、`deleted`                                                                                                   |
| `key`        | 行键，逻辑字段名：主键；没有主键时为定位该行的唯一键。through 行一律用两侧外键组成的键，无论 through Collection 有没有自己的主键  |
| `fields`     | `created`、`updated` 时写入的逻辑字段。是“写了哪些字段”，不是“哪些值真的变了”：把值写成原值也会列出；乐观锁版本字段的递增也会列出 |
| `values`     | 只给 `values: true` 的订阅，见“values”                                                                                            |

同一行在一次调用中被写多次时只报告一次：先创建后修改仍是 `created`，字段合并；创建后又删除则不出现。

### 嵌套写入记为什么

| 写法                                             | 记为                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| belongsTo `connect`、`disconnect`、`create`      | 源记录上外键字段的 `updated`（`create` 另有目标的 `created`）                   |
| belongsTo `delete`                               | 源记录外键置空的 `updated`，目标的 `deleted`                                    |
| hasOne / hasMany `create`                        | 目标的 `created`，`fields` 含外键                                               |
| hasOne / hasMany `connect`                       | 目标外键的 `updated`；hasOne 原有目标被解除时另有一条外键置空                   |
| hasMany `disconnect`、hasOne `disconnect`、`set` | 被解除目标的外键置空 `updated`；未关联在本记录上的目标不报告                    |
| `update`、`upsert`                               | 目标的 `updated` 或 `created`                                                   |
| hasOne / hasMany `delete`                        | 目标的 `deleted`                                                                |
| belongsToMany `connect`、`create`                | through 行的 `created`；已有关系带 through 值时为 `updated`                     |
| belongsToMany `disconnect`、`set` 移除的关系     | through 行的 `deleted`                                                          |
| belongsToMany `delete`                           | 目标的 `deleted`，以及指向该目标的全部 through 行的 `deleted`，包括其他源记录的 |

belongsToMany 的 `connect` 不写目标表，所以没有目标 Collection 的变更；关心“标签关系变了”的一方应订阅 through Collection。

## 两个阶段与错误语义

| 阶段            | 能否写库                                                          | 抛错的后果                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inTransaction` | 可以，用收到的 Connection，与本次调用在同一事务；写入会再产生事件 | 本次调用以原错误失败；其后的 `inTransaction` 监听器不再执行，本次调用的 `afterCommit` 不投递。没有外层事务时隐式事务回滚                                                                                            |
| `afterCommit`   | 可以，用收到的 Connection；收到时事务已经结束                     | 不影响调用方，也不影响其他监听器。错误交给连接配置 `onRepositoryEventError(error, { subscriptionId, operationIds })`，未配置时成为 code 为 `REPOSITORY_EVENT_LISTENER_FAILED` 的进程警告，原错误在警告的 `cause` 中 |

- 同一阶段的监听器按登记顺序逐个 `await`。
- 没有改动任何行的调用（例如以 `RECORD_NOT_FOUND` 失败，或批量写匹配零行）不产生事件。
- 一个事务内的多次调用，`afterCommit` 只被调用一次，数组按发生顺序排列；事务回滚时什么也收不到。savepoint（嵌套 `transaction()`）回滚时，其中调用的事件被丢弃，其余照常投递。
- 调用方没有开事务时，Repository 先在隐式事务中执行并提交，再投递 `afterCommit`，调用在投递结束后才返回。`transaction()` 同样在全部 `afterCommit` 结束后才 resolve。监听器应当很快，慢的工作交给 jobs。
- 调用方处于事务中时，Repository 复用该事务，不为每次调用建 savepoint（见[事务](./transactions.md)）。`inTransaction` 抛错后，调用方不应捕获再继续提交：那次调用的写入会被提交，却不会投递事件。
- 需要“写入前拒绝”的检查，放在 `inTransaction` 中按写入后的状态判断：判断与写入在同一事务内，失败则一起回滚。

`inTransaction` 收到的 Connection 是本次调用所在的事务 Connection，不是调用方使用的 Policy 绑定 Connection；需要按 Policy 写入时自己调用 `withPolicies()`。经它写入产生的事件带 `parentOperationId`。这种嵌套写入的深度受连接配置 `repositoryEventMaxDepth`（默认 8）限制，超过时写入在执行前以 `RepositoryError('REPOSITORY_EVENT_RECURSION')` 失败，整个调用回滚；监听器写入自己订阅的 Collection 时，这就是无限递归的出口。

`afterCommit` 收到的 Connection 是根 Connection，写入在新的事务中进行，事件的 `parentOperationId` 是这批事件中最后一个的 `operationId`，深度从这批事件中最深的一个再加一，同样受 `repositoryEventMaxDepth` 限制。监听器在提交后写入自己订阅的 Collection 时，超过深度的那次写入以 `REPOSITORY_EVENT_RECURSION` 失败并交给 `onRepositoryEventError`，调用方正常返回。直接用 `db.connection()` 写入不带这些信息，也就不受限制，提交后的写入应经收到的 Connection 进行。

## 执行策略

单行写（`createOne`、`updateOne`、`upsertOne`、`deleteOne`）本来就知道键，有订阅时执行方式不变，事件总是 `rows`。只有按条件改写外键的嵌套写入（hasOne 替换和解除、hasMany `set`、删除 belongsToMany 目标）会先锁定匹配的行，再按键写入，各多一条 SELECT。

批量写的执行方式由“匹配根 Collection 的订阅”决定，不按方言名分支：

| 匹配的订阅                        | `updateMany` / `deleteMany`                      | `createMany`                                                                                                  | 事件粒度 |
| --------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------- |
| 无                                | 维持现状，单条语句                               | 维持现状                                                                                                      | 不发事件 |
| 全部为 `keys: false`              | 单条语句                                         | 单条语句                                                                                                      | `count`  |
| 任一为 `keys: true`，且行有标识   | 锁定匹配的行取键，再按键分批写，在隐式事务内执行 | 每行都给出了键时仍是原来的单条语句；否则方言支持时用一条多行 `INSERT … RETURNING`（SQLite），其余方言逐行插入 | `rows`   |
| 任一为 `keys: true`，但行没有标识 | 单条语句                                         | 单条语句                                                                                                      | `count`  |

- “行有标识”指 Collection 有主键，或第一个唯一键的字段都不可为空。没有主键、唯一键可为空的 Collection 拿不到可靠的行键，批量写如实退回 `count`。
- 调用本身已经知道键时（带 `select` 返回记录的批量写），即使全部订阅都是 `keys: false`，也给出 `rows`。
- 存在 `inTransaction` 监听器时，单条语句也在隐式事务内执行，以便监听器与写入一同提交或回滚。
- 代价只由有订阅的 Collection 承担。在文件型 SQLite 上，1 万行的 `updateMany` 无订阅约 1.4 ms，`keys: true` 约 40 ms（锁行查询加 50 条按键写入语句），`keys: false` 与无订阅相同。缓存失效一类只需知道“变了”的订阅应声明 `keys: false`。

`explainRepositoryEvents()` 说明某个 Collection 上的调用会怎样执行：

```ts
await db.connection().explainRepositoryEvents({
  collection: 'tasks',
  operation: 'updateMany',
});
// {
//   subscriptions: [{ id: 'task-cache', keys: false, values: false, phases: ['afterCommit'] }],
//   strategy: 'single-statement',
//   granularity: 'count',
//   implicitTransaction: false,
// }
```

| `strategy`               | 含义                                              |
| ------------------------ | ------------------------------------------------- |
| `unchanged`              | 与没有订阅时相同（单行写，或没有匹配的订阅）      |
| `single-statement`       | 批量写保持单条语句                                |
| `lock-then-write-by-key` | `updateMany` / `deleteMany` 先锁行取键，再按键写  |
| `insert-returning`       | `createMany` 用一条多行 `INSERT … RETURNING` 取键 |
| `insert-per-row`         | `createMany` 逐行插入取键                         |

它只看匹配根 Collection 的订阅；嵌套写入还可能匹配更多订阅。`createMany` 的各行都给出键时，实际仍是单条语句。返回值是 Promise，因为需要读取 Collection 定义。

## meta

`meta` 把调用方的信息（例如操作者）传给监听器。用 `defineRepositoryEventMeta()` 定义命名空间，类型由定义处给出：

```ts
import { defineRepositoryEventMeta } from '@nocobase/db';

const audit = defineRepositoryEventMeta<{ actorId: string }>('audit');

await repository.updateOne({
  filter: { id: 'task-1' },
  values: { status: 'done' },
  meta: [audit({ actorId: user.id })],
});

// 监听器中
const actor = audit.read(event); // { actorId: string } | undefined
```

- 7 个写入方法都接受 `meta`。meta 随本次调用进入事件，覆盖它产生的全部变更，包括嵌套写入。
- 监听器自己发起的写入不继承 meta，需要时显式传递。
- 同一命名空间在一次调用中只能出现一次，条目必须由 handle 构造，否则以 `INVALID_MUTATION` 拒绝。
- meta 不同于 [`context`](./context.md)：`context` 是 Filter 与 Values 的变量上下文，不进入事件。meta 也不参与 Policy 判断；按操作者授权应使用 Policy 绑定。

## values

`values: true` 的订阅在 `created`、`updated` 变更中收到 `values`：本次写入的规范化逻辑值。

- 不是写之前的快照，也不含数据库生成的值：数据库默认值、递增后的版本号、批量写中原子数值运算（`{ increment: 1 }`）的结果都不在其中。单行写的原子数值运算会回读，`values` 中是运算后的值。
- 外键改写的 `values` 是新的外键值，置空时为 `null`。
- 同一事件中没有声明 `values` 的订阅看不到这些值。写入值可能包含密码、令牌等敏感字段，只在确实需要时开启。

## 不产生事件的写入

- `connection.query`、`connection.client()` 与 `upsertPhysicalRow()` 的写入。
- 数据库自身完成的改动，例如外键级联删除或置空的行。需要这些行的事件时，在 Repository 层显式删除，不依赖数据库级联。
- Migration 与 Seed 任务中的全部写入，包括经任务上下文 `repository()` 的写入。任务在安装、升级时执行，监听器依赖的服务可能还没有启动，任务的效果也不应取决于当时登记了哪些监听器。业务代码无法关闭事件。
- 按条件解除关系时，目标 Collection 没有行标识（没有主键、唯一键可为空）的那部分行：写入照常执行，但这些行不在 `changes` 中。
- 其他进程中的写入。

## 进程范围

事件只在执行写入的进程里、由该进程的订阅投递，不跨进程广播，也不持久化：提交后、投递前进程崩溃，事件就丢失。它是“本进程刚提交了这些变更”的通知，不是“数据库里发生了这些变更”的通知。

| 消费方                     | 多节点部署下是否成立                   |
| -------------------------- | -------------------------------------- |
| 同事务写审计行、写 outbox  | 成立，写进共享的数据库                 |
| 投递 jobs、发送到队列      | 成立，后端是共享的                     |
| 清理共享缓存（例如 Redis） | 成立                                   |
| realtime 推送              | 取决于 realtime 服务能否跨节点分发     |
| 清理进程内存缓存           | 不成立，其他节点收不到；应改用共享缓存 |

不可丢失的消费方（工作流、外部同步）应在 `inTransaction` 中把待处理记录写进同一事务，再由独立任务认领投递。

## 连接配置

| 配置                      | 说明                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `onRepositoryEventError`  | 接收 `afterCommit` 监听器的错误和 `{ subscriptionId, operationIds }`。它自身抛错时，两个错误合并为一条进程警告 |
| `repositoryEventMaxDepth` | 监听器经收到的 Connection 嵌套写入的深度上限，`inTransaction` 与 `afterCommit` 都计入，非负整数，默认 8        |

## 已知限制

- SQLite 的事务以延迟方式开始（`BEGIN`），写锁从第一次写入才获取。同一进程内所有写入经同一个连接串行执行；多个进程共享一个数据库文件时，`lock-then-write-by-key` 不会拿到错误的行键，但可能在锁升级时以 `SQLITE_BUSY` 失败。
- 版本号递增、数据库默认值不出现在 `values` 中；需要写入后的完整记录时，在 `inTransaction` 中按键回读。
