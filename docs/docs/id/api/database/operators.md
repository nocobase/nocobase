:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Operator Filter

Digunakan dalam parameter `filter` pada API seperti `find`, `findOne`, `findAndCount`, `count` dari sebuah Repository:

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

Untuk mendukung serialisasi JSON, NocoBase mengidentifikasi operator kueri dengan string yang diawali dengan `$`.

Selain itu, NocoBase juga menyediakan API untuk memperluas operator. Lihat [`db.registerOperators()`](../database#registeroperators) untuk detailnya.

## Operator Umum

### `$eq`

Memeriksa apakah nilai kolom sama dengan nilai yang ditentukan. Setara dengan `=` pada SQL.

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

Memeriksa apakah nilai kolom tidak sama dengan nilai yang ditentukan. Setara dengan `!=` pada SQL.

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

Memeriksa apakah nilai kolom adalah nilai yang ditentukan. Setara dengan `IS` pada SQL.

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

Memeriksa apakah nilai kolom bukan nilai yang ditentukan. Setara dengan `IS NOT` pada SQL.

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

Memeriksa apakah nilai kolom sama dengan nilai kolom lain. Setara dengan `=` pada SQL.

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

Memeriksa apakah nilai kolom ada dalam array yang ditentukan. Setara dengan `IN` pada SQL.

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

Memeriksa apakah nilai kolom tidak ada dalam array yang ditentukan. Setara dengan `NOT IN` pada SQL.

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

Memeriksa apakah suatu kolom umum kosong. Untuk kolom string, operator ini memeriksa string kosong. Untuk kolom array, operator ini memeriksa array kosong.

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

Memeriksa apakah suatu kolom umum tidak kosong. Untuk kolom string, operator ini memeriksa string yang tidak kosong. Untuk kolom array, operator ini memeriksa array yang tidak kosong.

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

Logika AND. Setara dengan `AND` pada SQL.

**Contoh**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logika OR. Setara dengan `OR` pada SQL.

**Contoh**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Operator untuk Kolom Tipe Boolean

Untuk kolom boolean `type: 'boolean'`

### `$isFalsy`

Memeriksa apakah nilai kolom boolean adalah falsy. Nilai kolom boolean `false`, `0`, dan `NULL` semuanya akan dianggap `$isFalsy: true`.

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

Memeriksa apakah nilai kolom boolean adalah truly. Nilai kolom boolean `true` dan `1` semuanya akan dianggap `$isTruly: true`.

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

## Operator untuk Kolom Tipe Angka

Untuk kolom tipe angka, termasuk:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Memeriksa apakah nilai kolom lebih besar dari nilai yang ditentukan. Setara dengan `>` pada SQL.

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

Memeriksa apakah nilai kolom lebih besar dari atau sama dengan nilai yang ditentukan. Setara dengan `>=` pada SQL.

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

Memeriksa apakah nilai kolom lebih kecil dari nilai yang ditentukan. Setara dengan `<` pada SQL.

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

Memeriksa apakah nilai kolom lebih kecil dari atau sama dengan nilai yang ditentukan. Setara dengan `<=` pada SQL.

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

Memeriksa apakah nilai kolom berada di antara dua nilai yang ditentukan. Setara dengan `BETWEEN` pada SQL.

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

Memeriksa apakah nilai kolom tidak berada di antara dua nilai yang ditentukan. Setara dengan `NOT BETWEEN` pada SQL.

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

## Operator untuk Kolom Tipe String

Untuk kolom tipe string, termasuk `string`

### `$includes`

Memeriksa apakah kolom string mengandung substring yang ditentukan.

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

Memeriksa apakah kolom string tidak mengandung substring yang ditentukan.

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

Memeriksa apakah kolom string diawali dengan substring yang ditentukan.

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

Memeriksa apakah kolom string tidak diawali dengan substring yang ditentukan.

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

Memeriksa apakah kolom string diakhiri dengan substring yang ditentukan.

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

Memeriksa apakah kolom string tidak diakhiri dengan substring yang ditentukan.

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

Memeriksa apakah nilai kolom mengandung string yang ditentukan. Setara dengan `LIKE` pada SQL.

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

Memeriksa apakah nilai kolom tidak mengandung string yang ditentukan. Setara dengan `NOT LIKE` pada SQL.

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

Memeriksa apakah nilai kolom mengandung string yang ditentukan, tidak peka huruf besar/kecil. Setara dengan `ILIKE` pada SQL (hanya berlaku untuk PostgreSQL).

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

Memeriksa apakah nilai kolom tidak mengandung string yang ditentukan, tidak peka huruf besar/kecil. Setara dengan `NOT ILIKE` pada SQL (hanya berlaku untuk PostgreSQL).

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

Memeriksa apakah nilai kolom cocok dengan ekspresi reguler yang ditentukan. Setara dengan `REGEXP` pada SQL (hanya berlaku untuk PostgreSQL).

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

Memeriksa apakah nilai kolom tidak cocok dengan ekspresi reguler yang ditentukan. Setara dengan `NOT REGEXP` pada SQL (hanya berlaku untuk PostgreSQL).

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

Memeriksa apakah nilai kolom cocok dengan ekspresi reguler yang ditentukan, tidak peka huruf besar/kecil. Setara dengan `~*` pada SQL (hanya berlaku untuk PostgreSQL).

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

Memeriksa apakah nilai kolom tidak cocok dengan ekspresi reguler yang ditentukan, tidak peka huruf besar/kecil. Setara dengan `!~*` pada SQL (hanya berlaku untuk PostgreSQL).

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

## Operator untuk Kolom Tipe Tanggal

Untuk kolom tipe tanggal `type: 'date'`

### `$dateOn`

Memeriksa apakah kolom tanggal berada pada hari tertentu.

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

Memeriksa apakah kolom tanggal tidak berada pada hari tertentu.

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

Memeriksa apakah kolom tanggal sebelum nilai tertentu. Setara dengan lebih kecil dari nilai tanggal yang diberikan.

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

Memeriksa apakah kolom tanggal tidak sebelum nilai tertentu. Setara dengan lebih besar dari atau sama dengan nilai tanggal yang diberikan.

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

Memeriksa apakah kolom tanggal setelah nilai tertentu. Setara dengan lebih besar dari nilai tanggal yang diberikan.

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

Memeriksa apakah kolom tanggal tidak setelah nilai tertentu. Setara dengan lebih kecil dari atau sama dengan nilai tanggal yang diberikan.

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

## Operator untuk Kolom Tipe Array

Untuk kolom tipe array `type: 'array'`

### `$match`

Memeriksa apakah nilai kolom array cocok dengan nilai-nilai dalam array yang ditentukan.

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

Memeriksa apakah nilai kolom array tidak cocok dengan nilai-nilai dalam array yang ditentukan.

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

Memeriksa apakah nilai kolom array mengandung salah satu nilai dalam array yang ditentukan.

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

Memeriksa apakah nilai kolom array tidak mengandung nilai apa pun dalam array yang ditentukan.

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

Memeriksa apakah kolom array kosong.

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

Memeriksa apakah kolom array tidak kosong.

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

## Operator untuk Kolom Tipe Relasi

Digunakan untuk memeriksa apakah suatu relasi ada. Tipe kolom termasuk:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Data relasi ada

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

Data relasi tidak ada

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