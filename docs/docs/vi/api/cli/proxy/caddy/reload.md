---
title: "nb proxy caddy reload"
description: "Tài liệu tham khảo lệnh nb proxy caddy reload: tải lại cấu hình Caddy với driver hiện tại."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Tải lại cấu hình Caddy với driver hiện tại.

## Cách dùng

```bash
nb proxy caddy reload
```

## Ví dụ

```bash
nb proxy caddy reload
```

## Ghi chú

- Lệnh này thường được dùng sau khi bạn tạo lại cấu hình
- `reload` yêu cầu Caddy đã chạy sẵn; nếu chưa chạy, hãy dùng `nb proxy caddy start` trước
- Driver local sẽ tải lại Caddy cục bộ, còn driver Docker sẽ tải lại Caddy bên trong container

## Lệnh liên quan

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
