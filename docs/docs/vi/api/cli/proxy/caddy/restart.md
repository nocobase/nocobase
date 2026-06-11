---
title: "nb proxy caddy restart"
description: "Tài liệu tham khảo lệnh nb proxy caddy restart: khởi động lại proxy Caddy với driver hiện tại."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

Khởi động lại proxy Caddy với driver hiện tại.

## Cách dùng

```bash
nb proxy caddy restart
```

## Ví dụ

```bash
nb proxy caddy restart
```

## Ghi chú

- Lệnh này sẽ dừng proxy trước rồi khởi động lại
- Với `local` hoặc `docker`, lệnh sẽ thao tác trên tiến trình cục bộ hoặc container Docker tương ứng với driver hiện tại

## Lệnh liên quan

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
