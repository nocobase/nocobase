:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Opérateurs de filtre

Ces opérateurs sont utilisés dans le paramètre `filter` des API de Repository comme `find`, `findOne`, `findAndCount` et `count` :

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

Pour faciliter la sérialisation JSON, NocoBase identifie les opérateurs de requête par une chaîne de caractères préfixée par `$`.

De plus, NocoBase propose une API pour étendre ces opérateurs. Pour en savoir plus, consultez [`db.registerOperators()`](../database#registeroperators).

## Opérateurs généraux

### `$eq`

Vérifie si la valeur du champ est égale à la valeur spécifiée. Équivalent à l'opérateur SQL `=`.

**Exemple**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Ceci est équivalent à `title: '春秋'`.

### `$ne`

Vérifie si la valeur du champ est différente de la valeur spécifiée. Équivalent à l'opérateur SQL `!=`.

**Exemple**

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

Vérifie si la valeur du champ est la valeur spécifiée. Équivalent à l'opérateur SQL `IS`.

**Exemple**

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

Vérifie si la valeur du champ n'est pas la valeur spécifiée. Équivalent à l'opérateur SQL `IS NOT`.

**Exemple**

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

Vérifie si la valeur du champ est égale à la valeur d'un autre champ. Équivalent à l'opérateur SQL `=`.

**Exemple**

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

Vérifie si la valeur du champ est présente dans le tableau spécifié. Équivalent à l'opérateur SQL `IN`.

**Exemple**

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

Vérifie si la valeur du champ n'est pas présente dans le tableau spécifié. Équivalent à l'opérateur SQL `NOT IN`.

**Exemple**

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

Vérifie si un champ est vide. Pour un champ de type chaîne de caractères, il vérifie si la chaîne est vide. Pour un champ de type tableau, il vérifie si le tableau est vide.

**Exemple**

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

Vérifie si un champ n'est pas vide. Pour un champ de type chaîne de caractères, il vérifie si la chaîne n'est pas vide. Pour un champ de type tableau, il vérifie si le tableau n'est pas vide.

**Exemple**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Opérateurs logiques

### `$and`

Opérateur logique ET. Équivalent à l'opérateur SQL `AND`.

**Exemple**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Opérateur logique OU. Équivalent à l'opérateur SQL `OR`.

**Exemple**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Opérateurs pour les champs booléens

Pour les champs de type booléen (`type: 'boolean'`)

### `$isFalsy`

Vérifie si la valeur d'un champ booléen est fausse (falsy). Les valeurs de champ `false`, `0` et `NULL` sont toutes considérées comme `$isFalsy: true`.

**Exemple**

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

Vérifie si la valeur d'un champ booléen est vraie (truthy). Les valeurs de champ `true` et `1` sont toutes considérées comme `$isTruly: true`.

**Exemple**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Opérateurs pour les champs numériques

Pour les champs numériques, incluant :

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Vérifie si la valeur du champ est strictement supérieure à la valeur spécifiée. Équivalent à l'opérateur SQL `>`.

**Exemple**

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

Vérifie si la valeur du champ est supérieure ou égale à la valeur spécifiée. Équivalent à l'opérateur SQL `>=`.

**Exemple**

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

Vérifie si la valeur du champ est strictement inférieure à la valeur spécifiée. Équivalent à l'opérateur SQL `<`.

**Exemple**

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

Vérifie si la valeur du champ est inférieure ou égale à la valeur spécifiée. Équivalent à l'opérateur SQL `<=`.

**Exemple**

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

Vérifie si la valeur du champ se situe entre les deux valeurs spécifiées. Équivalent à l'opérateur SQL `BETWEEN`.

**Exemple**

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

Vérifie si la valeur du champ ne se situe pas entre les deux valeurs spécifiées. Équivalent à l'opérateur SQL `NOT BETWEEN`.

**Exemple**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Opérateurs pour les champs de type chaîne de caractères

Pour les champs de type chaîne de caractères, incluant `string`

### `$includes`

Vérifie si le champ de type chaîne de caractères contient la sous-chaîne spécifiée.

**Exemple**

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

Vérifie si le champ de type chaîne de caractères ne contient pas la sous-chaîne spécifiée.

**Exemple**

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

Vérifie si le champ de type chaîne de caractères commence par la sous-chaîne spécifiée.

**Exemple**

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

Vérifie si le champ de type chaîne de caractères ne commence pas par la sous-chaîne spécifiée.

**Exemple**

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

Vérifie si le champ de type chaîne de caractères se termine par la sous-chaîne spécifiée.

**Exemple**

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

Vérifie si le champ de type chaîne de caractères ne se termine pas par la sous-chaîne spécifiée.

**Exemple**

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

Vérifie si la valeur du champ contient la chaîne de caractères spécifiée. Équivalent à l'opérateur SQL `LIKE`.

**Exemple**

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

Vérifie si la valeur du champ ne contient pas la chaîne de caractères spécifiée. Équivalent à l'opérateur SQL `NOT LIKE`.

**Exemple**

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

Vérifie si la valeur du champ contient la chaîne de caractères spécifiée, sans tenir compte de la casse. Équivalent à l'opérateur SQL `ILIKE` (PostgreSQL uniquement).

**Exemple**

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

Vérifie si la valeur du champ ne contient pas la chaîne de caractères spécifiée, sans tenir compte de la casse. Équivalent à l'opérateur SQL `NOT ILIKE` (PostgreSQL uniquement).

**Exemple**

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

Vérifie si la valeur du champ correspond à l'expression régulière spécifiée. Équivalent à l'opérateur SQL `REGEXP` (PostgreSQL uniquement).

**Exemple**

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

Vérifie si la valeur du champ ne correspond pas à l'expression régulière spécifiée. Équivalent à l'opérateur SQL `NOT REGEXP` (PostgreSQL uniquement).

**Exemple**

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

Vérifie si la valeur du champ correspond à l'expression régulière spécifiée, sans tenir compte de la casse. Équivalent à l'opérateur SQL `~*` (PostgreSQL uniquement).

**Exemple**

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

Vérifie si la valeur du champ ne correspond pas à l'expression régulière spécifiée, sans tenir compte de la casse. Équivalent à l'opérateur SQL `!~*` (PostgreSQL uniquement).

**Exemple**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Opérateurs pour les champs de type date

Pour les champs de type date (`type: 'date'`)

### `$dateOn`

Vérifie si le champ de type date correspond à un jour spécifique.

**Exemple**

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

Vérifie si le champ de type date ne correspond pas à un jour spécifique.

**Exemple**

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

Vérifie si le champ de type date est antérieur à une valeur spécifique. Équivalent à une valeur inférieure à la date fournie.

**Exemple**

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

Vérifie si le champ de type date n'est pas antérieur à une valeur spécifique. Équivalent à une valeur supérieure ou égale à la date fournie.

**Exemple**

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

Vérifie si le champ de type date est postérieur à une valeur spécifique. Équivalent à une valeur supérieure à la date fournie.

**Exemple**

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

Vérifie si le champ de type date n'est pas postérieur à une valeur spécifique. Équivalent à une valeur inférieure ou égale à la date fournie.

**Exemple**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Opérateurs pour les champs de type tableau

Pour les champs de type tableau (`type: 'array'`)

### `$match`

Vérifie si la valeur du champ de type tableau correspond aux valeurs du tableau spécifié.

**Exemple**

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

Vérifie si la valeur du champ de type tableau ne correspond pas aux valeurs du tableau spécifié.

**Exemple**

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

Vérifie si la valeur du champ de type tableau contient au moins une des valeurs du tableau spécifié.

**Exemple**

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

Vérifie si la valeur du champ de type tableau ne contient aucune des valeurs du tableau spécifié.

**Exemple**

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

Vérifie si le champ de type tableau est vide.

**Exemple**

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

Vérifie si le champ de type tableau n'est pas vide.

**Exemple**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Opérateurs pour les champs de relation (associations)

Utilisé pour vérifier l'existence d'une relation. Les types de champs incluent :

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Vérifie si des données de relation existent.

**Exemple**

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

Vérifie si aucune donnée de relation n'existe.

**Exemple**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```