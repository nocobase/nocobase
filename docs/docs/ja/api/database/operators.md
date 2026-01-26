:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# フィルター演算子

Repository の `find`、`findOne`、`findAndCount`、`count` といったAPIの `filter` パラメーターで使用します。

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

JSON形式に対応するため、NocoBaseではクエリ演算子を`$`プレフィックス付きの文字列として識別します。

また、NocoBaseでは演算子を拡張するためのAPIも提供しています。詳細は[`db.registerOperators()`](../database#registeroperators)をご覧ください。

## 一般的な演算子

### `$eq`

フィールドの値が指定された値と等しいかどうかを判定します。SQLの`=`に相当します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

`title: '春秋'` と同じ意味です。

### `$ne`

フィールドの値が指定された値と等しくないかどうかを判定します。SQLの`!=`に相当します。

**例**

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

フィールドの値が指定された値であるかどうかを判定します。SQLの`IS`に相当します。

**例**

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

フィールドの値が指定された値ではないかどうかを判定します。SQLの`IS NOT`に相当します。

**例**

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

フィールドの値が別のフィールドの値と等しいかどうかを判定します。SQLの`=`に相当します。

**例**

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

フィールドの値が指定された配列に含まれているかどうかを判定します。SQLの`IN`に相当します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $in: ['春秋', '戦国'],
    },
  },
});
```

### `$notIn`

フィールドの値が指定された配列に含まれていないかどうかを判定します。SQLの`NOT IN`に相当します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notIn: ['春秋', '戦国'],
    },
  },
});
```

### `$empty`

一般的なフィールドが空であるかどうかを判定します。文字列フィールドの場合は空文字列、配列フィールドの場合は空配列であるかを判定します。

**例**

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

一般的なフィールドが空ではないかどうかを判定します。文字列フィールドの場合は空文字列ではないか、配列フィールドの場合は空配列ではないかを判定します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## 論理演算子

### `$and`

論理AND。SQLの`AND`に相当します。

**例**

```ts
repository.find({
  filter: {
    $and: [{ title: '詩経' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

論理OR。SQLの`OR`に相当します。

**例**

```ts
repository.find({
  filter: {
    $or: [{ title: '詩経' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## ブール型フィールド演算子

`type: 'boolean'` のブール型フィールドで使用します。

### `$isFalsy`

ブール型フィールドの値が偽であるかどうかを判定します。フィールドの値が`false`、`0`、`NULL`のいずれかである場合、`$isFalsy: true`と判定されます。

**例**

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

ブール型フィールドの値が真であるかどうかを判定します。フィールドの値が`true`または`1`である場合、`$isTruly: true`と判定されます。

**例**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## 数値型フィールド演算子

以下の数値型フィールドで使用します。

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

フィールドの値が指定された値より大きいかどうかを判定します。SQLの`>`に相当します。

**例**

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

フィールドの値が指定された値以上であるかどうかを判定します。SQLの`>=`に相当します。

**例**

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

フィールドの値が指定された値未満であるかどうかを判定します。SQLの`<`に相当します。

**例**

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

フィールドの値が指定された値以下であるかどうかを判定します。SQLの`<=`に相当します。

**例**

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

フィールドの値が指定された2つの値の間にあるかどうかを判定します。SQLの`BETWEEN`に相当します。

**例**

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

フィールドの値が指定された2つの値の間にないかどうかを判定します。SQLの`NOT BETWEEN`に相当します。

**例**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## 文字列型フィールド演算子

`string` を含む文字列型フィールドで使用します。

### `$includes`

文字列フィールドが指定された部分文字列を含むかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $includes: '三字経',
    },
  },
});
```

### `$notIncludes`

文字列フィールドが指定された部分文字列を含まないかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notIncludes: '三字経',
    },
  },
});
```

### `$startsWith`

文字列フィールドが指定された部分文字列で始まるかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $startsWith: '三字経',
    },
  },
});
```

### `$notStartsWith`

文字列フィールドが指定された部分文字列で始まらないかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notStartsWith: '三字経',
    },
  },
});
```

