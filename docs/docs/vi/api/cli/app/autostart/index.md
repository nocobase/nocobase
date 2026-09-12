---
title: "nb app autostart"
description: "Tài liệu tham khảo nhóm lệnh nb app autostart: bật hoặc tắt tự khởi động cho env local hoặc Docker và khởi chạy tất cả env đã bật trong một lần."
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

Quản lý cài đặt tự khởi động của ứng dụng.

Nhóm lệnh này bao gồm hai loại công việc:

- bật hoặc tắt cờ tự khởi động cho một env
- khởi chạy tất cả env đã bật tự khởi động

`nb app autostart` chỉ áp dụng cho env có runtime do CLI quản lý trên máy hiện tại, tức là `local` và `docker`. Nếu một env chỉ là kết nối API từ xa, hoặc không phải runtime ứng dụng do CLI quản lý có thể khởi chạy trên máy này, nó không thể tham gia vào luồng tự khởi động này.

## Cách dùng

```bash
nb app autostart <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Bật cờ tự khởi động cho một env |
| [`nb app autostart disable`](./disable.md) | Tắt cờ tự khởi động cho một env |
| [`nb app autostart list`](./list.md) | Hiển thị trạng thái tự khởi động của tất cả env |
| [`nb app autostart run`](./run.md) | Khởi chạy tất cả env đã bật tự khởi động |

## Ghi chú

`nb app autostart enable` chỉ đánh dấu một env là được phép tự khởi động. Bản thân lệnh này không tự tích hợp env vào luồng khởi động của hệ điều hành. Trong một setup production thực tế, bạn thường vẫn cần gọi `nb app autostart run` từ cơ chế khởi động của riêng mình, ví dụ như `systemd`, script khởi động của nền tảng container hoặc quy trình boot khác mà bạn đang dùng.

Ngoài ra, `nb app autostart run` sẽ kiểm tra từng env đã bật một. Những env có thể khởi chạy sẽ tiếp tục nội bộ qua `nb app start --env <name> --yes`. Những env không nên tự động khởi động trên máy hiện tại sẽ hiện là `skipped` hoặc `failed` trong bảng kết quả.

## Ví dụ

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Lệnh liên quan

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
