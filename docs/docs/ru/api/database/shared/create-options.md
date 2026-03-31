:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

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

- `values`: Объект данных для создаваемой записи.
- `whitelist`: Указывает, какие поля в объекте данных создаваемой записи **могут быть записаны**. Если этот параметр не передан, по умолчанию разрешена запись во все поля.
- `blacklist`: Указывает, какие поля в объекте данных создаваемой записи **не могут быть записаны**. Если этот параметр не передан, по умолчанию разрешена запись во все поля.
- `transaction`: Объект транзакции. Если параметр транзакции не передан, этот метод автоматически создаст внутреннюю транзакцию.