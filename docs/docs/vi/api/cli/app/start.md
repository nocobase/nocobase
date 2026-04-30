---
title: "nb app start"
description: "Tài liệu lệnh nb app start: khởi động ứng dụng NocoBase hoặc Docker container của env được chỉ định."
keywords: "nb app start,NocoBase CLI,Khởi động ứng dụng,Docker,pm2"
---

# nb app start

Khởi động ứng dụng NocoBase của env được chỉ định. Cài đặt npm/Git sẽ chạy lệnh ứng dụng cục bộ, còn cài đặt Docker sẽ khởi động container ứng dụng đã lưu.

## Cách dùng

```bash
nb app start [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn khởi động, bỏ qua thì dùng env hiện tại |
| `--quickstart` | boolean | Khởi động nhanh ứng dụng |
| `--port`, `-p` | string | Ghi đè `appPort` trong cấu hình env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Có chạy ở chế độ daemon hay không, mặc định bật |
| `--instances`, `-i` | integer | Số lượng instance chạy |
| `--launch-mode` | string | Cách khởi động: `pm2` hoặc `node` |
| `--verbose` | boolean | Hiển thị output của lệnh cục bộ hoặc Docker bên dưới |

## Ví dụ

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local-docker
```

## Lệnh liên quan

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
