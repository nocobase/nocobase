:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

**Tipo**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parámetros**

La mayoría de los parámetros son los mismos que en `find()`. La diferencia es que `findOne()` solo devuelve un único registro, por lo que no necesita el parámetro `limit`, ya que la consulta siempre opera con un límite de `1`.