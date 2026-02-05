:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# ResourceManager Quản lý tài nguyên

Tính năng quản lý tài nguyên của NocoBase có thể tự động chuyển đổi các bảng dữ liệu (bộ sưu tập) và các liên kết (association) hiện có thành tài nguyên. NocoBase cũng tích hợp sẵn nhiều loại thao tác, giúp nhà phát triển nhanh chóng xây dựng các thao tác tài nguyên REST API. Khác một chút so với REST API truyền thống, các thao tác tài nguyên của NocoBase không phụ thuộc vào phương thức yêu cầu HTTP mà xác định thao tác cụ thể cần thực hiện thông qua việc định nghĩa `:action` một cách rõ ràng.

## Tự động tạo tài nguyên

NocoBase sẽ tự động chuyển đổi các `bộ sưu tập` và `association` được định nghĩa trong cơ sở dữ liệu thành tài nguyên. Ví dụ, khi định nghĩa hai bộ sưu tập là `posts` và `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Điều này sẽ tự động tạo ra các tài nguyên sau:

* Tài nguyên `posts`
* Tài nguyên `tags`
* Tài nguyên liên kết `posts.tags`

Ví dụ yêu cầu:

| Phương thức | Đường dẫn                 | Thao tác     |
| ----------- | -------------------------- | ------------ |
| `GET`       | `/api/posts:list`          | Truy vấn danh sách |
| `GET`       | `/api/posts:get/1`         | Truy vấn một bản ghi |
| `POST`      | `/api/posts:create`        | Thêm mới     |
| `POST`      | `/api/posts:update/1`      | Cập nhật     |
| `POST`      | `/api/posts:destroy/1`     | Xóa          |

| Phương thức | Đường dẫn                 | Thao tác     |
| ----------- | -------------------------- | ------------ |
| `GET`       | `/api/tags:list`           | Truy vấn danh sách |
| `GET`       | `/api/tags:get/1`          | Truy vấn một bản ghi |
| `POST`      | `/api/tags:create`         | Thêm mới     |
| `POST`      | `/api/tags:update/1`       | Cập nhật     |
| `POST`      | `/api/tags:destroy/1`      | Xóa          |

| Phương thức | Đường dẫn                        | Thao tác                                  |
| ----------- | -------------------------------- | ----------------------------------------- |
| `GET`       | `/api/posts/1/tags:list`         | Truy vấn tất cả các `tags` liên kết với một `post` |
| `GET`       | `/api/posts/1/tags:get/1`        | Truy vấn một `tag` cụ thể thuộc một `post` |
| `POST`      | `/api/posts/1/tags:create`       | Tạo mới một `tag` cụ thể thuộc một `post` |
| `POST`      | `/api/posts/1/tags:update/1`     | Cập nhật một `tag` cụ thể thuộc một `post` |
| `POST`      | `/api/posts/1/tags:destroy/1`    | Xóa một `tag` cụ thể thuộc một `post`     |
| `POST`      | `/api/posts/1/tags:add`          | Thêm các `tags` liên kết vào một `post`   |
| `POST`      | `/api/posts/1/tags:remove`       | Xóa các `tags` liên kết khỏi một `post`   |
| `POST`      | `/api/posts/1/tags:set`          | Đặt tất cả các `tags` liên kết cho một `post` |
| `POST`      | `/api/posts/1/tags:toggle`       | Chuyển đổi liên kết `tags` cho một `post` |

:::tip Mẹo

Các thao tác tài nguyên của NocoBase không phụ thuộc trực tiếp vào phương thức yêu cầu, mà xác định các thao tác thông qua việc định nghĩa `:action` một cách rõ ràng.

:::

## Các thao tác tài nguyên

NocoBase cung cấp nhiều loại thao tác tích hợp sẵn phong phú để đáp ứng các nhu cầu kinh doanh khác nhau.

### Các thao tác CRUD cơ bản

| Tên thao tác    | Mô tả                                   | Loại tài nguyên áp dụng | Phương thức yêu cầu | Đường dẫn ví dụ             |
| --------------- | --------------------------------------- | ----------------------- | ------------------- | --------------------------- |
| `list`          | Truy vấn dữ liệu danh sách              | Tất cả                  | GET/POST            | `/api/posts:list`           |
| `get`           | Truy vấn một bản ghi                    | Tất cả                  | GET/POST            | `/api/posts:get/1`          |
| `create`        | Tạo bản ghi mới                         | Tất cả                  | POST                | `/api/posts:create`         |
| `update`        | Cập nhật bản ghi                        | Tất cả                  | POST                | `/api/posts:update/1`       |
| `destroy`       | Xóa bản ghi                             | Tất cả                  | POST                | `/api/posts:destroy/1`      |
| `firstOrCreate` | Tìm bản ghi đầu tiên, tạo nếu không tồn tại | Tất cả                  | POST                | `/api/users:firstOrCreate`  |
| `updateOrCreate`| Cập nhật bản ghi, tạo nếu không tồn tại | Tất cả                  | POST                | `/api/users:updateOrCreate` |

### Các thao tác liên kết

| Tên thao tác | Mô tả             | Loại liên kết áp dụng                     | Đường dẫn ví dụ                |
| ------------ | ----------------- | ----------------------------------------- | ------------------------------ |
| `add`        | Thêm liên kết     | `hasMany`, `belongsToMany`                | `/api/posts/1/tags:add`        |
| `remove`     | Xóa liên kết      | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`        | Đặt lại liên kết  | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`     | Thêm hoặc xóa liên kết | `belongsToMany`                           | `/api/posts/1/tags:toggle`     |

### Các tham số thao tác

Các tham số thao tác phổ biến bao gồm:

*   `filter`: Điều kiện truy vấn
*   `values`: Các giá trị cần đặt
*   `fields`: Chỉ định các trường trả về
*   `appends`: Bao gồm dữ liệu liên kết
*   `except`: Loại trừ các trường
*   `sort`: Quy tắc sắp xếp
*   `page`, `pageSize`: Tham số phân trang
*   `paginate`: Có bật phân trang hay không
*   `tree`: Có trả về cấu trúc dạng cây hay không
*   `whitelist`, `blacklist`: Danh sách trắng/đen các trường
*   `updateAssociationValues`: Có cập nhật giá trị liên kết hay không

## Các thao tác tài nguyên tùy chỉnh

NocoBase cho phép đăng ký các thao tác bổ sung cho các tài nguyên hiện có. Bạn có thể sử dụng `registerActionHandlers` để tùy chỉnh các thao tác cho tất cả hoặc các tài nguyên cụ thể.

### Đăng ký thao tác toàn cục

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Đăng ký thao tác cho tài nguyên cụ thể

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Ví dụ yêu cầu:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Quy tắc đặt tên: `resourceName:actionName`, sử dụng cú pháp dấu chấm (`posts.comments`) khi bao gồm các liên kết.

## Tài nguyên tùy chỉnh

Nếu bạn cần cung cấp các tài nguyên không liên quan đến các bộ sưu tập, bạn có thể sử dụng phương thức `resourceManager.define` để định nghĩa chúng:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Phương thức yêu cầu nhất quán với các tài nguyên được tạo tự động:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (mặc định hỗ trợ cả GET/POST)

## Middleware tùy chỉnh

Sử dụng phương thức `resourceManager.use()` để đăng ký middleware toàn cục. Ví dụ:

Middleware ghi log toàn cục

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Các thuộc tính Context đặc biệt

Việc có thể truy cập vào middleware hoặc action của lớp `resourceManager` có nghĩa là tài nguyên đó chắc chắn tồn tại.

### ctx.action

*   `ctx.action.actionName`: Tên thao tác
*   `ctx.action.resourceName`: Có thể là một bộ sưu tập hoặc association
*   `ctx.action.params`: Các tham số thao tác

### ctx.dataSource

Đối tượng nguồn dữ liệu hiện tại.

### ctx.getCurrentRepository()

Đối tượng repository hiện tại.

## Cách lấy đối tượng resourceManager cho các nguồn dữ liệu khác nhau

`resourceManager` thuộc về một nguồn dữ liệu và có thể đăng ký các thao tác riêng biệt cho từng nguồn dữ liệu khác nhau.

### Nguồn dữ liệu chính

Đối với nguồn dữ liệu chính, bạn có thể trực tiếp sử dụng `app.resourceManager` để thực hiện thao tác:

```ts
app.resourceManager.registerActionHandlers();
```

### Các nguồn dữ liệu khác

Đối với các nguồn dữ liệu khác, bạn có thể lấy một thể hiện nguồn dữ liệu cụ thể thông qua `dataSourceManager` và sử dụng `resourceManager` của thể hiện đó để thực hiện thao tác:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Lặp qua tất cả các nguồn dữ liệu

Nếu bạn cần thực hiện các thao tác giống nhau trên tất cả các nguồn dữ liệu đã thêm, bạn có thể sử dụng phương thức `dataSourceManager.afterAddDataSource` để lặp qua, đảm bảo rằng `resourceManager` của mỗi nguồn dữ liệu đều có thể đăng ký các thao tác tương ứng:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```