:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# عوامل التصفية

تُستخدم في معامل `filter` لواجهات برمجة التطبيقات (APIs) مثل `find` و`findOne` و`findAndCount` و`count` الخاصة بـ Repository:

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

لدعم تسلسل JSON، تحدد NocoBase عوامل تشغيل الاستعلام بسلسلة نصية مسبوقة بعلامة `$` (دولار).

بالإضافة إلى ذلك، توفر NocoBase واجهة برمجة تطبيقات (API) لتوسيع عوامل التشغيل، للمزيد من التفاصيل، راجع [`db.registerOperators()`](../database#registeroperators).

## عوامل التشغيل العامة

### `$eq`

تتحقق مما إذا كانت قيمة الحقل تساوي القيمة المحددة. يكافئ `=` في SQL.

**مثال**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

يكافئ `title: '春秋'`.

### `$ne`

تتحقق مما إذا كانت قيمة الحقل لا تساوي القيمة المحددة. يكافئ `!=` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل هي القيمة المحددة. يكافئ `IS` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل ليست القيمة المحددة. يكافئ `IS NOT` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل تساوي قيمة حقل آخر. يكافئ `=` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل موجودة ضمن المصفوفة المحددة. يكافئ `IN` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل غير موجودة ضمن المصفوفة المحددة. يكافئ `NOT IN` في SQL.

**مثال**

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

تتحقق مما إذا كان الحقل فارغًا. بالنسبة لحقل السلسلة النصية، تتحقق مما إذا كان سلسلة نصية فارغة. وبالنسبة لحقل المصفوفة، تتحقق مما إذا كان مصفوفة فارغة.

**مثال**

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

تتحقق مما إذا كان الحقل غير فارغ. بالنسبة لحقل السلسلة النصية، تتحقق مما إذا كان سلسلة نصية غير فارغة. وبالنسبة لحقل المصفوفة، تتحقق مما إذا كان مصفوفة غير فارغة.

**مثال**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## عوامل التشغيل المنطقية

### `$and`

الربط المنطقي AND. يكافئ `AND` في SQL.

**مثال**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

الربط المنطقي OR. يكافئ `OR` في SQL.

**مثال**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## عوامل تشغيل الحقول المنطقية

تُستخدم لحقول النوع المنطقي `type: 'boolean'`

### `$isFalsy`

تتحقق مما إذا كانت قيمة حقل منطقي (Boolean) خاطئة (falsy). تُعتبر قيم الحقل المنطقي `false` و`0` و`NULL` كلها خاطئة عند استخدام `$isFalsy: true`.

**مثال**

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

تتحقق مما إذا كانت قيمة حقل منطقي (Boolean) صحيحة (truthy). تُعتبر قيم الحقل المنطقي `true` و`1` كلها صحيحة عند استخدام `$isTruly: true`.

**مثال**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## عوامل تشغيل الحقول الرقمية

تُستخدم لحقول النوع الرقمي، وتشمل:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

تتحقق مما إذا كانت قيمة الحقل أكبر من القيمة المحددة. يكافئ `>` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل أكبر من أو تساوي القيمة المحددة. يكافئ `>=` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل أصغر من القيمة المحددة. يكافئ `<` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل أصغر من أو تساوي القيمة المحددة. يكافئ `<=` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل تقع بين القيمتين المحددتين. يكافئ `BETWEEN` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل لا تقع بين القيمتين المحددتين. يكافئ `NOT BETWEEN` في SQL.

**مثال**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## عوامل تشغيل حقول السلسلة النصية

تُستخدم لحقول النوع النصي، وتشمل `string`

### `$includes`

تتحقق مما إذا كان حقل السلسلة النصية يحتوي على السلسلة الفرعية المحددة.

**مثال**

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

تتحقق مما إذا كان حقل السلسلة النصية لا يحتوي على السلسلة الفرعية المحددة.

**مثال**

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

تتحقق مما إذا كان حقل السلسلة النصية يبدأ بالسلسلة الفرعية المحددة.

**مثال**

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

تتحقق مما إذا كان حقل السلسلة النصية لا يبدأ بالسلسلة الفرعية المحددة.

**مثال**

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

تتحقق مما إذا كان حقل السلسلة النصية ينتهي بالسلسلة الفرعية المحددة.

**مثال**

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

تتحقق مما إذا كان حقل السلسلة النصية لا ينتهي بالسلسلة الفرعية المحددة.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل تحتوي على السلسلة النصية المحددة. يكافئ `LIKE` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل لا تحتوي على السلسلة النصية المحددة. يكافئ `NOT LIKE` في SQL.

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل تحتوي على السلسلة النصية المحددة، مع تجاهل حالة الأحرف. يكافئ `ILIKE` في SQL (ينطبق على PostgreSQL فقط).

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل لا تحتوي على السلسلة النصية المحددة، مع تجاهل حالة الأحرف. يكافئ `NOT ILIKE` في SQL (ينطبق على PostgreSQL فقط).

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل تطابق التعبير النمطي المحدد. يكافئ `REGEXP` في SQL (ينطبق على PostgreSQL فقط).

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل لا تطابق التعبير النمطي المحدد. يكافئ `NOT REGEXP` في SQL (ينطبق على PostgreSQL فقط).

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل تطابق التعبير النمطي المحدد، مع تجاهل حالة الأحرف. يكافئ `~*` في SQL (ينطبق على PostgreSQL فقط).

**مثال**

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

تتحقق مما إذا كانت قيمة الحقل لا تطابق التعبير النمطي المحدد، مع تجاهل حالة الأحرف. يكافئ `!~*` في SQL (ينطبق على PostgreSQL فقط).

**مثال**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## عوامل تشغيل حقول التاريخ

تُستخدم لحقول النوع التاريخي `type: 'date'`

### `$dateOn`

تتحقق مما إذا كان حقل التاريخ يقع في يوم معين.

**مثال**

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

تتحقق مما إذا كان حقل التاريخ لا يقع في يوم معين.

**مثال**

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

تتحقق مما إذا كان حقل التاريخ قبل قيمة محددة. يكافئ أن يكون أصغر من قيمة التاريخ المُمررة.

**مثال**

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

تتحقق مما إذا كان حقل التاريخ ليس قبل قيمة محددة. يكافئ أن يكون أكبر من أو يساوي قيمة التاريخ المُمررة.

**مثال**

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

تتحقق مما إذا كان حقل التاريخ بعد قيمة محددة. يكافئ أن يكون أكبر من قيمة التاريخ المُمررة.

**مثال**

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

تتحقق مما إذا كان حقل التاريخ ليس بعد قيمة محددة. يكافئ أن يكون أصغر من أو يساوي قيمة التاريخ المُمررة.

**مثال**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## عوامل تشغيل حقول المصفوفات

تُستخدم لحقول النوع المصفوفي `type: 'array'`

### `$match`

تتحقق مما إذا كانت قيمة حقل المصفوفة تطابق القيم الموجودة في المصفوفة المحددة.

**مثال**

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

تتحقق مما إذا كانت قيمة حقل المصفوفة لا تطابق القيم الموجودة في المصفوفة المحددة.

**مثال**

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

تتحقق مما إذا كانت قيمة حقل المصفوفة تحتوي على أي من القيم الموجودة في المصفوفة المحددة.

**مثال**

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

تتحقق مما إذا كانت قيمة حقل المصفوفة لا تحتوي على أي من القيم الموجودة في المصفوفة المحددة.

**مثال**

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

تتحقق مما إذا كان حقل المصفوفة فارغًا.

**مثال**

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

تتحقق مما إذا كان حقل المصفوفة غير فارغ.

**مثال**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## عوامل تشغيل حقول الارتباطات

تُستخدم للتحقق مما إذا كان الارتباط موجودًا، وتشمل أنواع الحقول:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

توجد بيانات ارتباط.

**مثال**

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

لا توجد بيانات ارتباط.

**مثال**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```