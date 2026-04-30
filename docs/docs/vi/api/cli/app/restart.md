---
title: "nb app restart"
description: "Tài liệu lệnh nb app restart: khởi động lại ứng dụng NocoBase hoặc Docker container của env được chỉ định."
keywords: "nb app restart,NocoBase CLI,Khởi động lại ứng dụng,Docker"
---

# nb app restart

Dừng rồi khởi động lại ứng dụng NocoBase của env được chỉ định.

## Cách dùng

```bash
nb app restart [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn khởi động lại, bỏ qua thì dùng env hiện tại |
| `--quickstart` | boolean | Khởi động nhanh ứng dụng sau khi dừng |
| `--port`, `-p` | string | Ghi đè `appPort` trong cấu hình env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Sau khi dừng có chạy ở chế độ daemon hay không, mặc định bật |
| `--instances`, `-i` | integer | Số lượng instance chạy sau khi dừng |
| `--launch-mode` | string | Cách khởi động: `pm2` hoặc `node` |
| `--verbose` | boolean | Hiển thị output của lệnh stop và start bên dưới |

## Ví dụ

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local-docker
```

## Lệnh liên quan

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
