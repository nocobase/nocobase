---
title: "nb app restart"
description: "Tài liệu lệnh nb app restart: khởi động lại ứng dụng NocoBase của env được chỉ định và, với env Docker, tạo lại container ứng dụng từ cấu hình đã lưu."
keywords: "nb app restart,NocoBase CLI,Khởi động lại ứng dụng,Docker"
---

# nb app restart

Dừng rồi khởi động lại ứng dụng NocoBase của env được chỉ định. Env cục bộ sẽ dùng lại luồng `nb app stop` và `nb app start`; env Docker sẽ xóa container hiện tại trước, rồi tạo lại container ứng dụng từ cấu hình env đã lưu.

## Cách dùng

```bash
nb app restart [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn khởi động lại, bỏ qua thì dùng env hiện tại |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
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
nb app restart --env local --verbose
nb app restart --env local-docker
```

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

Mỗi khi CLI cần đợi ứng dụng sẵn sàng, CLI sẽ kiểm tra `__health_check`: trước hết in ra một dòng waiting, sau đó in một dòng progress mỗi 10 giây cho đến khi ứng dụng khả dụng hoặc hết thời gian chờ. Nếu bạn truyền `--no-daemon` cho env cục bộ, ứng dụng sẽ chạy ở chế độ foreground, nên CLI sẽ không tiếp tục đợi kiểm tra readiness sau khi khởi động.

## Lệnh liên quan

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
