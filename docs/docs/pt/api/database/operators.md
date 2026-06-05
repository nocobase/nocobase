:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Operadores de Filtro

Utilizados no parâmetro `filter` das APIs de um Repository, como `find`, `findOne`, `findAndCount` e `count`:

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

Para suportar a serialização JSON, o NocoBase identifica os operadores de consulta com uma string prefixada por `$`.

Além disso, o NocoBase oferece uma API para estender operadores. Para mais detalhes, consulte [`db.registerOperators()`](../database#registeroperators).

## Operadores Gerais

### `$eq`

Verifica se o valor do campo é igual ao valor especificado. Equivalente ao `=` do SQL.

**Exemplo**

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

Verifica se o valor do campo é diferente do valor especificado. Equivalente ao `!=` do SQL.

**Exemplo**

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

Verifica se o valor do campo é o valor especificado. Equivalente ao `IS` do SQL.

**Exemplo**

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

Verifica se o valor do campo não é o valor especificado. Equivalente ao `IS NOT` do SQL.

**Exemplo**

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

Verifica se o valor do campo é igual ao valor de outro campo. Equivalente ao `=` do SQL.

**Exemplo**

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

Verifica se o valor do campo está no array especificado. Equivalente ao `IN` do SQL.

**Exemplo**

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

Verifica se o valor do campo não está no array especificado. Equivalente ao `NOT IN` do SQL.

**Exemplo**

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

Verifica se um campo geral está vazio. Para um campo de string, verifica se é uma string vazia. Para um campo de array, verifica se é um array vazio.

**Exemplo**

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

Verifica se um campo geral não está vazio. Para um campo de string, verifica se não é uma string vazia. Para um campo de array, verifica se não é um array vazio.

**Exemplo**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Operadores Lógicos

### `$and`

AND lógico. Equivalente ao `AND` do SQL.

**Exemplo**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

OR lógico. Equivalente ao `OR` do SQL.

**Exemplo**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operadores de Campo Booleano

Para campos do tipo booleano `type: 'boolean'`

### `$isFalsy`

Verifica se o valor de um campo booleano é falso. Valores de campo booleanos como `false`, `0` e `NULL` são considerados `$isFalsy: true`.

**Exemplo**

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

Verifica se o valor de um campo booleano é verdadeiro. Valores de campo booleanos como `true` e `1` são considerados `$isTruly: true`.

**Exemplo**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operadores de Campo Numérico

Para campos numéricos, incluindo:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Verifica se o valor do campo é maior que o valor especificado. Equivalente ao `>` do SQL.

**Exemplo**

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

Verifica se o valor do campo é maior ou igual ao valor especificado. Equivalente ao `>=` do SQL.

**Exemplo**

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

Verifica se o valor do campo é menor que o valor especificado. Equivalente ao `<` do SQL.

**Exemplo**

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

Verifica se o valor do campo é menor ou igual ao valor especificado. Equivalente ao `<=` do SQL.

**Exemplo**

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

Verifica se o valor do campo está entre os dois valores especificados. Equivalente ao `BETWEEN` do SQL.

**Exemplo**

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

Verifica se o valor do campo não está entre os dois valores especificados. Equivalente ao `NOT BETWEEN` do SQL.

**Exemplo**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operadores de Campo de String

Para campos do tipo string, incluindo `string`

### `$includes`

Verifica se o campo de string contém a substring especificada.

**Exemplo**

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

Verifica se o campo de string não contém a substring especificada.

**Exemplo**

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

Verifica se o campo de string começa com a substring especificada.

**Exemplo**

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

Verifica se o campo de string não começa com a substring especificada.

**Exemplo**

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

Verifica se o campo de string termina com a substring especificada.

**Exemplo**

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

Verifica se o campo de string não termina com a substring especificada.

**Exemplo**

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

Verifica se o valor do campo contém a string especificada. Equivalente ao `LIKE` do SQL.

**Exemplo**

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

Verifica se o valor do campo não contém a string especificada. Equivalente ao `NOT LIKE` do SQL.

**Exemplo**

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

Verifica se o valor do campo contém a string especificada, ignorando maiúsculas e minúsculas. Equivalente ao `ILIKE` do SQL (Apenas para PostgreSQL).

**Exemplo**

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

Verifica se o valor do campo não contém a string especificada, ignorando maiúsculas e minúsculas. Equivalente ao `NOT ILIKE` do SQL (Apenas para PostgreSQL).

**Exemplo**

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

Verifica se o valor do campo corresponde à expressão regular especificada. Equivalente ao `REGEXP` do SQL (Apenas para PostgreSQL).

**Exemplo**

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

Verifica se o valor do campo não corresponde à expressão regular especificada. Equivalente ao `NOT REGEXP` do SQL (Apenas para PostgreSQL).

**Exemplo**

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

Verifica se o valor do campo corresponde à expressão regular especificada, ignorando maiúsculas e minúsculas. Equivalente ao `~*` do SQL (Apenas para PostgreSQL).

**Exemplo**

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

Verifica se o valor do campo não corresponde à expressão regular especificada, ignorando maiúsculas e minúsculas. Equivalente ao `!~*` do SQL (Apenas para PostgreSQL).

**Exemplo**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operadores de Campo de Data

Para campos do tipo data `type: 'date'`

### `$dateOn`

Verifica se o campo de data está em um dia específico.

**Exemplo**

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

Verifica se o campo de data não está em um dia específico.

**Exemplo**

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

Verifica se o campo de data é anterior a um valor específico. Equivalente a ser menor que o valor de data fornecido.

**Exemplo**

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

Verifica se o campo de data não é anterior a um valor específico. Equivalente a ser maior ou igual ao valor de data fornecido.

**Exemplo**

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

Verifica se o campo de data é posterior a um valor específico. Equivalente a ser maior que o valor de data fornecido.

**Exemplo**

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

Verifica se o campo de data não é posterior a um valor específico. Equivalente a ser menor ou igual ao valor de data fornecido.

**Exemplo**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operadores de Campo de Array

Para campos do tipo array `type: 'array'`

### `$match`

Verifica se o valor do campo de array corresponde aos valores no array especificado.

**Exemplo**

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

Verifica se o valor do campo de array não corresponde aos valores no array especificado.

**Exemplo**

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

Verifica se o valor do campo de array contém *qualquer um* dos valores no array especificado.

**Exemplo**

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

Verifica se o valor do campo de array *não* contém *nenhum* dos valores no array especificado.

**Exemplo**

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

Verifica se o campo de array está vazio.

**Exemplo**

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

Verifica se o campo de array não está vazio.

**Exemplo**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operadores de Campo de Relacionamento

Utilizados para verificar se um relacionamento existe. Os tipos de campo incluem:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Dados de relacionamento existem.

**Exemplo**

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

Dados de relacionamento não existem.

**Exemplo**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```