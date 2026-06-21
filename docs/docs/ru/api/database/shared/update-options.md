## Тип

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

## Подробности

- `values`: объект данных для обновляемой записи.
- `filter`: определяет условия фильтрации для обновляемых записей. Подробную информацию об использовании фильтра см. в методе [`find()`](#find).
- `filterByTk`: определяет условия фильтрации для записей, обновляемых TargetKey.
- `whitelist`: белый список для полей `values`. Будут записаны только поля из этого списка.
- `blacklist`: черный список для полей `values`. Поля в этом списке не будут записаны.
- `transaction`: объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.

Должен быть передан хотя бы один из `filterByTk` или `filter`.