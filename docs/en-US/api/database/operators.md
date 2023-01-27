# Filter Operators

Used in the filter paramaters of the `find`, `findOne`, `findAndCount`, `count`, etc. APIs of repository:

```ts
const repository = db.getRepository('books');

repository.find({
  filter: {
    title: {
      $eq: 'Spring and Autumn',
    }
  }
});
```

To support JSON, NocoBase identifies query operators as a string prefixed with $.

Moreover, NocoBase provides API to extend operators. Refer to [`db.registerOperators()`](../database#registeroperators).

## General Operators

### `$eq`

Check if the field value is equal to the specified value. Equivalent to `=` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $eq: 'Spring and Autumn',
    }
  }
});
```

Equal to `title: 'Spring and Autumn'`

### `$ne`

Check if the field value is not equal to the specified value. Equivalent to `!=` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $ne: 'Spring and Autumn',
    }
  }
});
```

### `$is`

Check if the field value is the specified value. Equivalent to `IS` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $is: null,
    }
  }
});
```

### `$not`

Check if the field value is not the specified value. Equivalent to `IS NOT` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $not: null,
    }
  }
});
```

### `$col`

Check if the field value is equal to the value of another field. Equivalent to `=` in SQL.


**Example**

```ts
repository.find({
  filter: {
    title: {
      $col: 'name',
    }
  }
});
```

### `$in`

Check if the field value is in the specified array. Equivalent to `IN` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $in: ['Spring and Autumn', 'Warring States'],
    }
  }
});
```

### `$notIn`

Check if the field value is not in the specified array. Equivalent to `NOT IN` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notIn: ['Spring and Autumn', 'Warring States'],
    }
  }
});
```

### `$empty`

Check if the general field is empty. For string field, check if it is an empty string; for array field, check if it is an empty array.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $empty: true,
    }
  }
});
```

### `$notEmpty`

Check if the general field is not empty. For string field, check if it is not an empty string; for array field, check if it is not an empty array.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    }
  }
});
```

## Logical Operators

### `$and`

Logical AND. Equivalent to `AND` in SQL.

**Example**

```ts
repository.find({
  filter: {
    $and: [
      { title: 'Book of Songs' },
      { isbn: '1234567890' },
    ]
  }
});
```

### `$or`

Logical OR. Equivalent to `OR` in SQL.

**Example**

```ts
repository.find({
  filter: {
    $or: [
      { title: 'Book of Songs' },
      { publishedAt: { $lt: '0000-00-00T00:00:00Z' } },
    ]
  }
});
```

## Boolean Field Operators

For boolean fields: `type: 'boolean'`

### `$isFalsy`

Check if a Boolean field value is false. Boolean field values of `false`, `0` and `NULL` are all judged to be `$isFalsy: true`.

**Example**

```ts
repository.find({
  filter: {
    isPublished: {
      $isFalsy: true,
    }
  }
})
```

### `$isTruly`

Check if a Boolean field value is true. Boolean field values of `true` and `1` are all judged to be `$isTruly: true`.

**Example**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    }
  }
})
```

## Numeric Type Field Operators

For numeric type fields, including:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Check if the field value is greater than the specified value. Equivalent to `>` in SQL.

**Example**

```ts
repository.find({
  filter: {
    price: {
      $gt: 100,
    }
  }
});
```

### `$gte`

Check if the field value is equal to or greater than the specified value. Equivalent to `>=` in SQL.

**Example**

```ts
repository.find({
  filter: {
    price: {
      $gte: 100,
    }
  }
});
```

### `$lt`

Check if the field value is less than the specified value. Equivalent to `<` in SQL.

**Example**

```ts
repository.find({
  filter: {
    price: {
      $lt: 100,
    }
  }
});
```

### `$lte`

Check if the field value is equal to or less than the specified value. Equivalent to `<=` in SQL.

**Example**

```ts
repository.find({
  filter: {
    price: {
      $lte: 100,
    }
  }
});
```

### `$between`

Check if the field value is between the specified two values. Equivalent to `BETWEEN` in SQL.

**Example**

```ts
repository.find({
  filter: {
    price: {
      $between: [100, 200],
    }
  }
});
```

### `$notBetween`

Check if the field value is not between the specified two values. Equivalent to `NOT BETWEEN` in SQL.

**Example**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    }
  }
});
```

## String Type Field Operators

For string type fields, including `string`.

### `$includes`

Check if the string field contains the specified substring.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $includes: 'Three Character Classic',
    }
  }
})
```

### `$notIncludes`

Check if the string field does not contain the specified substring.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notIncludes: 'Three Character Classic',
    }
  }
})
```

