:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Filtre Operatörleri

Repository'nin `find`, `findOne`, `findAndCount`, `count` gibi API'lerinin `filter` parametresinde kullanılır:

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

JSON serileştirmeyi desteklemek için NocoBase, sorgu operatörlerini `$` ön ekli bir dize olarak tanımlar.

Ayrıca, NocoBase operatörleri genişletmek için bir API sunar. Detaylar için [`db.registerOperators()`](../database#registeroperators) bölümüne bakabilirsiniz.

## Genel Operatörler

### `$eq`

Alan değerinin belirtilen değere eşit olup olmadığını kontrol eder. SQL'deki `=` ile aynıdır.

**Örnek**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

`title: '春秋'` ile eşdeğerdir.

### `$ne`

Alan değerinin belirtilen değere eşit olmadığını kontrol eder. SQL'deki `!=` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen değer olup olmadığını kontrol eder. SQL'deki `IS` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen değer olmadığını kontrol eder. SQL'deki `IS NOT` ile aynıdır.

**Örnek**

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

Alan değerinin başka bir alanın değerine eşit olup olmadığını kontrol eder. SQL'deki `=` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen dizide olup olmadığını kontrol eder. SQL'deki `IN` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen dizide olmadığını kontrol eder. SQL'deki `NOT IN` ile aynıdır.

**Örnek**

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

Genel bir alanın boş olup olmadığını kontrol eder. Bir dize alanı için boş dize, bir dizi alanı için boş dizi olup olmadığını kontrol eder.

**Örnek**

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

Genel bir alanın boş olmadığını kontrol eder. Bir dize alanı için boş olmayan dize, bir dizi alanı için boş olmayan dizi olup olmadığını kontrol eder.

**Örnek**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Mantıksal Operatörler

### `$and`

Mantıksal AND. SQL'deki `AND` ile aynıdır.

**Örnek**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Mantıksal OR. SQL'deki `OR` ile aynıdır.

**Örnek**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Boolean Alan Operatörleri

`type: 'boolean'` boolean alanlar için kullanılır.

### `$isFalsy`

Boolean alan değerinin 'falsy' olup olmadığını kontrol eder. `false`, `0` ve `NULL` boolean alan değerleri `$isFalsy: true` olarak kabul edilir.

**Örnek**

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

Boolean alan değerinin 'truthy' olup olmadığını kontrol eder. `true` ve `1` boolean alan değerleri `$isTruly: true` olarak kabul edilir.

**Örnek**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Sayısal Alan Operatörleri

Aşağıdaki sayısal alan tipleri için kullanılır:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Alan değerinin belirtilen değerden büyük olup olmadığını kontrol eder. SQL'deki `>` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen değere eşit veya ondan büyük olup olmadığını kontrol eder. SQL'deki `>=` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen değerden küçük olup olmadığını kontrol eder. SQL'deki `<` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen değere eşit veya ondan küçük olup olmadığını kontrol eder. SQL'deki `<=` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen iki değer arasında olup olmadığını kontrol eder. SQL'deki `BETWEEN` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen iki değer arasında olmadığını kontrol eder. SQL'deki `NOT BETWEEN` ile aynıdır.

**Örnek**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Dize Alan Operatörleri

`string` dahil olmak üzere dize alanları için kullanılır.

### `$includes`

Dize alanının belirtilen alt dizeyi içerip içermediğini kontrol eder.

**Örnek**

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

Dize alanının belirtilen alt dizeyi içermediğini kontrol eder.

**Örnek**

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

Dize alanının belirtilen alt dizeyle başlayıp başlamadığını kontrol eder.

**Örnek**

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

Dize alanının belirtilen alt dizeyle başlamadığını kontrol eder.

**Örnek**

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

Dize alanının belirtilen alt dizeyle bitip bitmediğini kontrol eder.

**Örnek**

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

Dize alanının belirtilen alt dizeyle bitmediğini kontrol eder.

**Örnek**

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

Alan değerinin belirtilen dizeyi içerip içermediğini kontrol eder. SQL'deki `LIKE` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen dizeyi içermediğini kontrol eder. SQL'deki `NOT LIKE` ile aynıdır.

**Örnek**

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

Alan değerinin belirtilen dizeyi büyük/küçük harf duyarlılığı olmadan içerip içermediğini kontrol eder. SQL'deki `ILIKE` ile aynıdır (yalnızca PostgreSQL için geçerlidir).

**Örnek**

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

Alan değerinin belirtilen dizeyi büyük/küçük harf duyarlılığı olmadan içermediğini kontrol eder. SQL'deki `NOT ILIKE` ile aynıdır (yalnızca PostgreSQL için geçerlidir).

**Örnek**

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

Alan değerinin belirtilen düzenli ifadeyle eşleşip eşleşmediğini kontrol eder. SQL'deki `REGEXP` ile aynıdır (yalnızca PostgreSQL için geçerlidir).

**Örnek**

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

Alan değerinin belirtilen düzenli ifadeyle eşleşmediğini kontrol eder. SQL'deki `NOT REGEXP` ile aynıdır (yalnızca PostgreSQL için geçerlidir).

**Örnek**

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

Alan değerinin belirtilen düzenli ifadeyle büyük/küçük harf duyarlılığı olmadan eşleşip eşleşmediğini kontrol eder. SQL'deki `~*` ile aynıdır (yalnızca PostgreSQL için geçerlidir).

**Örnek**

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

Alan değerinin belirtilen düzenli ifadeyle büyük/küçük harf duyarlılığı olmadan eşleşmediğini kontrol eder. SQL'deki `!~*` ile aynıdır (yalnızca PostgreSQL için geçerlidir).

**Örnek**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Tarih Alan Operatörleri

`type: 'date'` tarih alanları için kullanılır.

### `$dateOn`

Tarih alanının belirli bir günde olup olmadığını kontrol eder.

**Örnek**

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

Tarih alanının belirli bir günde olmadığını kontrol eder.

**Örnek**

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

Tarih alanının belirtilen bir değerden önce olup olmadığını kontrol eder. Sağlanan tarih değerinden küçük olmakla eşdeğerdir.

**Örnek**

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

Tarih alanının belirtilen bir değerden önce olmadığını kontrol eder. Sağlanan tarih değerinden büyük veya eşit olmakla eşdeğerdir.

**Örnek**

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

Tarih alanının belirtilen bir değerden sonra olup olmadığını kontrol eder. Sağlanan tarih değerinden büyük olmakla eşdeğerdir.

**Örnek**

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

Tarih alanının belirtilen bir değerden sonra olmadığını kontrol eder. Sağlanan tarih değerinden küçük veya eşit olmakla eşdeğerdir.

**Örnek**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Dizi Alan Operatörleri

`type: 'array'` dizi alanları için kullanılır.

### `$match`

Dizi alanının değerinin belirtilen dizideki değerlerle eşleşip eşleşmediğini kontrol eder.

**Örnek**

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

Dizi alanının değerinin belirtilen dizideki değerlerle eşleşmediğini kontrol eder.

**Örnek**

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

Dizi alanının değerinin belirtilen dizideki herhangi bir değeri içerip içermediğini kontrol eder.

**Örnek**

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

Dizi alanının değerinin belirtilen dizideki hiçbir değeri içermediğini kontrol eder.

**Örnek**

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

Dizi alanının boş olup olmadığını kontrol eder.

**Örnek**

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

Dizi alanının boş olmadığını kontrol eder.

**Örnek**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## İlişki Alan Operatörleri

Bir ilişkinin var olup olmadığını kontrol etmek için kullanılır. Alan tipleri şunlardır:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

İlişki verisi mevcut.

**Örnek**

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

İlişki verisi mevcut değil.

**Örnek**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```