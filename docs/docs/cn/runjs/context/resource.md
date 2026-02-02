# ctx.resource

当前区块绑定的数据资源对象（如表格资源、详情资源）。常用于在 JSBlock / Action 中执行数据操作。

> 具体类型因区块类型而异，此处仅描述常用能力。

## 常用场景

- 通过 `ctx.runAction` 对当前资源执行 CRUD
- 通过资源方法（如 `setFilter`、`refresh`）控制数据加载

```ts
// 示例：执行删除操作
await ctx.runAction('destroy', {
  filterByTk: ctx.record?.id,
});
```
