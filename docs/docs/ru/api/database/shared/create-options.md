**Тип**

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

**Подробности**

- `values`: объект данных для создаваемой записи.
- `whitelist`: указывает, в какие поля объекта данных создаваемой записи **может быть записана**. Если этот параметр не передан, по умолчанию разрешена запись во все поля.
- `blacklist`: указывает, в какие поля объекта данных создаваемой записи **не разрешена запись**. Если этот параметр не передан, по умолчанию разрешена запись во все поля.
- `transaction`: объект транзакции. Если параметр транзакции не передан, этот метод автоматически создаст внутреннюю транзакцию.