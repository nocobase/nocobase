**Typ**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parametry**

Większość parametrów jest taka sama jak w przypadku `find()`. Różnica polega na tym, że `findOne()` zwraca tylko jeden rekord, dlatego parametr `limit` nie jest potrzebny, a podczas zapytania zawsze wynosi `1`.