### `$endsWith`

文字列フィールドが指定された部分文字列で終わるかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $endsWith: '三字経',
    },
  },
});
```

### `$notEndsWith`

文字列フィールドが指定された部分文字列で終わらないかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notEndsWith: '三字経',
    },
  },
});
```

### `$like`

フィールドの値が指定された文字列を含むかどうかを判定します。SQLの`LIKE`に相当します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $like: 'コンピューター',
    },
  },
});
```

### `$notLike`

フィールドの値が指定された文字列を含まないかどうかを判定します。SQLの`NOT LIKE`に相当します。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notLike: 'コンピューター',
    },
  },
});
```

### `$iLike`

フィールドの値が指定された文字列を大文字・小文字を区別せずに含むかどうかを判定します。SQLの`ILIKE`に相当します（PostgreSQLのみ対応）。

**例**

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

フィールドの値が指定された文字列を大文字・小文字を区別せずに含まないかどうかを判定します。SQLの`NOT ILIKE`に相当します（PostgreSQLのみ対応）。

**例**

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

フィールドの値が指定された正規表現に一致するかどうかを判定します。SQLの`REGEXP`に相当します（PostgreSQLのみ対応）。

**例**

```ts
repository.find({
  filter: {
    title: {
      $regexp: '^コンピューター',
    },
  },
});
```

### `$notRegexp`

フィールドの値が指定された正規表現に一致しないかどうかを判定します。SQLの`NOT REGEXP`に相当します（PostgreSQLのみ対応）。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notRegexp: '^コンピューター',
    },
  },
});
```

### `$iRegexp`

フィールドの値が指定された正規表現に大文字・小文字を区別せずに一致するかどうかを判定します。SQLの`~*`に相当します（PostgreSQLのみ対応）。

**例**

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

フィールドの値が指定された正規表現に大文字・小文字を区別せずに一致しないかどうかを判定します。SQLの`!~*`に相当します（PostgreSQLのみ対応）。

**例**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## 日付型フィールド演算子

`type: 'date'` の日付型フィールドで使用します。

### `$dateOn`

日付フィールドが特定の日付であるかどうかを判定します。

**例**

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

日付フィールドが特定の日付ではないかどうかを判定します。

**例**

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

日付フィールドが特定の値より前であるかどうかを判定します。これは、渡された日付値より小さいことに相当します。

**例**

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

日付フィールドが特定の値より前ではないかどうかを判定します。これは、渡された日付値以上であることに相当します。

**例**

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

日付フィールドが特定の値より後であるかどうかを判定します。これは、渡された日付値より大きいことに相当します。

**例**

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

日付フィールドが特定の値より後ではないかどうかを判定します。これは、渡された日付値以下であることに相当します。

**例**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## 配列型フィールド演算子

`type: 'array'` の配列型フィールドで使用します。

### `$match`

配列フィールドの値が指定された配列内の値と一致するかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    tags: {
      $match: ['文学', '歴史'],
    },
  },
});
```

### `$notMatch`

配列フィールドの値が指定された配列内の値と一致しないかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    tags: {
      $notMatch: ['文学', '歴史'],
    },
  },
});
```

### `$anyOf`

配列フィールドの値が指定された配列内のいずれかの値を含むかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    tags: {
      $anyOf: ['文学', '歴史'],
    },
  },
});
```

### `$noneOf`

配列フィールドの値が指定された配列内のどの値も含まないかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    tags: {
      $noneOf: ['文学', '歴史'],
    },
  },
});
```

### `$arrayEmpty`

配列フィールドが空であるかどうかを判定します。

**例**

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

配列フィールドが空ではないかどうかを判定します。

**例**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## 関連フィールド演算子

関連の有無を判定するために使用します。フィールドタイプは以下の通りです。

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

関連データが存在する場合。

**例**

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

関連データが存在しない場合。

**例**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```