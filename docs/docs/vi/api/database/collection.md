---
title: "Collection"
description: "API Collection của NocoBase Database: định nghĩa model dữ liệu, field, index, quan hệ, cấu hình qua db.collection()."
keywords: "Collection,model dữ liệu,db.collection,định nghĩa field,Database API,NocoBase"
---

# Collection

## Tổng quan

`Collection` được dùng để định nghĩa model dữ liệu trong hệ thống, như tên model, field, index, quan hệ, v.v.
Thông thường gọi qua phương thức `collection` của instance `Database` làm điểm vào ủy quyền.

```javascript
const { Database } = require('@nocobase/database')

// Tạo instance cơ sở dữ liệu
const db = new Database({...});

// Định nghĩa model dữ liệu
db.collection({
  name: 'users',
  // Định nghĩa field của model
  fields: [
    // Field scalar
    {
      name: 'name',
      type: 'string',
    },

    // Field quan hệ
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Để biết thêm các kiểu field, vui lòng tham khảo [Fields](/api/database/field).

## Constructor

**Chữ ký**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Tham số**

| Tên tham số           | Kiểu                                                        | Giá trị mặc định | Mô tả                                                                                  |
| --------------------- | ----------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -                | Định danh collection                                                                   |
| `options.tableName?`  | `string`                                                    | -                | Tên bảng cơ sở dữ liệu, nếu không truyền sẽ dùng giá trị `options.name`                |
| `options.fields?`     | `FieldOptions[]`                                            | -                | Định nghĩa field, xem [Field](./field)                                                 |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -                | Kiểu Model của Sequelize, nếu dùng `string` thì tên model này phải đã được đăng ký trên db trước |
| `options.repository?` | `string \| RepositoryType`                                  | -                | Kiểu repository, nếu dùng `string` thì kiểu repository này phải đã được đăng ký trên db trước |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -                | Cấu hình field có thể sắp xếp dữ liệu, mặc định không sắp xếp                         |
| `options.autoGenId?`  | `boolean`                                                   | `true`           | Có tự động sinh khóa chính duy nhất hay không, mặc định `true`                          |
| `context.database`    | `Database`                                                  | -                | Cơ sở dữ liệu trong ngữ cảnh                                                            |

**Ví dụ**

Tạo bảng bài viết:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Instance cơ sở dữ liệu đã có
    database: db,
  },
);
```

## Thành viên của instance

### `options`

Tham số khởi tạo cấu hình bảng dữ liệu. Giống tham số `options` của constructor.

### `context`

Ngữ cảnh thuộc về của bảng dữ liệu hiện tại, hiện chủ yếu là instance cơ sở dữ liệu.

### `name`

Tên bảng dữ liệu.

### `db`

Instance cơ sở dữ liệu thuộc về.

### `filterTargetKey`

Tên field được dùng làm khóa chính.

### `isThrough`

Có phải là bảng trung gian hay không.

### `model`

Kiểu Model khớp với Sequelize.

### `repository`

Instance repository.

## Phương thức cấu hình field

### `getField()`

Lấy đối tượng field đã được định nghĩa với tên tương ứng trong bảng dữ liệu.

**Chữ ký**

- `getField(name: string): Field`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả     |
| ----------- | -------- | ---------------- | --------- |
| `name`      | `string` | -                | Tên field |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

Đặt field cho bảng dữ liệu.

**Chữ ký**

- `setField(name: string, options: FieldOptions): Field`

**Tham số**

| Tên tham số | Kiểu           | Giá trị mặc định | Mô tả                              |
| ----------- | -------------- | ---------------- | ---------------------------------- |
| `name`      | `string`       | -                | Tên field                          |
| `options`   | `FieldOptions` | -                | Cấu hình field, xem [Field](./field) |

**Ví dụ**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Đặt nhiều field hàng loạt cho bảng dữ liệu.

**Chữ ký**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Tham số**

