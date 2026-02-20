**类型**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**详细信息**

- `filter`：指定要删除的记录的过滤条件。Filter 详细用法可参考 [`find()`](#find) 方法。
- `filterByTk`：按 TargetKey 指定要删除的记录的过滤条件。
- `truncate`: 是否清空表数据，在没有传入 `filter` 或 `filterByTk` 参数时有效。
- `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。
