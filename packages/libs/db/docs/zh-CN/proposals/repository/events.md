---
title: Repository 与事务生命周期事件
description: 候选设计：事务提交与回滚回调、覆盖嵌套写入的 Repository 行级变更事件、按订阅决定的执行策略、分阶段错误语义，以及后续的持久化投递。
---

# Repository 与事务生命周期事件

> 文档状态：设计与演进记录。第一层与第二层均已实现，当前用法以[事务](../../database/transactions.md)、[Repository 变更事件](../../repository/events.md)和公开类型为准；本页与正式文档不一致处，以正式文档为准。第三层（outbox）仍是候选设计。

> **状态：第一层已实现，用法见[事务](../../database/transactions.md)；第二层已实现，用法见 [Repository 变更事件](../../repository/events.md)。** “原型提出的设计修正”已采纳，除第 9 条外均已实现；实现与本页设计的差异见“实现与设计的差异”，未完成的事项见“待决问题”。逐层的用法示例、实际收到的事件和常见场景见 [Repository 与事务生命周期事件示例](./events-examples.md)。

## 背景

`@nocobase/db` 目前没有任何生命周期事件：没有 `beforeCreate/afterUpdate` 一类的钩子，没有事件总线，也没有事务提交后的回调。需要在数据变化后做事的调用方，都在事务回调返回之后手动通知：

| 位置                                                        | 做法                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `libs/authorization/src/plugins/permission-sets/plugin.ts`  | 绑定事务时 `notifyAssignmentsChanged()` 什么也不做，注释要求“持有事务的调用方在提交后发布”                   |
| `plugins/app-plugin-users/server/services/users.ts`         | `database.transaction(...)` 返回后再调 `onRoleScopesChanged`；事务内另有 `onDelete(userId, connection)` 钩子 |
| `plugins/app-plugin-notification-in-app/server/realtime.ts` | 包装 store，写完后 `topic.publishFor(...)`，错误记日志后吞掉                                                 |
| `examples/app-plugin-departments-example/server/tokens.ts`  | 约定“提交后返回成员变化的用户 id”，由调用方再去刷新                                                          |

这种写法有三个问题：漏写一处不会有任何报错；在回滚后照样通知同样不会报错；通过嵌套关系写入改到的数据，调用方往往意识不到。

db 内部其实已经有一个提交后机制，只是没有开放。`KnexDatabaseConnection.transaction()` 创建 `TransactionInvalidationCollector`，事务内记录 Collection 元数据失效，回滚时丢弃，提交后才应用到根 Registry（`src/database/internal/knex/connection.ts`，测试见 `db-sqlite/tests/manager.test.ts` 的 “publishes transactional Metadata and Registry invalidation only after commit”）。本提案把这个机制推广为公开能力。

## 目标与非目标

目标：

1. 让“提交后再做”成为 db 提供的能力，回滚时自动丢弃，嵌套事务和 Repository 隐式事务都正确处理。
2. 让订阅方看到一次 Repository 调用真正改动了哪些行，包括嵌套关系写入改到的目标表、外键和 through 行。
3. 有人订阅才付出代价，代价确定、可见，不按方言名分支，不悄悄降级。
4. 每个阶段的错误语义写清楚：抛错会不会回滚、会不会传给调用方。

非目标：

- 不提供能修改 values 的钩子。默认值、受保护字段和权限由 [write policy](../../repository/write-policy.md) 与 [Policy](./policies.md) 负责；值的转换属于字段类型和 codec。再开一个通用改值入口，“最终写进库的是什么”就说不清了。
- 不做 Sequelize 式的模型实例钩子。v3 返回普通对象，没有模型实例。
- 不覆盖 `connection.query`、`connection.client()` 的写入，也不覆盖数据库外键级联（`ON DELETE CASCADE`）删除的行。这不是 CDC。
- v1 不做持久化投递。进程崩溃时，内存中尚未投递的提交后事件会丢失；需要可靠投递的场景见下文“第三层：持久化投递”。
- 不做跨进程投递。事件只在执行写入的那个进程里触发，见下文“进程范围”。
- v1 不提供写入前的 `before` 阶段，见下文“后续可能：before 阶段”。
- 不做按 SQL 语句的中间件或 AST 改写。软删除、租户隔离等读写范围由 Policy 负责，再加一层改写就多了一条绕过 `explainPolicy()` 的路径。

## 分层

| 层             | 能力                                                         | 依赖   | 覆盖范围                                                     |
| -------------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------ |
| 第一层         | 事务 `afterCommit` / `afterRollback` 回调                    | 无     | 任何在事务 Connection 上执行的代码                           |
| 第二层         | Repository 变更事件：`inTransaction`、`afterCommit` 两个阶段 | 第一层 | 经 Repository 执行的写入，包括嵌套关系写入；迁移与 Seed 除外 |
| 第三层（后续） | 事务性 outbox，可靠投递                                      | 第二层 | 需要跨进程、不可丢失的消费方                                 |

第一层改动小、语义清楚，可以单独交付；上表列出的手动通知都能直接改用它。

## 第一层：事务回调

### API

```ts
await db.transaction(async (connection) => {
  await connection.repository('orders').createOne({ values });
  connection.afterCommit(() =>
    ordersTopic.publishFor(userId, { kind: 'orders.changed' }),
  );
  connection.afterRollback((error) =>
    logger.warn({ error }, 'order creation rolled back'),
  );
});
```

`DatabaseConnection` 与 `ScopedDatabaseConnection` 新增：

