---
title: "nb proxy nginx use"
description: "Tài liệu tham khảo lệnh nb proxy nginx use: chuyển driver hiện tại của provider Nginx."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Chuyển driver hiện tại của provider Nginx.

## Cách dùng

```bash
nb proxy nginx use <driver>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<driver>` | string | Hỗ trợ `local` hoặc `docker` |

## Ví dụ

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Ghi chú

- Lệnh này lưu kết quả vào `proxy.nginx-driver`
- Các lệnh tiếp theo như `start`, `reload`, `stop`, `status` và `info` đều sẽ dùng driver hiện tại

## Lệnh liên quan

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
