---
title: "nb env auth"
description: "Tài liệu lệnh nb env auth: đăng nhập OAuth cho NocoBase env đã lưu."
keywords: "nb env auth,NocoBase CLI,OAuth,Đăng nhập,Xác thực"
---

# nb env auth

Đăng nhập OAuth cho env được chỉ định. Khi bỏ qua tên môi trường, lệnh sẽ dùng env hiện tại.

## Cách dùng

```bash
nb env auth [name]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên môi trường, bỏ qua thì dùng env hiện tại |

## Mô tả

Lệnh sử dụng quy trình PKCE bên trong: khởi động service callback cục bộ, mở trình duyệt để cấp quyền, trao đổi token và lưu vào file cấu hình.

## Ví dụ

```bash
nb env auth
nb env auth prod
```

## Lệnh liên quan

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
