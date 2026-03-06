:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/route).
:::

# ctx.route

Thông tin khớp định tuyến (route matching) hiện tại, tương ứng với khái niệm `route` trong React Router, được sử dụng để lấy cấu hình định tuyến, tham số hiện tại, v.v. Thường được sử dụng kết hợp với `ctx.router` và `ctx.location`.

## Các tình huống áp dụng

| Tình huống | Mô tả |
|------|------|
| **JSBlock / JSField** | Thực hiện render có điều kiện hoặc hiển thị định danh trang hiện tại dựa trên `route.pathname` hoặc `route.params`. |
| **Quy tắc liên kết / Luồng sự kiện** | Đọc các tham số định tuyến (ví dụ: `params.name`) để phân nhánh logic hoặc truyền cho các thành phần con. |
| **Điều hướng chế độ xem** | So sánh nội bộ `ctx.route.pathname` với đường dẫn đích để quyết định có kích hoạt `ctx.router.navigate` hay không. |

> Lưu ý: `ctx.route` chỉ khả dụng trong môi trường RunJS có ngữ cảnh định tuyến (như JSBlock trong trang, trang luồng công việc, v.v.); trong ngữ cảnh thuần backend hoặc không có định tuyến (như luồng công việc) nó có thể bị trống.

## Định nghĩa kiểu

```ts
type RouteOptions = {
  name?: string;   // Định danh duy nhất của định tuyến
  path?: string;   // Mẫu định tuyến (ví dụ: /admin/:name)
  params?: Record<string, any>;  // Tham số định tuyến (ví dụ: { name: 'users' })
  pathname?: string;  // Đường dẫn đầy đủ của định tuyến hiện tại (ví dụ: /admin/users)
};
```

## Các trường thường dùng

| Trường | Kiểu | Mô tả |
|------|------|------|
| `pathname` | `string` | Đường dẫn đầy đủ của định tuyến hiện tại, nhất quán với `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Các tham số động được phân tích từ mẫu định tuyến, ví dụ `{ name: 'users' }`. |
| `path` | `string` | Mẫu định tuyến, ví dụ `/admin/:name`. |
| `name` | `string` | Định danh duy nhất của định tuyến, thường dùng trong các kịch bản đa Tab, đa chế độ xem. |

## Quan hệ với ctx.router và ctx.location

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Đọc đường dẫn hiện tại** | `ctx.route.pathname` hoặc `ctx.location.pathname`, cả hai đều nhất quán khi khớp. |
| **Đọc tham số định tuyến** | `ctx.route.params`, ví dụ `params.name` đại diện cho UID của trang hiện tại. |
| **Điều hướng chuyển hướng** | `ctx.router.navigate(path)` |
| **Đọc tham số truy vấn, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` tập trung vào "cấu hình định tuyến được khớp", trong khi `ctx.location` tập trung vào "vị trí URL hiện tại", cả hai phối hợp với nhau để mô tả đầy đủ trạng thái định tuyến hiện tại.

## Ví dụ

### Đọc pathname

```ts
// Hiển thị đường dẫn hiện tại
ctx.message.info('Trang hiện tại: ' + ctx.route.pathname);
```

### Phân nhánh dựa trên params

```ts
// params.name thường là UID của trang hiện tại (ví dụ: định danh trang luồng)
if (ctx.route.params?.name === 'users') {
  // Thực thi logic cụ thể tại trang quản lý người dùng
}
```

### Hiển thị trong trang Luồng công việc

```tsx
<div>
  <h1>Trang hiện tại - {ctx.route.pathname}</h1>
  <p>Định danh định tuyến: {ctx.route.params?.name}</p>
</div>
```

## Liên quan

- [ctx.router](./router.md): Điều hướng định tuyến, sau khi `ctx.router.navigate()` thay đổi đường dẫn, `ctx.route` sẽ được cập nhật theo.
- [ctx.location](./location.md): Vị trí URL hiện tại (pathname, search, hash, state), sử dụng kết hợp với `ctx.route`.