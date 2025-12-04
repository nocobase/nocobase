:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

**Typ**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Szczegóły**

- `filter`: Określa warunki filtrowania dla rekordów, które mają zostać usunięte. Szczegółowe informacje na temat użycia filtra znajdą Państwo w metodzie [`find()`](#find).
- `filterByTk`: Określa warunki filtrowania dla rekordów, które mają zostać usunięte według TargetKey.
- `truncate`: Wskazuje, czy należy wyczyścić dane kolekcji. Parametr ten jest skuteczny tylko wtedy, gdy nie zostaną przekazane parametry `filter` lub `filterByTk`.
- `transaction`: Obiekt transakcji. Jeśli nie zostanie przekazany żaden parametr transakcji, metoda automatycznie utworzy wewnętrzną transakcję.