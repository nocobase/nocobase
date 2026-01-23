:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Filteroperatorer

Används i parametern `filter` för API:er som `find`, `findOne`, `findAndCount` och `count` i ett Repository:

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

För att stödja JSON-serialisering identifierar NocoBase frågeoperatorer med en sträng som har prefixet `$`.

Dessutom tillhandahåller NocoBase ett API för att utöka operatorer. Se [`db.registerOperators()`](../database#registeroperators) för mer information.

## Allmänna operatorer

### `$eq`

Kontrollerar om fältvärdet är lika med det angivna värdet. Motsvarar SQL:s `=`.

**Exempel**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Motsvarar `title: '春秋'`.

### `$ne`

Kontrollerar om fältvärdet inte är lika med det angivna värdet. Motsvarar SQL:s `!=`.

**Exempel**

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

Kontrollerar om fältvärdet är det angivna värdet. Motsvarar SQL:s `IS`.

**Exempel**

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

Kontrollerar om fältvärdet inte är det angivna värdet. Motsvarar SQL:s `IS NOT`.

**Exempel**

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

Kontrollerar om fältvärdet är lika med värdet av ett annat fält. Motsvarar SQL:s `=`.

**Exempel**

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

Kontrollerar om fältvärdet finns i den angivna arrayen. Motsvarar SQL:s `IN`.

**Exempel**

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

Kontrollerar om fältvärdet inte finns i den angivna arrayen. Motsvarar SQL:s `NOT IN`.

**Exempel**

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

Kontrollerar om ett allmänt fält är tomt. För ett strängfält kontrollerar det om strängen är tom, och för ett arrayfält kontrollerar det om arrayen är tom.

**Exempel**

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

Kontrollerar om ett allmänt fält inte är tomt. För ett strängfält kontrollerar det om strängen inte är tom, och för ett arrayfält kontrollerar det om arrayen inte är tom.

**Exempel**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Logiska operatorer

### `$and`

Logiskt AND. Motsvarar SQL:s `AND`.

**Exempel**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logiskt OR. Motsvarar SQL:s `OR`.

**Exempel**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operatorer för booleska fält

För booleska fält med `type: 'boolean'`

### `$isFalsy`

Kontrollerar om ett booleskt fältvärde är "falsy". Fältvärden som `false`, `0` och `NULL` betraktas alla som `$isFalsy: true`.

**Exempel**

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

Kontrollerar om ett booleskt fältvärde är "truthy". Fältvärden som `true` och `1` betraktas alla som `$isTruly: true`.

**Exempel**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operatorer för numeriska fält

För numeriska fält, inklusive:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Kontrollerar om fältvärdet är större än det angivna värdet. Motsvarar SQL:s `>`.

**Exempel**

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

Kontrollerar om fältvärdet är större än eller lika med det angivna värdet. Motsvarar SQL:s `>=`.

**Exempel**

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

Kontrollerar om fältvärdet är mindre än det angivna värdet. Motsvarar SQL:s `<`.

**Exempel**

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

Kontrollerar om fältvärdet är mindre än eller lika med det angivna värdet. Motsvarar SQL:s `<=`.

**Exempel**

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

Kontrollerar om fältvärdet ligger mellan de två angivna värdena. Motsvarar SQL:s `BETWEEN`.

**Exempel**

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

Kontrollerar om fältvärdet inte ligger mellan de två angivna värdena. Motsvarar SQL:s `NOT BETWEEN`.

**Exempel**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operatorer för strängfält

För strängfält, inklusive `string`

### `$includes`

Kontrollerar om strängfältet innehåller den angivna delsträngen.

**Exempel**

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

Kontrollerar om strängfältet inte innehåller den angivna delsträngen.

**Exempel**

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

Kontrollerar om strängfältet börjar med den angivna delsträngen.

**Exempel**

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

Kontrollerar om strängfältet inte börjar med den angivna delsträngen.

**Exempel**

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

Kontrollerar om strängfältet slutar med den angivna delsträngen.

**Exempel**

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

Kontrollerar om strängfältet inte slutar med den angivna delsträngen.

**Exempel**

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

Kontrollerar om fältvärdet innehåller den angivna strängen. Motsvarar SQL:s `LIKE`.

**Exempel**

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

Kontrollerar om fältvärdet inte innehåller den angivna strängen. Motsvarar SQL:s `NOT LIKE`.

**Exempel**

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

Kontrollerar om fältvärdet innehåller den angivna strängen, skiftlägesokänsligt. Motsvarar SQL:s `ILIKE` (endast för PostgreSQL).

**Exempel**

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

Kontrollerar om fältvärdet inte innehåller den angivna strängen, skiftlägesokänsligt. Motsvarar SQL:s `NOT ILIKE` (endast för PostgreSQL).

**Exempel**

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

Kontrollerar om fältvärdet matchar det angivna reguljära uttrycket. Motsvarar SQL:s `REGEXP` (endast för PostgreSQL).

**Exempel**

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

Kontrollerar om fältvärdet inte matchar det angivna reguljära uttrycket. Motsvarar SQL:s `NOT REGEXP` (endast för PostgreSQL).

**Exempel**

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

Kontrollerar om fältvärdet matchar det angivna reguljära uttrycket, skiftlägesokänsligt. Motsvarar SQL:s `~*` (endast för PostgreSQL).

**Exempel**

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

Kontrollerar om fältvärdet inte matchar det angivna reguljära uttrycket, skiftlägesokänsligt. Motsvarar SQL:s `!~*` (endast för PostgreSQL).

**Exempel**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operatorer för datumfält

För datumfält med `type: 'date'`

### `$dateOn`

Kontrollerar om datumfältet är på en specifik dag.

**Exempel**

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

Kontrollerar om datumfältet inte är på en specifik dag.

**Exempel**

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

Kontrollerar om datumfältet är före ett specifikt värde. Motsvarar att vara mindre än det angivna datumvärdet.

**Exempel**

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

Kontrollerar om datumfältet inte är före ett specifikt värde. Motsvarar att vara större än eller lika med det angivna datumvärdet.

**Exempel**

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

Kontrollerar om datumfältet är efter ett specifikt värde. Motsvarar att vara större än det angivna datumvärdet.

**Exempel**

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

Kontrollerar om datumfältet inte är efter ett specifikt värde. Motsvarar att vara mindre än eller lika med det angivna datumvärdet.

**Exempel**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operatorer för arrayfält

För arrayfält med `type: 'array'`

### `$match`

Kontrollerar om arrayfältets värde matchar värdena i den angivna arrayen.

**Exempel**

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

Kontrollerar om arrayfältets värde inte matchar värdena i den angivna arrayen.

**Exempel**

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

Kontrollerar om arrayfältets värde innehåller något av värdena i den angivna arrayen.

**Exempel**

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

Kontrollerar om arrayfältets värde inte innehåller något av värdena i den angivna arrayen.

**Exempel**

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

Kontrollerar om arrayfältet är tomt.

**Exempel**

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

Kontrollerar om arrayfältet inte är tomt.

**Exempel**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operatorer för relationsfält

Används för att kontrollera om en relation existerar. Fälttyper inkluderar:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Relationsdata existerar

**Exempel**

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

Ingen relationsdata existerar

**Exempel**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```