```ts
interface DatabaseConnection {
  /** Runs after the outermost transaction commits. Runs immediately outside a transaction. */
  afterCommit(callback: () => void | Promise<void>): void;
  /** Runs after the enclosing transaction or savepoint rolls back. Ignored outside a transaction. */
  afterRollback(callback: (error: unknown) => void | Promise<void>): void;
}
```

### 语义

| 情形                                                       | `afterCommit`                    | `afterRollback`                    |
| ---------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| 不在事务中调用                                             | 立即开始执行，调用方不等待其完成 | 忽略                               |
| 在最外层事务中登记，事务提交                               | 提交成功后按登记顺序逐个执行     | 不执行                             |
| 在最外层事务中登记，事务回滚                               | 丢弃                             | 回滚后按登记顺序执行，收到原始错误 |
| 在 savepoint（嵌套 `transaction()`）中登记，savepoint 释放 | 并入父事务，等最外层提交后执行   | 并入父事务                         |
| 在 savepoint 中登记，savepoint 回滚                        | 丢弃                             | savepoint 回滚后执行               |
| 提交本身失败                                               | 不执行                           | 执行                               |

`transaction()` 返回的 Promise 在所有 `afterCommit` 回调结束后才 resolve（已定），这样测试和调用方可以依赖“`await transaction()` 之后副作用已经发生”。代价是慢回调会拖长调用方的等待时间，所以回调里只做快的事情，慢的工作交给 jobs。回调抛错不会改变事务结果，也不会让 `transaction()` reject：错误交给新的连接配置项 `onTransactionCallbackError(error, phase)`，未配置时用 `process.emitWarning`，code 为 `TRANSACTION_CALLBACK_FAILED`，原错误放在警告的 `cause` 中。这与现有的 `onCollectionMetadataInvalidationError` / `COLLECTION_METADATA_INVALIDATION_FAILED` 一致：事务已经提交，事后的错误不应再让调用方以为写入失败。

`afterCommit` 回调在事务之外执行。回调里要写库，应使用根 Connection，或自己开启新事务；事务 Connection 此时已经结束，继续使用会得到 `QUERY_TRANSACTION_COMPLETED`。

### 实现

- 把 `TransactionInvalidationCollector` 推广为 `TransactionScope`：持有失效记录、`afterCommit` 队列和 `afterRollback` 队列，并有父子关系。
- `KnexDatabaseConnection.transaction()` 在当前 Connection 已处于事务时（`trx.transaction()` 即 savepoint），创建子 scope；savepoint 成功时并入父 scope，失败时执行子 scope 的 `afterRollback` 并丢弃其余内容。
- 只有根 scope 在 Knex 事务结束后执行 `afterCommit` 队列，顺序与现有的 `invalidations.apply(...)` 一致：先应用元数据失效，再执行回调，保证回调读到的 Registry 已是新状态。
- `PolicyBoundConnection.transaction()` 已把绑定带入事务，只需转发两个新方法。
- 迁移器和 Seeder 内部使用 `connection.transaction()`。任务拿到的 `MigrationConnection` / `SeedConnection` 是受限接口，v1 不在其上暴露 `afterCommit` / `afterRollback`；第二层事件在任务中也不发出，见下文“迁移与 Seed”。

## 第二层：Repository 变更事件

### 为什么不在 Repository 方法返回时发一个事件

一次 Repository 调用不只写一张表。嵌套关系写入会插入和更新目标表、修改外键（connect、disconnect、set、clear 时置空或改写外键列），还会插入、更新、删除 through 行。`KnexRepositoryExecutionAdapter` 中直接执行写 SQL 的位置有二十多处。只在 `DefaultRepository.createOne` 返回时发一个以根 Collection 为主体的事件，订阅 `tags` 的一方看不到经由 `posts.createOne` 嵌套创建的 tag。

所以模型是：**按行记录变更，按调用发出事件。**

### 事件结构

```ts
type RowChangeKind = 'created' | 'updated' | 'deleted';

interface RowChange {
  /** Logical Collection name; may be a nested target or a through Collection. */
  readonly collection: string;
  readonly kind: RowChangeKind;
  /** Primary key, or the unique field set used to address the row. */
  readonly key: Readonly<Record<string, unknown>>;
  /** Logical names of the fields written. Present for `created` and `updated`. */
  readonly fields?: readonly string[];
  /** Written values, only for subscriptions that ask for them. Never a before-image. */
  readonly values?: Readonly<Record<string, unknown>>;
}

interface RepositoryMutationEventBase {
  /** Unique per Repository call. Writes made by a listener carry the caller's id as `parentOperationId`. */
  readonly operationId: string;
  readonly parentOperationId?: string;
  /** Connection name. */
  readonly connection: string;
  /** Root Collection of the call. */
  readonly collection: string;
  readonly operation:
    | 'createOne'
    | 'createMany'
    | 'updateOne'
    | 'upsertOne'
    | 'updateMany'
    | 'deleteOne'
    | 'deleteMany';
  /** Whether the call ran inside a caller-owned transaction. */
  readonly scope: 'transaction' | 'connection';
  readonly meta: RepositoryEventMetaBag;
}

type RepositoryMutationEvent = RepositoryMutationEventBase &
  (
    | { readonly granularity: 'rows'; readonly changes: readonly RowChange[] }
    | { readonly granularity: 'count'; readonly count: number }
  );
```

`granularity: 'count'` 只出现在所有匹配订阅都声明了 `keys: false` 的批量写上，见下文“执行策略随订阅变化”。用判别联合表达，订阅方不可能把“只有行数”误当成“没有行改变”。

`values` 默认不提供，订阅时显式开启。原因有二：带上写入值会让密码、令牌等字段进入事件和日志；而大多数消费方（realtime、缓存失效）只需要知道哪些行和哪些字段变了。`values` 是规范化后实际写入的逻辑值，不是写之前的快照，也不含数据库生成的默认值。

