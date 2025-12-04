:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

**Typ**

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

**Szczegóły**

- `values`: Obiekt danych dla tworzonego rekordu.
- `whitelist`: Określa, które pola w obiekcie danych tworzonego rekordu **mogą być zapisane**. Jeśli ten parametr nie zostanie przekazany, domyślnie wszystkie pola są dozwolone do zapisu.
- `blacklist`: Określa, które pola w obiekcie danych tworzonego rekordu **nie są dozwolone do zapisu**. Jeśli ten parametr nie zostanie przekazany, domyślnie wszystkie pola są dozwolone do zapisu.
- `transaction`: Obiekt transakcji. Jeśli nie zostanie przekazany żaden parametr transakcji, ta metoda automatycznie utworzy wewnętrzną transakcję.