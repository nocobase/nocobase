:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Filtrační operátory

Používají se v parametru `filter` u API, jako jsou `find`, `findOne`, `findAndCount`, `count` v rámci Repository:

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

Pro podporu serializace do JSON NocoBase identifikuje operátory dotazů řetězcem s předponou `$`.

NocoBase navíc poskytuje API pro rozšíření operátorů. Podrobnosti naleznete v [`db.registerOperators()`](../database#registeroperators).

## Obecné operátory

### `$eq`

Kontroluje, zda je hodnota pole rovna zadané hodnotě. Ekvivalent k SQL operátoru `=`.

**Příklad**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Ekvivalentní k `title: '春秋'`.

### `$ne`

Kontroluje, zda hodnota pole není rovna zadané hodnotě. Ekvivalent k SQL operátoru `!=`.

**Příklad**

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

Kontroluje, zda je hodnota pole zadanou hodnotou. Ekvivalent k SQL operátoru `IS`.

**Příklad**

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

Kontroluje, zda hodnota pole není zadanou hodnotou. Ekvivalent k SQL operátoru `IS NOT`.

**Příklad**

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

Kontroluje, zda je hodnota pole rovna hodnotě jiného pole. Ekvivalent k SQL operátoru `=`.

**Příklad**

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

Kontroluje, zda je hodnota pole obsažena v zadaném poli. Ekvivalent k SQL operátoru `IN`.

**Příklad**

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

Kontroluje, zda hodnota pole není obsažena v zadaném poli. Ekvivalent k SQL operátoru `NOT IN`.

**Příklad**

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

Kontroluje, zda je obecné pole prázdné. U pole typu string kontroluje, zda je prázdný řetězec. U pole typu array kontroluje, zda je prázdné pole.

**Příklad**

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

Kontroluje, zda obecné pole není prázdné. U pole typu string kontroluje, zda není prázdný řetězec. U pole typu array kontroluje, zda není prázdné pole.

**Příklad**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Logické operátory

### `$and`

Logické AND. Ekvivalent k SQL operátoru `AND`.

**Příklad**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logické OR. Ekvivalent k SQL operátoru `OR`.

**Příklad**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operátory pro pole typu boolean

Používá se pro pole typu boolean `type: 'boolean'`

### `$isFalsy`

Kontroluje, zda je hodnota pole typu boolean nepravdivá (falsy). Hodnoty pole `false`, `0` a `NULL` jsou považovány za `$isFalsy: true`.

**Příklad**

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

Kontroluje, zda je hodnota pole typu boolean pravdivá (truly). Hodnoty pole `true` a `1` jsou považovány za `$isTruly: true`.

**Příklad**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operátory pro číselná pole

Používá se pro číselná pole, včetně:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Kontroluje, zda je hodnota pole větší než zadaná hodnota. Ekvivalent k SQL operátoru `>`.

**Příklad**

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

Kontroluje, zda je hodnota pole větší nebo rovna zadané hodnotě. Ekvivalent k SQL operátoru `>=`.

**Příklad**

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

Kontroluje, zda je hodnota pole menší než zadaná hodnota. Ekvivalent k SQL operátoru `<`.

**Příklad**

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

Kontroluje, zda je hodnota pole menší nebo rovna zadané hodnotě. Ekvivalent k SQL operátoru `<=`.

**Příklad**

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

Kontroluje, zda je hodnota pole mezi dvěma zadanými hodnotami. Ekvivalent k SQL operátoru `BETWEEN`.

**Příklad**

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

Kontroluje, zda hodnota pole není mezi dvěma zadanými hodnotami. Ekvivalent k SQL operátoru `NOT BETWEEN`.

**Příklad**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operátory pro pole typu string

Používá se pro pole typu string, včetně `string`

### `$includes`

Kontroluje, zda pole typu string obsahuje zadaný podřetězec.

**Příklad**

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

Kontroluje, zda pole typu string neobsahuje zadaný podřetězec.

**Příklad**

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

Kontroluje, zda pole typu string začíná zadaným podřetězcem.

**Příklad**

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

Kontroluje, zda pole typu string nezačíná zadaným podřetězcem.

**Příklad**

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

Kontroluje, zda pole typu string končí zadaným podřetězcem.

**Příklad**

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

Kontroluje, zda pole typu string nekončí zadaným podřetězcem.

**Příklad**

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

Kontroluje, zda hodnota pole obsahuje zadaný řetězec. Ekvivalent k SQL operátoru `LIKE`.

**Příklad**

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

Kontroluje, zda hodnota pole neobsahuje zadaný řetězec. Ekvivalent k SQL operátoru `NOT LIKE`.

**Příklad**

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

Kontroluje, zda hodnota pole obsahuje zadaný řetězec, ignoruje velikost písmen. Ekvivalent k SQL operátoru `ILIKE` (pouze pro PostgreSQL).

**Příklad**

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

Kontroluje, zda hodnota pole neobsahuje zadaný řetězec, ignoruje velikost písmen. Ekvivalent k SQL operátoru `NOT ILIKE` (pouze pro PostgreSQL).

**Příklad**

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

Kontroluje, zda hodnota pole odpovídá zadanému regulárnímu výrazu. Ekvivalent k SQL operátoru `REGEXP` (pouze pro PostgreSQL).

**Příklad**

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

Kontroluje, zda hodnota pole neodpovídá zadanému regulárnímu výrazu. Ekvivalent k SQL operátoru `NOT REGEXP` (pouze pro PostgreSQL).

**Příklad**

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

Kontroluje, zda hodnota pole odpovídá zadanému regulárnímu výrazu, ignoruje velikost písmen. Ekvivalent k SQL operátoru `~*` (pouze pro PostgreSQL).

**Příklad**

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

Kontroluje, zda hodnota pole neodpovídá zadanému regulárnímu výrazu, ignoruje velikost písmen. Ekvivalent k SQL operátoru `!~*` (pouze pro PostgreSQL).

**Příklad**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operátory pro pole typu datum

Používá se pro pole typu datum `type: 'date'`

### `$dateOn`

Kontroluje, zda je pole typu datum v rámci konkrétního dne.

**Příklad**

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

Kontroluje, zda pole typu datum není v rámci konkrétního dne.

**Příklad**

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

Kontroluje, zda je pole typu datum před zadanou hodnotou. Ekvivalentní k tomu, že je menší než zadaná hodnota data.

**Příklad**

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

Kontroluje, zda pole typu datum není před zadanou hodnotou. Ekvivalentní k tomu, že je větší nebo rovno zadané hodnotě data.

**Příklad**

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

Kontroluje, zda je pole typu datum po zadané hodnotě. Ekvivalentní k tomu, že je větší než zadaná hodnota data.

**Příklad**

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

Kontroluje, zda pole typu datum není po zadané hodnotě. Ekvivalentní k tomu, že je menší nebo rovno zadané hodnotě data.

**Příklad**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operátory pro pole typu array

Používá se pro pole typu array `type: 'array'`

### `$match`

Kontroluje, zda hodnota pole typu array odpovídá hodnotám v zadaném poli.

**Příklad**

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

Kontroluje, zda hodnota pole typu array neodpovídá hodnotám v zadaném poli.

**Příklad**

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

Kontroluje, zda hodnota pole typu array obsahuje libovolnou ze zadaných hodnot.

**Příklad**

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

Kontroluje, zda hodnota pole typu array neobsahuje žádnou ze zadaných hodnot.

**Příklad**

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

Kontroluje, zda je pole typu array prázdné.

**Příklad**

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

Kontroluje, zda pole typu array není prázdné.

**Příklad**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operátory pro pole typu vztahů

Používá se ke kontrole existence vztahu. Typy polí zahrnují:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Data vztahu existují.

**Příklad**

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

Data vztahu neexistují.

**Příklad**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```