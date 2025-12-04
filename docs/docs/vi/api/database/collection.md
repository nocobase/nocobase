:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# bộ sưu tập

## Tổng quan

`Collection` được dùng để định nghĩa các mô hình dữ liệu trong hệ thống, chẳng hạn như tên mô hình, trường, chỉ mục, liên kết và các thông tin khác.
Thông thường, nó được gọi thông qua phương thức `collection` của một thể hiện `Database` như một điểm truy cập ủy quyền.

```javascript
const { Database } = require('@nocobase/database')

// Tạo một thể hiện cơ sở dữ liệu
const db = new Database({...});

// Định nghĩa một mô hình dữ liệu
db.collection({
  name: 'users',
  // Định nghĩa các trường của mô hình
  fields: [
    // Trường vô hướng
    {
      name: 'name',
      type: 'string',
    },

    // Trường liên kết
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Để biết thêm các loại trường, vui lòng tham khảo [Trường](/api/database/field).

## Hàm tạo

**Chữ ký**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Tham số**

| Tham số               | Kiểu                                                        | Giá trị mặc định | Mô tả                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | Định danh của bộ sưu tập                                                                        |
| `options.tableName?`  | `string`                                                    | -      | Tên bảng cơ sở dữ liệu. Nếu không cung cấp, giá trị của `options.name` sẽ được sử dụng.            |
| `options.fields?`     | `FieldOptions[]`                                            | -      | Định nghĩa trường. Xem chi tiết tại [Trường](./field).                                                        |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Kiểu Model của Sequelize. Nếu sử dụng `string`, tên mô hình phải được đăng ký trước đó trên `db`. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | Kiểu kho dữ liệu (repository). Nếu sử dụng `string`, kiểu kho dữ liệu phải được đăng ký trước đó trên `db`.                |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | Cấu hình trường có thể sắp xếp. Mặc định không sắp xếp.                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | Có tự động tạo khóa chính duy nhất hay không. Mặc định là `true`.                                                    |
| `context.database`    | `Database`                                                  | -      | Cơ sở dữ liệu trong ngữ cảnh hiện tại.                                                                 |

**Ví dụ**

Tạo một bộ sưu tập bài viết:

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
    // Thể hiện cơ sở dữ liệu hiện có
    database: db,
  },
);
```

## Thành viên thể hiện

### `options`

Các tham số cấu hình ban đầu cho bộ sưu tập. Giống với tham số `options` của hàm tạo.

### `context`

Ngữ cảnh mà bộ sưu tập hiện tại thuộc về, hiện tại chủ yếu là thể hiện cơ sở dữ liệu.

### `name`

Tên bộ sưu tập.

### `db`

Thể hiện cơ sở dữ liệu mà nó thuộc về.

### `filterTargetKey`

Tên trường được sử dụng làm khóa chính.

### `isThrough`

Có phải là bảng trung gian hay không.

### `model`

Khớp với kiểu Model của Sequelize.

### `repository`

Thể hiện kho dữ liệu (repository).

## Phương thức cấu hình trường

### `getField()`

Lấy đối tượng trường có tên tương ứng đã được định nghĩa trong bộ sưu tập.

**Chữ ký**

- `getField(name: string): Field`

**Tham số**

| Tham số | Kiểu     | Giá trị mặc định | Mô tả     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Tên trường |

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

Đặt một trường cho bộ sưu tập.

**Chữ ký**

- `setField(name: string, options: FieldOptions): Field`

**Tham số**

| Tham số   | Kiểu           | Giá trị mặc định | Mô tả                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | Tên trường                        |
| `options` | `FieldOptions` | -      | Cấu hình trường. Xem chi tiết tại [Trường](./field). |

**Ví dụ**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Đặt nhiều trường cho bộ sưu tập theo lô.

**Chữ ký**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Tham số**

| Tham số       | Kiểu             | Giá trị mặc định | Mô tả                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | Cấu hình trường. Xem chi tiết tại [Trường](./field). |
| `resetFields` | `boolean`        | `true` | Có đặt lại các trường hiện có hay không.            |

**Ví dụ**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Xóa đối tượng trường có tên tương ứng đã được định nghĩa trong bộ sưu tập.

**Chữ ký**

- `removeField(name: string): void | Field`

**Tham số**

| Tham số | Kiểu     | Giá trị mặc định | Mô tả     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Tên trường |

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

Đặt lại (xóa) các trường của bộ sưu tập.

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

Kiểm tra xem bộ sưu tập có định nghĩa đối tượng trường với tên tương ứng hay không.

**Chữ ký**

- `hasField(name: string): boolean`

**Tham số**

| Tham số | Kiểu     | Giá trị mặc định | Mô tả     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Tên trường |

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

Tìm một đối tượng trường trong bộ sưu tập đáp ứng các tiêu chí.

**Chữ ký**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Tham số**

| Tham số     | Kiểu                        | Giá trị mặc định | Mô tả     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | Tiêu chí tìm kiếm |

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

Lặp qua các đối tượng trường trong bộ sưu tập.

**Chữ ký**

- `forEachField(callback: (field: Field) => void): void`

**Tham số**

| Tham số    | Kiểu                     | Giá trị mặc định | Mô tả     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | Hàm callback |

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

## Phương thức cấu hình chỉ mục

### `addIndex()`

Thêm một chỉ mục vào bộ sưu tập.

**Chữ ký**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Tham số**

| Tham số | Kiểu                                                         | Giá trị mặc định | Mô tả                                |
| ------- | ------------------------------------------------------------ | ------ | ------------------------------------ |
| `index` | `string \| string[]`                                         | -      | Tên trường (hoặc các trường) cần cấu hình chỉ mục |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | Cấu hình đầy đủ                      |

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

Xóa một chỉ mục khỏi bộ sưu tập.

**Chữ ký**

- `removeIndex(fields: string[])`

**Tham số**

| Tham số  | Kiểu       | Giá trị mặc định | Mô tả                            |
| -------- | ---------- | ------ | -------------------------------- |
| `fields` | `string[]` | -      | Tổ hợp tên trường cho chỉ mục cần xóa |

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

## Phương thức cấu hình bộ sưu tập

### `remove()`

Xóa bộ sưu tập.

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

Đồng bộ hóa định nghĩa bộ sưu tập vào cơ sở dữ liệu. Ngoài logic mặc định của `Model.sync` trong Sequelize, phương thức này cũng xử lý các bộ sưu tập tương ứng với các trường liên kết.

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

Kiểm tra xem bộ sưu tập có tồn tại trong cơ sở dữ liệu hay không.

**Chữ ký**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Tham số**

| Tham số                | Kiểu          | Giá trị mặc định | Mô tả     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | Thể hiện giao dịch |

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

// Đồng bộ hóa bộ sưu tập sách vào cơ sở dữ liệu
await db.sync();

// Xóa bộ sưu tập sách khỏi cơ sở dữ liệu
await books.removeFromDb();
```