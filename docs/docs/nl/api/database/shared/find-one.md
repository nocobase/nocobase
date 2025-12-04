:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

**Type**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parameters**

De parameters zijn grotendeels hetzelfde als bij `find()`. Het verschil is dat `findOne()` slechts één gegeven retourneert, waardoor de `limit` parameter niet nodig is en de limiet tijdens de query altijd `1` is.