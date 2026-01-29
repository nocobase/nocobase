# ctx.resource

当前区块绑定的数据资源对象（如表格数据源、详情数据源等）。常用于在 JSBlock / Action 中执行数据操作。

> 具体类型取决于区块类型，这里只给出常见能力的概念描述。

## 常见用途

- 通过 `ctx.runAction` 执行当前资源的 CRUD 操作
- 通过资源本身的方法（如 `setFilter`, `refresh` 等）控制数据加载

```ts
// 示例：执行删除动作
await ctx.runAction('destroy', {
  filterByTk: ctx.record?.id,
});
```
