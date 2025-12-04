:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trường

## Tổng quan

Đây là lớp quản lý trường của bộ sưu tập (lớp trừu tượng). Đồng thời, nó là lớp cơ sở cho tất cả các loại trường. Bất kỳ loại trường nào khác đều được triển khai bằng cách kế thừa lớp này.

Để biết cách tùy chỉnh trường, bạn có thể tham khảo [Mở rộng loại trường]

## Hàm khởi tạo

Thông thường, hàm này không được các nhà phát triển gọi trực tiếp, mà chủ yếu được gọi thông qua phương thức `db.collection({ fields: [] })` như một điểm truy cập ủy quyền.

Khi mở rộng một trường, bạn chủ yếu triển khai bằng cách kế thừa lớp trừu tượng `Field`, sau đó đăng ký nó vào thể hiện của Database.

**Chữ ký**

- `constructor(options: FieldOptions, context: FieldContext)`

**Tham số**

| Tham số              | Kiểu           | Mặc định | Mô tả                                          |
| -------------------- | -------------- | -------- | ---------------------------------------------- |
| `options`            | `FieldOptions` | -        | Đối tượng cấu hình trường                      |
| `options.name`       | `string`       | -        | Tên trường                                     |
| `options.type`       | `string`       | -        | Loại trường, tương ứng với tên loại trường đã đăng ký trong db |
| `context`            | `FieldContext` | -        | Đối tượng ngữ cảnh trường                      |
| `context.database`   | `Database`     | -        | Thể hiện của Database                          |
| `context.collection` | `Collection`   | -        | Thể hiện của bộ sưu tập                        |

## Thành viên thể hiện

### `name`

Tên trường.

### `type`

Loại trường.

### `dataType`

Kiểu lưu trữ trường trong cơ sở dữ liệu.

### `options`

Các tham số cấu hình khởi tạo trường.

### `context`

Đối tượng ngữ cảnh trường.

## Phương thức cấu hình

### `on()`

Đây là phương thức định nghĩa nhanh dựa trên các sự kiện của bộ sưu tập. Tương đương với `db.on(this.collection.name + '.' + eventName, listener)`.

Khi kế thừa, bạn thường không cần ghi đè phương thức này.

**Chữ ký**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Tham số**

| Tham số     | Kiểu                       | Mặc định | Mô tả            |
| ----------- | -------------------------- | -------- | ---------------- |
| `eventName` | `string`                   | -        | Tên sự kiện      |
| `listener`  | `(...args: any[]) => void` | -        | Trình lắng nghe sự kiện |

### `off()`

Đây là phương thức xóa nhanh dựa trên các sự kiện của bộ sưu tập. Tương đương với `db.off(this.collection.name + '.' + eventName, listener)`.

Khi kế thừa, bạn thường không cần ghi đè phương thức này.

**Chữ ký**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Tham số**

| Tham số     | Kiểu                       | Mặc định | Mô tả            |
| ----------- | -------------------------- | -------- | ---------------- |
| `eventName` | `string`                   | -        | Tên sự kiện      |
| `listener`  | `(...args: any[]) => void` | -        | Trình lắng nghe sự kiện |

### `bind()`

Nội dung được thực thi khi một trường được thêm vào bộ sưu tập. Thường được dùng để thêm trình lắng nghe sự kiện của bộ sưu tập và các xử lý khác.

Khi kế thừa, bạn cần gọi phương thức `super.bind()` tương ứng trước.

**Chữ ký**

- `bind()`

### `unbind()`

Nội dung được thực thi khi một trường bị xóa khỏi bộ sưu tập. Thường được dùng để xóa trình lắng nghe sự kiện của bộ sưu tập và các xử lý khác.

Khi kế thừa, bạn cần gọi phương thức `super.unbind()` tương ứng trước.

**Chữ ký**

- `unbind()`

### `get()`

Lấy giá trị của một mục cấu hình của trường.

**Chữ ký**

- `get(key: string): any`

**Tham số**

