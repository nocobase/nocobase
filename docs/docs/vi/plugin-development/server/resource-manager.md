---
title: "ResourceManager - Quản lý Resource"
description: "Quản lý resource phía server của NocoBase: app.resourceManager, registerActions, resource.use, đăng ký Action."
keywords: "ResourceManager,Quản lý resource,registerActions,resource.use,Action,NocoBase"
---

# ResourceManager - Quản lý Resource

Chức năng quản lý resource của NocoBase tự động chuyển đổi bảng dữ liệu (Collection) và quan hệ (Association) thành resource, và tích hợp sẵn nhiều loại thao tác, cho phép bạn nhanh chóng xây dựng REST API. Khác với REST API truyền thống một chút, các thao tác resource của NocoBase không phụ thuộc trực tiếp vào HTTP method, mà xác định thao tác cụ thể được thực thi thông qua việc định nghĩa tường minh `:action`.

## Tự động sinh resource

NocoBase sẽ tự động chuyển các Collection và Association được định nghĩa trong database thành resource. Ví dụ định nghĩa hai collection `posts` và `tags`:

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

Hệ thống sẽ tự động sinh các resource sau:

* Resource `posts`
* Resource `tags`
* Resource quan hệ `posts.tags`

Ví dụ request:

| Phương thức   | Đường dẫn                     | Thao tác   |
| -------- | ---------------------- | ---- |
| `GET`  | `/api/posts:list`      | Truy vấn danh sách |
| `GET`  | `/api/posts:get/1`     | Truy vấn một bản ghi |
| `POST` | `/api/posts:create`    | Thêm mới   |
| `POST` | `/api/posts:update/1`  | Cập nhật   |
| `POST` | `/api/posts:destroy/1` | Xóa   |

| Phương thức   | Đường dẫn                        | Thao tác   |
| -------- | ------------------------- | ---- |
| `GET`  | `/api/tags:list`      | Truy vấn danh sách |
| `GET`  | `/api/tags:get/1`     | Truy vấn một bản ghi |
| `POST` | `/api/tags:create`    | Thêm mới   |
| `POST` | `/api/tags:update/1`  | Cập nhật   |
| `POST` | `/api/tags:destroy/1` | Xóa   |

| Phương thức   | Đường dẫn                             | Thao tác                            |
| -------- | ------------------------------ | ----------------------------- |
| `GET`  | `/api/posts/1/tags:list`   | Truy vấn tất cả `tags` liên quan của một `post`   |
| `GET`  | `/api/posts/1/tags:get/1`  | Truy vấn một `tags` thuộc một `post`    |
| `POST` | `/api/posts/1/tags:create`  | Thêm một `tags` cho một `post`    |
| `POST` | `/api/posts/1/tags:update/1`  | Cập nhật một `tags` thuộc một `post`    |
| `POST` | `/api/posts/1/tags:destroy/1`  | Xóa một `tags` thuộc một `post`    |
| `POST` | `/api/posts/1/tags:add`    | Thêm `tags` liên quan cho một `post`   |
| `POST` | `/api/posts/1/tags:remove` | Loại bỏ `tags` liên quan của một `post`   |
| `POST` | `/api/posts/1/tags:set`    | Đặt tất cả `tags` liên quan của một `post` |
| `POST` | `/api/posts/1/tags:toggle` | Toggle quan hệ `tags` của một `post`   |

:::tip Mẹo

Các thao tác resource của NocoBase không phụ thuộc trực tiếp vào HTTP method, mà quyết định thao tác được thực thi thông qua định nghĩa tường minh `:action`.

:::

## Thao tác resource

NocoBase tích hợp sẵn nhiều loại thao tác, bao trùm các tình huống nghiệp vụ phổ biến.

### Thao tác CRUD cơ bản

| Tên thao tác       | Mô tả     | Loại resource áp dụng | Phương thức     | Ví dụ đường dẫn                   |
| --------- | ------ | ------ | -------- | ---------------------- |
| `list`    | Truy vấn dữ liệu danh sách | Tất cả     | GET/POST | `/api/posts:list`      |
| `get`     | Truy vấn một bản ghi | Tất cả     | GET/POST | `/api/posts:get/1`     |
| `create`  | Tạo bản ghi mới  | Tất cả     | POST     | `/api/posts:create`    |
| `update`  | Cập nhật bản ghi   | Tất cả     | POST     | `/api/posts:update/1`  |
| `destroy` | Xóa bản ghi   | Tất cả     | POST     | `/api/posts:destroy/1` |
| `firstOrCreate`  | Tìm bản ghi đầu tiên, không có thì tạo | Tất cả | POST     |  `/api/users:firstOrCreate`  |
| `updateOrCreate` | Cập nhật bản ghi, không có thì tạo    | Tất cả | POST     |  `/api/users:updateOrCreate` |

