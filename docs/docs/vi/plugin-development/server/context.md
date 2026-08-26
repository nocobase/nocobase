---
title: "Context Request"
description: "ctx phía server NocoBase: mở rộng Koa Context, ctx.action, ctx.db, ctx.cache, sử dụng trong Middleware và Action."
keywords: "Context,ctx,ctx.action,Koa,Context request,Middleware,Action,NocoBase"
---

# Context

Trong NocoBase, mỗi request sẽ sinh ra một đối tượng `ctx`, đây là instance của Context. Context đóng gói thông tin request và response, đồng thời cung cấp các chức năng đặc trưng của NocoBase — ví dụ truy cập database, thao tác cache, quản lý quyền, i18n và ghi log, v.v.

`Application` của NocoBase được triển khai dựa trên Koa, do đó `ctx` về bản chất là Koa Context, tuy nhiên NocoBase mở rộng thêm nhiều API trên cơ sở đó, cho phép bạn xử lý logic nghiệp vụ tiện lợi trong Middleware và Action. Mỗi request có `ctx` độc lập, đảm bảo cách ly dữ liệu giữa các request.

## ctx.action

`ctx.action` cung cấp thông tin Action mà request hiện tại đang thực thi, bao gồm:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Tên Action hiện tại
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Hỗ trợ i18n.

- `ctx.i18n` cung cấp thông tin môi trường ngôn ngữ
- `ctx.t()` được dùng để dịch chuỗi theo ngôn ngữ

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Trả về bản dịch theo ngôn ngữ hiện tại
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` cung cấp interface truy cập database, có thể thao tác model và thực thi truy vấn trực tiếp.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` cung cấp các thao tác cache, hỗ trợ đọc và ghi cache, thường được dùng để tăng tốc truy cập dữ liệu hoặc lưu trạng thái tạm.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', { ttl: 60 }); // Cache 60 giây
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` là instance ứng dụng NocoBase, có thể truy cập cấu hình toàn cục, Plugin và dịch vụ.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` lấy thông tin người dùng đã được xác thực hiện tại, phù hợp dùng trong xác minh quyền hoặc logic nghiệp vụ.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` được dùng để chia sẻ dữ liệu trong chuỗi middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` cung cấp khả năng ghi log, hỗ trợ xuất log nhiều cấp độ.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` được dùng để quản lý quyền, `ctx.can()` được dùng để đánh giá người dùng hiện tại có quyền thực thi một thao tác nào đó hay không.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Tóm tắt

- Mỗi request tương ứng một đối tượng `ctx` độc lập
- `ctx` là mở rộng của Koa Context, tích hợp các năng lực của NocoBase
- Các thuộc tính phổ biến bao gồm: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, v.v.
- Sử dụng `ctx` trong Middleware và Action có thể tiện lợi thao tác request, response, quyền, log và database

## Liên kết liên quan

- [Middleware](./middleware.md) — Quy trình hoàn chỉnh sử dụng `ctx` trong middleware để xử lý request
- [ResourceManager](./resource-manager.md) — Nguồn và định nghĩa của `ctx.action` trong Action của resource
- [ACL](./acl.md) — Cơ chế xác minh quyền của `ctx.permission` và `ctx.can()`
- [Cache](./cache.md) — Cách dùng chi tiết các thao tác cache của `ctx.cache`
- [Logger](./logger.md) — Cấu hình ghi log và xuất log của `ctx.logger`
- [I18n](./i18n.md) — Hỗ trợ i18n của `ctx.t()` và `ctx.i18n`
