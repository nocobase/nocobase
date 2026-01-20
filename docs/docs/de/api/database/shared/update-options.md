:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
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

## Details

- `values`: Das Datenobjekt für den zu aktualisierenden Datensatz.
- `filter`: Definiert die Filterbedingungen für die zu aktualisierenden Datensätze. Eine detaillierte Beschreibung der Filter-Nutzung finden Sie in der [`find()`](#find)-Methode.
- `filterByTk`: Definiert die Filterbedingungen für die zu aktualisierenden Datensätze anhand des TargetKey.
- `whitelist`: Eine Whitelist für die `values`-Felder. Nur die Felder, die in dieser Liste enthalten sind, werden geschrieben.
- `blacklist`: Eine Blacklist für die `values`-Felder. Felder, die in dieser Liste enthalten sind, werden nicht geschrieben.
- `transaction`: Das Transaktionsobjekt. Wenn kein Transaktionsparameter übergeben wird, erstellt die Methode automatisch eine interne Transaktion.

Mindestens einer von `filterByTk` oder `filter` muss übergeben werden.