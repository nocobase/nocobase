---
title: "nb env remove"
description: "Tài liệu lệnh nb env remove: dừng runtime được quản lý trước khi xóa cấu hình env, hoặc dọn tài nguyên CLI cục bộ khi cần."
keywords: "nb env remove,NocoBase CLI,Xóa môi trường,Xóa cấu hình,purge"
---

# nb env remove

Xóa một env đã cấu hình. Với env local và Docker, lệnh này trước tiên dừng runtime ứng dụng và runtime cơ sở dữ liệu tích hợp do CLI quản lý trên máy này, rồi xóa cấu hình env đã lưu. Với env HTTP và SSH, lệnh chỉ xóa cấu hình env đã lưu.

Nếu env bị xóa cũng chính là env hiện tại, CLI sẽ tự động chọn một env hiện tại mới từ các env còn lại. Nếu không còn env nào, env hiện tại sẽ được xóa khỏi trạng thái.

Theo mặc định, lệnh sẽ yêu cầu xác nhận. Trong chế độ không tương tác, bắt buộc phải truyền `--force` trước khi chạy lệnh.

Truyền `--purge` để dọn thêm các tài nguyên do CLI quản lý trên máy này. Với env local và Docker, `--purge` thực hiện cùng kiểu dọn dẹp như [`nb app destroy`](../app/destroy.md). Với env HTTP và SSH, `--purge` không đụng tới dịch vụ bên ngoài và chỉ xóa cấu hình env đã lưu.

## Cách dùng

```bash
nb env remove <name> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<name>` | string | Tên env đã cấu hình để xoá |
| `--force`, `-f` | boolean | Bỏ qua xác nhận cho chế độ remove đã chọn; bắt buộc trong chế độ không tương tác |
| `--purge` | boolean | Đồng thời xóa các tài nguyên runtime cục bộ do CLI quản lý, dữ liệu storage và, khi áp dụng, các tệp app cục bộ đã tải về. Với env API từ xa, chỉ cấu hình env đã lưu bị xóa |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |

## Ví dụ

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Lệnh liên quan

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
