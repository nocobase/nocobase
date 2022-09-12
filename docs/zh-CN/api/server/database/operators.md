# 查询操作符

相当于 Sequelize 中的 [Op](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#operators) 对象。

为了支持 JSON 化，NocoBase 中将查询操作符转换为以 `$` 为前缀的字符串标识。

另外，NocoBase 也提供了扩展操作符的方式，详见 [`registerOperators()`](../database#registeroperators)。

## 操作符列表

### `'$exists'`

判断字段是否不为空。相当于 `IS NOT NULL`。亦可用于判断对一的关联字段外键是否存在。

**示例**

```ts
books.find({
  filter: {
    title: {
      $exists: true,
    }
  }
});
```

### `'$notExists'`

判断字段是否为空。相当于 `IS NULL`。亦可用于判断对一的关联字段外键是否不存在。

**示例**

```ts
books.find({
  filter: {
    title: {
      $notExists: true,
    }
  }
});
```

### `'$isFalsy'`

判断逻辑值字段是否为假值。仅包含 `null` 和 `false`，不含 `0` 和 空字符串 `''`。

**示例**

```ts
books.find({
  filter: {
    isPublished: {
      $isFalsy: true,
    }
  }
})
```

### `'$isTruly'`

判断逻辑值字段是否为真值。`true`，不含其他 JS 中转换为逻辑值后为 `true` 的值，如 `1`、`'abc'` 等。

**示例**

```ts
books.find({
  filter: {
    isPublished: {
      $isTruly: true,
    }
  }
})
```

### `'$includes'`

判断字符串字段是否包含指定子串。

**示例**

```ts
books.find({
  filter: {
    title: {
      $includes: '三字经',
    }
  }
})
```

### `'$notIncludes'`

判断字符串字段是否不包含指定子串。

**示例**

```ts
books.find({
  filter: {
    title: {
      $notIncludes: '三字经',
    }
  }
})
```

### `'$startsWith'`

判断字符串字段是否以指定子串开头。

**示例**

```ts
books.find({
  filter: {
    title: {
      $startsWith: '三字经',
    }
  }
})
```

### `'$notStatsWith'`

判断字符串字段是否不以指定子串开头。

**示例**

```ts
books.find({
  filter: {
    title: {
      $notStatsWith: '三字经',
    }
  }
})
```

### `'$endsWith'`

判断字符串字段是否以指定子串结尾。

**示例**

```ts
books.find({
  filter: {
    title: {
      $endsWith: '三字经',
    }
  }
})
```

### `'$notEndsWith'`

判断字符串字段是否不以指定子串结尾。

**示例**

```ts
books.find({
  filter: {
    title: {
      $notEndsWith: '三字经',
    }
  }
})
```

### `'$dateOn'`

判断日期字段是否在某天内。

**示例**

```ts
books.find({
  filter: {
    createdAt: {
      $dateOn: '2021-01-01',
    }
  }
})
```

### `'$dateNotOn'`

判断日期字段是否不在某天内。

**示例**

```ts
books.find({
  filter: {
    createdAt: {
      $dateNotOn: '2021-01-01',
    }
  }
})
```

### `'$dateBefore'`

判断日期字段是否在某个值之前。相当于小于传入的日期值。

**示例**

```ts
books.find({
  filter: {
    createdAt: {
      $dateBefore: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### `'$dateNotBefore'`

判断日期字段是否不在某个值之前。相当于大于等于传入的日期值。

**示例**

```ts
books.find({
  filter: {
    createdAt: {
      $dateNotBefore: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### `'$dateAfter'`

判断日期字段是否在某个值之后。相当于大于传入的日期值。

**示例**

```ts
books.find({
  filter: {
    createdAt: {
      $dateAfter: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### `'$dateNotAfter'`

判断日期字段是否不在某个值之后。相当于小于等于传入的日期值。

**示例**

```ts
books.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    }
  }
})
```

### `'$match'`

判断数组字段的值是否匹配指定数组中的值。

**示例**

```ts
books.find({
  filter: {
    tags: {
      $match: ['文学', '历史'],
    }
  }
})
```

### `'$notMatch'`

判断数组字段的值是否不匹配指定数组中的值。

**示例**

```ts
books.find({
  filter: {
    tags: {
      $notMatch: ['文学', '历史'],
    }
  }
})
```

### `'$anyOf'`

判断数组字段的值是否包含指定数组中的任意值。

**示例**

```ts
books.find({
  filter: {
    tags: {
      $anyOf: ['文学', '历史'],
    }
  }
})
```

### `'$noneOf'`

判断数组字段的值是否不包含指定数组中的任意值。

**示例**

```ts
books.find({
  filter: {
    tags: {
      $noneOf: ['文学', '历史'],
    }
  }
})
```

### `'$arrayEmpty'`

判断数组字段是否为空。

**示例**

```ts
books.find({
  filter: {
    tags: {
      $arrayEmpty: true,
    }
  }
});
```

### `'$arrayNotEmpty'`

判断数组字段是否不为空。

**示例**

```ts
books.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    }
  }
});
```

### `'$empty'`

判断一般字段是否为空，如果是字符串字段，判断是否为空串，如果是数组字段，判断是否为空数组。

**示例**

```ts
books.find({
  filter: {
    title: {
      $empty: true,
    }
  }
});
```

### `'$notEmpty'`

判断一般字段是否不为空，如果是字符串字段，判断是否不为空串，如果是数组字段，判断是否不为空数组。

**示例**

```ts
books.find({
  filter: {
    title: {
      $notEmpty: true,
    }
  }
});
```
