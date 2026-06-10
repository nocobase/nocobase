---
title: "nb proxy caddy start"
description: "Tài liệu tham khảo lệnh nb proxy caddy start: khởi động proxy Caddy với driver hiện tại."
keywords: "nb proxy caddy start,NocoBase CLI,caddy,start"
---

# nb proxy caddy start

Khởi động proxy Caddy với driver hiện tại.

## Cách dùng

```bash
nb proxy caddy start
```

## Ví dụ

```bash
nb proxy caddy start
```

## Ghi chú

- Với driver `local`, lệnh này khởi động tiến trình Caddy cục bộ
- Với driver `docker`, lệnh này khởi động hoặc tạo container Docker
- Nếu proxy đã chạy, lệnh sẽ thông báo rằng nó đã chạy sẵn

## Lệnh liên quan

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