| Tham số | Kiểu     | Mặc định | Mô tả          |
| ------ | -------- | -------- | -------------- |
| `key`  | `string` | -        | Tên mục cấu hình |

**Ví dụ**

```ts
const field = db.collection('users').getField('name');

// Lấy giá trị của mục cấu hình tên trường, trả về 'name'
console.log(field.get('name'));
```

### `merge()`

Hợp nhất các giá trị của các mục cấu hình của trường.

**Chữ ký**

- `merge(options: { [key: string]: any }): void`

**Tham số**

| Tham số   | Kiểu                     | Mặc định | Mô tả                      |
| --------- | ------------------------ | -------- | -------------------------- |
| `options` | `{ [key: string]: any }` | -        | Đối tượng mục cấu hình cần hợp nhất |

**Ví dụ**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Thêm một cấu hình chỉ mục
  index: true,
});
```

### `remove()`

Xóa trường khỏi bộ sưu tập (chỉ xóa khỏi bộ nhớ).

**Ví dụ**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// really remove from db
await books.sync();
```

## Phương thức cơ sở dữ liệu

### `removeFromDb()`

Xóa trường khỏi cơ sở dữ liệu.

**Chữ ký**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Tham số**

| Tham số                | Kiểu          | Mặc định | Mô tả             |
| ---------------------- | ------------- | -------- | ----------------- |
| `options.transaction?` | `Transaction` | -        | Thể hiện của giao dịch |

### `existsInDb()`

Kiểm tra xem trường có tồn tại trong cơ sở dữ liệu hay không.

**Chữ ký**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Tham số**

| Tham số                | Kiểu          | Mặc định | Mô tả             |
| ---------------------- | ------------- | -------- | ----------------- |
| `options.transaction?` | `Transaction` | -        | Thể hiện của giao dịch |

## Danh sách các loại trường tích hợp

NocoBase tích hợp sẵn một số loại trường phổ biến. Bạn có thể trực tiếp sử dụng tên `type` tương ứng để chỉ định loại trường khi định nghĩa các trường cho một bộ sưu tập. Các loại trường khác nhau có cấu hình tham số khác nhau; vui lòng tham khảo danh sách dưới đây để biết chi tiết.

Tất cả các mục cấu hình cho các loại trường, ngoại trừ những mục được giới thiệu thêm bên dưới, sẽ được truyền qua Sequelize. Do đó, tất cả các mục cấu hình trường được Sequelize hỗ trợ đều có thể được sử dụng ở đây (ví dụ: `allowNull`, `defaultValue`, v.v.).

Ngoài ra, các loại trường phía máy chủ chủ yếu giải quyết các vấn đề về lưu trữ cơ sở dữ liệu và một số thuật toán, và về cơ bản không liên quan đến các loại hiển thị trường và thành phần giao diện người dùng phía frontend. Đối với các loại trường frontend, vui lòng tham khảo hướng dẫn tương ứng.

### `'boolean'`

Kiểu logic (Boolean).

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

Kiểu số nguyên (32-bit).

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

Kiểu số nguyên lớn (64-bit).

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

Kiểu số thực dấu phẩy động độ chính xác kép (64-bit).

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

Kiểu chuỗi. Tương đương với kiểu `VARCHAR` trong hầu hết các cơ sở dữ liệu.

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

Kiểu văn bản. Tương đương với kiểu `TEXT` trong hầu hết các cơ sở dữ liệu.

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

Kiểu mật khẩu (mở rộng của NocoBase). Mã hóa mật khẩu dựa trên phương thức `scrypt` của gói crypto gốc của Node.js.