### 每种操作产生的变更

| 操作         | 根 Collection 上的变更                 | 键从哪里来                                                                           |
| ------------ | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `createOne`  | 一条 `created`，另加嵌套写入产生的变更 | 现有插入路径已返回记录                                                               |
| `createMany` | 每行一条 `created`                     | 现有批量插入路径拿不到自增主键；有订阅时改走 `executeCreateManyReturning` 或逐行路径 |
| `updateOne`  | 一条 `updated`，另加嵌套写入产生的变更 | 现有 `lockByFilter`                                                                  |
| `upsertOne`  | 一条 `created` 或 `updated`            | 现有路径                                                                             |
| `updateMany` | 每行一条 `updated`                     | 有订阅时改走现有的 `executeUpdateManyReturning`（`lockManyByFilter` 后按键更新）     |
| `deleteOne`  | 一条 `deleted`                         | 现有 `lockByFilter`                                                                  |
| `deleteMany` | 每行一条 `deleted`                     | 有订阅时改走“先锁行、再按键删除”的路径，不回读记录                                   |

嵌套写入中的外键修改记为目标 Collection 上的 `updated`，`fields` 为外键字段；through 行记为 through Collection 上的 `created`、`updated` 或 `deleted`。乐观锁版本字段的递增出现在 `fields` 中。

`updateMany` 与 `deleteMany` 的“先锁行、再按键写”不依赖 `RETURNING`，因此 MySQL 与其他方言行为一致。锁的强度随方言而定：支持 `FOR UPDATE` 的方言锁定匹配行，SQLite 依赖数据库级写锁。

### 记录点

给 `KnexRepositoryExecutionAdapter` 注入一个 `MutationRecorder`，与 `TransactionInvalidationCollector` 注入 Connection 的方式相同。在底层写入点调用 `record()`，而不是在 Repository 层二十多处调用点补记录：

- 根记录与嵌套创建：`insertRecord`，以及 `createMany` 的各条批量插入路径。
- 按键更新：`updateOne` 的根更新、`updateTargetRecord`、`executeUpdateManyReturning`。
- 按键删除：`executeDeleteOne`、`deleteRelatedTarget`、`deleteMany` 的按键路径。
- 外键改写：connect、disconnect、set、clear 中对目标表外键列的更新。其中按条件批量置空外键的语句，有订阅时同样先锁行取键。
- through 行：through 的插入、更新和删除。

记录点容易遗漏，需要一个结构性测试兜底：在每个方言上，对 `db-testkit/tests/integration/repository/` 中已覆盖的全部写入场景（含嵌套关系写入），对比执行前后的表快照差异与记录到的 `RowChange` 集合，两者必须一致。

### 订阅 API

```ts
const audit = defineRepositoryEventMeta<{ actorId: string }>('audit');

const off = db.connection().onRepositoryMutation(
  {
    collections: ['orders', 'orderItems'],
    id: 'orders-audit', // optional; shown by explainRepositoryEvents() and in logs
    keys: true, // default; false accepts count-only events for bulk writes
    values: false, // default
  },
  {
    inTransaction: async (event, connection) => {
      if (event.granularity !== 'rows') return;
      await connection.repository('auditLogs').createMany({
        values: event.changes.map((change) => ({
          operationId: event.operationId,
          actorId: audit.read(event)?.actorId,
          collection: change.collection,
          kind: change.kind,
          key: change.key,
        })),
      });
    },
    afterCommit: async (events) => {
      for (const event of events)
        ordersTopic.publish({ operationId: event.operationId });
    },
  },
);

await db
  .connection()
  .repository('orders')
  .deleteMany({
    filter: { status: 'void' },
    meta: [audit({ actorId: user.id })],
  });
```

- 在根 Connection 上注册，返回取消函数 `() => void`，与 `AppEventBus`、jobs `subscribe` 一致。可选的 `id` 只用于诊断，出现在 `explainRepositoryEvents()` 的结果和日志中。订阅表由根 Connection 持有，并像 `TransactionScope` 一样传给事务 Connection 与 `PolicyBoundConnection`；事务内新建的 Connection 不另有订阅表。
- `collections` 匹配事件的根 Collection 和任意一条 `RowChange` 的 Collection，因此订阅 `orderItems` 也能收到 `orders.createOne` 中嵌套写入的明细行，订阅 `posts` 也能收到只改了 through 行的 `posts.updateOne`。`inTransaction` 与 `afterCommit` 收到的是完整事件，订阅方自行按 Collection 过滤 `changes`。
- 不在 `DatabaseManager` 上提供跨 Connection 的订阅。不同 Connection 的事务互不相干，需要时分别注册。

### 两个阶段与错误语义

| 阶段            | 时机                                           | 收到                                               | 能否写库                                                  | 抛错的后果                                                                                                                           | 调用失败时是否执行 |
| --------------- | ---------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| `inTransaction` | 本次调用的全部写入完成后、本次调用的事务结束前 | 事件 + 当前事务 Connection                         | 可以，与本次调用同一事务；写入会再次触发事件              | 本次调用失败，错误传给调用方；见下方回滚范围                                                                                         | 不执行             |
| `afterCommit`   | 最外层事务提交后（经由第一层）                 | 该事务内匹配的全部事件，按发生顺序 + 根 Connection | 可以，用收到的 Connection，在事务之外；写入会再次触发事件 | 不影响调用方；交给 `onRepositoryEventError(error, context)`，未配置时 `process.emitWarning`，code `REPOSITORY_EVENT_LISTENER_FAILED` | 不执行；回滚时丢弃 |

