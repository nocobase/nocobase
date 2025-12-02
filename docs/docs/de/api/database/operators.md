:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Filter-Operatoren

Diese Operatoren werden im `filter`-Parameter von Repository-APIs wie `find`, `findOne`, `findAndCount` und `count` verwendet:

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

Um die JSON-Serialisierung zu unterstützen, kennzeichnet NocoBase Abfrage-Operatoren mit einem String, der mit einem Dollarzeichen (`$`) beginnt.

Zusätzlich bietet NocoBase eine API zur Erweiterung von Operatoren an. Weitere Details finden Sie unter [`db.registerOperators()`](../database#registeroperators).

## Allgemeine Operatoren

### `$eq`

Prüft, ob der Feldwert dem angegebenen Wert entspricht. Dies entspricht dem SQL-Operator `=`:`

**Beispiel**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Dies ist gleichbedeutend mit `title: '春秋'`.

### `$ne`

Prüft, ob der Feldwert nicht dem angegebenen Wert entspricht. Dies entspricht dem SQL-Operator `!=`:`

**Beispiel**

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

Prüft, ob der Feldwert dem angegebenen Wert entspricht. Dies entspricht dem SQL-Operator `IS`:`

**Beispiel**

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

Prüft, ob der Feldwert nicht dem angegebenen Wert entspricht. Dies entspricht dem SQL-Operator `IS NOT`:`

**Beispiel**

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

Prüft, ob der Feldwert dem Wert eines anderen Feldes entspricht. Dies entspricht dem SQL-Operator `=`:`

**Beispiel**

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

Prüft, ob der Feldwert in dem angegebenen Array enthalten ist. Dies entspricht dem SQL-Operator `IN`:`

**Beispiel**

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

Prüft, ob der Feldwert nicht in dem angegebenen Array enthalten ist. Dies entspricht dem SQL-Operator `NOT IN`:`

**Beispiel**

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

Prüft, ob ein Feld leer ist. Bei einem String-Feld wird geprüft, ob es sich um einen leeren String handelt. Bei einem Array-Feld wird geprüft, ob es sich um ein leeres Array handelt.

**Beispiel**

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

Prüft, ob ein Feld nicht leer ist. Bei einem String-Feld wird geprüft, ob es sich um einen nicht leeren String handelt. Bei einem Array-Feld wird geprüft, ob es sich um ein nicht leeres Array handelt.

**Beispiel**

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

Logisches UND. Dies entspricht dem SQL-Operator `AND`:`

**Beispiel**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logisches ODER. Dies entspricht dem SQL-Operator `OR`:`

**Beispiel**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operatoren für Boolesche Felder

Für Boolesche Felder mit `type: 'boolean'`:`

### `$isFalsy`

Prüft, ob der Wert eines Booleschen Feldes "falsy" ist. Feldwerte wie `false`, `0` und `NULL` werden alle als `$isFalsy: true` bewertet.

**Beispiel**

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

Prüft, ob der Wert eines Booleschen Feldes "truthy" ist. Feldwerte wie `true` und `1` werden alle als `$isTruly: true` bewertet.

**Beispiel**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operatoren für numerische Felder

Für numerische Felder, einschließlich:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Prüft, ob der Feldwert größer als der angegebene Wert ist. Dies entspricht dem SQL-Operator `>`:`

**Beispiel**

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

Prüft, ob der Feldwert größer oder gleich dem angegebenen Wert ist. Dies entspricht dem SQL-Operator `>=`:`

**Beispiel**

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

Prüft, ob der Feldwert kleiner als der angegebene Wert ist. Dies entspricht dem SQL-Operator `<`:`

**Beispiel**

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

Prüft, ob der Feldwert kleiner oder gleich dem angegebenen Wert ist. Dies entspricht dem SQL-Operator `<=`:`

**Beispiel**

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

Prüft, ob der Feldwert zwischen den beiden angegebenen Werten liegt. Dies entspricht dem SQL-Operator `BETWEEN`:`

**Beispiel**

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

Prüft, ob der Feldwert nicht zwischen den beiden angegebenen Werten liegt. Dies entspricht dem SQL-Operator `NOT BETWEEN`:`

**Beispiel**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operatoren für String-Felder

Für String-Felder, einschließlich `string`:`

### `$includes`

Prüft, ob das String-Feld die angegebene Teilzeichenkette enthält.

**Beispiel**

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

Prüft, ob das String-Feld die angegebene Teilzeichenkette nicht enthält.

**Beispiel**

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

Prüft, ob das String-Feld mit der angegebenen Teilzeichenkette beginnt.

**Beispiel**

```ts
repository.find({
  filter: {
    title: {
      $startsWith: '三字经',
    },
  },
});
```

### `$notStartsWith`

Prüft, ob das String-Feld nicht mit der angegebenen Teilzeichenkette beginnt.

**Beispiel**

```ts
repository.find({
  filter: {
    title: {
      $notStartsWith: '三字经',
    },
  },
});
```

### `$endsWith`

Prüft, ob das String-Feld mit der angegebenen Teilzeichenkette endet.

**Beispiel**

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

Prüft, ob das String-Feld nicht mit der angegebenen Teilzeichenkette endet.

**Beispiel**

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

Prüft, ob der Feldwert den angegebenen String enthält. Dies entspricht dem SQL-Operator `LIKE`:`

**Beispiel**

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

Prüft, ob der Feldwert den angegebenen String nicht enthält. Dies entspricht dem SQL-Operator `NOT LIKE`:`

**Beispiel**

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

Prüft, ob der Feldwert den angegebenen String enthält, wobei die Groß-/Kleinschreibung ignoriert wird. Dies entspricht dem SQL-Operator `ILIKE` (nur für PostgreSQL anwendbar):`

**Beispiel**

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

Prüft, ob der Feldwert den angegebenen String nicht enthält, wobei die Groß-/Kleinschreibung ignoriert wird. Dies entspricht dem SQL-Operator `NOT ILIKE` (nur für PostgreSQL anwendbar):`

**Beispiel**

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

Prüft, ob der Feldwert dem angegebenen regulären Ausdruck entspricht. Dies entspricht dem SQL-Operator `REGEXP` (nur für PostgreSQL anwendbar):`

**Beispiel**

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

Prüft, ob der Feldwert nicht dem angegebenen regulären Ausdruck entspricht. Dies entspricht dem SQL-Operator `NOT REGEXP` (nur für PostgreSQL anwendbar):`

**Beispiel**

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

Prüft, ob der Feldwert dem angegebenen regulären Ausdruck entspricht, wobei die Groß-/Kleinschreibung ignoriert wird. Dies entspricht dem SQL-Operator `~*` (nur für PostgreSQL anwendbar):`

**Beispiel**

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

Prüft, ob der Feldwert nicht dem angegebenen regulären Ausdruck entspricht, wobei die Groß-/Kleinschreibung ignoriert wird. Dies entspricht dem SQL-Operator `!~*` (nur für PostgreSQL anwendbar):`

**Beispiel**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operatoren für Datumsfelder

Für Datumsfelder mit `type: 'date'`:`

### `$dateOn`

Prüft, ob das Datumsfeld an einem bestimmten Tag liegt.

**Beispiel**

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

Prüft, ob das Datumsfeld nicht an einem bestimmten Tag liegt.

**Beispiel**

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

Prüft, ob das Datumsfeld vor einem bestimmten Wert liegt. Dies entspricht der Bedingung, dass der Wert kleiner als der angegebene Datumswert ist.

**Beispiel**

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

Prüft, ob das Datumsfeld nicht vor einem bestimmten Wert liegt. Dies entspricht der Bedingung, dass der Wert größer oder gleich dem angegebenen Datumswert ist.

**Beispiel**

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

Prüft, ob das Datumsfeld nach einem bestimmten Wert liegt. Dies entspricht der Bedingung, dass der Wert größer als der angegebene Datumswert ist.

**Beispiel**

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

Prüft, ob das Datumsfeld nicht nach einem bestimmten Wert liegt. Dies entspricht der Bedingung, dass der Wert kleiner oder gleich dem angegebenen Datumswert ist.

**Beispiel**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operatoren für Array-Felder

Für Array-Felder mit `type: 'array'`:`

### `$match`

Prüft, ob der Wert des Array-Feldes mit den Werten im angegebenen Array übereinstimmt.

**Beispiel**

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

Prüft, ob der Wert des Array-Feldes nicht mit den Werten im angegebenen Array übereinstimmt.

**Beispiel**

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

Prüft, ob der Wert des Array-Feldes einen der Werte im angegebenen Array enthält.

**Beispiel**

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

Prüft, ob der Wert des Array-Feldes keinen der Werte im angegebenen Array enthält.

**Beispiel**

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

Prüft, ob das Array-Feld leer ist.

**Beispiel**

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

Prüft, ob das Array-Feld nicht leer ist.

**Beispiel**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operatoren für Beziehungsfelder

Diese Operatoren werden verwendet, um zu prüfen, ob eine Beziehung existiert. Die Feldtypen umfassen:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Prüft, ob Beziehungsdaten vorhanden sind.

**Beispiel**

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

Prüft, ob keine Beziehungsdaten vorhanden sind.

**Beispiel**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```