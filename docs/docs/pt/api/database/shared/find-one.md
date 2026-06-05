:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Tipo

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## Parâmetros

A maioria dos parâmetros são os mesmos de `find()`. A diferença é que `findOne()` retorna apenas um único registro, então o parâmetro `limit` não é necessário e é sempre `1` durante a consulta.