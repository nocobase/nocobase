:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Typ

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

## Detaljer

- `filter`: Anger filtervillkoren för de poster som ska tas bort. För detaljerad användning av Filter, se metoden [`find()`](#find).
- `filterByTk`: Anger filtervillkoren för de poster som ska tas bort med TargetKey.
- `truncate`: Om samlingsdata ska tömmas. Detta är endast effektivt när parametrarna `filter` eller `filterByTk` inte anges.
- `transaction`: Transaktionsobjekt. Om ingen transaktionsparameter skickas med, skapar metoden automatiskt en intern transaktion.