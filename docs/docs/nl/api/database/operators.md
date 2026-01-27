:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Filteroperatoren

Gebruikt in de `filter`-parameter van API's zoals `find`, `findOne`, `findAndCount` en `count` van een Repository:

```ts
const repository = db.getRepository('books');

repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Om JSON-serialisatie te ondersteunen, identificeert NocoBase query-operatoren met een string die begint met een `$`-voorvoegsel.

Daarnaast biedt NocoBase ook een API om operatoren uit te breiden. Zie [`db.registerOperators()`](../database#registeroperators) voor meer details.

## Algemene Operatoren

### `$eq`

Controleert of de veldwaarde gelijk is aan de opgegeven waarde. Dit komt overeen met SQL's `=`.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Gelijk aan `title: '春秋'`.

### `$ne`

Controleert of de veldwaarde *niet* gelijk is aan de opgegeven waarde. Dit komt overeen met SQL's `!=`.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $ne: '春秋',
    },
  },
});
```

### `$is`

Controleert of de veldwaarde de opgegeven waarde is. Dit komt overeen met SQL's `IS`.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $is: null,
    },
  },
});
```

### `$not`

Controleert of de veldwaarde *niet* de opgegeven waarde is. Dit komt overeen met SQL's `IS NOT`.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $not: null,
    },
  },
});
```

### `$col`

Controleert of de veldwaarde gelijk is aan de waarde van een ander veld. Dit komt overeen met SQL's `=`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $col: 'name',
    },
  },
});
```

### `$in`

Controleert of de veldwaarde zich in de opgegeven array bevindt. Dit komt overeen met SQL's `IN`.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $in: ['春秋', '战国'],
    },
  },
});
```

### `$notIn`

Controleert of de veldwaarde zich *niet* in de opgegeven array bevindt. Dit komt overeen met SQL's `NOT IN`.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notIn: ['春秋', '战国'],
    },
  },
});
```

### `$empty`

Controleert of een algemeen veld leeg is. Voor een stringveld controleert het op een lege string, en voor een arrayveld op een lege array.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $empty: true,
    },
  },
});
```

### `$notEmpty`

Controleert of een algemeen veld *niet* leeg is. Voor een stringveld controleert het op een niet-lege string, en voor een arrayveld op een niet-lege array.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Logische Operatoren

### `$and`

Logische AND. Dit komt overeen met SQL's `AND`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logische OR. Dit komt overeen met SQL's `OR`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operatoren voor Booleaanse Veldtypen

Voor booleaanse velden `type: 'boolean'`.

### `$isFalsy`

Controleert of een booleaanse veldwaarde 'falsy' is. Veldwaarden `false`, `0` en `NULL` worden allemaal als `$isFalsy: true` beschouwd.

**Voorbeeld**

```ts
repository.find({
  filter: {
    isPublished: {
      $isFalsy: true,
    },
  },
});
```

### `$isTruly`

Controleert of een booleaanse veldwaarde 'truly' is. Veldwaarden `true` en `1` worden allemaal als `$isTruly: true` beschouwd.

**Voorbeeld**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operatoren voor Numerieke Veldtypen

Voor numerieke velden, waaronder:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Controleert of de veldwaarde groter is dan de opgegeven waarde. Dit komt overeen met SQL's `>`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    price: {
      $gt: 100,
    },
  },
});
```

### `$gte`

Controleert of de veldwaarde groter is dan of gelijk is aan de opgegeven waarde. Dit komt overeen met SQL's `>=`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    price: {
      $gte: 100,
    },
  },
});
```

### `$lt`

Controleert of de veldwaarde kleiner is dan de opgegeven waarde. Dit komt overeen met SQL's `<`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    price: {
      $lt: 100,
    },
  },
});
```

### `$lte`

Controleert of de veldwaarde kleiner is dan of gelijk is aan de opgegeven waarde. Dit komt overeen met SQL's `<=`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    price: {
      $lte: 100,
    },
  },
});
```

### `$between`

Controleert of de veldwaarde tussen de twee opgegeven waarden ligt. Dit komt overeen met SQL's `BETWEEN`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    price: {
      $between: [100, 200],
    },
  },
});
```

### `$notBetween`

Controleert of de veldwaarde *niet* tussen de twee opgegeven waarden ligt. Dit komt overeen met SQL's `NOT BETWEEN`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operatoren voor String Veldtypen

Voor stringvelden, waaronder `string`.

### `$includes`

Controleert of het stringveld de opgegeven substring bevat.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $includes: '三字经',
    },
  },
});
```

### `$notIncludes`

Controleert of het stringveld de opgegeven substring *niet* bevat.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notIncludes: '三字经',
    },
  },
});
```

### `$startsWith`

Controleert of het stringveld begint met de opgegeven substring.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $startsWith: '三字经',
    },
  },
});
```

### `$notStatsWith`

Controleert of het stringveld *niet* begint met de opgegeven substring.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notStatsWith: '三字经',
    },
  },
});
```

### `$endsWith`

Controleert of het stringveld eindigt met de opgegeven substring.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $endsWith: '三字经',
    },
  },
});
```

### `$notEndsWith`