**Ví dụ**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Chiều dài ký tự, mặc định 64
      randomBytesSize: 8, // Chiều dài byte ngẫu nhiên, mặc định 8
    },
  ],
});
```

**Tham số**

| Tham số           | Kiểu     | Mặc định | Mô tả              |
| ----------------- | -------- | -------- | ------------------ |
| `length`          | `number` | 64       | Chiều dài ký tự    |
| `randomBytesSize` | `number` | 8        | Kích thước byte ngẫu nhiên |

### `'date'`

Kiểu ngày.

### `'time'`

Kiểu thời gian.

### `'array'`

Kiểu mảng (chỉ áp dụng cho PG).

### `'json'`

Kiểu JSON.

### `'jsonb'`

Kiểu JSONB (chỉ áp dụng cho PG, các loại khác sẽ được tương thích thành kiểu `'json'`).

### `'uuid'`

Kiểu UUID.

### `'uid'`

Kiểu UID (mở rộng của NocoBase). Kiểu định danh chuỗi ngẫu nhiên ngắn.

### `'formula'`

Kiểu công thức (mở rộng của NocoBase). Có thể cấu hình tính toán công thức toán học dựa trên [mathjs](https://www.npmjs.com/package/mathjs). Công thức có thể tham chiếu các giá trị của các cột khác trong cùng một bản ghi để tính toán.

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

Kiểu radio (mở rộng của NocoBase). Tối đa một hàng dữ liệu trong toàn bộ bộ sưu tập có thể có giá trị trường này là `true`, tất cả các hàng khác sẽ là `false` hoặc `null`.

**Ví dụ**

Toàn bộ hệ thống chỉ có một người dùng được đánh dấu là root. Sau khi giá trị root của bất kỳ người dùng nào khác được thay đổi thành `true`, tất cả các bản ghi khác có root là `true` sẽ được sửa đổi thành `false`:

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

Kiểu sắp xếp (mở rộng của NocoBase). Sắp xếp dựa trên các số nguyên, tự động tạo số thứ tự mới cho các bản ghi mới, và sắp xếp lại số thứ tự khi dữ liệu được di chuyển.

Nếu một bộ sưu tập định nghĩa tùy chọn `sortable`, một trường tương ứng cũng sẽ được tự động tạo.

**Ví dụ**

Bài viết có thể được sắp xếp dựa trên người dùng sở hữu:

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
      scopeKey: 'userId', // Sắp xếp dữ liệu được nhóm theo cùng giá trị userId
    },
  ],
});
```

### `'virtual'`

Kiểu ảo. Không thực sự lưu trữ dữ liệu, chỉ dùng để định nghĩa getter/setter đặc biệt.

### `'belongsTo'`

Kiểu liên kết nhiều-một. Khóa ngoại được lưu trữ trong bảng của chính nó, đối lập với hasOne/hasMany.

**Ví dụ**

Bất kỳ bài viết nào cũng thuộc về một tác giả:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Nếu không cấu hình, mặc định là tên bảng ở dạng số nhiều của tên
      foreignKey: 'authorId', // Nếu không cấu hình, mặc định là định dạng <name> + Id
      sourceKey: 'id', // Nếu không cấu hình, mặc định là id của bảng đích
    },
  ],
});
```

### `'hasOne'`

Kiểu liên kết một-một. Khóa ngoại được lưu trữ trong bảng liên kết, đối lập với belongsTo.

**Ví dụ**

Mỗi người dùng đều có một hồ sơ cá nhân:

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

Kiểu liên kết một-nhiều. Khóa ngoại được lưu trữ trong bảng liên kết, đối lập với belongsTo.

**Ví dụ**

Bất kỳ người dùng nào cũng có thể có nhiều bài viết:

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

Kiểu liên kết nhiều-nhiều. Sử dụng bảng trung gian để lưu trữ khóa ngoại của cả hai bên. Nếu không chỉ định một bảng hiện có làm bảng trung gian, một bảng trung gian sẽ được tạo tự động.

**Ví dụ**

Bất kỳ bài viết nào cũng có thể có nhiều thẻ, và bất kỳ thẻ nào cũng có thể được thêm vào nhiều bài viết:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Có thể bỏ qua nếu tên giống nhau
      through: 'postsTags', // Bảng trung gian sẽ được tự động tạo nếu không cấu hình
      foreignKey: 'postId', // Khóa ngoại của bảng nguồn trong bảng trung gian
      sourceKey: 'id', // Khóa chính của bảng nguồn
      otherKey: 'tagId', // Khóa ngoại của bảng đích trong bảng trung gian
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