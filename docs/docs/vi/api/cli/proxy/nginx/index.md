---
title: "nb proxy nginx"
description: "Tài liệu tham khảo nhóm lệnh nb proxy nginx: quản lý driver của provider Nginx, việc tạo cấu hình và điều khiển runtime."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx

`nb proxy nginx` là điểm vào của nhóm lệnh dành cho provider Nginx.

Nếu bạn đã dùng Nginx để quản lý site, chứng chỉ, cache hoặc kiểm soát truy cập, thì đây thường là nơi phù hợp để bắt đầu. Nhóm lệnh này xử lý hai việc:

- chọn cách chạy Nginx, tức là `local` hoặc `docker`
- tạo, khởi động, tải lại và kiểm tra điểm vào Nginx cho các env do CLI quản lý

## Cách dùng

```bash
nb proxy nginx <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Chuyển driver của Nginx |
| [`nb proxy nginx current`](./current.md) | Hiển thị driver hiện tại |
| [`nb proxy nginx generate`](./generate.md) | Tạo hoặc làm mới cấu hình Nginx cho một env |
| [`nb proxy nginx start`](./start.md) | Khởi động proxy Nginx |
| [`nb proxy nginx restart`](./restart.md) | Khởi động lại proxy Nginx |
| [`nb proxy nginx reload`](./reload.md) | Tải lại cấu hình Nginx |
| [`nb proxy nginx stop`](./stop.md) | Dừng proxy Nginx |
| [`nb proxy nginx status`](./status.md) | Hiển thị trạng thái runtime của Nginx |
| [`nb proxy nginx info`](./info.md) | Hiển thị driver, các đường dẫn cấu hình và thông tin runtime |

## Ghi chú

- Driver hiện tại được lưu trong `proxy.nginx-driver`
- Driver mặc định là `local`
- Driver local dùng tệp thực thi được trỏ bởi `bin.nginx`, với giá trị mặc định là `nginx`
- Driver Docker dùng `nginx:latest`
- Tên container Docker mặc định là `<docker.container-prefix>-nginx-proxy`
- Driver Docker mount `NB_CLI_ROOT` của host vào container tại `/apps`

## Quy trình làm việc điển hình

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Lệnh liên quan

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
