:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Type

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## Paramètres

La plupart des paramètres sont identiques à ceux de `find()`. La différence est que `findOne()` ne renvoie qu'une seule entrée, vous n'avez donc pas besoin du paramètre `limit`, et la limite est toujours de `1` lors de la requête.