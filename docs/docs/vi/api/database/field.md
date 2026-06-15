---
title: "Field"
description: "API Field của NocoBase Database: định nghĩa kiểu field của Collection, cấu hình field scalar, field quan hệ."
keywords: "Field API,định nghĩa field,kiểu field,field scalar,field quan hệ,NocoBase"
---

# Field

## Tổng quan

Lớp quản lý field của bảng dữ liệu (lớp trừu tượng). Đồng thời cũng là lớp cơ sở cho mọi kiểu field, các kiểu field khác đều được triển khai bằng cách kế thừa lớp này.

Cách tùy chỉnh field có thể tham khảo [Mở rộng kiểu field].

## Constructor

Thông thường nhà phát triển không gọi trực tiếp, mà chủ yếu gọi qua `db.collection({ fields: [] })` làm điểm vào ủy quyền.

Khi mở rộng field thì chủ yếu kế thừa lớp trừu tượng `Field`, sau đó đăng ký vào instance Database để triển khai.

**Chữ ký**

- `constructor(options: FieldOptions, context: FieldContext)`

**Tham số**

| Tên tham số          | Kiểu           | Giá trị mặc định | Mô tả                                       |
| -------------------- | -------------- | ---------------- | ------------------------------------------- |
| `options`            | `FieldOptions` | -                | Đối tượng cấu hình field                    |
| `options.name`       | `string`       | -                | Tên field                                   |
| `options.type`       | `string`       | -                | Kiểu field, tương ứng với tên kiểu field đã đăng ký trong db |
| `context`            | `FieldContext` | -                | Đối tượng ngữ cảnh field                    |
| `context.database`   | `Database`     | -                | Instance cơ sở dữ liệu                      |
| `context.collection` | `Collection`   | -                | Instance bảng dữ liệu                       |

## Thành viên của instance

### `name`

Tên field.

### `type`

Kiểu field.

### `dataType`

Kiểu lưu trữ trong cơ sở dữ liệu của field.

### `options`

Tham số cấu hình khởi tạo của field.

### `context`

Đối tượng ngữ cảnh field.

## Phương thức cấu hình

### `on()`

Cách định nghĩa nhanh dựa trên sự kiện bảng dữ liệu. Tương đương với `db.on(this.collection.name + '.' + eventName, listener)`.

Khi kế thừa thường không cần override phương thức này.

**Chữ ký**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Tham số**

| Tên tham số | Kiểu                       | Giá trị mặc định | Mô tả      |
| ----------- | -------------------------- | ---------------- | ---------- |
| `eventName` | `string`                   | -                | Tên sự kiện |
| `listener`  | `(...args: any[]) => void` | -                | Listener sự kiện |

### `off()`

Cách gỡ bỏ nhanh dựa trên sự kiện bảng dữ liệu. Tương đương với `db.off(this.collection.name + '.' + eventName, listener)`.

Khi kế thừa thường không cần override phương thức này.

**Chữ ký**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Tham số**

| Tên tham số | Kiểu                       | Giá trị mặc định | Mô tả      |
| ----------- | -------------------------- | ---------------- | ---------- |
| `eventName` | `string`                   | -                | Tên sự kiện |
| `listener`  | `(...args: any[]) => void` | -                | Listener sự kiện |

### `bind()`

Nội dung thực thi được kích hoạt khi field được thêm vào bảng dữ liệu. Thường dùng để thêm event listener cho bảng dữ liệu và các xử lý khác.

Khi kế thừa cần gọi `super.bind()` tương ứng trước.

**Chữ ký**

- `bind()`

### `unbind()`

Nội dung thực thi được kích hoạt khi field bị gỡ khỏi bảng dữ liệu. Thường dùng để gỡ event listener của bảng dữ liệu và các xử lý khác.

Khi kế thừa cần gọi `super.unbind()` tương ứng trước.

**Chữ ký**

- `unbind()`

### `get()`

Lấy giá trị của một tùy chọn cấu hình của field.

**Chữ ký**

