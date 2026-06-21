---
title: "Filter Operators"
description: "Toán tử lọc Repository của NocoBase: $eq, $ne, $in, $and, $or, v.v., dùng trong tham số filter của find/findOne."
keywords: "Toán tử Filter,$eq,$in,$and,$or,truy vấn Repository,tham số filter,NocoBase"
---

# Filter Operators

Dùng trong tham số filter của các API như `find`, `findOne`, `findAndCount`, `count` của Repository:

```ts
const repository = db.getRepository('books');

repository.find({
  filter: {
    title: {
      $eq: 'Xuân Thu',
    },
  },
});
```

Để hỗ trợ JSON hóa, NocoBase đánh dấu các toán tử truy vấn bằng chuỗi có tiền tố $.

Ngoài ra, NocoBase cũng cung cấp API mở rộng toán tử, xem chi tiết tại [`db.registerOperators()`](../database#registeroperators).

## Toán tử chung

### `$eq`

Kiểm tra giá trị field có bằng giá trị chỉ định không. Tương đương với `=` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $eq: 'Xuân Thu',
    },
  },
});
```

Tương đương với `title: 'Xuân Thu'`.

### `$ne`

Kiểm tra giá trị field có khác giá trị chỉ định không. Tương đương với `!=` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $ne: 'Xuân Thu',
    },
  },
});
```

### `$is`

Kiểm tra giá trị field có phải là giá trị chỉ định không. Tương đương với `IS` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có không phải là giá trị chỉ định không. Tương đương với `IS NOT` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có bằng giá trị của field khác không. Tương đương với `=` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có nằm trong mảng chỉ định không. Tương đương với `IN` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $in: ['Xuân Thu', 'Chiến Quốc'],
    },
  },
});
```

### `$notIn`

Kiểm tra giá trị field có không nằm trong mảng chỉ định không. Tương đương với `NOT IN` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notIn: ['Xuân Thu', 'Chiến Quốc'],
    },
  },
});
```

### `$empty`

Kiểm tra field thông thường có rỗng không, nếu là field chuỗi thì kiểm tra có phải chuỗi rỗng không, nếu là field mảng thì kiểm tra có phải mảng rỗng không.

**Ví dụ**

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

Kiểm tra field thông thường có không rỗng không, nếu là field chuỗi thì kiểm tra có khác chuỗi rỗng không, nếu là field mảng thì kiểm tra có khác mảng rỗng không.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## Toán tử logic

### `$and`

Logic AND. Tương đương với `AND` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    $and: [{ title: 'Kinh Thi' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Logic OR. Tương đương với `OR` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    $or: [{ title: 'Kinh Thi' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Toán tử cho field kiểu boolean

Dùng cho field kiểu boolean `type: 'boolean'`.

### `$isFalsy`

Kiểm tra giá trị field boolean có là sai không. Giá trị field boolean là `false`, `0` và `NULL` đều được coi là `$isFalsy: true`.

**Ví dụ**

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

Kiểm tra giá trị field boolean có là đúng không. Giá trị field boolean là `true` và `1` đều được coi là `$isTruly: true`.

**Ví dụ**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## Toán tử cho field kiểu số

Dùng cho field kiểu số, gồm:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Kiểm tra giá trị field có lớn hơn giá trị chỉ định không. Tương đương với `>` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có lớn hơn hoặc bằng giá trị chỉ định không. Tương đương với `>=` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có nhỏ hơn giá trị chỉ định không. Tương đương với `<` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có nhỏ hơn hoặc bằng giá trị chỉ định không. Tương đương với `<=` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có nằm giữa hai giá trị chỉ định không. Tương đương với `BETWEEN` trong SQL.

**Ví dụ**

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

Kiểm tra giá trị field có không nằm giữa hai giá trị chỉ định không. Tương đương với `NOT BETWEEN` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## Toán tử cho field kiểu chuỗi

Dùng cho field kiểu chuỗi, gồm `string`.

### `$includes`

Kiểm tra field chuỗi có chứa chuỗi con chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $includes: 'Tam Tự Kinh',
    },
  },
});
```

### `$notIncludes`

Kiểm tra field chuỗi có không chứa chuỗi con chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notIncludes: 'Tam Tự Kinh',
    },
  },
});
```

### `$startsWith`

Kiểm tra field chuỗi có bắt đầu bằng chuỗi con chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $startsWith: 'Tam Tự Kinh',
    },
  },
});
```

### `$notStatsWith`

Kiểm tra field chuỗi có không bắt đầu bằng chuỗi con chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notStatsWith: 'Tam Tự Kinh',
    },
  },
});
```

