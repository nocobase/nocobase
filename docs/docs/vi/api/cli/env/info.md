---
title: 'nb env info'
description: 'Tài liệu tham khảo lệnh nb env info: xem cấu hình ứng dụng, cơ sở dữ liệu, API và xác thực của env NocoBase CLI được chỉ định.'
keywords: 'nb env info,NocoBase CLI,chi tiết môi trường,cấu hình'
---

# nb env info

Xem thông tin chi tiết của một env, bao gồm cấu hình ứng dụng, cơ sở dữ liệu, API và xác thực.

## Cách dùng

```bash
nb env info [name] [flags]
```

## Tham số

| Tham số          | Kiểu    | Mô tả                                                                                                              |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `[name]`         | string  | Tên môi trường đã được cấu hình cần xem; nếu bỏ qua thì dùng env hiện tại                                          |
| `--json`         | boolean | Xuất JSON                                                                                                          |
| `--field`        | string  | Chỉ trả về một trường, dùng đường dẫn phân tách bằng dấu chấm, ví dụ `app.url`, `app.appPath` hoặc `api.auth.type` |
| `--show-secrets` | boolean | Hiển thị token, mật khẩu và các bí mật khác dưới dạng văn bản thuần                                                |

## Ví dụ

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Lệnh liên quan

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
