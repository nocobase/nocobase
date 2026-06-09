---
title: "nb proxy caddy"
description: "Tài liệu tham khảo nhóm lệnh nb proxy caddy: quản lý driver của provider Caddy, việc tạo cấu hình và điều khiển runtime."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy

`nb proxy caddy` là điểm vào của nhóm lệnh dành cho provider Caddy.

Nếu bạn đã có domain, muốn bật HTTPS nhanh và không muốn tự quản quá nhiều chi tiết TLS, thì đây thường là nơi phù hợp để bắt đầu. Nhóm lệnh này xử lý hai việc:

- chọn cách chạy Caddy, tức là `local` hoặc `docker`
- tạo, khởi động, tải lại và kiểm tra điểm vào Caddy cho các env do CLI quản lý

## Cách dùng

```bash
nb proxy caddy <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Chuyển driver của Caddy |
| [`nb proxy caddy current`](./current.md) | Hiển thị driver hiện tại |
| [`nb proxy caddy generate`](./generate.md) | Tạo hoặc làm mới cấu hình Caddy cho một env |
| [`nb proxy caddy start`](./start.md) | Khởi động proxy Caddy |
| [`nb proxy caddy restart`](./restart.md) | Khởi động lại proxy Caddy |
| [`nb proxy caddy reload`](./reload.md) | Tải lại cấu hình Caddy |
| [`nb proxy caddy stop`](./stop.md) | Dừng proxy Caddy |
| [`nb proxy caddy status`](./status.md) | Hiển thị trạng thái runtime của Caddy |
| [`nb proxy caddy info`](./info.md) | Hiển thị driver, các đường dẫn cấu hình và thông tin runtime |

## Ghi chú

- Driver hiện tại được lưu trong `proxy.caddy-driver`
- Driver mặc định là `local`
- Driver local dùng tệp thực thi được trỏ bởi `bin.caddy`, với giá trị mặc định là `caddy`
- Driver Docker dùng `caddy:latest`
- Tên container Docker mặc định là `<docker.container-prefix>-caddy-proxy`
- Driver Docker mount `NB_CLI_ROOT` của host vào container tại `/apps`

## Quy trình làm việc điển hình

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Lệnh liên quan

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
