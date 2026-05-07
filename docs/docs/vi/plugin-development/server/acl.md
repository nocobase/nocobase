---
title: "Kiểm soát quyền ACL (Server)"
description: "ACL phía server NocoBase: registerSnippet, allow/deny, đoạn quyền, quyền role, middleware, đánh giá điều kiện."
keywords: "ACL,Kiểm soát quyền,registerSnippet,allow,deny,Đoạn quyền,Quyền role,NocoBase"
---

# Kiểm soát quyền ACL

ACL (Access Control List) dùng để kiểm soát quyền thao tác resource. Bạn có thể gán quyền cho role, hoặc bỏ qua giới hạn role để ràng buộc quyền trực tiếp. Hệ thống ACL cung cấp cơ chế quản lý quyền linh hoạt, hỗ trợ nhiều cách như đoạn quyền, middleware, đánh giá điều kiện.

:::tip Mẹo

Đối tượng ACL thuộc về nguồn dữ liệu (`dataSource.acl`), ACL của nguồn dữ liệu chính có thể truy cập nhanh thông qua `app.acl`. Cách dùng ACL của các nguồn dữ liệu khác xem chi tiết tại [DataSourceManager](./data-source-manager.md).

:::

## Đăng ký đoạn quyền (Snippet)

Đoạn quyền (Snippet) có thể đăng ký các tổ hợp quyền phổ biến thành đơn vị quyền có thể tái sử dụng. Sau khi role được gắn Snippet, sẽ có được tổ hợp quyền tương ứng, giảm cấu hình lặp lại.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Tiền tố ui.* biểu thị quyền có thể cấu hình trên giao diện
  actions: ['customRequests:*'], // Thao tác resource tương ứng, hỗ trợ wildcard
});
```

## Quyền bỏ qua ràng buộc role (allow)

`acl.allow()` được dùng để cho một số thao tác bỏ qua ràng buộc role, áp dụng cho API công khai, các tình huống cần đánh giá quyền động, hoặc cần đánh giá quyền dựa trên context request.

```ts
// Truy cập công khai, không cần đăng nhập
acl.allow('app', 'getLang', 'public');

// Người dùng đã đăng nhập là có thể truy cập
acl.allow('app', 'getInfo', 'loggedIn');

// Đánh giá dựa trên điều kiện tùy chỉnh
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Mô tả tham số condition:**

- `'public'`: Bất kỳ người dùng nào (bao gồm người dùng chưa đăng nhập) đều có thể truy cập, không cần xác thực
- `'loggedIn'`: Chỉ người dùng đã đăng nhập có thể truy cập, cần định danh người dùng hợp lệ
- `(ctx) => Promise<boolean>` hoặc `(ctx) => boolean`: Hàm tùy chỉnh, đánh giá động có cho phép truy cập hay không dựa trên context request, có thể triển khai logic quyền phức tạp

## Đăng ký middleware quyền (use)

`acl.use()` được dùng để đăng ký middleware quyền tùy chỉnh, có thể chèn logic tùy chỉnh vào quy trình kiểm tra quyền. Thường được dùng kết hợp với `ctx.permission`, dùng cho quy tắc quyền tùy chỉnh. Áp dụng cho các tình huống cần triển khai kiểm soát quyền không thông thường, ví dụ form công khai cần xác minh mật khẩu tùy chỉnh, đánh giá quyền động dựa trên tham số request, v.v.

**Tình huống áp dụng điển hình:**

- Tình huống form công khai: Không có user, không có role, nhưng cần ràng buộc quyền qua mật khẩu tùy chỉnh
- Kiểm soát quyền dựa trên tham số request, địa chỉ IP, v.v.
- Quy tắc quyền tùy chỉnh, bỏ qua hoặc sửa đổi quy trình kiểm tra quyền mặc định

**Kiểm soát quyền thông qua `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Ví dụ: Form công khai cần xác minh mật khẩu rồi bỏ qua kiểm tra quyền
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Xác minh thành công, bỏ qua kiểm tra quyền
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Thực thi kiểm tra quyền (tiếp tục quy trình ACL)
  await next();
});
```

**Mô tả thuộc tính `ctx.permission`:**

- `skip: true`: Bỏ qua kiểm tra quyền ACL tiếp theo, cho phép truy cập trực tiếp
- Có thể đặt động trong middleware dựa trên logic tùy chỉnh, triển khai kiểm soát quyền linh hoạt