补充规则：

- 同一阶段内，监听器按注册顺序逐个 `await`；`inTransaction` 中有一个抛错，其后的 `inTransaction` 不再执行。
- 调用没有改动任何行（例如 `updateOne` 以 `RECORD_NOT_FOUND` 失败，或批量写匹配零行）时不发事件。
- `inTransaction` 的回滚范围与现有 Repository 写入一致：调用方没有外层事务时，本次调用的隐式事务整体回滚；调用方处于事务中时，Repository 复用该事务、不建 savepoint（见 [Repository 事务](../../repository/transactions.md)），错误抛给调用方，由调用方的事务回滚。调用方不应捕获后继续提交。
- 目前不带 select 的 `updateMany`、`deleteMany` 和批量 `createMany` 只执行一条语句、不开事务。存在匹配的 `inTransaction` 监听器时，这些调用改在隐式事务中执行。
- `inTransaction` 失败时，同一调用的 `afterCommit` 不会执行，事务回滚后已积累的事件一并丢弃。
- 需要在写入前拒绝的检查，放在 `inTransaction` 中、在写入之后判断：此时数据已是写入后的状态，判断与写入在同一事务内，结论不会被并发写入推翻。
- 监听器经收到的 Connection 写入会产生新事件。`inTransaction` 的写入以触发它的调用为 `parentOperationId`；`afterCommit` 的写入以这批事件的最后一个为 parent，深度取这批中最深的一个再加一。嵌套深度超过 `repositoryEventMaxDepth`（默认 8）时写入抛 `RepositoryError('REPOSITORY_EVENT_RECURSION')`；在 `afterCommit` 中，这个错误交给 `onRepositoryEventError`，调用方不受影响。直接用 `db.connection()` 写入不带这些信息，也不受上限保护。
- 第一层的 `afterCommit` 回调与第二层的 `afterCommit` 监听器共用同一个队列，按登记或事件发生的先后执行。

### 执行策略随订阅变化

是否需要取键，只由“本次调用会触及的 Collection 集合”和“匹配这些 Collection 的订阅”决定，不由方言名决定：

| 匹配的订阅                                   | 批量写的执行方式                       | 事件粒度 |
| -------------------------------------------- | -------------------------------------- | -------- |
| 无                                           | 维持现状，单条语句，不记录             | 不发事件 |
| 全部为 `keys: false`，且没有 `inTransaction` | 维持单条语句                           | `count`  |
| 任一为 `keys: true`                          | 先锁行取键，再按键写，在隐式事务内执行 | `rows`   |

代价是一次额外的加锁查询，以及批量写从一条语句变成“查询 + 按键写”。为了让它可见，Connection 提供 `explainRepositoryEvents({ collection, operation })`，说明这类调用会匹配哪些订阅、采用哪种执行方式；Repository 在 debug 日志中输出同样的信息。现有的 `describeMutation()` 只支持 `createOne` 与 `updateOne`，不适合承载批量写的说明。

### meta

`meta` 用来把调用方的信息（例如操作者）传给监听器，供审计等场景使用。它不同于现有的 `context`：`context` 是 Filter 与 Values 的变量上下文，不是权限上下文，也不会进入事件。

```ts
const audit = defineRepositoryEventMeta<{ actorId: string }>('audit');
await repository.updateOne({ filter, values, meta: [audit({ actorId })] });
const actor = audit.read(event); // { actorId: string } | undefined
```

- 每个 meta 有自己的命名空间，类型由定义处给出，读取时不需要断言。
- meta 随本次调用传到它产生的全部 `RowChange` 与事件，包括嵌套写入；监听器自己发起的写入不自动继承，需要显式传递。
- meta 不参与 Policy 判断。需要按操作者授权，应使用 Policy 绑定的 principal。

### 不覆盖的范围

以下写入不产生事件，提案落地时要写进正式文档：

- `connection.query` 与 `connection.client()` 执行的写入，包括 `upsertPhysicalRow`。
- 数据库外键级联删除或置空的行。需要这些行的事件，应在 Repository 层显式删除，而不是依赖数据库级联。
- 迁移和 Seed 执行期间的全部写入，包括经 Repository 的写入，见下文“迁移与 Seed”。
- 其他进程中的写入，见下文“进程范围”。
- 写之前的快照。如有需要，后续可增加订阅选项 `snapshot: 'before'`，由执行层在写之前按键回读，代价由声明的订阅方承担。

### 进程范围

事件在执行写入的那个进程里、由该进程的订阅表投递，不跨进程广播。同一应用部署成多个节点时，节点 A 上的写入只触发节点 A 的监听器。

这对不同的消费方意味着不同的事情：

| 消费方                     | 多节点下是否成立 | 说明                                                                                                                 |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| 同事务写审计行、写 outbox  | 成立             | 写进共享的数据库，与哪个节点执行无关                                                                                 |
| 投递 jobs、发送到队列      | 成立             | 后端是共享的，由任一节点投递即可                                                                                     |
| 清理共享缓存（例如 Redis） | 成立             | 缓存本身是共享的                                                                                                     |
| realtime 推送              | 取决于 realtime  | realtime 服务自身支持跨节点分发时成立；否则只有连在节点 A 上的客户端收到                                             |
| 清理进程内存缓存           | 不成立           | 其他节点的内存缓存不会被清理。应改用共享缓存；`@nocobase/queue` 是工作队列，每条消息只由一个消费者处理，不能用来广播 |

正式文档要明确写出这一点：事件是“本进程刚提交了这些变更”的通知，不是“数据库里发生了这些变更”的通知。

### 迁移与 Seed

