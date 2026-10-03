---
title: Database Transaction：事务与 Connection 传播
description: 使用 db.transaction() 或 connection.transaction() 原子执行操作，并保持事务 Connection 贯穿回调。
---

# Database Transaction：事务与 Connection 传播

`db.transaction()` 在一个连接事务中执行多个操作。事务回调里的 `connection` 表示当前事务连接。

```ts
await db.transaction(async (connection) => {
  await connection.builder.createCollection('payments', (collection) => {
    collection.increments('id');
    collection.string('orderNo');
    collection.decimal('amount', { precision: 12, scale: 2 });
    collection.string('status');
  });

  await connection.query
    .insertInto('payments')
    .values({
      orderNo: 'SO-001',
      amount: 99.5,
      status: 'paid',
    })
    .execute();
});
```

## 使用事务连接

事务内应使用回调参数里的 `connection`，不要回到外层 `db`：

```ts
await db.transaction(async (connection) => {
  await connection.query
    .insertInto('orders')
    .values({ status: 'paid' })
    .execute();
});
```

不要在事务回调里写：

```ts
await db.transaction(async () => {
  await db.query().insertInto('orders').values({ status: 'paid' }).execute();
});
```

这样会绕开当前事务连接。

## 命名连接事务

```ts
await db.transaction(async (connection) => {
  await connection.query
    .insertInto('events')
    .values({ name: 'checkout' })
    .execute();
}, 'analytics');
```

也可以先取 connection：

```ts
const analytics = db.connection('analytics');

await analytics.transaction(async (connection) => {
  await connection.query
    .insertInto('events')
    .values({ name: 'checkout' })
    .execute();
});
```

## 提交后再执行：afterCommit

推送 realtime 消息、清缓存、投递任务这类工作，只应在写入真正提交之后发生。直接写在事务回调里，后面的步骤失败回滚时它已经发出去了。用事务 Connection 的 `afterCommit` 登记：

```ts
await db.transaction(async (connection) => {
  await connection.repository('orders').createOne({ values: order });
  connection.afterCommit(() => ordersTopic.publish({ orderNo: order.orderNo }));
  await reserveInventory(connection, order);
});
```

| 情形                                  | `afterCommit` 回调               | `afterRollback` 回调               |
| ------------------------------------- | -------------------------------- | ---------------------------------- |
| 不在事务中调用                        | 立即开始执行，调用方不等待其完成 | 忽略                               |
| 最外层事务提交                        | 提交后按登记顺序逐个执行         | 不执行                             |
| 最外层事务回滚                        | 丢弃                             | 回滚后按登记顺序执行，收到原始错误 |
| 嵌套 `transaction()`（savepoint）成功 | 并入外层事务，等最外层提交后执行 | 并入外层事务                       |
| 嵌套 `transaction()` 回滚             | 丢弃                             | savepoint 回滚后立即执行           |
| 提交本身失败                          | 不执行                           | 执行                               |

- `transaction()` 在所有 `afterCommit` 回调执行完之后才 resolve，`await` 之后可以依赖副作用已经发生。回调应当很快；慢的工作交给 jobs。
- 回调抛错不改变事务结果，`transaction()` 也不会因此 reject。错误交给连接配置 `onTransactionCallbackError(error, phase)`；未配置时成为 code 为 `TRANSACTION_CALLBACK_FAILED` 的进程警告，原错误在警告的 `cause` 中。后续回调照常执行。
- 回调执行时事务 Connection 已经结束。回调里要写库，用外层的 `db` 或开新事务。事务结束后再在该事务 Connection 上登记回调会直接抛错，而不是悄悄丢弃。
- 执行回调之前，事务中的 Collection 元数据变更已经生效。
- 不在事务中调用时也能用，所以服务方法不必区分调用方是否开了事务：

```ts
async function publishOrder(
  connection: DatabaseConnection,
  orderNo: string,
): Promise<void> {
  await connection
    .repository('orders')
    .updateOne({ filter: { orderNo }, values: { status: 'published' } });
  connection.afterCommit(() => ordersTopic.publish({ orderNo }));
}

await publishOrder(db.connection(), 'SO-001'); // 写完立即推送
await db.transaction((connection) => publishOrder(connection, 'SO-001')); // 提交后推送
```

`afterRollback((error) => …)` 用于回滚后的记录与清理，不能挽回事务。Migration 与 Seed 的上下文不提供这两个方法。

`afterCommit` 需要在每个写入点登记。要集中观察“谁改了哪些表的哪些行”，包括嵌套关系写入改到的行，使用 [Repository 变更事件](../repository/events.md)。

## 使用注意事项

- transaction 内只使用回调里的 `connection`。
- 需要 Builder、Query 混合操作时，也应全部走同一个事务 connection。
- 如果事务抛错，底层 driver 应回滚事务。
- 测试事务行为时使用真实数据库集成测试。
- 事务内使用回调 Connection 的 `connection.repository('projects')`；不要复用事务外的 Repository。嵌套写入与 ifVersion 见 [Repository 事务](../repository/transactions.md)。