| Tên tham số   | Kiểu             | Giá trị mặc định | Mô tả                              |
| ------------- | ---------------- | ---------------- | ---------------------------------- |
| `fields`      | `FieldOptions[]` | -                | Cấu hình field, xem [Field](./field) |
| `resetFields` | `boolean`        | `true`           | Có reset các field đã có hay không  |

**Ví dụ**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Gỡ đối tượng field đã được định nghĩa với tên tương ứng trong bảng dữ liệu.

**Chữ ký**

- `removeField(name: string): void | Field`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả     |
| ----------- | -------- | ---------------- | --------- |
| `name`      | `string` | -                | Tên field |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

Reset (làm sạch) các field của bảng dữ liệu.

**Chữ ký**

- `resetFields(): void`

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

Kiểm tra bảng dữ liệu có đối tượng field với tên tương ứng đã được định nghĩa hay không.

**Chữ ký**

- `hasField(name: string): boolean`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả     |
| ----------- | -------- | ---------------- | --------- |
| `name`      | `string` | -                | Tên field |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

Tìm đối tượng field thỏa điều kiện trong bảng dữ liệu.

**Chữ ký**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Tham số**

| Tên tham số | Kiểu                        | Giá trị mặc định | Mô tả          |
| ----------- | --------------------------- | ---------------- | -------------- |
| `predicate` | `(field: Field) => boolean` | -                | Điều kiện tìm  |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

Duyệt qua các đối tượng field trong bảng dữ liệu.

**Chữ ký**

- `forEachField(callback: (field: Field) => void): void`

**Tham số**

| Tên tham số | Kiểu                     | Giá trị mặc định | Mô tả     |
| ----------- | ------------------------ | ---------------- | --------- |
| `callback`  | `(field: Field) => void` | -                | Hàm callback |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## Phương thức cấu hình index

### `addIndex()`

Thêm index cho bảng dữ liệu.

**Chữ ký**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Tham số**

| Tên tham số | Kiểu                                                         | Giá trị mặc định | Mô tả                |
| ----------- | ------------------------------------------------------------ | ---------------- | -------------------- |
| `index`     | `string \| string[]`                                         | -                | Tên field cần index   |
| `index`     | `{ fields: string[], unique?: boolean, [key: string]: any }` | -                | Cấu hình đầy đủ      |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

Gỡ index của bảng dữ liệu.

**Chữ ký**

- `removeIndex(fields: string[])`

**Tham số**

| Tên tham số | Kiểu       | Giá trị mặc định | Mô tả                            |
| ----------- | ---------- | ---------------- | -------------------------------- |
| `fields`    | `string[]` | -                | Tổ hợp tên field cần gỡ index    |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## Phương thức cấu hình bảng

### `remove()`

Xóa bảng dữ liệu.

**Chữ ký**

- `remove(): void`

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Phương thức thao tác cơ sở dữ liệu

### `sync()`

Đồng bộ định nghĩa bảng dữ liệu vào cơ sở dữ liệu. Ngoài logic mặc định của `Model.sync` trong Sequelize, sẽ đồng thời xử lý các bảng dữ liệu tương ứng với field quan hệ.

**Chữ ký**

- `sync(): Promise<void>`

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

Kiểm tra bảng dữ liệu có tồn tại trong cơ sở dữ liệu hay không.

**Chữ ký**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Tham số**

| Tên tham số            | Kiểu          | Giá trị mặc định | Mô tả     |
| ---------------------- | ------------- | ---------------- | --------- |
| `options?.transaction` | `Transaction` | -                | Instance transaction |

**Ví dụ**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Chữ ký**

- `removeFromDb(): Promise<void>`

**Ví dụ**

```ts
const books = db.collection({
  name: 'books',
});

// Đồng bộ bảng books vào cơ sở dữ liệu
await db.sync();

// Xóa bảng books trong cơ sở dữ liệu
await books.removeFromDb();
```