**已定：迁移和 Seed 任务执行期间，不发出第二层事件。** 任务上下文的受限 Connection 也不暴露第一层回调；任务需要的后续动作由任务自己显式完成。

理由：

- 任务在应用安装、升级时执行，此时监听器依赖的服务（realtime、jobs、其他插件的服务）可能尚未启动；监听器是否已注册，取决于 Provider 的启动顺序，不应成为任务结果的一部分。
- 迁移要求自包含、可重放。如果迁移的效果还取决于当时注册了哪些监听器，同一条迁移在不同应用里会产生不同的结果。
- Seed 写入的是安装数据。需要的派生数据（审计、索引、计数）应由 Seed 自己显式写出，或在应用启动后由重建任务生成，而不是隐式依赖事件。

实现：迁移器与 Seeder 为任务创建的事务 Connection 带一个内部标记，`DefaultRepository` 在该标记下不记录、不投递变更，也不因订阅切换执行路径。这个标记不对外公开，业务代码无法关闭事件。

### 后续可能：before 阶段

早期草案有一个写入前执行的 `before` 阶段，用于拒绝调用。v1 不提供，原因：

- 判断与写入不是原子的。`before` 里查询到的状态，在随后的写入执行前可能已被并发写入改变。
- 只能对根 Collection 触发。经嵌套关系写入改到的 Collection 收不到 `before`，同一条规则会出现能绕过的路径。
- 它能做的拒绝，`inTransaction` 都能更可靠地做到：在写入之后、同一事务内检查写入后的状态，失败则整体回滚。

以后如果出现 `inTransaction` 做不到的需求（例如必须在执行任何 SQL 之前拒绝，以避免加锁），再单独提案，并且同样不允许修改 values。

## 第三层：持久化投递（后续）

`afterCommit` 在进程内存中投递，提交成功但投递前进程崩溃时事件会丢失。jobs、workflow、搜索索引等不可丢失的消费方，应使用事务性 outbox：在 `inTransaction` 阶段把一行 outbox 记录写入同一事务，再由独立的 relay 认领、投递、标记完成。仓库中已有商业插件实现了专用的 outbox 与 relay，后续可以抽象为通用组件，建立在第二层之上。v1 不包含此项。

## 其他生命周期事件

以下事件简单，可以随第一层一起交付：

- Connection 的 `connect`、`disconnect`、`destroy`。
- Collection 元数据变化：在现有失效机制应用到根 Registry 之后发出 `onCollectionsChanged({ collections, namingIndex })`，与事务内的元数据失效语义一致，只在提交后发出。

## 能解决哪些场景

事件覆盖两类需求：写入之后通知别人，以及写入时连带做点什么、并和写入一起成败。需要改值、要旧值、要跨进程或不能丢的需求，要靠别的机制或第三层。场景的完整写法见[示例文档](./events-examples.md)的“常见场景”。

### 能直接解决的

| 场景                                       | 用哪一层、哪个阶段                   | 解决了什么                                                                   |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------- |
| 前端实时刷新（realtime 推送）              | 第二层 `afterCommit`                 | 现在各写入点手动 publish，容易漏、回滚了也照发；改为集中订阅、只在提交后推送 |
| 缓存失效                                   | 第二层 `afterCommit` + `keys: false` | 提交后才清，避免旧数据被重新填回；批量写不必加锁                             |
| 权限、角色变化通知                         | 第一层 `afterCommit`                 | 不再要求调用方提交后手动调 `notifyAssignmentsChanged`，服务内部自己登记      |
| 同步审计日志                               | 第二层 `inTransaction` + meta        | 审计行与业务数据一起提交或回滚；嵌套写入改到的行也会记录                     |
| 跨表不变量（如“有未完成任务就不能删项目”） | 第二层 `inTransaction`               | 写入后同事务内检查，失败就整体回滚；经由别的表嵌套删除也绕不过               |
| 删除时清理关联数据                         | 第二层 `inTransaction`               | 各模块订阅自己关心的删除，替代 users 插件逐个模块开的 `onDelete` 钩子        |
| 派生、冗余数据（计数、汇总字段）           | 第二层 `inTransaction`               | 如任务增删时同步项目上的任务数，与写入原子                                   |
| 投递后台任务（搜索索引、向量化、发通知）   | 第二层 `afterCommit` → jobs          | 提交后才投递，不会为回滚了的数据建索引                                       |

### 能部分解决、有明确局限的

| 场景                                | 局限                                       | 补救                                                                             |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| 数据变更触发工作流                  | `afterCommit` 只在内存里投递，进程崩溃会丢 | 可靠触发等第三层 outbox；现阶段在 `inTransaction` 里写待处理记录，由定时任务补偿 |
| 同步到外部系统（webhook、数据仓库） | 同上，且要求不丢、不重                     | 同上，外部投递还要做成幂等                                                       |
| 只在“状态从 A 变成 B”时触发         | 事件只有写了哪些字段和新值，没有旧值       | 订阅方自己维护上一状态；或以后加 `snapshot: 'before'`                            |
| 多节点部署下的 realtime 推送        | 事件只在执行写入的节点触发                 | 取决于 realtime 服务自身能否跨节点分发                                           |

### 解决不了、应该用别的机制的

