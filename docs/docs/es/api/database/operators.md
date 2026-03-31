:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Operadores de Filtro

Se utilizan en el parámetro `filter` de las APIs del Repository como `find`, `findOne`, `findAndCount` y `count`:

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

Para facilitar la serialización a JSON, NocoBase identifica los operadores de consulta con una cadena de texto que lleva el prefijo `$`.

Además, NocoBase ofrece una API para extender los operadores. Para más detalles, consulte [`db.registerOperators()`](../database#registeroperators).

## Operadores Generales

### `$eq`

Comprueba si el valor del campo es igual al valor especificado. Es equivalente al operador `=` de SQL.

**Ejemplo**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Es equivalente a `title: '春秋'`.

### `$ne`

Comprueba si el valor del campo es diferente al valor especificado. Es equivalente al operador `!=` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo es el valor especificado. Es equivalente al operador `IS` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo no es el valor especificado. Es equivalente al operador `IS NOT` de SQL.

**Ejemplo**

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

Comprueba si el valor de un campo es igual al valor de otro campo. Es equivalente al operador `=` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo está incluido en el array especificado. Es equivalente al operador `IN` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo no está incluido en el array especificado. Es equivalente al operador `NOT IN` de SQL.

**Ejemplo**

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

Comprueba si un campo está vacío. Si es un campo de tipo cadena, verifica si es una cadena vacía; si es un campo de tipo array, verifica si es un array vacío.

**Ejemplo**

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

Comprueba si un campo no está vacío. Si es un campo de tipo cadena, verifica si no es una cadena vacía; si es un campo de tipo array, verifica si no es un array vacío.

**Ejemplo**

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

AND lógico. Es equivalente al operador `AND` de SQL.

**Ejemplo**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

OR lógico. Es equivalente al operador `OR` de SQL.

**Ejemplo**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operadores para Campos de Tipo Booleano

Se utilizan para campos de tipo booleano (`type: 'boolean'`).

### `$isFalsy`

Comprueba si el valor de un campo booleano es falso (falsy). Los valores `false`, `0` y `NULL` se consideran `$isFalsy: true`.

**Ejemplo**

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

Comprueba si el valor de un campo booleano es verdadero (truly). Los valores `true` y `1` se consideran `$isTruly: true`.

**Ejemplo**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operadores para Campos de Tipo Numérico

Se utilizan para campos de tipo numérico, incluyendo:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Comprueba si el valor del campo es mayor que el valor especificado. Es equivalente al operador `>` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo es mayor o igual que el valor especificado. Es equivalente al operador `>=` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo es menor que el valor especificado. Es equivalente al operador `<` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo es menor o igual que el valor especificado. Es equivalente al operador `<=` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo está entre los dos valores especificados. Es equivalente al operador `BETWEEN` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo no está entre los dos valores especificados. Es equivalente al operador `NOT BETWEEN` de SQL.

**Ejemplo**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operadores para Campos de Tipo Cadena

Se utilizan para campos de tipo cadena, incluyendo `string`.

### `$includes`

Comprueba si el campo de cadena contiene la subcadena especificada.

**Ejemplo**

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

Comprueba si el campo de cadena no contiene la subcadena especificada.

**Ejemplo**

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

Comprueba si el campo de cadena comienza con la subcadena especificada.

**Ejemplo**

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

Comprueba si el campo de cadena no comienza con la subcadena especificada.

**Ejemplo**

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

Comprueba si el campo de cadena termina con la subcadena especificada.

**Ejemplo**

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

Comprueba si el campo de cadena no termina con la subcadena especificada.

**Ejemplo**

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

Comprueba si el valor del campo contiene la cadena especificada. Es equivalente al operador `LIKE` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo no contiene la cadena especificada. Es equivalente al operador `NOT LIKE` de SQL.

**Ejemplo**

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

Comprueba si el valor del campo contiene la cadena especificada, ignorando mayúsculas y minúsculas. Es equivalente al operador `ILIKE` de SQL (solo aplicable a PostgreSQL).

**Ejemplo**

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

Comprueba si el valor del campo no contiene la cadena especificada, ignorando mayúsculas y minúsculas. Es equivalente al operador `NOT ILIKE` de SQL (solo aplicable a PostgreSQL).

**Ejemplo**

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

Comprueba si el valor del campo coincide con la expresión regular especificada. Es equivalente al operador `REGEXP` de SQL (solo aplicable a PostgreSQL).

**Ejemplo**

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

Comprueba si el valor del campo no coincide con la expresión regular especificada. Es equivalente al operador `NOT REGEXP` de SQL (solo aplicable a PostgreSQL).

**Ejemplo**

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

Comprueba si el valor del campo coincide con la expresión regular especificada, ignorando mayúsculas y minúsculas. Es equivalente al operador `~*` de SQL (solo aplicable a PostgreSQL).

**Ejemplo**

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

Comprueba si el valor del campo no coincide con la expresión regular especificada, ignorando mayúsculas y minúsculas. Es equivalente al operador `!~*` de SQL (solo aplicable a PostgreSQL).

**Ejemplo**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operadores para Campos de Tipo Fecha

Se utilizan para campos de tipo fecha (`type: 'date'`).

### `$dateOn`

Comprueba si el campo de fecha corresponde a un día específico.

**Ejemplo**

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

Comprueba si el campo de fecha no corresponde a un día específico.

**Ejemplo**

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

Comprueba si el campo de fecha es anterior a un valor específico. Es equivalente a ser menor que el valor de fecha proporcionado.

**Ejemplo**

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

Comprueba si el campo de fecha no es anterior a un valor específico. Es equivalente a ser mayor o igual que el valor de fecha proporcionado.

**Ejemplo**

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

Comprueba si el campo de fecha es posterior a un valor específico. Es equivalente a ser mayor que el valor de fecha proporcionado.

**Ejemplo**

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

Comprueba si el campo de fecha no es posterior a un valor específico. Es equivalente a ser menor o igual que el valor de fecha proporcionado.

**Ejemplo**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operadores para Campos de Tipo Array

Se utilizan para campos de tipo array (`type: 'array'`).

### `$match`

Comprueba si el valor del campo de array coincide con los valores del array especificado.

**Ejemplo**

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

Comprueba si el valor del campo de array no coincide con los valores del array especificado.

**Ejemplo**

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

Comprueba si el valor del campo de array contiene alguno de los valores del array especificado.

**Ejemplo**

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

Comprueba si el valor del campo de array no contiene ninguno de los valores del array especificado.

**Ejemplo**

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

Comprueba si el campo de array está vacío.

**Ejemplo**

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

Comprueba si el campo de array no está vacío.

**Ejemplo**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operadores para Campos de Tipo Relación

Se utilizan para comprobar si existe una relación. Los tipos de campo incluyen:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Comprueba si existen datos de relación.

**Ejemplo**

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

Comprueba si no existen datos de relación.

**Ejemplo**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```