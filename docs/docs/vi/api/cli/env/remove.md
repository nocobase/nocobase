---
title: "nb env remove"
description: "Tài liệu lệnh nb env remove: xóa cấu hình của một NocoBase CLI env."
keywords: "nb env remove,NocoBase CLI,Xóa môi trường,Xóa cấu hình"
---

# nb env remove

Xóa một env đã cấu hình. Lệnh này chỉ xóa cấu hình CLI env; nếu bạn muốn dọn dẹp ứng dụng cục bộ, container và storage, hãy dùng [`nb app down`](../app/down.md).

## Cách dùng

```bash
nb env remove <name> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<name>` | string | Tên môi trường muốn xóa |
| `--force`, `-f` | boolean | Bỏ qua xác nhận và xóa luôn |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |

## Ví dụ

```bash
nb env remove staging
nb env remove staging -f
```

## Lệnh liên quan

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
