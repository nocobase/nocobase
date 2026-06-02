---
title: "nb app destroy"
description: "Tài liệu lệnh nb app destroy: xóa tài nguyên runtime được quản lý, dữ liệu storage và cấu hình env đã lưu cho env được chọn."
keywords: "nb app destroy,NocoBase CLI,phá hủy env,dọn dẹp,xóa storage"
---

# nb app destroy

Phá hủy env được chọn bằng cách xóa tài nguyên runtime được quản lý, dữ liệu storage và cấu hình CLI env đã lưu.

Với env local và Docker, lệnh này trước tiên xóa các tài nguyên runtime ứng dụng được quản lý trên máy này, đồng thời xóa runtime cơ sở dữ liệu tích hợp nếu có, xóa dữ liệu storage, rồi cuối cùng xóa cấu hình CLI env đã lưu. Với env HTTP và SSH, lệnh chỉ xóa cấu hình CLI env đã lưu và không đụng tới dịch vụ bên ngoài.

Với env npm/Git cục bộ được tải về, lệnh cũng xóa các tệp app cục bộ do CLI quản lý. Với đường dẫn app local tùy chỉnh, lệnh sẽ giữ lại các tệp source cục bộ và chỉ xóa tài nguyên runtime được quản lý, dữ liệu storage và cấu hình env đã lưu.

Theo mặc định, lệnh sẽ yêu cầu xác nhận. Trong chế độ không tương tác, bạn phải truyền rõ `--env` và `--force`.

## Cách dùng

```bash
nb app destroy [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env cần phá hủy; trong chế độ tương tác, nếu bỏ qua thì mặc định dùng env hiện tại |
| `--force`, `-f` | boolean | Bỏ qua xác nhận và phá hủy ngay env đã chọn; bắt buộc trong chế độ không tương tác |
| `--verbose` | boolean | Hiển thị output thô từ các lệnh destroy |

## Ví dụ

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## Lệnh liên quan

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
