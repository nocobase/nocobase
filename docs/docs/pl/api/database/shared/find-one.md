:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

**Typ**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parametry**

Większość parametrów jest taka sama jak w przypadku `find()`. Różnica polega na tym, że `findOne()` zwraca tylko jeden rekord, dlatego parametr `limit` nie jest potrzebny, a podczas zapytania zawsze wynosi `1`.