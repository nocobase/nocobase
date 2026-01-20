:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
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

**Podrobnosti**

- `filter`: Specifikuje podmínky filtru pro záznamy, které mají být smazány. Podrobné použití filtru naleznete v metodě [`find()`](#find).
- `filterByTk`: Specifikuje podmínky filtru pro záznamy, které mají být smazány podle `TargetKey`.
- `truncate`: Zda vyprázdnit data tabulky. Toto je účinné pouze v případě, že nejsou zadány parametry `filter` nebo `filterByTk`.
- `transaction`: Objekt transakce. Pokud není předán žádný parametr transakce, metoda automaticky vytvoří interní transakci.