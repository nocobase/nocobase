:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

**Typ**

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

**Szczegóły**

- `values`: Obiekt danych dla rekordu, który ma zostać zaktualizowany.
- `filter`: Określa warunki filtrowania dla rekordów, które mają zostać zaktualizowane. Szczegółowe informacje na temat użycia filtra znajdą Państwo w metodzie [`find()`](#find).
- `filterByTk`: Określa warunki filtrowania dla rekordów, które mają zostać zaktualizowane, używając `TargetKey`.
- `whitelist`: Biała lista pól `values`. Tylko pola znajdujące się na tej liście zostaną zapisane.
- `blacklist`: Czarna lista pól `values`. Pola znajdujące się na tej liście nie zostaną zapisane.
- `transaction`: Obiekt transakcji. Jeśli nie przekażą Państwo parametru transakcji, metoda automatycznie utworzy wewnętrzną transakcję.

Należy przekazać przynajmniej jeden z parametrów: `filterByTk` lub `filter`.