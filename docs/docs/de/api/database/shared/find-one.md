:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Typ

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## Parameter

Die meisten Parameter sind identisch mit `find()`. Der Unterschied besteht darin, dass `findOne()` nur einen einzelnen Datensatz zurückgibt, weshalb der `limit`-Parameter nicht benötigt wird und bei der Abfrage immer `1` ist.