## Thêm ràng buộc dữ liệu cố định cho thao tác cụ thể (addFixedParams)

`addFixedParams` có thể thêm ràng buộc phạm vi dữ liệu cố định (filter) cho thao tác của một số resource, các ràng buộc này sẽ bỏ qua giới hạn role và có hiệu lực trực tiếp, thường dùng để bảo vệ dữ liệu quan trọng của hệ thống.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Ngay cả khi user có quyền xóa role, cũng không thể xóa các role hệ thống root, admin, member
```

:::tip Mẹo

`addFixedParams` có thể dùng để ngăn dữ liệu nhạy cảm bị xóa hoặc sửa nhầm, ví dụ role tích hợp sẵn của hệ thống, tài khoản admin, v.v. Các ràng buộc này sẽ chồng lên quyền role và có hiệu lực, đảm bảo ngay cả khi có quyền cũng không thể thao tác lên dữ liệu được bảo vệ.

:::

## Đánh giá quyền (can)

`acl.can()` được dùng để đánh giá role nào đó có quyền thực thi thao tác đã chỉ định không, trả về đối tượng kết quả quyền hoặc `null`. Thường được dùng trong middleware hoặc Handler của thao tác, để đánh giá động có cho phép thực thi một số thao tác hay không dựa trên role.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Có thể truyền một role hoặc mảng role
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Role ${result.role} có thể thực thi thao tác ${result.action}`);
  // result.params chứa các tham số cố định được đặt qua addFixedParams
  console.log('Tham số cố định:', result.params);
} else {
  console.log('Không có quyền thực thi thao tác này');
}
```

:::tip Mẹo

Nếu truyền nhiều role, sẽ kiểm tra từng role, trả về kết quả hợp của các role.

:::

**Định nghĩa kiểu:**

```ts
interface CanArgs {
  role?: string;      // Một role
  roles?: string[];   // Nhiều role (sẽ kiểm tra từng cái, trả về role có quyền đầu tiên)
  resource: string;   // Tên resource
  action: string;    // Tên thao tác
}

interface CanResult {
  role: string;       // Role có quyền
  resource: string;   // Tên resource
  action: string;    // Tên thao tác
  params?: any;       // Thông tin tham số cố định (nếu được đặt qua addFixedParams)
}
```

## Đăng ký thao tác có thể cấu hình (setAvailableAction)

Nếu bạn muốn thao tác tùy chỉnh có thể cấu hình quyền trên giao diện (ví dụ hiển thị trong trang "Quản lý role"), cần đăng ký bằng `setAvailableAction`. Thao tác đã đăng ký sẽ xuất hiện trong giao diện cấu hình quyền, admin có thể cấu hình quyền thao tác cho các role khác nhau trên giao diện.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Tên hiển thị giao diện, hỗ trợ i18n
  type: 'new-data',               // Loại thao tác
  onNewRecord: true,              // Có hiệu lực khi tạo bản ghi mới
});
```

**Mô tả tham số:**

- **displayName**: Tên hiển thị trong giao diện cấu hình quyền, hỗ trợ i18n (dùng định dạng `{{t("key")}}`)
- **type**: Loại thao tác, quyết định phân loại của thao tác này trong cấu hình quyền
  - `'new-data'`: Thao tác tạo dữ liệu mới (như import, thêm mới, v.v.)
  - `'existing-data'`: Thao tác sửa dữ liệu đã có (như cập nhật, xóa, v.v.)
- **onNewRecord**: Có hiệu lực khi tạo bản ghi mới, chỉ có hiệu lực với loại `'new-data'`

Sau khi đăng ký, thao tác sẽ xuất hiện trong giao diện cấu hình quyền, admin có thể cấu hình quyền của thao tác này trong trang "Quản lý role".

## Liên kết liên quan

- [ResourceManager](./resource-manager.md) — Đăng ký interface tùy chỉnh và thao tác resource
- [Plugin](./plugin.md) — Đăng ký quyền trong vòng đời Plugin
- [Context Request](./context.md) — Lấy thông tin role và quyền hiện tại trong request
- [Middleware](./middleware.md) — Đăng ký và sử dụng middleware ACL
- [DataSourceManager](./data-source-manager.md) — Mỗi nguồn dữ liệu có instance ACL độc lập riêng
