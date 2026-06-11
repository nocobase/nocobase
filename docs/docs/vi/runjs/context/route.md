---
title: "ctx.route"
description: "ctx.route là thông tin route hiện tại, chứa path, params, v.v., dùng để lấy tham số page, render có điều kiện."
keywords: "ctx.route,route,path,params,tham số page,RunJS,NocoBase"
---

# ctx.route

Thông tin match route hiện tại, tương ứng với khái niệm route của React Router, dùng để lấy cấu hình route đang match, tham số, v.v. Thường được dùng kết hợp với `ctx.router`, `ctx.location`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField** | Render có điều kiện hoặc hiển thị định danh page hiện tại dựa trên `route.pathname` hoặc `route.params` |
| **Quy tắc liên kết / luồng sự kiện** | Đọc tham số route (như `params.name`) để rẽ nhánh logic hoặc truyền cho component con |
| **Điều hướng view** | Nội bộ so sánh `ctx.route.pathname` với path đích để quyết định có trigger `ctx.router.navigate` hay không |

> Lưu ý: `ctx.route` chỉ khả dụng trong môi trường RunJS có ngữ cảnh route (như JSBlock trong page, page Flow, v.v.); trong các ngữ cảnh không route hoặc backend thuần túy (như workflow) có thể trống.

## Định nghĩa kiểu

```ts
type RouteOptions = {
  name?: string;   // 路由唯一标识
  path?: string;   // 路由模板（如 /admin/:name）
  params?: Record<string, any>;  // 路由参数（如 { name: 'users' }）
  pathname?: string;  // 当前路由的完整路径（如 /admin/users）
};
```

## Trường thường dùng

| Trường | Kiểu | Mô tả |
|------|------|------|
| `pathname` | `string` | Path đầy đủ của route hiện tại, giống với `ctx.location.pathname` |
| `params` | `Record<string, any>` | Tham số động được parse từ template route, như `{ name: 'users' }` |
| `path` | `string` | Template route, như `/admin/:name` |
| `name` | `string` | Định danh duy nhất của route, thường dùng trong các kịch bản đa Tab, đa view |

## Quan hệ với ctx.router, ctx.location

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Đọc path hiện tại** | `ctx.route.pathname` hoặc `ctx.location.pathname`, hai cái này giống nhau khi match |
| **Đọc tham số route** | `ctx.route.params`, như `params.name` biểu thị UID của page hiện tại |
| **Điều hướng** | `ctx.router.navigate(path)` |
| **Đọc tham số query, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` chú trọng "cấu hình route đã match", `ctx.location` chú trọng "vị trí URL hiện tại", hai cái này phối hợp có thể mô tả đầy đủ trạng thái route hiện tại.

## Ví dụ

### Đọc pathname

```ts
// 显示当前路径
ctx.message.info('当前页面: ' + ctx.route.pathname);
```

### Rẽ nhánh dựa trên params

```ts
// params.name 通常为当前页面 UID（如 flow 页面标识）
if (ctx.route.params?.name === 'users') {
  // 在用户管理页执行特定逻辑
}
```

### Hiển thị trong page Flow

```tsx
<div>
  <h1>当前页面 - {ctx.route.pathname}</h1>
  <p>路由标识: {ctx.route.params?.name}</p>
</div>
```

## Liên quan

- [ctx.router](./router.md): Điều hướng route, sau khi `ctx.router.navigate()` thay đổi path, `ctx.route` sẽ cập nhật theo
- [ctx.location](./location.md): Vị trí URL hiện tại (pathname, search, hash, state), dùng kết hợp với `ctx.route`
