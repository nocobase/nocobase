---
title: "nb env update"
description: "Tài liệu lệnh nb env update: làm mới OpenAPI Schema và cache lệnh runtime của env được chỉ định."
keywords: "nb env update,NocoBase CLI,OpenAPI,Lệnh runtime,swagger"
---

# nb env update

Làm mới OpenAPI Schema từ ứng dụng NocoBase và cập nhật cache lệnh runtime cục bộ. Cache được lưu tại `.nocobase/versions/<hash>/commands.json`.

## Cách dùng

```bash
nb env update [name] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên môi trường, bỏ qua thì dùng env hiện tại |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |
| `--api-base-url` | string | Ghi đè địa chỉ API NocoBase và lưu lâu dài vào env đích |
| `--role` | string | Ghi đè role, gửi đi qua header `X-Role` |
| `--token`, `-t` | string | Ghi đè API key và lưu lâu dài vào env đích |

## Ví dụ

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Lệnh liên quan

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
