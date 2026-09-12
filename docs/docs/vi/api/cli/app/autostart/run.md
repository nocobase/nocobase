---
title: "nb app autostart run"
description: "Tài liệu tham khảo nb app autostart run: khởi chạy tất cả env đã bật tự khởi động ứng dụng."
keywords: "nb app autostart run,NocoBase CLI,autostart,khởi động hàng loạt"
---

# nb app autostart run

Khởi chạy tất cả env đã bật tự khởi động ứng dụng.

Lệnh này thường được gọi sau khi hệ thống host khởi động xong, thông qua cơ chế startup của riêng bạn. CLI sẽ đọc tất cả env đã lưu, lọc ra các env đã bật tự khởi động, rồi cố gắng khởi chạy từng env một.

## Cách dùng

```bash
nb app autostart run [flags]
```

## Flags

| Flag | Kiểu | Mô tả |
| --- | --- | --- |
| `--verbose` | boolean | Hiển thị đầu ra khởi động thô từ các lệnh local hoặc Docker ở tầng dưới |

## Ví dụ

```bash
nb app autostart run
nb app autostart run --verbose
```

## Ghi chú

Nếu không có env nào bật tự khởi động, lệnh sẽ in ra `No environments have app autostart enabled.`.

Trong quá trình thực thi, CLI xử lý từng env đã bật một:

- env có thể khởi chạy sẽ hiện là `started`
- env không nên tự khởi động trên máy hiện tại sẽ hiện là `skipped`
- env thất bại trong quá trình khởi động sẽ hiện là `failed`

Nội bộ, lệnh này gọi `nb app start --env <name> --yes`. Nếu bạn truyền `--verbose`, cờ này cũng sẽ được chuyển tiếp xuống luồng khởi động bên dưới.

Nếu có bất kỳ kết quả nào là `failed`, lệnh sẽ thoát với lỗi và in ra `Some app autostart envs failed to start.`. Nhờ đó, lỗi sẽ được nhìn thấy rõ trong `systemd`, CI hoặc các cơ chế startup khác của host.

## Lệnh liên quan

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
