---
title: "ctx.location"
description: "ctx.location là thông tin URL của page hiện tại, chỉ đọc, hỗ trợ điều hướng an toàn, dùng để lấy query, hash, v.v."
keywords: "ctx.location,URL,query,hash,điều hướng page,RunJS,NocoBase"
---

# ctx.location

Thông tin vị trí route hiện tại, tương đương với object `location` của React Router. Thường được dùng kết hợp với `ctx.router`, `ctx.route` để đọc path hiện tại, query string, hash và state được truyền qua route.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField** | Render có điều kiện hoặc rẽ nhánh logic dựa trên path, tham số query hoặc hash hiện tại |
| **Quy tắc liên kết / luồng sự kiện** | Đọc tham số query của URL để filter liên kết, hoặc xét nguồn dựa trên `location.state` |
| **Xử lý sau khi điều hướng route** | Trong page đích nhận dữ liệu được truyền từ page trước qua `ctx.router.navigate` qua `ctx.location.state` |

> Lưu ý: `ctx.location` chỉ khả dụng trong môi trường RunJS có ngữ cảnh route (như JSBlock trong page, luồng sự kiện, v.v.); trong các ngữ cảnh không route hoặc backend thuần túy (như workflow) có thể trống.

## Định nghĩa kiểu

```ts
location: Location;
```

`Location` đến từ `react-router-dom`, giống với giá trị trả về của `useLocation()` trong React Router.

## Trường thường dùng

| Trường | Kiểu | Mô tả |
|------|------|------|
| `pathname` | `string` | Path hiện tại, bắt đầu bằng `/` (như `/admin/users`) |
| `search` | `string` | Query string, bắt đầu bằng `?` (như `?page=1&status=active`) |
| `hash` | `string` | Đoạn hash, bắt đầu bằng `#` (như `#section-1`) |
| `state` | `any` | Dữ liệu bất kỳ được truyền qua `ctx.router.navigate(path, { state })`, không phản ánh trong URL |
| `key` | `string` | Định danh duy nhất của location này, page khởi đầu là `"default"` |

## Quan hệ với ctx.router, ctx.urlSearchParams

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Đọc path, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Đọc tham số query (dạng object)** | `ctx.urlSearchParams`, có thể nhận trực tiếp object đã parse |
| **Parse search string** | `new URLSearchParams(ctx.location.search)` hoặc dùng trực tiếp `ctx.urlSearchParams` |

`ctx.urlSearchParams` được parse từ `ctx.location.search`, nếu chỉ cần tham số query, sử dụng `ctx.urlSearchParams` tiện lợi hơn.

## Ví dụ

### Rẽ nhánh dựa trên path

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('当前在用户管理页');
}
```

### Parse tham số query

```ts
// 方式 1：使用 ctx.urlSearchParams（推荐）
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// 方式 2：使用 URLSearchParams 解析 search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Nhận state được truyền qua điều hướng route

```ts
// 上一页跳转时：ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('从仪表盘跳转而来');
}
```

### Định vị anchor theo hash

```ts
const hash = ctx.location.hash; // 如 "#edit"
if (hash === '#edit') {
  // 滚动到编辑区域或执行对应逻辑
}
```

## Liên quan

- [ctx.router](./router.md): Điều hướng route, `state` của `ctx.router.navigate` có thể lấy qua `ctx.location.state` ở page đích
- [ctx.route](./route.md): Thông tin match route hiện tại (tham số, cấu hình, v.v.), thường được dùng kết hợp với `ctx.location`
