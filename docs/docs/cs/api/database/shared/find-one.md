:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


**Typ**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parametry**

Většina parametrů je stejná jako u `find()`. Rozdíl spočívá v tom, že `findOne()` vrací pouze jeden záznam, proto není potřeba parametr `limit` a při dotazu je vždy `1`.