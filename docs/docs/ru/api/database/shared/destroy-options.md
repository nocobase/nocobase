**Тип**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Подробности**

- `filter`: определяет условия фильтрации для удаляемых записей. Подробную информацию об использовании фильтра см. в методе [`find()`](#find).
- `filterByTk`: определяет условия фильтрации записей, которые будут удалены с помощью TargetKey.
- `truncate`: Усекать ли данные сбора. Это эффективно только в том случае, если параметры `filter` или `filterByTk` не указаны.
- `transaction`: объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.