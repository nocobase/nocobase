:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Details**

- `filter`: Specificeert de filtercondities voor de te verwijderen records. Voor gedetailleerd gebruik van `Filter` verwijst u naar de [`find()`](#find) methode.
- `filterByTk`: Specificeert de filtercondities voor de te verwijderen records op basis van `TargetKey`.
- `truncate`: Geeft aan of de collectiegegevens moeten worden geleegd. Dit is alleen van kracht wanneer de parameters `filter` of `filterByTk` niet zijn opgegeven.
- `transaction`: Het transactieobject. Als er geen transactieparameter wordt meegegeven, creëert de methode automatisch een interne transactie.