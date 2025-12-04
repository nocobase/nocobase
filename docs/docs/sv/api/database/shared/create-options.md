:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
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

**Detaljer**

- `values`: Dataobjektet för den post som ska skapas.
- `whitelist`: Anger vilka fält i dataobjektet för den post som ska skapas som **får skrivas till**. Om ni inte skickar med denna parameter, tillåts alla fält att skrivas till som standard.
- `blacklist`: Anger vilka fält i dataobjektet för den post som ska skapas som **inte får skrivas till**. Om ni inte skickar med denna parameter, tillåts alla fält att skrivas till som standard.
- `transaction`: Transaktionsobjektet. Om ingen transaktionsparameter skickas med, kommer denna metod automatiskt att skapa en intern transaktion.