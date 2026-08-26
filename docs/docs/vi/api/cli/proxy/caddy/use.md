---
title: "nb proxy caddy use"
description: "Tài liệu tham khảo lệnh nb proxy caddy use: chuyển driver hiện tại của provider Caddy."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Chuyển driver hiện tại của provider Caddy.

## Cách dùng

```bash
nb proxy caddy use <driver>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<driver>` | string | Hỗ trợ `local` hoặc `docker` |

## Ví dụ

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Ghi chú

- Lệnh này lưu kết quả vào `proxy.caddy-driver`
- Các lệnh tiếp theo như `start`, `reload`, `stop`, `status` và `info` đều sẽ dùng driver hiện tại

## Lệnh liên quan

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
