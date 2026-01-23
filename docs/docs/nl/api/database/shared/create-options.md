:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

**Type**

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

**Details**

- `values`: Het data-object voor de aan te maken record.
- `whitelist`: Specificeert welke velden in het data-object van de aan te maken record **mogen worden weggeschreven**. Als u deze parameter niet meegeeft, zijn standaard alle velden toegestaan om te worden weggeschreven.
- `blacklist`: Specificeert welke velden in het data-object van de aan te maken record **niet mogen worden weggeschreven**. Als u deze parameter niet meegeeft, zijn standaard alle velden toegestaan om te worden weggeschreven.
- `transaction`: Het transactie-object. Als er geen transactieparameter wordt meegegeven, zal deze methode automatisch een interne transactie aanmaken.