### `$startsWith`

Check if the string field starts with the specified substring.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $startsWith: 'Three Character Classic',
    }
  }
})
```

### `$notStatsWith`

Check if the string field does not start with the specified substring.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notStatsWith: 'Three Character Classic',
    }
  }
})
```

### `$endsWith`

Check if the string field ends with the specified substring.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $endsWith: 'Three Character Classic',
    }
  }
})
```

### `$notEndsWith`

Check if the string field does not end with the specified substring.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notEndsWith: 'Three Character Classic',
    }
  }
})
```

### `$like`

Check if the field value contains the specified string. Equivalent to `LIKE` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $like: 'Computer',
    }
  }
});
```

### `$notLike`

Check if the field value does not contain the specified string. Equivalent to `NOT LIKE` in SQL.

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notLike: 'Computer',
    }
  }
});
```

### `$iLike`

Check if a field value contains the specified string, case ignored. Equivalent to `ILIKE` in SQL (PG only).

**Example**

```ts
repository.find({
  filter: {
    title: {
      $iLike: 'Computer',
    }
  }
});
```

### `$notILike`

Check if a field value does not contain the specified string, case ignored. Equivalent to `NOT ILIKE` in SQL (PG only).

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notILike: 'Computer',
    }
  }
});
```

### `$regexp`

Check if the field value matches the specified regular expression. Equivalent to `REGEXP` in SQL (PG only).

**Example**

```ts
repository.find({
  filter: {
    title: {
      $regexp: '^Computer',
    }
  }
});
```

### `$notRegexp`

Check if the field value does not matche the specified regular expression. Equivalent to `NOT REGEXP` in SQL (PG only).

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notRegexp: '^Computer',
    }
  }
});
```

### `$iRegexp`

Check if the field value matches the specified regular expression, case ignored. Equivalent to `~*` in SQL (PG only).

**Example**

```ts
repository.find({
  filter: {
    title: {
      $iRegexp: '^COMPUTER',
    }
  }
});
```

### `$notIRegexp`

Check if the field value does not matche the specified regular expression, case ignored. Equivalent to `!~*` in SQL (PG only).

**Example**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    }
  }
});
```

## Date Type Field Operators

For date type fields: `type: 'date'`

### `$dateOn`

Check if the date field value is within a certain day.

**Example**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateOn: '2021-01-01',
    }
  }
})
```

### `$dateNotOn`

Check if the date field value is not within a certain day.

**Example**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotOn: '2021-01-01',
    }
  }
})
```

### `$dateBefore`

Check if the date field value is before a certain value, i.e. less than the one passed in.

**Example**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateBefore: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### `$dateNotBefore`

Check if the date field value is not before a certain value, i.e. equal to or greater than the one passed in.

**Example**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotBefore: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### `$dateAfter`

Check if the date field value is after a certain value, i.e. greater than the one passed in.

**Example**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateAfter: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### `$dateNotAfter`

Check if the date field value is not after a certain value, i.e. equal to or greater than the one passed in.

**Example**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

## Array Type Field Operators

For array type fields: `type: 'array'`

### `$match`

Check if the array field values match values of the specified array.

**Example**

```ts
repository.find({
  filter: {
    tags: {
      $match: ['literature', 'history'],
    }
  }
})
```

### `$notMatch`

Check if the array field values do not match values of the specified array.

**Example**

```ts
repository.find({
  filter: {
    tags: {
      $notMatch: ['literature', 'history'],
    }
  }
})
```

### `$anyOf`

Check if the array field values contain any of the values of the specified array.

**Example**

```ts
repository.find({
  filter: {
    tags: {
      $anyOf: ['literature', 'history'],
    }
  }
})
```

### `$noneOf`

Check if the array field values contain none of the values of the specified array.

**Example**

```ts
repository.find({
  filter: {
    tags: {
      $noneOf: ['literature', 'history'],
    }
  }
})
```

### `$arrayEmpty`

Check if the array field is empty.

**Example**

```ts
repository.find({
  filter: {
    tags: {
      $arrayEmpty: true,
    }
  }
});
```

### `$arrayNotEmpty`

Check if the array field is not empty.

**Example**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    }
  }
});
```

## Relational Field Type Operators

For checking if a relationship exists, field types include:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

There is relational data existing.

**Example**

```ts
repository.find({
  filter: {
    author: {
      $exists: true,
    }
  }
});
```

### `$notExists`

There is no relational data existing.

**Example**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    }
  }
});
```
