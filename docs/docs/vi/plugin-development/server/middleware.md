---
title: "Middleware"
description: "Middleware phía server NocoBase: app.use, Middleware Koa, chặn request, middleware resource."
keywords: "Middleware,app.use,Koa,Chặn request,Middleware resource,NocoBase"
---

# Middleware

Middleware của NocoBase Server về bản chất là **middleware Koa**, bạn có thể thao tác đối tượng `ctx` để xử lý request và response giống như trong Koa. Tuy nhiên do NocoBase cần quản lý logic của các tầng nghiệp vụ khác nhau, nếu tất cả middleware đặt cùng nhau sẽ rất khó bảo trì.

Để giải quyết, NocoBase chia middleware thành **bốn cấp**:

1. **Middleware cấp nguồn dữ liệu**: `app.dataSourceManager.use()`
   Chỉ tác động lên request của một nguồn dữ liệu nào đó, thường được dùng cho logic kết nối database, validate Field hoặc xử lý transaction của nguồn dữ liệu đó.

2. **Middleware cấp resource**: `app.resourceManager.use()`
   Chỉ có hiệu lực với resource đã được định nghĩa, phù hợp để xử lý logic cấp resource, như quyền dữ liệu, format, v.v.

3. **Middleware cấp quyền**: `app.acl.use()`
   Thực thi trước khi đánh giá quyền, dùng để xác minh quyền hoặc role của người dùng.

4. **Middleware cấp ứng dụng**: `app.use()`
   Thực thi cho mỗi request, phù hợp để ghi log, xử lý lỗi chung, xử lý response, v.v.

## Đăng ký middleware

Middleware thường được đăng ký trong phương thức `load` của Plugin, ví dụ:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware cấp ứng dụng
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware nguồn dữ liệu
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware quyền
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware resource
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Thứ tự thực thi

Thứ tự thực thi middleware như sau:

1. Trước tiên thực thi middleware quyền được thêm bởi `acl.use()`
2. Tiếp theo thực thi middleware resource được thêm bởi `resourceManager.use()`
3. Tiếp theo thực thi middleware nguồn dữ liệu được thêm bởi `dataSourceManager.use()`
4. Cuối cùng thực thi middleware ứng dụng được thêm bởi `app.use()`

## Cơ chế chèn before / after / tag

Để kiểm soát thứ tự middleware linh hoạt hơn, NocoBase cung cấp các tham số `before`, `after` và `tag`:

- **tag**: Đánh dấu cho middleware, dùng để middleware sau tham chiếu đến
- **before**: Chèn vào trước middleware có tag đã chỉ định
- **after**: Chèn vào sau middleware có tag đã chỉ định

Ví dụ:

```ts
// Middleware thông thường
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });

// m4 sẽ được sắp xếp trước m1
app.use(m4, { before: 'restApi' });

// m5 sẽ được chèn vào giữa m2 và m3
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip Mẹo

Nếu không chỉ định vị trí, thứ tự thực thi mặc định của middleware mới thêm là:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## Ví dụ mô hình củ hành

Thứ tự thực thi middleware tuân theo **mô hình củ hành** của Koa, tức là vào stack middleware trước, ra stack cuối cùng.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourcer.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourcer.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Truy cập các interface khác nhau, ví dụ thứ tự đầu ra:

- **Request thông thường**: `/api/hello`
  Đầu ra: `[1,2]` (không có resource được định nghĩa, không thực thi middleware `resourceManager` và `acl`)

- **Request resource**: `/api/test:list`
  Đầu ra: `[5,3,7,1,2,8,4,6]`
  Middleware thực thi theo phân cấp và mô hình củ hành

## Tóm tắt

- Middleware NocoBase là mở rộng của Middleware Koa
- Bốn cấp: ứng dụng -> nguồn dữ liệu -> resource -> quyền
- Có thể dùng `before` / `after` / `tag` để kiểm soát thứ tự thực thi linh hoạt
- Tuân theo mô hình củ hành Koa, đảm bảo middleware có thể kết hợp, có thể lồng nhau
- Middleware cấp nguồn dữ liệu chỉ tác động lên request của nguồn dữ liệu đã chỉ định, middleware cấp resource chỉ tác động lên request của resource đã định nghĩa

## Liên kết liên quan

- [Context Request](./context.md) — Tìm hiểu API đầy đủ của đối tượng `ctx` trong middleware
- [ResourceManager](./resource-manager.md) — Đăng ký middleware cấp resource và định nghĩa resource
- [ACL](./acl.md) — Sử dụng middleware cấp quyền và logic xác minh quyền
- [Plugin](./plugin.md) — Đăng ký middleware trong phương thức `load` của Plugin
- [DataSourceManager](./data-source-manager.md) — Tình huống sử dụng middleware cấp nguồn dữ liệu
- [Tổng quan phát triển server](./index.md) — Kiến trúc tổng thể server và vị trí của middleware
