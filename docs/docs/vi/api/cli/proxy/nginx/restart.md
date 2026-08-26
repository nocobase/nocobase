---
title: "nb proxy nginx restart"
description: "Tài liệu tham khảo lệnh nb proxy nginx restart: khởi động lại proxy Nginx với driver hiện tại."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

Khởi động lại proxy Nginx với driver hiện tại.

## Cách dùng

```bash
nb proxy nginx restart
```

## Ví dụ

```bash
nb proxy nginx restart
```

## Ghi chú

- Lệnh này sẽ dừng proxy trước rồi khởi động lại
- Với `local` hoặc `docker`, lệnh sẽ thao tác trên tiến trình cục bộ hoặc container Docker tương ứng với driver hiện tại

## Lệnh liên quan

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
