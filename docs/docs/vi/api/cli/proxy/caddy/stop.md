---
title: "nb proxy caddy stop"
description: "Tài liệu tham khảo lệnh nb proxy caddy stop: dừng proxy Caddy với driver hiện tại."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Dừng proxy Caddy với driver hiện tại.

## Cách dùng

```bash
nb proxy caddy stop
```

## Ví dụ

```bash
nb proxy caddy stop
```

## Ghi chú

- Với driver `local`, lệnh này dừng tiến trình Caddy cục bộ
- Với driver `docker`, lệnh này dừng container proxy
- Nếu proxy đã dừng, lệnh sẽ thông báo rằng nó đã dừng sẵn

## Lệnh liên quan

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
