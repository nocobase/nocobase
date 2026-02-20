**类型**

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**详细信息**

- `values`：要更新的记录的数据对象。
- `filter`：指定要更新的记录的过滤条件, Filter 详细用法可参考 [`find()`](#find) 方法。
- `filterByTk`：按 TargetKey 指定要更新的记录的过滤条件。
- `whitelist`: `values` 字段的白名单，只有名单内的字段会被写入。
- `blacklist`: `values` 字段的黑名单，名单内的字段不会被写入。
- `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

`filterByTk` 与 `filter` 至少要传其一。
