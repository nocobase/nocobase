---
title: "ctx.router"
description: "ctx.router là instance route, dùng cho điều hướng lập trình, lấy path hiện tại, chuyển đến page."
keywords: "ctx.router,route,điều hướng lập trình,chuyển đến page,RunJS,NocoBase"
---

# ctx.router

Instance route dựa trên React Router, dùng để điều hướng bằng code trong RunJS. Thường được dùng kết hợp với `ctx.route`, `ctx.location`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField** | Sau khi click button chuyển đến page chi tiết, page list hoặc link bên ngoài |
| **Quy tắc liên kết / luồng sự kiện** | Sau khi submit thành công `navigate` đến list hoặc chi tiết, hoặc truyền state đến page đích |
| **JSAction / xử lý sự kiện** | Thực hiện điều hướng route trong logic submit form, click link, v.v. |
| **Điều hướng view** | Khi chuyển đổi view stack nội bộ, cập nhật URL qua `navigate` |

> Lưu ý: `ctx.router` chỉ khả dụng trong môi trường RunJS có ngữ cảnh route (như JSBlock trong page, page Flow, luồng sự kiện, v.v.); trong các ngữ cảnh không route hoặc backend thuần túy (như workflow) có thể trống.

## Định nghĩa kiểu

```typescript
router: Router
```

`Router` đến từ `@remix-run/router`, trong RunJS thực hiện các thao tác điều hướng như chuyển hướng, quay lại, refresh qua `ctx.router.navigate()`.

## Phương thức

### ctx.router.navigate()

Chuyển đến path đích, hoặc thực hiện back/refresh.

**Chữ ký:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Tham số:**

- `to`: Path đích (string), vị trí tương đối lịch sử (number, như `-1` biểu thị back) hoặc `null` (refresh page hiện tại)
- `options`: Cấu hình tùy chọn
  - `replace?: boolean`: Có thay thế history record hiện tại hay không (mặc định `false`, tức là push record mới)
  - `state?: any`: State được truyền cho route đích. Dữ liệu này không xuất hiện trong URL, có thể truy cập qua `ctx.location.state` ở page đích, phù hợp với thông tin nhạy cảm, dữ liệu tạm thời hoặc thông tin không nên đặt trong URL

## Ví dụ

### Chuyển hướng cơ bản

```ts
// 跳转到用户列表（push 新历史，可后退）
ctx.router.navigate('/admin/users');

// 跳转到详情页
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Thay thế history (không thêm record mới)

```ts
// 登录后重定向到首页，用户后退不会回到登录页
ctx.router.navigate('/admin', { replace: true });

// 表单提交成功后替换当前页为详情页
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Truyền state

```ts
// 跳转时携带数据，目标页通过 ctx.location.state 获取
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Back và refresh

```ts
// 后退一页
ctx.router.navigate(-1);

// 后退两页
ctx.router.navigate(-2);

// 刷新当前页
ctx.router.navigate(null);
```

## Quan hệ với ctx.route, ctx.location

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Điều hướng** | `ctx.router.navigate(path)` |
| **Đọc path hiện tại** | `ctx.route.pathname` hoặc `ctx.location.pathname` |
| **Đọc state truyền khi điều hướng** | `ctx.location.state` |
| **Đọc tham số route** | `ctx.route.params` |

`ctx.router` chịu trách nhiệm "hành động điều hướng", `ctx.route` và `ctx.location` chịu trách nhiệm "trạng thái route hiện tại".

## Lưu ý

- `navigate(path)` mặc định sẽ push record history mới, người dùng có thể quay lại qua nút back của browser
- `replace: true` sẽ thay thế history record hiện tại mà không thêm mới, phù hợp với các kịch bản như redirect sau login, chuyển hướng sau khi submit thành công
- **Về tham số `state`**:
  - Dữ liệu được truyền qua `state` không xuất hiện trong URL, phù hợp với dữ liệu nhạy cảm hoặc tạm thời
  - Có thể truy cập qua `ctx.location.state` ở page đích
  - `state` sẽ được lưu trong history của browser, vẫn truy cập được khi forward/back
  - Sau khi refresh page, `state` sẽ mất

## Liên quan

- [ctx.route](./route.md): Thông tin match route hiện tại (pathname, params, v.v.)
- [ctx.location](./location.md): Vị trí URL hiện tại (pathname, search, hash, state), `state` được đọc tại đây sau khi điều hướng
