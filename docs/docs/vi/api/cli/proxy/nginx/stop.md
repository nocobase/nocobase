---
title: "nb proxy nginx stop"
description: "Tài liệu tham khảo lệnh nb proxy nginx stop: dừng proxy Nginx với driver hiện tại."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Dừng proxy Nginx với driver hiện tại.

## Cách dùng

```bash
nb proxy nginx stop
```

## Ví dụ

```bash
nb proxy nginx stop
```

## Ghi chú

- Với driver `local`, lệnh này dừng tiến trình Nginx cục bộ
- Với driver `docker`, lệnh này dừng container proxy
- Nếu proxy đã dừng, lệnh sẽ thông báo rằng nó đã dừng sẵn

## Lệnh liên quan

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
