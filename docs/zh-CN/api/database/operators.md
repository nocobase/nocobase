# Operators

相当于 Sequelize 中的 [Op](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#operators) 对象。

为了支持 JSON 化，NocoBase 中将查询操作符转换为以 `$` 为前缀的字符串标识。

另外，NocoBase 也提供了扩展操作符的方式，详见 [`registerOperators()`](../database#registeroperators)。

## 操作符列表

### 通用类型

#### `$eq`

判断字段值是否相等于指定值。相当于 SQL 的 `=`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $eq: '春秋',
    }
  }
});
```

等同于 `title: '春秋'`。

#### `$ne`

判断字段值是否不等于指定值。相当于 SQL 的 `!=`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $ne: '春秋',
    }
  }
});
```

#### `$is`

判断字段值是否为指定值。相当于 SQL 的 `IS`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $is: null,
    }
  }
});
```

#### `$not`

判断字段值是否不为指定值。相当于 SQL 的 `IS NOT`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $not: null,
    }
  }
});
```

#### `$col`

判断字段值是否等于另一个字段的值。相当于 SQL 的 `=`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $col: 'name',
    }
  }
});
```

#### `$in`

判断字段值是否在指定数组中。相当于 SQL 的 `IN`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $in: ['春秋', '战国'],
    }
  }
});
```

#### `$notIn`

判断字段值是否不在指定数组中。相当于 SQL 的 `NOT IN`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notIn: ['春秋', '战国'],
    }
  }
});
```

#### `'$exists'`

判断字段是否不为空。相当于 SQL 的 `IS NOT NULL`。亦可用于判断对一的关联字段外键是否存在。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $exists: true,
    }
  }
});
```

#### `'$notExists'`

判断字段是否为空。相当于 SQL 的 `IS NULL`。亦可用于判断对一的关联字段外键是否不存在。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notExists: true,
    }
  }
});
```

#### `'$empty'`

判断一般字段是否为空，如果是字符串字段，判断是否为空串，如果是数组字段，判断是否为空数组。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $empty: true,
    }
  }
});
```

#### `'$notEmpty'`

判断一般字段是否不为空，如果是字符串字段，判断是否不为空串，如果是数组字段，判断是否不为空数组。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notEmpty: true,
    }
  }
});
```

### 逻辑值类型

#### `'$isFalsy'`

判断逻辑值字段是否为假值。仅包含 `null` 和 `false`，不含 `0` 和 空字符串 `''`。

**示例**

```ts
booksRepository.find({
  filter: {
    isPublished: {
      $isFalsy: true,
    }
  }
})
```

#### `'$isTruly'`

判断逻辑值字段是否为真值。`true`，不含其他 JS 中转换为逻辑值后为 `true` 的值，如 `1`、`'abc'` 等。

**示例**

```ts
booksRepository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    }
  }
})
```

### 数字类型

数字类型的操作符亦可用于日期类型的字段。

#### `$gt`

判断字段值是否大于指定值。相当于 SQL 的 `>`。

**示例**

```ts
booksRepository.find({
  filter: {
    price: {
      $gt: 100,
    }
  }
});
```

#### `$gte`

判断字段值是否大于等于指定值。相当于 SQL 的 `>=`。

**示例**

```ts
booksRepository.find({
  filter: {
    price: {
      $gte: 100,
    }
  }
});
```

#### `$lt`

判断字段值是否小于指定值。相当于 SQL 的 `<`。

**示例**

```ts
booksRepository.find({
  filter: {
    price: {
      $lt: 100,
    }
  }
});
```

#### `$lte`

判断字段值是否小于等于指定值。相当于 SQL 的 `<=`。

**示例**

```ts
booksRepository.find({
  filter: {
    price: {
      $lte: 100,
    }
  }
});
```

#### `$between`

判断字段值是否在指定的两个值之间。相当于 SQL 的 `BETWEEN`。

**示例**

```ts
booksRepository.find({
  filter: {
    price: {
      $between: [100, 200],
    }
  }
});
```

#### `$notBetween`

判断字段值是否不在指定的两个值之间。相当于 SQL 的 `NOT BETWEEN`。

**示例**

```ts
booksRepository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    }
  }
});
```

### 字符串类型

#### `$like`

判断字段值是否包含指定的字符串。相当于 SQL 的 `LIKE`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $like: '计算机',
    }
  }
});
```

#### `$notLike`

判断字段值是否不包含指定的字符串。相当于 SQL 的 `NOT LIKE`。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notLike: '计算机',
    }
  }
});
```

#### `$iLike`

判断字段值是否包含指定的字符串，忽略大小写。相当于 SQL 的 `ILIKE`（仅 PG 适用）。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $iLike: 'Computer',
    }
  }
});
```

#### `$notILike`

