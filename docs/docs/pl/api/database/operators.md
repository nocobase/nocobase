:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Operatory Filtrowania

Używane w parametrze `filter` w API repozytorium, takich jak `find`, `findOne`, `findAndCount`, `count`:

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

Aby wspierać serializację do formatu JSON, NocoBase identyfikuje operatory zapytań za pomocą ciągu znaków poprzedzonego znakiem `$`.

Dodatkowo, NocoBase udostępnia API do rozszerzania operatorów. Szczegóły znajdą Państwo w [`db.registerOperators()`](../database#registeroperators).

## Operatory Ogólne

### `$eq`

Sprawdza, czy wartość pola jest równa określonej wartości. Odpowiednik SQL-owego `=`.

**Przykład**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Odpowiednik `title: '春秋'`.

### `$ne`

Sprawdza, czy wartość pola jest różna od określonej wartości. Odpowiednik SQL-owego `!=`.

**Przykład**

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

Sprawdza, czy wartość pola jest określoną wartością. Odpowiednik SQL-owego `IS`.

**Przykład**

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

Sprawdza, czy wartość pola nie jest określoną wartością. Odpowiednik SQL-owego `IS NOT`.

**Przykład**

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

Sprawdza, czy wartość pola jest równa wartości innego pola. Odpowiednik SQL-owego `=`.

**Przykład**

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

Sprawdza, czy wartość pola znajduje się w określonej tablicy. Odpowiednik SQL-owego `IN`.

**Przykład**

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

Sprawdza, czy wartość pola nie znajduje się w określonej tablicy. Odpowiednik SQL-owego `NOT IN`.

**Przykład**

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

Sprawdza, czy pole ogólnego typu jest puste. Dla pola typu tekstowego sprawdza, czy jest pustym ciągiem znaków. Dla pola typu tablicowego sprawdza, czy jest pustą tablicą.

**Przykład**

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

Sprawdza, czy pole ogólnego typu nie jest puste. Dla pola typu tekstowego sprawdza, czy nie jest pustym ciągiem znaków. Dla pola typu tablicowego sprawdza, czy nie jest pustą tablicą.

**Przykład**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Operatory Logiczne

### `$and`

Logiczne AND. Odpowiednik SQL-owego `AND`.

**Przykład**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logiczne OR. Odpowiednik SQL-owego `OR`.

**Przykład**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operatory dla Pól Typu Boolean

Dla pól typu boolean `type: 'boolean'`

### `$isFalsy`

Sprawdza, czy wartość pola typu boolean jest fałszywa. Wartości pola boolean takie jak `false`, `0` i `NULL` są traktowane jako `$isFalsy: true`.

**Przykład**

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

Sprawdza, czy wartość pola typu boolean jest prawdziwa. Wartości pola boolean takie jak `true` i `1` są traktowane jako `$isTruly: true`.

**Przykład**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operatory dla Pól Typu Liczbowego

Dla pól typu liczbowego, w tym:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Sprawdza, czy wartość pola jest większa od określonej wartości. Odpowiednik SQL-owego `>`.

**Przykład**

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

Sprawdza, czy wartość pola jest większa lub równa określonej wartości. Odpowiednik SQL-owego `>=`.

**Przykład**

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

Sprawdza, czy wartość pola jest mniejsza od określonej wartości. Odpowiednik SQL-owego `<`."

**Przykład**

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

Sprawdza, czy wartość pola jest mniejsza lub równa określonej wartości. Odpowiednik SQL-owego `<=`.

**Przykład**

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

Sprawdza, czy wartość pola znajduje się między dwiema określonymi wartościami. Odpowiednik SQL-owego `BETWEEN`.

**Przykład**

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

Sprawdza, czy wartość pola nie znajduje się między dwiema określonymi wartościami. Odpowiednik SQL-owego `NOT BETWEEN`.

**Przykład**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operatory dla Pól Typu Tekstowego

Dla pól typu tekstowego, w tym `string`

### `$includes`

Sprawdza, czy pole typu tekstowego zawiera określony podciąg znaków.

**Przykład**

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

Sprawdza, czy pole typu tekstowego nie zawiera określonego podciągu znaków.

**Przykład**

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

Sprawdza, czy pole typu tekstowego zaczyna się od określonego podciągu znaków.

**Przykład**

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

Sprawdza, czy pole typu tekstowego nie zaczyna się od określonego podciągu znaków.

**Przykład**

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

Sprawdza, czy pole typu tekstowego kończy się na określony podciąg znaków.

**Przykład**

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

Sprawdza, czy pole typu tekstowego nie kończy się na określony podciąg znaków.

**Przykład**

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

Sprawdza, czy wartość pola zawiera określony ciąg znaków. Odpowiednik SQL-owego `LIKE`.

**Przykład**

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

Sprawdza, czy wartość pola nie zawiera określonego ciągu znaków. Odpowiednik SQL-owego `NOT LIKE`.

**Przykład**

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

Sprawdza, czy wartość pola zawiera określony ciąg znaków, ignorując wielkość liter. Odpowiednik SQL-owego `ILIKE` (tylko dla PostgreSQL).

**Przykład**

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

Sprawdza, czy wartość pola nie zawiera określonego ciągu znaków, ignorując wielkość liter. Odpowiednik SQL-owego `NOT ILIKE` (tylko dla PostgreSQL).

**Przykład**

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

Sprawdza, czy wartość pola pasuje do określonego wyrażenia regularnego. Odpowiednik SQL-owego `REGEXP` (tylko dla PostgreSQL).

**Przykład**

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

Sprawdza, czy wartość pola nie pasuje do określonego wyrażenia regularnego. Odpowiednik SQL-owego `NOT REGEXP` (tylko dla PostgreSQL).

**Przykład**

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

Sprawdza, czy wartość pola pasuje do określonego wyrażenia regularnego, ignorując wielkość liter. Odpowiednik SQL-owego `~*` (tylko dla PostgreSQL).

**Przykład**

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

Sprawdza, czy wartość pola nie pasuje do określonego wyrażenia regularnego, ignorując wielkość liter. Odpowiednik SQL-owego `!~*` (tylko dla PostgreSQL).

**Przykład**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operatory dla Pól Typu Daty

Dla pól typu daty `type: 'date'`

### `$dateOn`

Sprawdza, czy pole daty przypada na określony dzień.

**Przykład**

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

Sprawdza, czy pole daty nie przypada na określony dzień.

**Przykład**

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

Sprawdza, czy pole daty jest przed określoną wartością. Odpowiednik wartości mniejszej niż podana data.

**Przykład**

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

Sprawdza, czy pole daty nie jest przed określoną wartością. Odpowiednik wartości większej lub równej podanej dacie.

**Przykład**

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

Sprawdza, czy pole daty jest po określonej wartości. Odpowiednik wartości większej niż podana data.

**Przykład**

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

Sprawdza, czy pole daty nie jest po określonej wartości. Odpowiednik wartości mniejszej lub równej podanej dacie.

**Przykład**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operatory dla Pól Typu Tablicowego

Dla pól typu tablicowego `type: 'array'`

### `$match`

Sprawdza, czy wartość pola tablicowego pasuje do wartości z określonej tablicy.

**Przykład**

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

Sprawdza, czy wartość pola tablicowego nie pasuje do wartości z określonej tablicy.

**Przykład**

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

Sprawdza, czy wartość pola tablicowego zawiera dowolną z wartości z określonej tablicy.

**Przykład**

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

Sprawdza, czy wartość pola tablicowego nie zawiera żadnej z wartości z określonej tablicy.

**Przykład**

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

Sprawdza, czy pole tablicowe jest puste.

**Przykład**

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

Sprawdza, czy pole tablicowe nie jest puste.

**Przykład**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operatory dla Pól Relacyjnych

Używane do sprawdzania istnienia relacji. Typy pól obejmują:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Istnieją dane relacji.

**Przykład**

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

Brak danych relacji.

**Przykład**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```