- `get(key: string): any`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả      |
| ----------- | -------- | ---------------- | ---------- |
| `key`       | `string` | -                | Tên tùy chọn cấu hình |

**Ví dụ**

```ts
const field = db.collection('users').getField('name');

// Lấy giá trị của tùy chọn cấu hình tên field, trả về 'name'
console.log(field.get('name'));
```

### `merge()`

Merge giá trị của các tùy chọn cấu hình của field.

**Chữ ký**

- `merge(options: { [key: string]: any }): void`

**Tham số**

| Tên tham số | Kiểu                     | Giá trị mặc định | Mô tả                  |
| ----------- | ------------------------ | ---------------- | ---------------------- |
| `options`   | `{ [key: string]: any }` | -                | Đối tượng tùy chọn cấu hình cần merge |

**Ví dụ**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Thêm cấu hình index
  index: true,
});
```

### `remove()`

Gỡ field khỏi bảng dữ liệu (chỉ gỡ khỏi bộ nhớ).

**Ví dụ**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// really remove from db
await books.sync();
```

## Phương thức cơ sở dữ liệu

### `removeFromDb()`

Gỡ field khỏi cơ sở dữ liệu.

**Chữ ký**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Tham số**

| Tên tham số            | Kiểu          | Giá trị mặc định | Mô tả     |
| ---------------------- | ------------- | ---------------- | --------- |
| `options.transaction?` | `Transaction` | -                | Instance transaction |

### `existsInDb()`

Kiểm tra field có tồn tại trong cơ sở dữ liệu hay không.

**Chữ ký**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Tham số**

| Tên tham số            | Kiểu          | Giá trị mặc định | Mô tả     |
| ---------------------- | ------------- | ---------------- | --------- |
| `options.transaction?` | `Transaction` | -                | Instance transaction |

## Danh sách kiểu field có sẵn

NocoBase đã tích hợp sẵn một số kiểu field thường dùng, bạn có thể trực tiếp dùng tên type tương ứng để chỉ định kiểu khi định nghĩa field cho bảng dữ liệu. Cấu hình tham số của các kiểu field khác nhau là khác nhau, có thể tham khảo danh sách bên dưới.

Các tùy chọn cấu hình của tất cả các kiểu field, ngoài những phần được giới thiệu thêm ở dưới, đều được truyền thẳng đến Sequelize, nên mọi tùy chọn cấu hình mà Sequelize hỗ trợ đều có thể dùng ở đây (như `allowNull`, `defaultValue`, v.v.).

Ngoài ra, kiểu field phía server chủ yếu giải quyết vấn đề lưu trữ trong cơ sở dữ liệu và một phần thuật toán, không liên quan nhiều đến kiểu hiển thị field và component sử dụng ở phía frontend. Kiểu field phía frontend có thể tham khảo phần hướng dẫn tương ứng.

### `'boolean'`

Kiểu giá trị logic.

**Ví dụ**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Kiểu số nguyên (32 bit).

**Ví dụ**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Kiểu số nguyên lớn (64 bit).

**Ví dụ**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Kiểu số thực dấu chấm động độ chính xác kép (64 bit).

**Ví dụ**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Kiểu số thực (chỉ áp dụng cho PG).

### `'decimal'`

Kiểu số thập phân.

### `'string'`

Kiểu chuỗi. Tương đương với kiểu `VARCHAR` của hầu hết cơ sở dữ liệu.

**Ví dụ**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Kiểu văn bản. Tương đương với kiểu `TEXT` của hầu hết cơ sở dữ liệu.

**Ví dụ**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Kiểu mật khẩu (mở rộng của NocoBase). Mã hóa mật khẩu dựa trên phương thức `scrypt` của package crypto gốc trong Node.js.

