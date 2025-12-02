:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Operatori di Filtro

Utilizzati nel parametro `filter` delle API di un Repository, come `find`, `findOne`, `findAndCount` e `count`:

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

Per supportare la serializzazione JSON, NocoBase identifica gli operatori di query con una stringa prefissata da `$`.

Inoltre, NocoBase offre un'API per estendere gli operatori; per maggiori dettagli, consulti [`db.registerOperators()`](../database#registeroperators).

## Operatori Generali

### `$eq`

Verifica se il valore del campo è uguale al valore specificato. Equivalente a `=` di SQL.

**Esempio**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Equivalente a `title: '春秋'`.

### `$ne`

Verifica se il valore del campo è diverso dal valore specificato. Equivalente a `!=` di SQL.

**Esempio**

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

Verifica se il valore del campo corrisponde al valore specificato. Equivalente a `IS` di SQL.

**Esempio**

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

Verifica se il valore del campo non corrisponde al valore specificato. Equivalente a `IS NOT` di SQL.

**Esempio**

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

Verifica se il valore del campo è uguale al valore di un altro campo. Equivalente a `=` di SQL.

**Esempio**

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

Verifica se il valore del campo è presente nell'array specificato. Equivalente a `IN` di SQL.

**Esempio**

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

Verifica se il valore del campo non è presente nell'array specificato. Equivalente a `NOT IN` di SQL.

**Esempio**

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

Verifica se un campo generico è vuoto. Per un campo stringa, controlla se è una stringa vuota; per un campo array, controlla se è un array vuoto.

**Esempio**

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

Verifica se un campo generico non è vuoto. Per un campo stringa, controlla se non è una stringa vuota; per un campo array, controlla se non è un array vuoto.

**Esempio**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Operatori Logici

### `$and`

AND logico. Equivalente a `AND` di SQL.

**Esempio**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

OR logico. Equivalente a `OR` di SQL.

**Esempio**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operatori per Campi Booleani

Utilizzati per campi di tipo booleano `type: 'boolean'`.

### `$isFalsy`

Verifica se il valore di un campo booleano è "falsy". I valori `false`, `0` e `NULL` sono tutti considerati `$isFalsy: true`.

**Esempio**

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

Verifica se il valore di un campo booleano è "truthy". I valori `true` e `1` sono tutti considerati `$isTruly: true`.

**Esempio**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operatori per Campi Numerici

Utilizzati per campi numerici, inclusi:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Verifica se il valore del campo è maggiore del valore specificato. Equivalente a `>` di SQL.

**Esempio**

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

Verifica se il valore del campo è maggiore o uguale al valore specificato. Equivalente a `>=` di SQL.

**Esempio**

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

Verifica se il valore del campo è minore del valore specificato. Equivalente a `<` di SQL.

**Esempio**

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

Verifica se il valore del campo è minore o uguale al valore specificato. Equivalente a `<=` di SQL.

**Esempio**

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

Verifica se il valore del campo è compreso tra i due valori specificati. Equivalente a `BETWEEN` di SQL.

**Esempio**

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

Verifica se il valore del campo non è compreso tra i due valori specificati. Equivalente a `NOT BETWEEN` di SQL.

**Esempio**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operatori per Campi Stringa

Utilizzati per campi di tipo stringa, incluso `string`.

### `$includes`

Verifica se il campo stringa contiene la sottostringa specificata.

**Esempio**

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

Verifica se il campo stringa non contiene la sottostringa specificata.

**Esempio**

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

Verifica se il campo stringa inizia con la sottostringa specificata.

**Esempio**

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

Verifica se il campo stringa non inizia con la sottostringa specificata.

**Esempio**

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

Verifica se il campo stringa termina con la sottostringa specificata.

**Esempio**

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

Verifica se il campo stringa non termina con la sottostringa specificata.

**Esempio**

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

Verifica se il valore del campo contiene la stringa specificata. Equivalente a `LIKE` di SQL.

**Esempio**

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

Verifica se il valore del campo non contiene la stringa specificata. Equivalente a `NOT LIKE` di SQL.

**Esempio**

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

Verifica se il valore del campo contiene la stringa specificata, ignorando la distinzione tra maiuscole e minuscole. Equivalente a `ILIKE` di SQL (solo per PostgreSQL).

**Esempio**

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

Verifica se il valore del campo non contiene la stringa specificata, ignorando la distinzione tra maiuscole e minuscole. Equivalente a `NOT ILIKE` di SQL (solo per PostgreSQL).

**Esempio**

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

Verifica se il valore del campo corrisponde all'espressione regolare specificata. Equivalente a `REGEXP` di SQL (solo per PostgreSQL).

**Esempio**

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

Verifica se il valore del campo non corrisponde all'espressione regolare specificata. Equivalente a `NOT REGEXP` di SQL (solo per PostgreSQL).

**Esempio**

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

Verifica se il valore del campo corrisponde all'espressione regolare specificata, ignorando la distinzione tra maiuscole e minuscole. Equivalente a `~*` di SQL (solo per PostgreSQL).

**Esempio**

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

Verifica se il valore del campo non corrisponde all'espressione regolare specificata, ignorando la distinzione tra maiuscole e minuscole. Equivalente a `!~*` di SQL (solo per PostgreSQL).

**Esempio**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operatori per Campi Data

Utilizzati per campi di tipo data `type: 'date'`.

### `$dateOn`

Verifica se il campo data corrisponde a un giorno specifico.

**Esempio**

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

Verifica se il campo data non corrisponde a un giorno specifico.

**Esempio**

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

Verifica se il campo data è precedente a un valore specifico. Equivalente a essere minore del valore di data fornito.

**Esempio**

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

Verifica se il campo data non è precedente a un valore specifico. Equivalente a essere maggiore o uguale al valore di data fornito.

**Esempio**

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

Verifica se il campo data è successivo a un valore specifico. Equivalente a essere maggiore del valore di data fornito.

**Esempio**

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

Verifica se il campo data non è successivo a un valore specifico. Equivalente a essere minore o uguale al valore di data fornito.

**Esempio**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operatori per Campi Array

Utilizzati per campi di tipo array `type: 'array'`.

### `$match`

Verifica se il valore del campo array corrisponde ai valori nell'array specificato.

**Esempio**

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

Verifica se il valore del campo array non corrisponde ai valori nell'array specificato.

**Esempio**

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

Verifica se il valore del campo array contiene uno qualsiasi dei valori nell'array specificato.

**Esempio**

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

Verifica se il valore del campo array non contiene nessuno dei valori nell'array specificato.

**Esempio**

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

Verifica se il campo array è vuoto.

**Esempio**

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

Verifica se il campo array non è vuoto.

**Esempio**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operatori per Campi di Relazione

Utilizzati per verificare l'esistenza di una relazione. I tipi di campo includono:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Esistono dati di relazione.

**Esempio**

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

Non esistono dati di relazione.

**Esempio**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```