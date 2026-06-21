**Type**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parameters**

Most parameters are the same as `find()`. The difference is that `findOne()` only returns a single record, so the `limit` parameter is not needed, and is always `1` during the query.