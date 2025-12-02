:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
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

## Деталі

- `values`: Об'єкт даних для запису, який потрібно оновити.
- `filter`: Визначає умови фільтрації для записів, які потрібно оновити. Детальне використання `Filter` дивіться у методі [`find()`](#find).
- `filterByTk`: Визначає умови фільтрації для записів, які потрібно оновити, за допомогою `TargetKey`.
- `whitelist`: Білий список для полів `values`. Будуть записані лише поля, що входять до цього списку.
- `blacklist`: Чорний список для полів `values`. Поля, що входять до цього списку, не будуть записані.
- `transaction`: Об'єкт транзакції. Якщо параметр транзакції не передано, метод автоматично створить внутрішню транзакцію.

Необхідно передати принаймні один з параметрів: `filterByTk` або `filter`.