Controleert of het stringveld *niet* eindigt met de opgegeven substring.

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notEndsWith: '三字经',
    },
  },
});
```

### `$like`

Controleert of de veldwaarde de opgegeven string bevat. Dit komt overeen met SQL's `LIKE`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $like: '计算机',
    },
  },
});
```

### `$notLike`

Controleert of de veldwaarde de opgegeven string *niet* bevat. Dit komt overeen met SQL's `NOT LIKE`."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notLike: '计算机',
    },
  },
});
```

### `$iLike`

Controleert of de veldwaarde de opgegeven string bevat, hoofdletterongevoelig. Dit komt overeen met SQL's `ILIKE` (alleen PostgreSQL)."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $iLike: 'Computer',
    },
  },
});
```

### `$notILike`

Controleert of de veldwaarde de opgegeven string *niet* bevat, hoofdletterongevoelig. Dit komt overeen met SQL's `NOT ILIKE` (alleen PostgreSQL)."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notILike: 'Computer',
    },
  },
});
```

### `$regexp`

Controleert of de veldwaarde overeenkomt met de opgegeven reguliere expressie. Dit komt overeen met SQL's `REGEXP` (alleen PostgreSQL)."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $regexp: '^计算机',
    },
  },
});
```

### `$notRegexp`

Controleert of de veldwaarde *niet* overeenkomt met de opgegeven reguliere expressie. Dit komt overeen met SQL's `NOT REGEXP` (alleen PostgreSQL)."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notRegexp: '^计算机',
    },
  },
});
```

### `$iRegexp`

Controleert of de veldwaarde overeenkomt met de opgegeven reguliere expressie, hoofdletterongevoelig. Dit komt overeen met SQL's `~*` (alleen PostgreSQL)."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $iRegexp: '^COMPUTER',
    },
  },
});
```

### `$notIRegexp`

Controleert of de veldwaarde *niet* overeenkomt met de opgegeven reguliere expressie, hoofdletterongevoelig. Dit komt overeen met SQL's `!~*` (alleen PostgreSQL)."

**Voorbeeld**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operatoren voor Datum Veldtypen

Voor datumvelden `type: 'date'`.

### `$dateOn`

Controleert of het datumveld op een specifieke dag valt.

**Voorbeeld**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateOn: '2021-01-01',
    },
  },
});
```

### `$dateNotOn`

Controleert of het datumveld *niet* op een specifieke dag valt.

**Voorbeeld**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotOn: '2021-01-01',
    },
  },
});
```

### `$dateBefore`

Controleert of het datumveld vóór een specifieke waarde ligt. Dit komt overeen met kleiner dan de opgegeven datumwaarde.

**Voorbeeld**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateBefore: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

### `$dateNotBefore`

Controleert of het datumveld *niet* vóór een specifieke waarde ligt. Dit komt overeen met groter dan of gelijk aan de opgegeven datumwaarde.

**Voorbeeld**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotBefore: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

### `$dateAfter`

Controleert of het datumveld ná een specifieke waarde ligt. Dit komt overeen met groter dan de opgegeven datumwaarde.

**Voorbeeld**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

### `$dateNotAfter`

Controleert of het datumveld *niet* ná een specifieke waarde ligt. Dit komt overeen met kleiner dan of gelijk aan de opgegeven datumwaarde.

**Voorbeeld**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operatoren voor Array Veldtypen

Voor arrayvelden `type: 'array'`.

### `$match`

Controleert of de waarde van het arrayveld overeenkomt met de waarden in de opgegeven array.

**Voorbeeld**

```ts
repository.find({
  filter: {
    tags: {
      $match: ['文学', '历史'],
    },
  },
});
```

### `$notMatch`

Controleert of de waarde van het arrayveld *niet* overeenkomt met de waarden in de opgegeven array.

**Voorbeeld**

```ts
repository.find({
  filter: {
    tags: {
      $notMatch: ['文学', '历史'],
    },
  },
});
```

### `$anyOf`

Controleert of de waarde van het arrayveld *een van* de waarden in de opgegeven array bevat.

**Voorbeeld**

```ts
repository.find({
  filter: {
    tags: {
      $anyOf: ['文学', '历史'],
    },
  },
});
```

### `$noneOf`

Controleert of de waarde van het arrayveld *geen van* de waarden in de opgegeven array bevat.

**Voorbeeld**

```ts
repository.find({
  filter: {
    tags: {
      $noneOf: ['文学', '历史'],
    },
  },
});
```

### `$arrayEmpty`

Controleert of het arrayveld leeg is.

**Voorbeeld**

```ts
repository.find({
  filter: {
    tags: {
      $arrayEmpty: true,
    },
  },
});
```

### `$arrayNotEmpty`

Controleert of het arrayveld *niet* leeg is.

**Voorbeeld**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operatoren voor Relatie Veldtypen

Wordt gebruikt om te controleren of een relatie bestaat. Veldtypen omvatten:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Relatiegegevens bestaan.

**Voorbeeld**

```ts
repository.find({
  filter: {
    author: {
      $exists: true,
    },
  },
});
```

### `$notExists`

Relatiegegevens bestaan *niet*.

**Voorbeeld**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```