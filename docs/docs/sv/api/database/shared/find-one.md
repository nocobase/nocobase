:::tip AI-översättningsmeddelande
Denna dokumentation har översatts automatiskt av AI.
:::


**Typ**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parametrar**

De flesta parametrar är desamma som för `find()`. Skillnaden är att `findOne()` endast returnerar en enskild post, så `limit`-parametern behövs inte och är alltid `1` vid en fråga.