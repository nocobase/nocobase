:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Context

Trong NocoBase, mỗi yêu cầu (request) sẽ tạo ra một đối tượng `ctx`, đây là một thể hiện (instance) của Context. Context đóng gói thông tin về yêu cầu và phản hồi, đồng thời cung cấp các chức năng đặc thù của NocoBase như truy cập cơ sở dữ liệu, thao tác bộ nhớ đệm (cache), quản lý quyền hạn, quốc tế hóa (i18n) và ghi nhật ký (logging).

`Application` của NocoBase được xây dựng dựa trên Koa, vì vậy `ctx` về cơ bản là một Koa Context. Tuy nhiên, NocoBase đã mở rộng nó với nhiều API phong phú, giúp nhà phát triển dễ dàng xử lý logic nghiệp vụ trong Middleware và Action. Mỗi yêu cầu đều có một `ctx` độc lập, đảm bảo tính cô lập và bảo mật dữ liệu giữa các yêu cầu.

## ctx.action

`ctx.action` cung cấp quyền truy cập vào Action đang được thực thi cho yêu cầu hiện tại. Bao gồm:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Xuất tên Action hiện tại
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Hỗ trợ quốc tế hóa (i18n).

- `ctx.i18n` cung cấp thông tin về ngôn ngữ/vùng miền (locale).
- `ctx.t()` được dùng để dịch chuỗi ký tự dựa trên ngôn ngữ.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Trả về bản dịch dựa trên ngôn ngữ của yêu cầu
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` cung cấp giao diện truy cập cơ sở dữ liệu, cho phép bạn trực tiếp thao tác với các model và thực thi các truy vấn.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` cung cấp các thao tác bộ nhớ đệm (cache), hỗ trợ đọc và ghi vào cache, thường được dùng để tăng tốc truy cập dữ liệu hoặc lưu trữ trạng thái tạm thời.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Lưu vào cache trong 60 giây
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` là thể hiện của ứng dụng NocoBase, cho phép truy cập vào cấu hình toàn cục, các plugin và dịch vụ.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Kiểm tra console để xem app';
});
```

## ctx.auth.user

`ctx.auth.user` lấy thông tin người dùng hiện tại đã được xác thực, phù hợp để sử dụng trong kiểm tra quyền hạn hoặc logic nghiệp vụ.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Không được ủy quyền');
  }
  ctx.body = `Xin chào ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` được sử dụng để chia sẻ dữ liệu trong chuỗi middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Người dùng hiện tại: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` cung cấp khả năng ghi nhật ký (logging), hỗ trợ xuất nhật ký ở nhiều cấp độ khác nhau.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Đang xử lý yêu cầu cho:', ctx.path);
  ctx.body = 'Đã ghi nhật ký thành công';
});
```

## ctx.permission & ctx.can()

`ctx.permission` được sử dụng để quản lý quyền hạn, còn `ctx.can()` dùng để kiểm tra xem người dùng hiện tại có quyền thực hiện một thao tác cụ thể hay không.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Bị cấm');
  }
  ctx.body = 'Bạn có quyền chỉnh sửa bài viết';
});
```

## Tóm tắt

- Mỗi yêu cầu tương ứng với một đối tượng `ctx` độc lập.
- `ctx` là một phần mở rộng của Koa Context, tích hợp các chức năng của NocoBase.
- Các thuộc tính phổ biến bao gồm: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, v.v.
- Sử dụng `ctx` trong Middleware và Action giúp bạn dễ dàng thao tác với các yêu cầu, phản hồi, quyền hạn, nhật ký và cơ sở dữ liệu.