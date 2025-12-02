:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
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

**Details**

- `values`: Das Datenobjekt für den zu erstellenden Datensatz.
- `whitelist`: Gibt an, welche Felder im Datenobjekt des zu erstellenden Datensatzes **geschrieben werden dürfen**. Wird dieser Parameter nicht übergeben, sind standardmäßig alle Felder zum Schreiben zugelassen.
- `blacklist`: Gibt an, welche Felder im Datenobjekt des zu erstellenden Datensatzes **nicht geschrieben werden dürfen**. Wird dieser Parameter nicht übergeben, sind standardmäßig alle Felder zum Schreiben zugelassen.
- `transaction`: Das Transaktionsobjekt. Wird kein Transaktionsparameter übergeben, erstellt diese Methode automatisch eine interne Transaktion.