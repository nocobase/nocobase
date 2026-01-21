:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Các Toán Tử Lọc

Sử dụng trong tham số `filter` của các API như `find`, `findOne`, `findAndCount`, `count` của một Repository:

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

Để hỗ trợ chuyển đổi sang định dạng JSON, NocoBase định danh các toán tử truy vấn bằng một chuỗi có tiền tố `$`.

Ngoài ra, NocoBase còn cung cấp một API để mở rộng các toán tử. Vui lòng xem chi tiết tại [`db.registerOperators()`](../database#registeroperators).

## Các Toán Tử Chung

### `$eq`

Kiểm tra xem giá trị của trường có bằng giá trị được chỉ định hay không. Tương đương với toán tử `=` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

Tương đương với `title: '春秋'`.

### `$ne`

Kiểm tra xem giá trị của trường có không bằng giá trị được chỉ định hay không. Tương đương với toán tử `!=` trong SQL.

**Ví dụ**

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

Kiểm tra xem giá trị của trường có phải là giá trị được chỉ định hay không. Tương đương với toán tử `IS` trong SQL.

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

Kiểm tra xem giá trị của trường có không phải là giá trị được chỉ định hay không. Tương đương với toán tử `IS NOT` trong SQL.

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

Kiểm tra xem giá trị của trường có bằng giá trị của một trường khác hay không. Tương đương với toán tử `=` trong SQL.

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

Kiểm tra xem giá trị của trường có nằm trong mảng được chỉ định hay không. Tương đương với toán tử `IN` trong SQL.

**Ví dụ**

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

Kiểm tra xem giá trị của trường có không nằm trong mảng được chỉ định hay không. Tương đương với toán tử `NOT IN` trong SQL.

**Ví dụ**

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

Kiểm tra xem một trường thông thường có rỗng hay không. Đối với trường kiểu chuỗi, kiểm tra xem có phải là chuỗi rỗng không. Đối với trường kiểu mảng, kiểm tra xem có phải là mảng rỗng không.

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

Kiểm tra xem một trường thông thường có không rỗng hay không. Đối với trường kiểu chuỗi, kiểm tra xem có phải là chuỗi không rỗng không. Đối với trường kiểu mảng, kiểm tra xem có phải là mảng không rỗng không.

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

## Các Toán Tử Logic

### `$and`

Toán tử logic AND. Tương đương với toán tử `AND` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

Toán tử logic OR. Tương đương với toán tử `OR` trong SQL.

**Ví dụ**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## Các Toán Tử Trường Kiểu Boolean

Dùng cho các trường kiểu boolean `type: 'boolean'`

### `$isFalsy`

Kiểm tra xem giá trị của trường kiểu boolean có là falsy hay không. Các giá trị `false`, `0` và `NULL` của trường boolean đều được coi là `$isFalsy: true`.

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

Kiểm tra xem giá trị của trường kiểu boolean có là truly hay không. Các giá trị `true` và `1` của trường boolean đều được coi là `$isTruly: true`.

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

## Các Toán Tử Trường Kiểu Số

Dùng cho các trường kiểu số, bao gồm:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

Kiểm tra xem giá trị của trường có lớn hơn giá trị được chỉ định hay không. Tương đương với toán tử `>` trong SQL.

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

Kiểm tra xem giá trị của trường có lớn hơn hoặc bằng giá trị được chỉ định hay không. Tương đương với toán tử `>=` trong SQL.

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

Kiểm tra xem giá trị của trường có nhỏ hơn giá trị được chỉ định hay không. Tương đương với toán tử `<` trong SQL.

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

Kiểm tra xem giá trị của trường có nhỏ hơn hoặc bằng giá trị được chỉ định hay không. Tương đương với toán tử `<=` trong SQL.

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

Kiểm tra xem giá trị của trường có nằm giữa hai giá trị được chỉ định hay không. Tương đương với toán tử `BETWEEN` trong SQL.

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

Kiểm tra xem giá trị của trường có không nằm giữa hai giá trị được chỉ định hay không. Tương đương với toán tử `NOT BETWEEN` trong SQL.

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

## Các Toán Tử Trường Kiểu Chuỗi

Dùng cho các trường kiểu chuỗi, bao gồm `string`

### `$includes`

Kiểm tra xem trường kiểu chuỗi có chứa chuỗi con được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem trường kiểu chuỗi có không chứa chuỗi con được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem trường kiểu chuỗi có bắt đầu bằng chuỗi con được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem trường kiểu chuỗi có không bắt đầu bằng chuỗi con được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem trường kiểu chuỗi có kết thúc bằng chuỗi con được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem trường kiểu chuỗi có không kết thúc bằng chuỗi con được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem giá trị của trường có chứa chuỗi được chỉ định hay không. Tương đương với toán tử `LIKE` trong SQL.

**Ví dụ**

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

Kiểm tra xem giá trị của trường có không chứa chuỗi được chỉ định hay không. Tương đương với toán tử `NOT LIKE` trong SQL.

**Ví dụ**

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

Kiểm tra xem giá trị của trường có chứa chuỗi được chỉ định, không phân biệt chữ hoa chữ thường hay không. Tương đương với toán tử `ILIKE` trong SQL (chỉ áp dụng cho PostgreSQL).

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

Kiểm tra xem giá trị của trường có không chứa chuỗi được chỉ định, không phân biệt chữ hoa chữ thường hay không. Tương đương với toán tử `NOT ILIKE` trong SQL (chỉ áp dụng cho PostgreSQL).

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

Kiểm tra xem giá trị của trường có khớp với biểu thức chính quy được chỉ định hay không. Tương đương với toán tử `REGEXP` trong SQL (chỉ áp dụng cho PostgreSQL).

**Ví dụ**

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

Kiểm tra xem giá trị của trường có không khớp với biểu thức chính quy được chỉ định hay không. Tương đương với toán tử `NOT REGEXP` trong SQL (chỉ áp dụng cho PostgreSQL).

**Ví dụ**

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

Kiểm tra xem giá trị của trường có khớp với biểu thức chính quy được chỉ định, không phân biệt chữ hoa chữ thường hay không. Tương đương với toán tử `~*` trong SQL (chỉ áp dụng cho PostgreSQL).

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

Kiểm tra xem giá trị của trường có không khớp với biểu thức chính quy được chỉ định, không phân biệt chữ hoa chữ thường hay không. Tương đương với toán tử `!~*` trong SQL (chỉ áp dụng cho PostgreSQL).

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

## Các Toán Tử Trường Kiểu Ngày

Dùng cho các trường kiểu ngày `type: 'date'`

### `$dateOn`

Kiểm tra xem trường kiểu ngày có nằm trong một ngày cụ thể hay không.

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

Kiểm tra xem trường kiểu ngày có không nằm trong một ngày cụ thể hay không.

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

Kiểm tra xem trường kiểu ngày có trước một giá trị cụ thể hay không. Tương đương với việc nhỏ hơn giá trị ngày được cung cấp.

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

Kiểm tra xem trường kiểu ngày có không trước một giá trị cụ thể hay không. Tương đương với việc lớn hơn hoặc bằng giá trị ngày được cung cấp.

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

Kiểm tra xem trường kiểu ngày có sau một giá trị cụ thể hay không. Tương đương với việc lớn hơn giá trị ngày được cung cấp.

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

Kiểm tra xem trường kiểu ngày có không sau một giá trị cụ thể hay không. Tương đương với việc nhỏ hơn hoặc bằng giá trị ngày được cung cấp.

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

## Các Toán Tử Trường Kiểu Mảng

Dùng cho các trường kiểu mảng `type: 'array'`

### `$match`

Kiểm tra xem giá trị của trường kiểu mảng có khớp với các giá trị trong mảng được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem giá trị của trường kiểu mảng có không khớp với các giá trị trong mảng được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem giá trị của trường kiểu mảng có chứa bất kỳ giá trị nào trong mảng được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem giá trị của trường kiểu mảng có không chứa bất kỳ giá trị nào trong mảng được chỉ định hay không.

**Ví dụ**

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

Kiểm tra xem trường kiểu mảng có rỗng hay không.

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

Kiểm tra xem trường kiểu mảng có không rỗng hay không.

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

## Các Toán Tử Trường Kiểu Quan Hệ

Dùng để kiểm tra xem một quan hệ có tồn tại hay không. Các kiểu trường bao gồm:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

Dữ liệu quan hệ tồn tại

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

Không có dữ liệu quan hệ

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