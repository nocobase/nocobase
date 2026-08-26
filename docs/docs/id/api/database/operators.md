---
title: "Filter Operators"
description: "Operator filter Repository NocoBase: $eq, $ne, $in, $and, $or, dll, digunakan untuk parameter filter find/findOne."
keywords: "Operator Filter,$eq,$in,$and,$or,Repository query,parameter filter,NocoBase"
---

# Filter Operators

Digunakan dalam parameter filter dari API Repository seperti `find`, `findOne`, `findAndCount`, `count`:

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

Untuk mendukung JSON-ifikasi, di NocoBase operator query diidentifikasi sebagai string dengan prefix $.

Selain itu, NocoBase juga menyediakan API untuk memperluas operator, lihat [`db.registerOperators()`](../database#registeroperators).

## Operator Umum

### `$eq`

Memeriksa apakah nilai field sama dengan nilai yang ditentukan. Setara dengan `=` di SQL.

**Contoh**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Setara dengan `title: '春秋'`.

### `$ne`

Memeriksa apakah nilai field tidak sama dengan nilai yang ditentukan. Setara dengan `!=` di SQL.

**Contoh**

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

Memeriksa apakah nilai field adalah nilai yang ditentukan. Setara dengan `IS` di SQL.

**Contoh**

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

Memeriksa apakah nilai field bukan nilai yang ditentukan. Setara dengan `IS NOT` di SQL.

**Contoh**

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

Memeriksa apakah nilai field sama dengan nilai field lain. Setara dengan `=` di SQL.

**Contoh**

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

Memeriksa apakah nilai field ada dalam array yang ditentukan. Setara dengan `IN` di SQL.

**Contoh**

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

Memeriksa apakah nilai field tidak ada dalam array yang ditentukan. Setara dengan `NOT IN` di SQL.

**Contoh**

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

Memeriksa apakah field umum kosong, jika field string, memeriksa apakah string kosong, jika field array, memeriksa apakah array kosong.

**Contoh**

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

Memeriksa apakah field umum tidak kosong, jika field string, memeriksa apakah string tidak kosong, jika field array, memeriksa apakah array tidak kosong.

**Contoh**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Operator Logika

### `$and`

Logika AND. Setara dengan `AND` di SQL.

**Contoh**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logika OR. Setara dengan `OR` di SQL.

**Contoh**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operator Field Tipe Boolean

Digunakan untuk field tipe boolean `type: 'boolean'`

### `$isFalsy`

Memeriksa apakah nilai field tipe boolean adalah falsy. Field boolean dengan nilai `false`, `0` dan `NULL` semua akan dinilai sebagai `$isFalsy: true`.

**Contoh**

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

Memeriksa apakah nilai field tipe boolean adalah truly. Field boolean dengan nilai `true` dan `1` semua akan dinilai sebagai `$isTruly: true`.

**Contoh**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Operator Field Tipe Numerik

Digunakan untuk field tipe numerik, termasuk:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Memeriksa apakah nilai field lebih besar dari nilai yang ditentukan. Setara dengan `>` di SQL.

**Contoh**

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

Memeriksa apakah nilai field lebih besar atau sama dengan nilai yang ditentukan. Setara dengan `>=` di SQL.

**Contoh**

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

Memeriksa apakah nilai field lebih kecil dari nilai yang ditentukan. Setara dengan `<` di SQL.

**Contoh**

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

Memeriksa apakah nilai field lebih kecil atau sama dengan nilai yang ditentukan. Setara dengan `<=` di SQL.

**Contoh**

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

Memeriksa apakah nilai field di antara dua nilai yang ditentukan. Setara dengan `BETWEEN` di SQL.

**Contoh**

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

Memeriksa apakah nilai field tidak di antara dua nilai yang ditentukan. Setara dengan `NOT BETWEEN` di SQL.

**Contoh**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Operator Field Tipe String

Digunakan untuk field tipe string, termasuk `string`

### `$includes`

Memeriksa apakah field string berisi substring yang ditentukan.

**Contoh**

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

Memeriksa apakah field string tidak berisi substring yang ditentukan.

**Contoh**

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

Memeriksa apakah field string dimulai dengan substring yang ditentukan.

**Contoh**

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

Memeriksa apakah field string tidak dimulai dengan substring yang ditentukan.

**Contoh**

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

Memeriksa apakah field string diakhiri dengan substring yang ditentukan.

**Contoh**

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

Memeriksa apakah field string tidak diakhiri dengan substring yang ditentukan.

**Contoh**

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

Memeriksa apakah nilai field berisi string yang ditentukan. Setara dengan `LIKE` di SQL.

**Contoh**

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

Memeriksa apakah nilai field tidak berisi string yang ditentukan. Setara dengan `NOT LIKE` di SQL.

**Contoh**

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

Memeriksa apakah nilai field berisi string yang ditentukan, mengabaikan huruf besar/kecil. Setara dengan `ILIKE` di SQL (hanya berlaku untuk PG).

**Contoh**

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

Memeriksa apakah nilai field tidak berisi string yang ditentukan, mengabaikan huruf besar/kecil. Setara dengan `NOT ILIKE` di SQL (hanya berlaku untuk PG).

**Contoh**

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

Memeriksa apakah nilai field cocok dengan regular expression yang ditentukan. Setara dengan `REGEXP` di SQL (hanya berlaku untuk PG).

**Contoh**

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

Memeriksa apakah nilai field tidak cocok dengan regular expression yang ditentukan. Setara dengan `NOT REGEXP` di SQL (hanya berlaku untuk PG).

**Contoh**

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

Memeriksa apakah nilai field cocok dengan regular expression yang ditentukan, mengabaikan huruf besar/kecil. Setara dengan `~*` di SQL (hanya berlaku untuk PG).

**Contoh**

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

Memeriksa apakah nilai field tidak cocok dengan regular expression yang ditentukan, mengabaikan huruf besar/kecil. Setara dengan `!~*` di SQL (hanya berlaku untuk PG).

**Contoh**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Operator Field Tipe Tanggal

Digunakan untuk field tipe tanggal `type: 'date'`

### `$dateOn`

Memeriksa apakah field tanggal berada pada hari tertentu.

**Contoh**

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

Memeriksa apakah field tanggal tidak berada pada hari tertentu.

**Contoh**

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

Memeriksa apakah field tanggal berada sebelum nilai tertentu. Setara dengan lebih kecil dari nilai tanggal yang dimasukkan.

**Contoh**

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

Memeriksa apakah field tanggal tidak berada sebelum nilai tertentu. Setara dengan lebih besar atau sama dengan nilai tanggal yang dimasukkan.

**Contoh**

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

Memeriksa apakah field tanggal berada setelah nilai tertentu. Setara dengan lebih besar dari nilai tanggal yang dimasukkan.

**Contoh**

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

Memeriksa apakah field tanggal tidak berada setelah nilai tertentu. Setara dengan lebih kecil atau sama dengan nilai tanggal yang dimasukkan.

**Contoh**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Operator Field Tipe Array

Digunakan untuk field tipe array `type: 'array'`

### `$match`

Memeriksa apakah nilai field array cocok dengan nilai dalam array yang ditentukan.

**Contoh**

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

Memeriksa apakah nilai field array tidak cocok dengan nilai dalam array yang ditentukan.

**Contoh**

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

Memeriksa apakah nilai field array berisi salah satu nilai dalam array yang ditentukan.

**Contoh**

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

Memeriksa apakah nilai field array tidak berisi nilai apapun dalam array yang ditentukan.

**Contoh**

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

Memeriksa apakah field array kosong.

**Contoh**

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

Memeriksa apakah field array tidak kosong.

**Contoh**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Operator Tipe Field Relasi

Digunakan untuk memeriksa apakah relasi ada, tipe field meliputi:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Memiliki data relasi

**Contoh**

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

Tidak memiliki data relasi

**Contoh**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```