判断字段值是否不包含指定的字符串，忽略大小写。相当于 SQL 的 `NOT ILIKE`（仅 PG 适用）。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notILike: 'Computer',
    }
  }
});
```

#### `$regexp`

判断字段值是否匹配指定的正则表达式。相当于 SQL 的 `REGEXP`（仅 PG 适用）。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $regexp: '^计算机',
    }
  }
});
```

#### `$notRegexp`

判断字段值是否不匹配指定的正则表达式。相当于 SQL 的 `NOT REGEXP`（仅 PG 适用）。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notRegexp: '^计算机',
    }
  }
});
```

#### `$iRegexp`

判断字段值是否匹配指定的正则表达式，忽略大小写。相当于 SQL 的 `~*`（仅 PG 适用）。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $iRegexp: '^COMPUTER',
    }
  }
});
```

#### `$notIRegexp`

判断字段值是否不匹配指定的正则表达式，忽略大小写。相当于 SQL 的 `!~*`（仅 PG 适用）。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    }
  }
});
```

#### `'$includes'`

判断字符串字段是否包含指定子串。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $includes: '三字经',
    }
  }
})
```

#### `'$notIncludes'`

判断字符串字段是否不包含指定子串。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notIncludes: '三字经',
    }
  }
})
```

#### `'$startsWith'`

判断字符串字段是否以指定子串开头。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $startsWith: '三字经',
    }
  }
})
```

#### `'$notStatsWith'`

判断字符串字段是否不以指定子串开头。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notStatsWith: '三字经',
    }
  }
})
```

#### `'$endsWith'`

判断字符串字段是否以指定子串结尾。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $endsWith: '三字经',
    }
  }
})
```

#### `'$notEndsWith'`

判断字符串字段是否不以指定子串结尾。

**示例**

```ts
booksRepository.find({
  filter: {
    title: {
      $notEndsWith: '三字经',
    }
  }
})
```

### 日期类型

#### `'$dateOn'`

判断日期字段是否在某天内。

**示例**

```ts
booksRepository.find({
  filter: {
    createdAt: {
      $dateOn: '2021-01-01',
    }
  }
})
```

#### `'$dateNotOn'`

判断日期字段是否不在某天内。

**示例**

```ts
booksRepository.find({
  filter: {
    createdAt: {
      $dateNotOn: '2021-01-01',
    }
  }
})
```

#### `'$dateBefore'`

判断日期字段是否在某个值之前。相当于小于传入的日期值。

**示例**

```ts
booksRepository.find({
  filter: {
    createdAt: {
      $dateBefore: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

#### `'$dateNotBefore'`

判断日期字段是否不在某个值之前。相当于大于等于传入的日期值。

**示例**

```ts
booksRepository.find({
  filter: {
    createdAt: {
      $dateNotBefore: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

#### `'$dateAfter'`

判断日期字段是否在某个值之后。相当于大于传入的日期值。

**示例**

```ts
booksRepository.find({
  filter: {
    createdAt: {
      $dateAfter: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

#### `'$dateNotAfter'`

判断日期字段是否不在某个值之后。相当于小于等于传入的日期值。

**示例**

```ts
booksRepository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### 数组类型

#### `'$match'`

判断数组字段的值是否匹配指定数组中的值。

**示例**

```ts
booksRepository.find({
  filter: {
    tags: {
      $match: ['文学', '历史'],
    }
  }
})
```

#### `'$notMatch'`

判断数组字段的值是否不匹配指定数组中的值。

**示例**

```ts
booksRepository.find({
  filter: {
    tags: {
      $notMatch: ['文学', '历史'],
    }
  }
})
```

#### `'$anyOf'`

判断数组字段的值是否包含指定数组中的任意值。

**示例**

```ts
booksRepository.find({
  filter: {
    tags: {
      $anyOf: ['文学', '历史'],
    }
  }
})
```

#### `'$noneOf'`

判断数组字段的值是否不包含指定数组中的任意值。

**示例**

```ts
booksRepository.find({
  filter: {
    tags: {
      $noneOf: ['文学', '历史'],
    }
  }
})
```

#### `'$arrayEmpty'`

判断数组字段是否为空。

**示例**

```ts
booksRepository.find({
  filter: {
    tags: {
      $arrayEmpty: true,
    }
  }
});
```

#### `'$arrayNotEmpty'`

判断数组字段是否不为空。

**示例**

```ts
booksRepository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    }
  }
});
```
### 逻辑计算分组

#### `$and`

逻辑与分组。相当于 SQL 的 `AND`。

**示例**

```ts
booksRepository.find({
  filter: {
    $and: [
      { title: '诗经' },
      { isbn: '1234567890' },
    ]
  }
});
```

#### `$or`

逻辑或分组。相当于 SQL 的 `OR`。

**示例**

```ts
booksRepository.find({
  filter: {
    $or: [
      { title: '诗经' },
      { publishedAt: { $lt: '0000-00-00T00:00:00Z' } },
    ]
  }
});
```
