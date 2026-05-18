---
title: "nb env remove"
description: "Tài liệu lệnh nb env remove: xóa cấu hình của một NocoBase CLI env."
keywords: "nb env remove,NocoBase CLI,Xóa môi trường,Xóa cấu hình"
---

# nb env remove

Xóa một env đã cấu hình. Lệnh này chỉ xóa cấu hình CLI env đã lưu và không dọn dẹp thư mục ứng dụng cục bộ, container hay dữ liệu storage; hãy dùng [`nb app down`](../app/down.md) khi bạn cần dọn tài nguyên runtime cục bộ.

Nếu env bị xóa cũng chính là env hiện tại, CLI sẽ tự động chọn một env hiện tại mới từ các env còn lại. Nếu không còn env nào, env hiện tại sẽ được xóa khỏi trạng thái.

Theo mặc định, lệnh sẽ yêu cầu xác nhận. Để bỏ qua xác nhận, hãy truyền `--yes`. Trong chế độ không tương tác, bắt buộc phải có `--yes` trước khi env có thể bị xóa.

## Cách dùng

```bash
nb env remove <name> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<name>` | string | Tên env đã cấu hình để xoá |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận và xóa cấu hình CLI env đã lưu |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |

## Ví dụ

```bash
nb env remove staging
nb env remove staging --yes
```

## Lệnh liên quan

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
