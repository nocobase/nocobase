---
title: "nb app start"
description: "Tài liệu lệnh nb app start: khởi động ứng dụng NocoBase của env được chỉ định và, với env Docker, tạo lại container ứng dụng từ cấu hình đã lưu."
keywords: "nb app start,NocoBase CLI,Khởi động ứng dụng,Docker,pm2"
---

# nb app start

Khởi động ứng dụng NocoBase của env được chỉ định. Cài đặt npm/Git sẽ chạy lệnh ứng dụng cục bộ, còn cài đặt Docker sẽ tạo lại container ứng dụng từ cấu hình env đã lưu.

## Cách dùng

```bash
nb app start [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn khởi động, bỏ qua thì dùng env hiện tại |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
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
nb app start --env local --verbose
nb app start --env local-docker
```

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

Theo mặc định, env cục bộ sẽ khởi động ở chế độ nền, còn env Docker sẽ tạo lại container ứng dụng từ cấu hình env đã lưu. Mỗi khi CLI cần đợi ứng dụng sẵn sàng, CLI sẽ kiểm tra `__health_check`: trước hết in ra một dòng waiting, sau đó in một dòng progress mỗi 10 giây cho đến khi ứng dụng khả dụng hoặc hết thời gian chờ.

Nếu bạn truyền `--no-daemon` cho env cục bộ, ứng dụng sẽ chạy ở chế độ foreground. Khi đó, CLI sẽ không tiếp tục đợi kiểm tra readiness sau khi khởi động.

## Lệnh liên quan

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
