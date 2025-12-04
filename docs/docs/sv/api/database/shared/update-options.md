:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
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

**Detaljer**

- `values`: Dataobjektet för posten som ska uppdateras.
- `filter`: Anger filtervillkoren för de poster som ska uppdateras. För detaljerad användning av Filter, se metoden [`find()`](#find).
- `filterByTk`: Anger filtervillkoren för de poster som ska uppdateras baserat på TargetKey.
- `whitelist`: En vitlista för `values`-fälten. Endast fält som finns med i denna lista kommer att skrivas.
- `blacklist`: En svartlista för `values`-fälten. Fält som finns med i denna lista kommer inte att skrivas.
- `transaction`: Transaktionsobjektet. Om ingen transaktionsparameter skickas in, skapar metoden automatiskt en intern transaktion.

Minst en av `filterByTk` eller `filter` måste skickas in.