| 场景                                          | 原因                                     | 用什么                                      |
| --------------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| 写入前自动填值（创建人、默认值、时间戳）      | 事件不允许改值                           | write policy、Policy defaults、字段类型     |
| 写入前的加密、格式转换                        | 同上                                     | 字段类型与 codec                            |
| 数据历史、版本对比                            | 没有改之前的快照                         | `snapshot: 'before'` 或专门的历史表方案     |
| 清理每个节点的进程内存缓存                    | 事件不跨进程；队列每条消息只有一个消费者 | 改用共享缓存                                |
| 监控 `query`、原生 SQL 的写入或数据库级联删除 | 不经过 Repository                        | 改走 Repository，或在 Repository 层显式删除 |
| 安装、升级时（迁移、Seed）触发业务逻辑        | 这期间事件关闭                           | 由任务自己写出派生数据，或启动后跑重建任务  |
| 软删除、租户隔离                              | 这是读写范围问题                         | Policy                                      |

## 与 Prisma 的对照

参考了新一代 Prisma ORM 仓库（`packages/0-config` 至 `9-public` 的分层结构）。它没有生命周期事件，只有按 SQL 语句执行的运行时中间件（`beforeCompile`、`beforeQuery/Execute`、`intercept*`、`onRow`、`afterQuery/Execute`），而且在本提案关心的两处留有缺口：

- 没有提交后钩子。`middleware-cache` 的 README 明确说明运行时还没有 post-commit 钩子，写入时的缓存失效只能等这个钩子出现；在此之前由应用在写入返回后自行失效，并特别指出 ORM 为 `update()`、`delete()` 隐式开启的事务也要等提交。
- 一次逻辑操作拆成多条语句时，annotation 在嵌套写入路径上丢失，“运行时应看到一个逻辑事件还是 N 个语句事件”作为开放问题搁置（`projects/middleware-intercept-and-cache/follow-ups.md`）。本提案的回答是：每次调用一个事件，内含 N 条 `RowChange`。

借鉴的做法：

| Prisma                                                                                    | 本提案                                                                  |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 每次执行生成 `planExecutionId`，上下文带 `scope`，拒绝 AsyncLocalStorage（ADR 220）       | 事件带 `operationId`、`parentOperationId`、`scope`；Connection 显式传递 |
| 按阶段规定错误语义；失败路径上 after 钩子的错误被吞掉，避免掩盖原始错误（ADR 215）        | “两个阶段与错误语义”一节的错误语义表                                    |
| 成功路径上 after 钩子的错误在语句已执行后抛给调用方（反例）                               | `afterCommit` 错误隔离上报，不传给调用方                                |
| 类型化 annotation，声明适用的操作类型                                                     | `defineRepositoryEventMeta`，并保证传到嵌套写入                         |
| 改参数值（加密）与改查询分成专门的窄入口；默认值由 mutation-default 生成器负责（ADR 256） | 不提供改值钩子；改值交给字段类型、codec 与 write policy                 |
| 行结果与计数结果用不同类型表达                                                            | `granularity: 'rows' \| 'count'` 判别联合                               |
| 按 capability 确定性地选择或拒绝执行方案，不按目标名分支，不悄悄降级                      | 按订阅确定执行策略，并经 `explainRepositoryEvents()` 可见               |
| 批量写只用 RETURNING 取主键，再按主键回读；删除前快照读                                   | 复用现有“先锁行、再按键写”路径，不依赖 RETURNING                        |

不借鉴的做法：

- 用 `beforeCompile` 改写 AST 实现软删除和租户隔离：与 Policy 职责重叠。
- 只能在客户端级注册中间件：这里需要按 Collection 订阅。
- 不支持嵌套事务：这里已经支持 savepoint，必须处理 savepoint 回滚时丢弃事件。
- 按语句的中间件本身：它解决遥测、缓存、改写 SQL，与 Repository 事件是两类需求；如有需要，应在 QueryAdapter 层单独设计。

## 实施步骤

0. **原型验证（第二层的前提）。** 在 SQLite 上做最小原型，回答“记录点是否可行、代价多大”，结论写回本页后再进入第 3 步。范围：
   - 第一层完整实现。
   - `MutationRecorder` 覆盖 `createOne` 的全部嵌套关系操作（create、connect、disconnect、set、clear、update、delete，以及 belongsToMany 的 through 写入），以及 `updateMany`、`deleteMany` 的取键路径。
   - 按条件批量置空外键（set、clear）在有订阅时的取键路径。

   验收标准：
   - 结构性测试（表快照差异对比 `RowChange`）在上述场景全部通过。
   - 没有订阅时，每个场景执行的 SQL 条数与原型前完全相同（以测试断言查询次数）。
   - 记录有订阅时批量写的额外查询次数，并在万行量级的 `updateMany`、`deleteMany` 上记录耗时，与无订阅时对比。
   - 列出实际改动的写入点数量，以及是否有无法在底层统一记录、只能逐处补记录的位置。

   如果按条件置空外键的取键代价不可接受，备选方案是：该部分只记 Collection 级的 `count` 变更，并在事件中如实标出，由本页更新后再评审。（结论：代价可接受，不需要这个备选方案，见“原型结论”。）

1. **第一层。** 引入 `TransactionScope`，实现 `afterCommit` / `afterRollback`、savepoint 并入与丢弃、`onTransactionCallbackError`。在 `db-testkit/tests/integration/` 增加跨方言测试：提交执行、回滚丢弃、savepoint 回滚丢弃子 scope、提交失败、回调错误不影响结果、回调执行时 Registry 已应用失效。
2. **调用方迁移。** 用 `afterCommit` 替换背景一节列出的手动通知，删除 `notifyAssignmentsChanged()` 在事务绑定下的空操作分支。（已完成：permission-sets 绑定 `@nocobase/db` 事务时改为提交后通知；users 的 `onRoleScopesChanged` 改为在事务内登记 `afterCommit`。departments 示例在服务提交后才通知，in-app 通知的 store 不在事务内写入，二者无需迁移。）
3. **第二层记录。** 先修复“原型结论”中的两个已有缺陷，其中批量写的 OR 链过长是本步的前提；再引入 `MutationRecorder` 与订阅表，实现 `inTransaction` 与 `afterCommit`、按订阅切换批量写路径、迁移与 Seed 中关闭事件。结构性测试（表快照差异对比 `RowChange`）在每个方言上运行。
4. **第二层补全。** `defineRepositoryEventMeta`、`explainRepositoryEvents()`、递归上限。
5. **文档转正。** 实现部分移入 `repository/` 正式文档，本页保留为演进记录。

