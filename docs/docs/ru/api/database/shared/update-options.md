:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

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

- `values`: Объект данных для обновляемой записи.
- `filter`: Указывает условия фильтрации для обновляемых записей. Подробное использование `Filter` см. в методе [`find()`](#find).
- `filterByTk`: Указывает условия фильтрации для обновляемых записей по `TargetKey`.
- `whitelist`: Белый список для полей `values`. Будут записаны только поля, указанные в этом списке.
- `blacklist`: Черный список для полей `values`. Поля, указанные в этом списке, не будут записаны.
- `transaction`: Объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.

Необходимо передать хотя бы один из параметров: `filterByTk` или `filter`.