# Filter Operators

Used in the `filter` parameter of APIs like `find`, `findOne`, `findAndCount`, `count` of a Repository:

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

To support JSON serialization, NocoBase identifies query operators with a string prefixed with `$`.

Additionally, NocoBase provides an API to extend operators, see [`db.registerOperators()`](../database#registeroperators) for details.

## General Operators

### `$eq`

Checks if the field value is equal to the specified value. Equivalent to SQL's `=`.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $eq: 'The Great Gatsby',
    },
  },
});
```

Equivalent to `title: 'The Great Gatsby'`.

### `$ne`

Checks if the field value is not equal to the specified value. Equivalent to SQL's `!=`.

**Example**

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

Checks if the field value is the specified value. Equivalent to SQL's `IS`.

**Example**

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

Checks if the field value is not the specified value. Equivalent to SQL's `IS NOT`.

**Example**

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

Checks if the field value is equal to the value of another field. Equivalent to SQL's `=`.

**Example**

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

Checks if the field value is in the specified array. Equivalent to SQL's `IN`.

**Example**

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

Checks if the field value is not in the specified array. Equivalent to SQL's `NOT IN`.

**Example**

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

Checks if a general field is empty. For a string field, it checks for an empty string. For an array field, it checks for an empty array.

**Example**

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

Checks if a general field is not empty. For a string field, it checks for a non-empty string. For an array field, it checks for a non-empty array.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Logical Operators

### `$and`

Logical AND. Equivalent to SQL's `AND`.

**Example**

```ts
repository.find({
  filter: {
    $and: [{ title: 'The Book of Songs' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logical OR. Equivalent to SQL's `OR`.

**Example**

```ts
repository.find({
  filter: {
    $or: [{ title: 'The Book of Songs' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Boolean Field Operators

For boolean fields `type: 'boolean'`

### `$isFalsy`

Checks if a boolean field value is falsy. Field values of `false`, `0`, and `NULL` are all considered `$isFalsy: true`.

**Example**

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

Checks if a boolean field value is truly. Field values of `true` and `1` are all considered `$isTruly: true`.

**Example**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Numeric Field Operators

For numeric fields, including:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Checks if the field value is greater than the specified value. Equivalent to SQL's `>`.

**Example**

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

Checks if the field value is greater than or equal to the specified value. Equivalent to SQL's `>=`.

**Example**

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

Checks if the field value is less than the specified value. Equivalent to SQL's `<`.

**Example**

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

Checks if the field value is less than or equal to the specified value. Equivalent to SQL's `<=`.

**Example**

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

Checks if the field value is between the two specified values. Equivalent to SQL's `BETWEEN`.

**Example**

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

Checks if the field value is not between the two specified values. Equivalent to SQL's `NOT BETWEEN`.

**Example**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## String Field Operators

For string fields, including `string`

### `$includes`

Checks if the string field contains the specified substring.

**Example**

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

Checks if the string field does not contain the specified substring.

**Example**

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

Checks if the string field starts with the specified substring.

**Example**

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

Checks if the string field does not start with the specified substring.

**Example**

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

Checks if the string field ends with the specified substring.

**Example**

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

Checks if the string field does not end with the specified substring.

**Example**

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

Checks if the field value contains the specified string. Equivalent to SQL's `LIKE`.

**Example**

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

Checks if the field value does not contain the specified string. Equivalent to SQL's `NOT LIKE`.

**Example**

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

Checks if the field value contains the specified string, case-insensitive. Equivalent to SQL's `ILIKE` (PostgreSQL only).

**Example**

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

Checks if the field value does not contain the specified string, case-insensitive. Equivalent to SQL's `NOT ILIKE` (PostgreSQL only).

**Example**

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

Checks if the field value matches the specified regular expression. Equivalent to SQL's `REGEXP` (PostgreSQL only).

**Example**

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

Checks if the field value does not match the specified regular expression. Equivalent to SQL's `NOT REGEXP` (PostgreSQL only).

**Example**

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

Checks if the field value matches the specified regular expression, case-insensitive. Equivalent to SQL's `~*` (PostgreSQL only).

**Example**

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

Checks if the field value does not match the specified regular expression, case-insensitive. Equivalent to SQL's `!~*` (PostgreSQL only).

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Date Field Operators

For date fields `type: 'date'`

### `$dateOn`

Checks if the date field is on a specific day.

**Example**

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

Checks if the date field is not on a specific day.

**Example**

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

Checks if the date field is before a specific value. Equivalent to being less than the provided date value.

**Example**

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

Checks if the date field is not before a specific value. Equivalent to being greater than or equal to the provided date value.

**Example**

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

Checks if the date field is after a specific value. Equivalent to being greater than the provided date value.

**Example**

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

Checks if the date field is not after a specific value. Equivalent to being less than or equal to the provided date value.

**Example**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Array Field Operators

For array fields `type: 'array'`

### `$match`

Checks if the array field's value matches the values in the specified array.

**Example**

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

Checks if the array field's value does not match the values in the specified array.

**Example**

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

Checks if the array field's value contains any of the values in the specified array.

**Example**

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

Checks if the array field's value contains none of the values in the specified array.

**Example**

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

Checks if the array field is empty.

**Example**

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

Checks if the array field is not empty.

**Example**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Association Field Operators

Used to check if an association exists. Field types include:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Association data exists

**Example**

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

No association data exists

**Example**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```