**Ví dụ**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Độ dài, mặc định 64
      randomBytesSize: 8, // Độ dài byte ngẫu nhiên, mặc định 8
    },
  ],
});
```

**Tham số**

| Tên tham số       | Kiểu     | Giá trị mặc định | Mô tả             |
| ----------------- | -------- | ---------------- | ----------------- |
| `length`          | `number` | 64               | Độ dài ký tự      |
| `randomBytesSize` | `number` | 8                | Kích thước byte ngẫu nhiên |

### `'date'`

Kiểu ngày.

### `'time'`

Kiểu thời gian.

### `'array'`

Kiểu mảng (chỉ áp dụng cho PG).

### `'json'`

Kiểu JSON.

### `'jsonb'`

Kiểu JSONB (chỉ áp dụng cho PG, các DB khác sẽ tương thích thành kiểu `'json'`).

### `'uuid'`

Kiểu UUID.

### `'uid'`

Kiểu UID (mở rộng của NocoBase). Kiểu định danh chuỗi ngẫu nhiên ngắn.

### `'formula'`

Kiểu công thức (mở rộng của NocoBase). Có thể cấu hình tính toán công thức toán học dựa trên [mathjs](https://www.npmjs.com/package/mathjs), trong công thức có thể tham chiếu giá trị các cột khác trong cùng một bản ghi để tham gia tính toán.

**Ví dụ**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Kiểu radio (mở rộng của NocoBase). Trong toàn bộ bảng tối đa chỉ có một hàng có giá trị field này là `true`, các hàng khác đều là `false` hoặc `null`.

**Ví dụ**

Trong toàn hệ thống chỉ có một user được đánh dấu là root, sau khi giá trị root của một user khác được đổi thành `true`, mọi bản ghi khác có root là `true` đều sẽ bị đổi thành `false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Kiểu sắp xếp (mở rộng của NocoBase). Sắp xếp dựa trên số nguyên, tự động sinh số thứ tự mới cho bản ghi mới, sắp xếp lại số thứ tự khi di chuyển dữ liệu.

Nếu bảng dữ liệu định nghĩa tùy chọn `sortable`, field tương ứng cũng sẽ được tự động sinh ra.

**Ví dụ**

Bài viết có thể sắp xếp theo user sở hữu:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Sắp xếp các dữ liệu nhóm theo cùng giá trị userId
    },
  ],
});
```

### `'virtual'`

Kiểu virtual. Không lưu trữ dữ liệu thực tế, chỉ dùng khi định nghĩa getter/setter đặc biệt.

### `'belongsTo'`

Kiểu quan hệ nhiều-một. Khóa ngoại được lưu ở chính bảng, ngược với hasOne/hasMany.

**Ví dụ**

Mỗi bài viết thuộc về một tác giả nào đó:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Không cấu hình thì mặc định là tên bảng dạng số nhiều của name
      foreignKey: 'authorId', // Không cấu hình thì mặc định là <name> + Id
      sourceKey: 'id', // Không cấu hình thì mặc định là id của bảng target
    },
  ],
});
```

### `'hasOne'`

Kiểu quan hệ một-một. Khóa ngoại được lưu ở bảng quan hệ, ngược với belongsTo.

**Ví dụ**

Mỗi user đều có một thông tin cá nhân:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Có thể bỏ qua
    },
  ],
});
```

### `'hasMany'`

Kiểu quan hệ một-nhiều. Khóa ngoại được lưu ở bảng quan hệ, ngược với belongsTo.

**Ví dụ**

Mỗi user có thể sở hữu nhiều bài viết:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Kiểu quan hệ nhiều-nhiều. Dùng bảng trung gian để lưu khóa ngoại của hai bên. Nếu không chỉ định bảng đã tồn tại làm bảng trung gian, hệ thống sẽ tự động tạo bảng trung gian.

**Ví dụ**

Mỗi bài viết có thể gắn nhiều tag, mỗi tag cũng có thể được nhiều bài viết gắn vào:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Cùng tên có thể bỏ qua
      through: 'postsTags', // Bảng trung gian không cấu hình sẽ tự động sinh
      foreignKey: 'postId', // Khóa ngoại của chính bảng trong bảng trung gian
      sourceKey: 'id', // Khóa chính của chính bảng
      otherKey: 'tagId', // Khóa ngoại của bảng quan hệ trong bảng trung gian
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Cùng một nhóm quan hệ trỏ đến cùng một bảng trung gian
    },
  ],
});
```
