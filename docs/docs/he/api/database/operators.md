:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# אופרטורים לסינון

אופרטורים אלו משמשים בפרמטר `filter` של ממשקי API כמו `find`, `findOne`, `findAndCount` ו-`count` של Repository:

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

כדי לתמוך בסריאליזציית JSON, NocoBase מזהה אופרטורי שאילתה באמצעות מחרוזת עם קידומת `$`.

בנוסף, NocoBase מספקת API להרחבת אופרטורים. לפרטים נוספים, ראו [`db.registerOperators()`](../database#registeroperators).

## אופרטורים כלליים

### `$eq`

בודק אם ערך השדה שווה לערך שצוין. שקול ל-`=` של SQL.

**דוגמה**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

שקול ל-`title: '春秋'`.

### `$ne`

בודק אם ערך השדה אינו שווה לערך שצוין. שקול ל-`!=` של SQL.

**דוגמה**

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

בודק אם ערך השדה הוא הערך שצוין. שקול ל-`IS` של SQL.

**דוגמה**

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

בודק אם ערך השדה אינו הערך שצוין. שקול ל-`IS NOT` של SQL.

**דוגמה**

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

בודק אם ערך השדה שווה לערך של שדה אחר. שקול ל-`=` של SQL.

**דוגמה**

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

בודק אם ערך השדה נמצא במערך שצוין. שקול ל-`IN` של SQL.

**דוגמה**

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

בודק אם ערך השדה אינו נמצא במערך שצוין. שקול ל-`NOT IN` של SQL.

**דוגמה**

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

בודק אם שדה כללי ריק. עבור שדה מסוג מחרוזת, בודק אם המחרוזת ריקה. עבור שדה מסוג מערך, בודק אם המערך ריק.

**דוגמה**

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

בודק אם שדה כללי אינו ריק. עבור שדה מסוג מחרוזת, בודק אם המחרוזת אינה ריקה. עבור שדה מסוג מערך, בודק אם המערך אינו ריק.

**דוגמה**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## אופרטורים לוגיים

### `$and`

AND לוגי. שקול ל-`AND` של SQL.

**דוגמה**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

OR לוגי. שקול ל-`OR` של SQL.

**דוגמה**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## אופרטורים לשדות בוליאניים

משמש עבור שדות בוליאניים `type: 'boolean'`

### `$isFalsy`

בודק אם ערך שדה בוליאני הוא "שקרי" (falsy). ערכי שדה של `false`, `0` ו-`NULL` ייחשבו כ-`$isFalsy: true`.

**דוגמה**

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

בודק אם ערך שדה בוליאני הוא "אמיתי" (truly). ערכי שדה של `true` ו-`1` ייחשבו כ-`$isTruly: true`.

**דוגמה**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## אופרטורים לשדות מספריים

משמש עבור שדות מספריים, כולל:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

בודק אם ערך השדה גדול מהערך שצוין. שקול ל-`>` של SQL.

**דוגמה**

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

בודק אם ערך השדה גדול או שווה לערך שצוין. שקול ל-`>=` של SQL.

**דוגמה**

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

בודק אם ערך השדה קטן מהערך שצוין. שקול ל-`<` של SQL.

**דוגמה**

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

בודק אם ערך השדה קטן או שווה לערך שצוין. שקול ל-`<=` של SQL.

**דוגמה**

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

בודק אם ערך השדה נמצא בין שני הערכים שצוינו. שקול ל-`BETWEEN` של SQL.

**דוגמה**

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

בודק אם ערך השדה אינו נמצא בין שני הערכים שצוינו. שקול ל-`NOT BETWEEN` של SQL.

**דוגמה**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## אופרטורים לשדות מחרוזת

משמש עבור שדות מחרוזת, כולל `string`

### `$includes`

בודק אם שדה המחרוזת מכיל את תת-המחרוזת שצוינה.

**דוגמה**

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

בודק אם שדה המחרוזת אינו מכיל את תת-המחרוזת שצוינה.

**דוגמה**

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

בודק אם שדה המחרוזת מתחיל בתת-המחרוזת שצוינה.

**דוגמה**

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

בודק אם שדה המחרוזת אינו מתחיל בתת-המחרוזת שצוינה.

**דוגמה**

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

בודק אם שדה המחרוזת מסתיים בתת-המחרוזת שצוינה.

**דוגמה**

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

בודק אם שדה המחרוזת אינו מסתיים בתת-המחרוזת שצוינה.

**דוגמה**

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

בודק אם ערך השדה מכיל את המחרוזת שצוינה. שקול ל-`LIKE` של SQL.

**דוגמה**

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

בודק אם ערך השדה אינו מכיל את המחרוזת שצוינה. שקול ל-`NOT LIKE` של SQL.

**דוגמה**

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

בודק אם ערך השדה מכיל את המחרוזת שצוינה, ללא התחשבות ברישיות. שקול ל-`ILIKE` של SQL (PostgreSQL בלבד).

**דוגמה**

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

בודק אם ערך השדה אינו מכיל את המחרוזת שצוינה, ללא התחשבות ברישיות. שקול ל-`NOT ILIKE` של SQL (PostgreSQL בלבד).

**דוגמה**

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

בודק אם ערך השדה תואם לביטוי הרגולרי שצוין. שקול ל-`REGEXP` של SQL (PostgreSQL בלבד).

**דוגמה**

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

בודק אם ערך השדה אינו תואם לביטוי הרגולרי שצוין. שקול ל-`NOT REGEXP` של SQL (PostgreSQL בלבד).

**דוגמה**

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

בודק אם ערך השדה תואם לביטוי הרגולרי שצוין, ללא התחשבות ברישיות. שקול ל-`~*` של SQL (PostgreSQL בלבד).

**דוגמה**

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

בודק אם ערך השדה אינו תואם לביטוי הרגולרי שצוין, ללא התחשבות ברישיות. שקול ל-`!~*` של SQL (PostgreSQL בלבד).

**דוגמה**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## אופרטורים לשדות תאריך

משמש עבור שדות תאריך `type: 'date'`

### `$dateOn`

בודק אם שדה התאריך חל ביום מסוים.

**דוגמה**

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

בודק אם שדה התאריך אינו חל ביום מסוים.

**דוגמה**

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

בודק אם שדה התאריך קודם לערך שצוין. שקול להיות קטן מערך התאריך שהועבר.

**דוגמה**

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

בודק אם שדה התאריך אינו קודם לערך שצוין. שקול להיות גדול או שווה לערך התאריך שהועבר.

**דוגמה**

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

בודק אם שדה התאריך מאוחר לערך שצוין. שקול להיות גדול מערך התאריך שהועבר.

**דוגמה**

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

בודק אם שדה התאריך אינו מאוחר לערך שצוין. שקול להיות קטן או שווה לערך התאריך שהועבר.

**דוגמה**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## אופרטורים לשדות מערך

משמש עבור שדות מערך `type: 'array'`

### `$match`

בודק אם ערך שדה המערך תואם לערכים במערך שצוין.

**דוגמה**

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

בודק אם ערך שדה המערך אינו תואם לערכים במערך שצוין.

**דוגמה**

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

בודק אם ערך שדה המערך מכיל אחד מהערכים שבמערך שצוין.

**דוגמה**

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

בודק אם ערך שדה המערך אינו מכיל אף אחד מהערכים שבמערך שצוין.

**דוגמה**

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

בודק אם שדה המערך ריק.

**דוגמה**

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

בודק אם שדה המערך אינו ריק.

**דוגמה**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## אופרטורים לשדות קשרים

משמש לבדיקה אם קיים קשר. סוגי השדות כוללים:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

נתוני קשר קיימים.

**דוגמה**

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

אין נתוני קשר.

**דוגמה**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```