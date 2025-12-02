:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Tipo

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## Parametri

La maggior parte dei parametri sono gli stessi di `find()`. La differenza è che `findOne()` restituisce un solo record, quindi il parametro `limit` non è necessario ed è sempre `1` durante la query.