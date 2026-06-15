---
title: "nb proxy nginx start"
description: "Tài liệu tham khảo lệnh nb proxy nginx start: khởi động proxy Nginx với driver hiện tại."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

Khởi động proxy Nginx với driver hiện tại.

## Cách dùng

```bash
nb proxy nginx start
```

## Ví dụ

```bash
nb proxy nginx start
```

## Ghi chú

- Với driver `local`, lệnh này khởi động tiến trình Nginx cục bộ
- Với driver `docker`, lệnh này khởi động hoặc tạo container Docker
- Nếu proxy đã chạy, lệnh sẽ thông báo rằng nó đã chạy sẵn

## Lệnh liên quan

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
