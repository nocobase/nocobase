**类型**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**参数**

大部分参数与 `find()` 相同，不同之处在于 `findOne()` 只返回单条数据，所以不需要 `limit` 参数，且查询时始终为 `1`。
