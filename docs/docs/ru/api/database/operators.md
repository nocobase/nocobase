# Операторы фильтрации

Используется в параметре `filter` таких API, как `find`, `findOne`, `findAndCount`, `count` репозитория:

```ts
const repository = db.getRepository('books');

repository.find({
  filter: {
    title: {
      $eq: 'The Great Gatsby',
    },
  },
});
```

Для поддержки сериализации JSON NocoBase идентифицирует операторы запроса с помощью строки с префиксом `$`.

Кроме того, NocoBase предоставляет API для расширения операторов, подробности см. в [`db.registerOperators()`](../database#registeroperators).

## Общие операторы

### `$eq`

Проверяет, соответствует ли значение поля указанному значению. Эквивалент `=` SQL.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $eq: 'The Great Gatsby',
    },
  },
});
```

Эквивалент `title: 'The Great Gatsby'`.

### `$ne`

Проверяет, не равно ли значение поля указанному значению. Эквивалент `!=` SQL.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $ne: 'The Great Gatsby',
    },
  },
});
```

### `$is`

Проверяет, соответствует ли значение поля указанному значению. Эквивалент `IS` SQL.

**Пример**

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

Проверяет, не соответствует ли значение поля указанному значению. Эквивалент `IS NOT` SQL.

**Пример**

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

Проверяет, равно ли значение поля значению другого поля. Эквивалент `=` SQL.

**Пример**

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

Проверяет, находится ли значение поля в указанном массиве. Эквивалент `IN` SQL.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $in: ['The Great Gatsby', 'Moby Dick'],
    },
  },
});
```

### `$notIn`

Проверяет, отсутствует ли значение поля в указанном массиве. Эквивалент `NOT IN` SQL.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notIn: ['The Great Gatsby', 'Moby Dick'],
    },
  },
});
```

### `$empty`

Проверяет, пусто ли общее поле. Для строкового поля проверяется наличие пустой строки. Для поля массива он проверяет пустой массив.

**Пример**

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

Проверяет, не пусто ли общее поле. Для строкового поля проверяется непустая строка. Для поля массива он проверяет непустой массив.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Логические операторы

### `$and`

Логическое И. Эквивалент `AND` SQL.

**Пример**

```ts
repository.find({
  filter: {
    $and: [{ title: 'The Book of Songs' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Логическое ИЛИ. Эквивалент `OR` SQL.

**Пример**

```ts
repository.find({
  filter: {
    $or: [{ title: 'The Book of Songs' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Операторы логических полей

Для логических полей `type: 'boolean'`

### `$isFalsy`

Проверяет, является ли значение логического поля ложным. Значения полей `false`, `0` и `NULL` считаются `$isFalsy: true`.

**Пример**

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

Проверяет, действительно ли значение логического поля соответствует действительности. Значения полей `true` и `1` считаются `$isTruly: true`.

**Пример**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Операторы числовых полей

Для числовых полей, включая:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Проверяет, превышает ли значение поля указанное значение. Эквивалент `>` SQL.

**Пример**

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

Проверяет, больше ли значение поля или равно указанному значению. Эквивалент `>=` SQL.

**Пример**

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

Проверяет, меньше ли значение поля указанного значения. Эквивалент `<` SQL.

**Пример**

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

Проверяет, меньше ли значение поля или равно указанному значению. Эквивалент `<=` SQL.

**Пример**

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

Проверяет, находится ли значение поля между двумя указанными значениями. Эквивалент `BETWEEN` SQL.

**Пример**

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

Проверяет, не находится ли значение поля между двумя указанными значениями. Эквивалент `NOT BETWEEN` SQL.

**Пример**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Операторы строковых полей

Для строковых полей, включая `string`

### `$includes`

Проверяет, содержит ли строковое поле указанную подстроку.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $includes: 'Classic',
    },
  },
});
```

### `$notIncludes`

Проверяет, не содержит ли строковое поле указанную подстроку.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notIncludes: 'Classic',
    },
  },
});
```

### `$startsWith`

Проверяет, начинается ли строковое поле с указанной подстроки.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $startsWith: 'Classic',
    },
  },
});
```

### `$notStatsWith`

Проверяет, не начинается ли строковое поле с указанной подстроки.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notStatsWith: 'Classic',
    },
  },
});
```