### `$endsWith`

Kiểm tra field chuỗi có kết thúc bằng chuỗi con chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $endsWith: 'Tam Tự Kinh',
    },
  },
});
```

### `$notEndsWith`

Kiểm tra field chuỗi có không kết thúc bằng chuỗi con chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notEndsWith: 'Tam Tự Kinh',
    },
  },
});
```

### `$like`

Kiểm tra giá trị field có chứa chuỗi chỉ định không. Tương đương với `LIKE` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $like: 'máy tính',
    },
  },
});
```

### `$notLike`

Kiểm tra giá trị field có không chứa chuỗi chỉ định không. Tương đương với `NOT LIKE` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notLike: 'máy tính',
    },
  },
});
```

### `$iLike`

Kiểm tra giá trị field có chứa chuỗi chỉ định không, không phân biệt hoa thường. Tương đương với `ILIKE` trong SQL (chỉ áp dụng cho PG).

**Ví dụ**

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

Kiểm tra giá trị field có không chứa chuỗi chỉ định không, không phân biệt hoa thường. Tương đương với `NOT ILIKE` trong SQL (chỉ áp dụng cho PG).

**Ví dụ**

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

Kiểm tra giá trị field có khớp regex chỉ định không. Tương đương với `REGEXP` trong SQL (chỉ áp dụng cho PG).

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $regexp: '^máy tính',
    },
  },
});
```

### `$notRegexp`

Kiểm tra giá trị field có không khớp regex chỉ định không. Tương đương với `NOT REGEXP` trong SQL (chỉ áp dụng cho PG).

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notRegexp: '^máy tính',
    },
  },
});
```

### `$iRegexp`

Kiểm tra giá trị field có khớp regex chỉ định không, không phân biệt hoa thường. Tương đương với `~*` trong SQL (chỉ áp dụng cho PG).

**Ví dụ**

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

Kiểm tra giá trị field có không khớp regex chỉ định không, không phân biệt hoa thường. Tương đương với `!~*` trong SQL (chỉ áp dụng cho PG).

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## Toán tử cho field kiểu ngày

Dùng cho field kiểu ngày `type: 'date'`.

### `$dateOn`

Kiểm tra field ngày có nằm trong một ngày nào đó không.

**Ví dụ**

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

Kiểm tra field ngày có không nằm trong một ngày nào đó không.

**Ví dụ**

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

Kiểm tra field ngày có trước một giá trị nào đó không. Tương đương với nhỏ hơn giá trị ngày được truyền vào.

**Ví dụ**

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

Kiểm tra field ngày có không trước một giá trị nào đó không. Tương đương với lớn hơn hoặc bằng giá trị ngày được truyền vào.

**Ví dụ**

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

Kiểm tra field ngày có sau một giá trị nào đó không. Tương đương với lớn hơn giá trị ngày được truyền vào.

**Ví dụ**

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

Kiểm tra field ngày có không sau một giá trị nào đó không. Tương đương với nhỏ hơn hoặc bằng giá trị ngày được truyền vào.

**Ví dụ**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## Toán tử cho field kiểu mảng

Dùng cho field kiểu mảng `type: 'array'`.

### `$match`

Kiểm tra giá trị field mảng có khớp với giá trị trong mảng chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    tags: {
      $match: ['Văn học', 'Lịch sử'],
    },
  },
});
```

### `$notMatch`

Kiểm tra giá trị field mảng có không khớp với giá trị trong mảng chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    tags: {
      $notMatch: ['Văn học', 'Lịch sử'],
    },
  },
});
```

### `$anyOf`

Kiểm tra giá trị field mảng có chứa bất kỳ giá trị nào trong mảng chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    tags: {
      $anyOf: ['Văn học', 'Lịch sử'],
    },
  },
});
```

### `$noneOf`

Kiểm tra giá trị field mảng có không chứa bất kỳ giá trị nào trong mảng chỉ định không.

**Ví dụ**

```ts
repository.find({
  filter: {
    tags: {
      $noneOf: ['Văn học', 'Lịch sử'],
    },
  },
});
```

### `$arrayEmpty`

Kiểm tra field mảng có rỗng không.

**Ví dụ**

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

Kiểm tra field mảng có không rỗng không.

**Ví dụ**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## Toán tử cho field kiểu quan hệ

Dùng để kiểm tra quan hệ có tồn tại hay không, các kiểu field gồm:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Có dữ liệu quan hệ.

**Ví dụ**

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

Không có dữ liệu quan hệ.

**Ví dụ**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```
