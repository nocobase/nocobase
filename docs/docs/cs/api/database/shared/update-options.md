:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Typ

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

## Podrobnosti

- `values`: Datový objekt záznamu, který chcete aktualizovat.
- `filter`: Určuje podmínky filtrování pro záznamy, které chcete aktualizovat. Podrobné použití `Filter` naleznete v metodě [`find()`](#find).
- `filterByTk`: Určuje podmínky filtrování pro záznamy, které chcete aktualizovat, a to pomocí `TargetKey`.
- `whitelist`: Seznam povolených polí pro `values`. Zapsána budou pouze pole uvedená v tomto seznamu.
- `blacklist`: Seznam zakázaných polí pro `values`. Pole uvedená v tomto seznamu nebudou zapsána.
- `transaction`: Objekt transakce. Pokud není předán žádný parametr transakce, metoda automaticky vytvoří interní transakci.

Musíte předat alespoň jeden z parametrů `filterByTk` nebo `filter`.