### `$endsWith`

Проверяет, заканчивается ли строковое поле указанной подстрокой.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $endsWith: 'Classic',
    },
  },
});
```

### `$notEndsWith`

Проверяет, не заканчивается ли строковое поле указанной подстрокой.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notEndsWith: 'Classic',
    },
  },
});
```

### `$like`

Проверяет, содержит ли значение поля указанную строку. Эквивалент `LIKE` SQL.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $like: 'Computer',
    },
  },
});
```

### `$notLike`

Проверяет, не содержит ли значение поля указанную строку. Эквивалент `NOT LIKE` SQL.

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notLike: 'Computer',
    },
  },
});
```

### `$iLike`

Проверяет, содержит ли значение поля указанную строку, без учета регистра. Эквивалент `ILIKE` SQL (только PostgreSQL).

**Пример**

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

Проверяет, не содержит ли значение поля указанную строку, без учета регистра. Эквивалент `NOT ILIKE` SQL (только PostgreSQL).

**Пример**

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

Проверяет, соответствует ли значение поля указанному регулярному выражению. Эквивалент `REGEXP` SQL (только PostgreSQL).

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $regexp: '^Computer',
    },
  },
});
```

### `$notRegexp`

Проверяет, не соответствует ли значение поля указанному регулярному выражению. Эквивалент `NOT REGEXP` SQL (только PostgreSQL).

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notRegexp: '^Computer',
    },
  },
});
```

### `$iRegexp`

Проверяет, соответствует ли значение поля указанному регулярному выражению, без учета регистра. Эквивалент `~*` SQL (только PostgreSQL).

**Пример**

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

Проверяет, не соответствует ли значение поля указанному регулярному выражению, без учета регистра. Эквивалент `!~*` SQL (только PostgreSQL).

**Пример**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Операторы поля даты

Для полей даты `type: 'date'`

### `$dateOn`

Проверяет, относится ли поле даты к определенному дню.

**Пример**

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

Проверяет, не относится ли поле даты к определенному дню.

**Пример**

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

Проверяет, находится ли поле даты перед определенным значением. Эквивалентно тому, что значение даты меньше указанного.

**Пример**

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

Проверяет, не находится ли поле даты перед определенным значением. Эквивалентно тому, что оно больше или равно указанному значению даты.

**Пример**

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

Проверяет, находится ли поле даты после определенного значения. Эквивалентно тому, что значение даты превышает указанное.

**Пример**

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

Проверяет, не находится ли поле даты после определенного значения. Эквивалентно тому, что оно меньше или равно указанному значению даты.

**Пример**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Операторы поля массива

Для полей массива `type: 'array'`

### `$match`

Проверяет, соответствует ли значение поля массива значениям в указанном массиве.

**Пример**

```ts
repository.find({
  filter: {
    tags: {
      $match: ['Literature', 'History'],
    },
  },
});
```

### `$notMatch`

Проверяет, не соответствует ли значение поля массива значениям в указанном массиве.

**Пример**

```ts
repository.find({
  filter: {
    tags: {
      $notMatch: ['Literature', 'History'],
    },
  },
});
```

### `$anyOf`

Проверяет, содержит ли значение поля массива какое-либо значение из указанного массива.

**Пример**

```ts
repository.find({
  filter: {
    tags: {
      $anyOf: ['Literature', 'History'],
    },
  },
});
```

### `$noneOf`

Проверяет, содержит ли значение поля массива ни одно из значений указанного массива.

**Пример**

```ts
repository.find({
  filter: {
    tags: {
      $noneOf: ['Literature', 'History'],
    },
  },
});
```

### `$arrayEmpty`

Проверяет, пусто ли поле массива.

**Пример**

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

Проверяет, не пусто ли поле массива.

**Пример**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Операторы полей связи

Используется для проверки наличия связи. Типы полей включают в себя:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Связанные данные существуют

**Пример**

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

Данных о связи не существует

**Пример**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```