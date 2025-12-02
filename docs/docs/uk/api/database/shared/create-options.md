:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


## Тип

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

## Деталі

- `values`: Об'єкт даних для запису, який потрібно створити.
- `whitelist`: Вказує, які поля в об'єкті даних запису, що створюється, **можна записувати**. Якщо цей параметр не передано, за замовчуванням дозволяється записувати всі поля.
- `blacklist`: Вказує, які поля в об'єкті даних запису, що створюється, **не можна записувати**. Якщо цей параметр не передано, за замовчуванням дозволяється записувати всі поля.
- `transaction`: Об'єкт транзакції. Якщо параметр транзакції не передано, цей метод автоматично створить внутрішню транзакцію.