第 3 至 5 步已完成：结构性测试与投递语义测试位于 `db-testkit/tests/integration/repository/events/`，在每个方言上运行；没有订阅时 SQL 逐条不变的断言与可选的耗时基准位于 `db-sqlite/tests/repository-events/`。

## 原型结论（第 0 步）

**结论：设计在 SQLite 上可行，验收标准全部满足。** 原型分支为 `feat/db-repository-events-prototype`（未合并），测试位于该分支的 `packages/libs/db-sqlite/tests/prototype-events/`，完整报告为分支根目录的 `PROTOTYPE-REPORT.md`。其他方言尚未验证。

| 验收标准         | 结果                                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 结构性正确       | 38 个场景（四种关系的全部嵌套操作、有无自身主键的 through 表、乐观锁根记录、upsertOne、deleteOne、批量写）中，记录到的 `RowChange` 与表快照差异全部一致。另有 10 个投递语义测试通过。在现有 SQLite 集成套件上挂一个覆盖全部表的订阅运行，849 个通过、3 个跳过 |
| 没有订阅时零开销 | 38 个场景执行的 SQL 文本与改动前逐条完全相同；没有订阅时只多一次“订阅表是否为空”的判断                                                                                                                                                                        |
| 有订阅时的代价   | 单行调用多 0 条语句；只有三条按条件置空外键的路径各多 1 条 SELECT。`keys: true` 的批量写多 3 条语句（BEGIN、加锁 SELECT、COMMIT）；`keys: false` 保持一条语句                                                                                                 |
| 写入点盘点       | 13 个函数中的 22 条写语句需要记录。只有 `insertRecord` 是真正的集中记录点，其余 20 条需逐处记录，其中 2 处还要按受影响行数判断是否真的写了                                                                                                                    |

批量写在文件型 SQLite 上的耗时（7 次中位数）：

| 操作       |  行数 |  无订阅 | `keys: true` | `keys: false` |
| ---------- | ----: | ------: | -----------: | ------------: |
| updateMany |  1 万 |  1.3 ms |      19.9 ms |        1.3 ms |
| deleteMany |  1 万 |  1.0 ms |      13.8 ms |        1.0 ms |
| updateMany | 10 万 | 10.5 ms |     191.6 ms |       10.8 ms |
| deleteMany | 10 万 |  8.6 ms |     160.4 ms |        8.3 ms |

1 万行时 SQL 本身约 6 ms，其余是逐行的 JavaScript 记录开销，正式实现可以优化。

### 已有缺陷

两个缺陷在当前 `develop` 上已能复现，与事件无关：

1. **按键批量写的 OR 链过长。** 带 `select` 的 `updateMany`、`deleteMany` 先锁行，再用一条把所有主键 OR 起来的语句写入或回读。SQLite 超过约 1000 行就报 `Expression tree is too large`，2000 行即失败。第二层的取键路径依赖它，必须先修（按批拆分，或改用 `IN`）。
2. **hasOne 嵌套 create 的唯一约束冲突。** 已有目标时再嵌套 create 一个新目标，新行先插入、旧行后解除，触发外键列上的唯一约束，抛出底层数据库错误。需要先确定语义：替换旧目标，还是给出明确的错误码。

### 原型提出的设计修正

| #   | 问题                                                                                           | 建议                                                                                              |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | 本页说记录点集中在少数底层函数，实际只有插入是集中的                                           | 改写“记录点”一节，按 22 条写语句逐一记录，并保留结构性测试兜底                                    |
| 2   | 没有主键、或唯一键可为空的 Collection 拿不到行键                                               | 这类 Collection 的批量写退回 `count` 粒度，在事件中如实体现                                       |
| 3   | through 表自身有主键时，行键用哪一个                                                           | 统一用两侧外键组成的键，与 through 表是否有自身主键无关                                           |
| 4   | 本次调用会触及哪些 Collection，只能在执行前按请求估算，会偏多                                  | 接受：订阅了“可能触及但实际没写”的 Collection，会承担记录开销但收不到事件                         |
| 5   | 执行策略表没有覆盖“`keys: false` 加 `inTransaction`”；调用本身已返回记录时，也不必退回 `count` | 补全策略表：粒度由 `keys` 决定，`inTransaction` 只要求在隐式事务内执行；已知行键时一律给出 `rows` |
| 6   | upsertOne 的 create 分支在 adapter 自己的 savepoint 里执行                                     | 记录器按 savepoint 分层，savepoint 释放时并入；正式实现补测试                                     |
| 7   | 按最外层事务批量投递，需要第一层的内部接口，公开的 `afterCommit` 不够                          | 第二层使用第一层的内部 `TransactionCallbacks`，不新增公开接口                                     |
| 8   | 隐式事务需经由 Connection 开启，监听器才能拿到 Connection                                      | 正式实现照此处理；文档写明监听器拿到的是事务 Connection，不是 Policy 绑定的 Connection            |
| 9   | SQLite 的写锁从第一次写入才开始（延迟 BEGIN），多进程共享一个文件时，取键路径不足以防并发      | 取键路径在 SQLite 上使用 `BEGIN IMMEDIATE`                                                        |
| 10  | 带 `keys` 的 `createMany` 退化为逐行插入                                                       | 主键由调用方给出时直接使用；支持 `RETURNING` 的方言用多行 `INSERT … RETURNING`                    |
| 11  | 监听器写入自己订阅的 Collection 会无限递归                                                     | 正式实现包含递归上限，`inTransaction` 与 `afterCommit` 监听器经收到的 Connection 写入都计入       |

