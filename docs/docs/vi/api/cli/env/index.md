---
title: "nb env"
description: "Tài liệu lệnh nb env: quản lý NocoBase CLI env, gồm thêm, làm mới, xem, chuyển, xác thực và xóa."
keywords: "nb env,NocoBase CLI,Quản lý env,env,Xác thực,OpenAPI"
---

# nb env

Quản lý các NocoBase CLI env đã lưu. Mỗi env lưu địa chỉ API, thông tin xác thực, đường dẫn ứng dụng cục bộ, cấu hình database và cache lệnh runtime.

## Cách dùng

```bash
nb env <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb env add`](./add.md) | Lưu một NocoBase API endpoint và đặt làm env hiện tại |
| [`nb env update`](./update.md) | Làm mới OpenAPI Schema và cache lệnh runtime từ ứng dụng |
| [`nb env list`](./list.md) | Liệt kê các env đã cấu hình và trạng thái xác thực API |
| [`nb env info`](./info.md) | Xem thông tin chi tiết của một env |
| [`nb env remove`](./remove.md) | Xóa cấu hình env |
| [`nb env auth`](./auth.md) | Đăng nhập OAuth cho env đã lưu |
| [`nb env use`](./use.md) | Chuyển env hiện tại |

## Ví dụ

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
