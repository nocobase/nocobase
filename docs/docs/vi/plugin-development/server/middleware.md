:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Middleware

Middleware của NocoBase Server về cơ bản là **Koa middleware**. Bạn có thể thao tác đối tượng `ctx` để xử lý yêu cầu và phản hồi giống như trong Koa. Tuy nhiên, vì NocoBase cần quản lý logic ở nhiều tầng nghiệp vụ khác nhau, nếu tất cả middleware được đặt chung, việc bảo trì và quản lý sẽ rất phức tạp.

Để giải quyết vấn đề này, NocoBase chia middleware thành **bốn tầng**:

1.  **Middleware cấp nguồn dữ liệu**: `app.dataSourceManager.use()`  
    Chỉ áp dụng cho các yêu cầu của **một nguồn dữ liệu** cụ thể, thường được sử dụng cho các logic như kết nối cơ sở dữ liệu, xác thực trường hoặc xử lý giao dịch của nguồn dữ liệu đó.

2.  **Middleware cấp tài nguyên**: `app.resourceManager.use()`  
    Chỉ áp dụng cho các tài nguyên (Resource) đã được định nghĩa, phù hợp để xử lý logic ở cấp tài nguyên, như quyền truy cập dữ liệu, định dạng, v.v.

3.  **Middleware cấp quyền**: `app.acl.use()`  
    Được thực thi trước khi kiểm tra quyền, được sử dụng để xác minh quyền hoặc vai trò của người dùng.

4.  **Middleware cấp ứng dụng**: `app.use()`  
    Được thực thi cho mọi yêu cầu, phù hợp cho các tác vụ như ghi nhật ký, xử lý lỗi chung, xử lý phản hồi, v.v.

## Đăng ký Middleware

Middleware thường được đăng ký trong phương thức `load` của plugin, ví dụ:

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

    // Middleware tài nguyên
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Thứ tự thực thi

Thứ tự thực thi middleware như sau:

1.  Đầu tiên thực thi middleware quyền do `acl.use()` thêm vào
2.  Sau đó thực thi middleware tài nguyên do `resourceManager.use()` thêm vào
3.  Tiếp theo thực thi middleware nguồn dữ liệu do `dataSourceManager.use()` thêm vào
4.  Cuối cùng thực thi middleware ứng dụng do `app.use()` thêm vào

## Cơ chế chèn before / after / tag

Để kiểm soát thứ tự middleware linh hoạt hơn, NocoBase cung cấp các tham số `before`, `after` và `tag`:

-   **tag**: Gán một thẻ (tag) cho middleware, để các middleware tiếp theo tham chiếu.
-   **before**: Chèn trước middleware có tag được chỉ định.
-   **after**: Chèn sau middleware có tag được chỉ định.

Ví dụ:

```ts
// Middleware thông thường
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 sẽ được đặt trước m1
app.use(m4, { before: 'restApi' });

// m5 sẽ được chèn giữa m2 và m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Nếu không chỉ định vị trí, thứ tự thực thi mặc định cho middleware mới được thêm vào là:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Ví dụ về mô hình Onion

Thứ tự thực thi middleware tuân theo **mô hình Onion** của Koa, tức là vào stack middleware trước và thoát ra sau cùng.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
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

app.resourceManager.define({
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

Ví dụ về thứ tự xuất ra khi truy cập các API khác nhau:

-   **Yêu cầu thông thường**: `/api/hello`  
    Đầu ra: `[1,2]` (tài nguyên không được định nghĩa, không thực thi middleware `resourceManager` và `acl`)

-   **Yêu cầu tài nguyên**: `/api/test:list`  
    Đầu ra: `[5,3,7,1,2,8,4,6]`  
    Middleware thực thi theo thứ tự tầng và mô hình Onion.

## Tóm tắt

-   NocoBase Middleware là một phần mở rộng của Koa Middleware.
-   Bốn tầng: Ứng dụng -> Nguồn dữ liệu -> Tài nguyên -> Quyền
-   Có thể sử dụng `before` / `after` / `tag` để kiểm soát linh hoạt thứ tự thực thi.
-   Tuân theo mô hình Onion của Koa, đảm bảo middleware có thể kết hợp và lồng nhau.
-   Middleware cấp nguồn dữ liệu chỉ áp dụng cho các yêu cầu của nguồn dữ liệu cụ thể, middleware cấp tài nguyên chỉ áp dụng cho các yêu cầu của tài nguyên đã được định nghĩa.