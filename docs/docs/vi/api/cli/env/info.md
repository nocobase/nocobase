---
title: "nb env info"
description: "Tài liệu lệnh nb env info: xem cấu hình ứng dụng, database, API và xác thực của một NocoBase CLI env."
keywords: "nb env info,NocoBase CLI,Chi tiết env,Cấu hình"
---

# nb env info

Xem thông tin chi tiết của một env, gồm cấu hình ứng dụng, database, API và xác thực.

## Cách dùng

```bash
nb env info [name] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên env đã cấu hình để xem; nếu bỏ qua, dùng env hiện tại |
| `--json` | boolean | Output dạng JSON |
| `--show-secrets` | boolean | Hiển thị token, mật khẩu và các giá trị bí mật ở dạng plaintext |

## Ví dụ

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
```

## Lệnh liên quan

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
