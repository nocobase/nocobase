# Filter Operators

用于 Repository 的 `find`、`findOne`、`findAndCount`、`count` 等 API 的 filter 参数中：

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

为了支持 JSON 化，NocoBase 中将查询运算符以 $ 为前缀的字符串标识。

另外，NocoBase 也提供了扩展运算符的 API，详见 [`db.registerOperators()`](../database#registeroperators)。

## 通用运算符

### `$eq`

判断字段值是否相等于指定值。相当于 SQL 的 `=`。

**示例**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

等同于 `title: '春秋'`。

### `$ne`

判断字段值是否不等于指定值。相当于 SQL 的 `!=`。

**示例**

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

判断字段值是否为指定值。相当于 SQL 的 `IS`。

**示例**

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

判断字段值是否不为指定值。相当于 SQL 的 `IS NOT`。

**示例**

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

判断字段值是否等于另一个字段的值。相当于 SQL 的 `=`。

**示例**

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

判断字段值是否在指定数组中。相当于 SQL 的 `IN`。

**示例**

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

判断字段值是否不在指定数组中。相当于 SQL 的 `NOT IN`。

**示例**

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

判断一般字段是否为空，如果是字符串字段，判断是否为空串，如果是数组字段，判断是否为空数组。

**示例**

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

判断一般字段是否不为空，如果是字符串字段，判断是否不为空串，如果是数组字段，判断是否不为空数组。

**示例**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## 逻辑运算符

### `$and`

逻辑 AND。相当于 SQL 的 `AND`。

**示例**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

逻辑 OR。相当于 SQL 的 `OR`。

**示例**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## 布尔类型字段运算符

用于布尔类型字段 `type: 'boolean'`

### `$isFalsy`

判断布尔类型字段值是否为假。布尔字段值为 `false`、`0` 和 `NULL` 的情况都会被判断为 `$isFalsy: true`。

**示例**

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

判断布尔类型字段值是否为真。布尔字段值为 `true` 和 `1` 的情况都会被判断为 `$isTruly: true`。

**示例**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## 数字类型字段运算符

用于数字类型字段，包括：

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

判断字段值是否大于指定值。相当于 SQL 的 `>`。

**示例**

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

判断字段值是否大于等于指定值。相当于 SQL 的 `>=`。

**示例**

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

判断字段值是否小于指定值。相当于 SQL 的 `<`。

**示例**

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

判断字段值是否小于等于指定值。相当于 SQL 的 `<=`。

**示例**

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

判断字段值是否在指定的两个值之间。相当于 SQL 的 `BETWEEN`。

**示例**

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

判断字段值是否不在指定的两个值之间。相当于 SQL 的 `NOT BETWEEN`。

**示例**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## 字符串类型字段运算符

用于字符串类型字段，包括 `string`

### `$includes`

判断字符串字段是否包含指定子串。

**示例**

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

判断字符串字段是否不包含指定子串。

**示例**

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

判断字符串字段是否以指定子串开头。

**示例**

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

判断字符串字段是否不以指定子串开头。

**示例**

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

判断字符串字段是否以指定子串结尾。

**示例**

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

判断字符串字段是否不以指定子串结尾。

**示例**

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

判断字段值是否包含指定的字符串。相当于 SQL 的 `LIKE`。

**示例**

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

判断字段值是否不包含指定的字符串。相当于 SQL 的 `NOT LIKE`。

**示例**

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

判断字段值是否包含指定的字符串，忽略大小写。相当于 SQL 的 `ILIKE`（仅 PG 适用）。

**示例**

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

判断字段值是否不包含指定的字符串，忽略大小写。相当于 SQL 的 `NOT ILIKE`（仅 PG 适用）。

**示例**

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

判断字段值是否匹配指定的正则表达式。相当于 SQL 的 `REGEXP`（仅 PG 适用）。

**示例**

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

判断字段值是否不匹配指定的正则表达式。相当于 SQL 的 `NOT REGEXP`（仅 PG 适用）。

**示例**

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

判断字段值是否匹配指定的正则表达式，忽略大小写。相当于 SQL 的 `~*`（仅 PG 适用）。

**示例**

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

判断字段值是否不匹配指定的正则表达式，忽略大小写。相当于 SQL 的 `!~*`（仅 PG 适用）。

**示例**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## 日期类型字段运算符

用于日期类型字段 `type: 'date'`

### `$dateOn`

判断日期字段是否在某天内。

**示例**

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

判断日期字段是否不在某天内。

**示例**

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

判断日期字段是否在某个值之前。相当于小于传入的日期值。

**示例**

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

判断日期字段是否不在某个值之前。相当于大于等于传入的日期值。

**示例**

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

判断日期字段是否在某个值之后。相当于大于传入的日期值。

**示例**

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

判断日期字段是否不在某个值之后。相当于小于等于传入的日期值。

**示例**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## 数组类型字段运算符

用于数组类型字段 `type: 'array'`

### `$match`

判断数组字段的值是否匹配指定数组中的值。

**示例**

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

判断数组字段的值是否不匹配指定数组中的值。

**示例**

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

判断数组字段的值是否包含指定数组中的任意值。

**示例**

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

判断数组字段的值是否不包含指定数组中的任意值。

**示例**

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

判断数组字段是否为空。

**示例**

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

判断数组字段是否不为空。

**示例**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## 关系字段类型运算符

用于判断关系是否存在，字段类型包括：

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

有关系数据

**示例**

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

无关系数据

**示例**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```