### Thao tác quan hệ

| Tên thao tác      | Mô tả             | Loại quan hệ áp dụng                                   | Ví dụ đường dẫn                           |
| -------- | -------------- | ---------------------------------------- | ------------------------------ |
| `add`    | Thêm quan hệ  | `hasMany`, `belongsToMany` | `/api/posts/1/tags:add`    |
| `remove` | Loại bỏ quan hệ  | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`    | Đặt lại quan hệ  | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle` | Thêm hoặc loại bỏ quan hệ | `belongsToMany` | `/api/posts/1/tags:toggle`     |

### Tham số thao tác

Các tham số thao tác phổ biến bao gồm:

* `filter`: Điều kiện truy vấn
* `values`: Giá trị được đặt
* `fields`: Chỉ định Field trả về
* `appends`: Bao gồm dữ liệu quan hệ
* `except`: Loại trừ Field
* `sort`: Quy tắc sắp xếp
* `page`, `pageSize`: Tham số phân trang
* `paginate`: Có bật phân trang không
* `tree`: Có trả về cấu trúc cây không
* `whitelist`, `blacklist`: Whitelist/blacklist của Field
* `updateAssociationValues`: Có cập nhật giá trị quan hệ không

---

## Thao tác resource tùy chỉnh

Bạn có thể dùng `registerActionHandlers` để đăng ký thêm các thao tác cho resource đã có, hỗ trợ thao tác toàn cục và thao tác cho resource cụ thể.

### Đăng ký thao tác toàn cục

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Đăng ký thao tác cho resource cụ thể

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Ví dụ request:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Quy tắc đặt tên: `resourceName:actionName`, khi có quan hệ thì dùng cú pháp dấu chấm (`posts.comments`).

## Resource tùy chỉnh

Nếu bạn cần cung cấp resource không liên quan đến bảng dữ liệu, có thể dùng `resourceManager.define` để định nghĩa:

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

Cách request giống với resource tự động:

* `GET /api/app:getInfo`
* `POST /api/app:getInfo` (mặc định hỗ trợ cả GET/POST)

## Middleware tùy chỉnh

Dùng `resourceManager.use()` có thể đăng ký middleware toàn cục. Ví dụ một middleware log toàn cục:

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Các thuộc tính Context đặc biệt

Việc có thể vào được tầng `resourceManager` middleware hoặc action, có nghĩa là resource đó chắc chắn tồn tại. Lúc này bạn có thể truy cập context của request thông qua các thuộc tính sau:

### ctx.action

- `ctx.action.actionName`: Tên thao tác
- `ctx.action.resourceName`: Có thể là collection hoặc association
- `ctx.action.params`: Tham số thao tác

### ctx.dataSource

Đối tượng nguồn dữ liệu hiện tại

### ctx.getCurrentRepository()

Đối tượng repository hiện tại

## Cách lấy đối tượng resourceManager của các nguồn dữ liệu khác nhau

`resourceManager` thuộc về nguồn dữ liệu, bạn có thể đăng ký thao tác cho các nguồn dữ liệu khác nhau riêng biệt.

### Nguồn dữ liệu chính

Nguồn dữ liệu chính có thể dùng trực tiếp `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Nguồn dữ liệu khác

Các nguồn dữ liệu khác có thể lấy instance tương ứng thông qua `dataSourceManager`:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Duyệt qua tất cả các nguồn dữ liệu

Nếu cần thực hiện cùng một thao tác cho tất cả các nguồn dữ liệu, có thể dùng `dataSourceManager.afterAddDataSource` để duyệt:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```

## Liên kết liên quan

- [Bảng tra cứu Resource API](../../api/flow-engine/resource.md) — Chữ ký phương thức và cách dùng đầy đủ của MultiRecordResource / SingleRecordResource phía client
- [ACL](./acl.md) — Cấu hình quyền role và kiểm soát truy cập cho các thao tác resource
- [Context Request](./context.md) — Lấy thông tin context trong handler request
- [Middleware](./middleware.md) — Thêm logic chặn và xử lý cho request
- [DataSourceManager](./data-source-manager.md) — Quản lý nhiều nguồn dữ liệu và resource manager của chúng
- [Collections](./collections.md) — Mối quan hệ map tự động giữa Collection và Resource
