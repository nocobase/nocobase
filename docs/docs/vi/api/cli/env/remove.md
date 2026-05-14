---
title: "nb env remove"
description: "Tài liệu lệnh nb env remove: xóa cấu hình của một NocoBase CLI env."
keywords: "nb env remove,NocoBase CLI,Xóa môi trường,Xóa cấu hình"
---

# nb env remove

Xóa một env đã cấu hình. Lệnh này chỉ xóa cấu hình CLI env; nếu bạn muốn dọn dẹp ứng dụng cục bộ, container và storage, hãy dùng [`nb app down`](../app/down.md).

Nếu env bị xóa cũng chính là env hiện tại, CLI sẽ tự động chọn một env hiện tại mới từ các env còn lại. Nếu không còn env nào, env hiện tại sẽ được xóa khỏi trạng thái.

## Cách dùng

```bash
nb env remove <name> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<name>` | string | Tên env đã cấu hình để xoá |
| `--force`, `-f` | boolean | Bỏ qua xác nhận và xóa luôn |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |

## Ví dụ

```bash
nb env remove staging
nb env remove staging -f
```

## Lệnh liên quan

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