以上修正均已采纳。除第 9 条（见待决问题 6）外均已实现。

原型未实现、留给正式实现的部分（均已在正式实现中完成）：`values`、meta、`parentOperationId`、递归上限、`explainRepositoryEvents()`、`onRepositoryEventError`、迁移与 Seed 中关闭事件、adapter 内 savepoint 回滚的测试，以及 SQLite 以外的方言。

## 实现与设计的差异

| 方面                        | 实现                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `explainRepositoryEvents()` | 返回 Promise，因为需要读取 Collection 定义判断行标识。`strategy` 取值为 `unchanged`、`single-statement`、`lock-then-write-by-key`、`insert-returning`、`insert-per-row`；没有匹配的订阅时 `granularity` 为 `none` |
| debug 日志                  | 未实现，见待决问题 7                                                                                                                                                                                              |
| `createMany` 取键           | 每行都给出键时保持原来的单条语句；否则方言运行时声明 `insertManyReturning` 时用一条多行 `INSERT … RETURNING`（目前只有 SQLite 声明），其余方言逐行插入                                                            |
| `values`                    | 不含递增后的版本号、数据库默认值，以及批量写中原子数值运算的结果；单行写的原子运算会回读，给出运算后的值                                                                                                          |
| 没有行标识的关系目标        | 按条件解除关系时，目标 Collection 没有主键或非空唯一键，就无法按键写入：写入照常执行，这些行不出现在 `changes` 中                                                                                                 |
| `inTransaction` 失败        | 调用的 `afterCommit` 位置在监听器运行前预留，监听器抛错时撤回。调用方捕获错误后继续提交时，那次调用的写入被提交，但不投递事件                                                                                     |
| 批量取键的代价              | 按键写入使用每批至多 200 个键的语句。文件型 SQLite 上 1 万行的 `updateMany`：无订阅 1.4 ms，`keys: true` 约 40 ms，`keys: false` 1.4 ms                                                                           |
| 订阅参数校验                | `collections` 为空、两个监听器都没有提供时，`onRepositoryMutation()` 抛 `TypeError`                                                                                                                               |
| `onRepositoryEventError`    | context 为 `{ subscriptionId?, operationIds }`；它自身抛错时，两个错误合并为一条 `REPOSITORY_EVENT_LISTENER_FAILED` 进程警告                                                                                      |

## 已定决策

| #   | 决策                                                                       | 依据                                         |
| --- | -------------------------------------------------------------------------- | -------------------------------------------- |
| D1  | `transaction()` 等待全部 `afterCommit` 回调结束后再 resolve                | 副作用在 `await` 之后可依赖；慢工作交给 jobs |
| D2  | v1 不提供 `before` 阶段                                                    | 见“后续可能：before 阶段”                    |
| D3  | 迁移与 Seed 执行期间不发出第二层事件，任务上下文也不暴露第一层回调         | 见“迁移与 Seed”                              |
| D4  | 事件只在执行写入的进程内投递，正式文档明确写出                             | 见“进程范围”                                 |
| D5  | 第二层在 SQLite 原型验证记录点的可行性与代价之后再实施（已验证，结论可行） | 记录点数量与批量取键代价此前只是推断         |

## 待决问题

| #   | 问题                                                                                                | 当前倾向                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `values` 是否需要按字段声明（例如只要 `status`），以便排除敏感字段                                  | 先做布尔开关，敏感字段由 Collection 元数据标记后统一排除                                                                                                                              |
| 2   | 是否在 Repository 层模拟外键级联，使级联删除的行也产生事件                                          | 不在本提案范围                                                                                                                                                                        |
| 3   | 递归深度上限的默认值，以及是否可配置                                                                | 已定：默认 8，连接配置 `repositoryEventMaxDepth` 可调                                                                                                                                 |
| 4   | 在事务中、存在 `inTransaction` 监听器时，是否为每次调用自动建 savepoint，使监听器失败只回滚本次调用 | 不建，保持与现有 Repository 事务语义一致                                                                                                                                              |
| 5   | 是否在 db 内提供跨进程广播                                                                          | 不提供。只需执行一次的工作交给 jobs、队列或第三层 outbox；需要每个节点都执行的（例如清本地缓存），应避免这种设计，或由框架另行提供广播通道                                            |
| 6   | SQLite 的取键路径是否使用 `BEGIN IMMEDIATE`（原型修正第 9 条）                                      | 未实现。Knex 的 SQLite 事务固定发出 `BEGIN;`，需要驱动运行时新增钩子并替换事务类。分析表明多进程下不会取到错误的行键，只可能在锁升级时以 `SQLITE_BUSY` 失败；已写入正式文档的已知限制 |
| 7   | Repository 是否在 debug 日志中输出执行策略                                                          | 未实现；db 目前没有日志接口，先用 `explainRepositoryEvents()`                                                                                                                         |
| 8   | 其他方言是否声明 `insertManyReturning`                                                              | 先只在 SQLite 声明；PostgreSQL 等支持多行 RETURNING 的方言需在各自 CI 验证解码后再开启                                                                                                |
| 9   | 单字段主键的按键批量写是否改用 `IN` 列表以降低代价                                                  | 待评估；当前与已有批量写共用每批 200 个键的 OR 条件                                                                                                                                   |
