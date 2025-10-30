**类型**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**详细信息**

- `values`：要创建的记录的数据对象。
- `whitelist`：指定要创建的记录的数据对象中，哪些字段**可以被写入**。若不传入此参数，则默认允许所有字段写入。
- `blacklist`：指定要创建的记录的数据对象中，哪些字段**不允许被写入**。若不传入此参数，则默认允许所有字段写入。
- `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。
