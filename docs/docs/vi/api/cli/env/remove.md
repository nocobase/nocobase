---
title: 'nb env remove'
description: 'Tài liệu tham khảo lệnh nb env remove: dừng các runtime được quản lý trước khi xóa cấu hình env, hoặc dọn dẹp hoàn toàn các tài nguyên cục bộ được quản lý khi cần.'
keywords: 'nb env remove,NocoBase CLI,xóa môi trường,xóa cấu hình,purge'
---

# nb env remove

Xóa một env đã được cấu hình. Với env local/docker, lệnh này trước tiên sẽ dừng runtime ứng dụng và runtime cơ sở dữ liệu tích hợp do CLI quản lý trên máy hiện tại, sau đó xóa cấu hình CLI env đã lưu. Với env http/ssh, lệnh này chỉ xóa cấu hình CLI env đã lưu.

Nếu env bị xóa là env hiện tại, CLI sẽ tự động chọn một current env mới từ các env còn lại; nếu không còn env nào khả dụng, current env sẽ bị xóa trống.

Theo mặc định, lệnh sẽ yêu cầu xác nhận. Trong chế độ không tương tác, bạn phải truyền rõ ràng `--force` thì mới có thể thực thi.

Nếu cần dọn dẹp tài nguyên do CLI quản lý trên máy hiện tại nhiều nhất có thể, bạn có thể truyền `--purge`. Với env local/docker, `--purge` cũng sẽ dọn dẹp tài nguyên runtime được quản lý, dữ liệu storage và các tệp app cục bộ đã tải xuống khi áp dụng; với env http/ssh, `--purge` sẽ không tác động đến các dịch vụ bên ngoài mà chỉ xóa cấu hình CLI env đã lưu.

## Cách dùng

```bash
nb env remove <name> [flags]
```

## Tham số

| Tham số         | Kiểu    | Mô tả                                                                                                                                                                              |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | Tên môi trường đã được cấu hình cần xóa                                                                                                                                            |
| `--force`, `-f` | boolean | Bỏ qua xác nhận trong chế độ remove hiện tại; bắt buộc trong chế độ không tương tác                                                                                                |
| `--purge`       | boolean | Dọn dẹp thêm các tài nguyên do CLI quản lý, dữ liệu storage và các tệp app cục bộ đã tải xuống trên máy hiện tại khi áp dụng; với env API từ xa, chỉ cấu hình env đã lưu sẽ bị xóa |
| `--verbose`     | boolean | Hiển thị tiến trình chi tiết                                                                                                                                                       |

## Ví dụ

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Các lệnh liên quan

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
