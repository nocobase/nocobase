:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

**Type**

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

**Details**

- `values`: Het data-object voor de te updaten record.
- `filter`: Specificeert de filtercondities voor de te updaten records. Voor gedetailleerd gebruik van `Filter` kunt u de [`find()`](#find)-methode raadplegen.
- `filterByTk`: Specificeert de filtercondities voor de te updaten records op basis van de `TargetKey`.
- `whitelist`: Een witte lijst voor de `values`-velden. Alleen velden die op deze lijst staan, worden weggeschreven.
- `blacklist`: Een zwarte lijst voor de `values`-velden. Velden die op deze lijst staan, worden niet weggeschreven.
- `transaction`: Het transactieobject. Als er geen transactieparameter wordt meegegeven, maakt de methode automatisch een interne transactie aan.

Minimaal één van `filterByTk` of `filter` moet worden meegegeven.