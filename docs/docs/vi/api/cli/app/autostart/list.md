---
title: "nb app autostart list"
description: "Tài liệu tham khảo nb app autostart list: hiển thị trạng thái tự khởi động của tất cả env đã được cấu hình."
keywords: "nb app autostart list,NocoBase CLI,autostart,danh sách env"
---

# nb app autostart list

Hiển thị trạng thái tự khởi động của tất cả env đã được cấu hình.

Bảng đầu ra bao gồm:

- `Current`: đánh dấu env hiện tại bằng `*`
- `Env`: tên env
- `Kind`: loại env
- `Source`: kiểu cài đặt hoặc nguồn
- `Autostart`: tự khởi động có được bật hay không

## Cách dùng

```bash
nb app autostart list
```

## Ví dụ

```bash
nb app autostart list
```

## Ghi chú

Nếu chưa có env nào được lưu, lệnh sẽ in ra `No environments are configured.`.

Lệnh này chỉ hiển thị trạng thái đã lưu trong CLI. Nó không kiểm tra xem ứng dụng hiện có đang chạy hay không, và cũng không kiểm tra xem quy trình khởi động hệ thống của bạn đã gọi `nb app autostart run` hay chưa. Mục đích chính của nó là cho biết env nào đang được đánh dấu tự khởi động trong cấu hình CLI.

## Lệnh liên quan

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
