---
title: "nb api"
description: "Tài liệu lệnh nb api: gọi NocoBase API qua CLI, bao gồm các lệnh resource thông dụng và lệnh động."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

Gọi NocoBase API thông qua CLI. `nb api` bao gồm các lệnh CRUD chung [`nb api resource`](./resource/index.md), cũng như các lệnh được sinh động dựa trên OpenAPI Schema của ứng dụng hiện tại.

## Cách dùng

```bash
nb api <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb api resource`](./resource/index.md) | Thực hiện CRUD và truy vấn tổng hợp trên bất kỳ tài nguyên NocoBase nào |
| [`nb api Lệnh động`](./dynamic.md) | Lệnh topic và operation được sinh từ OpenAPI Schema của ứng dụng |

## Tham số chung

Hầu hết các lệnh `nb api` đều hỗ trợ các tham số kết nối sau:

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--api-base-url` | string | Địa chỉ API NocoBase, ví dụ `http://localhost:13000/api` |
| `--env`, `-e` | string | Tên môi trường |
| `--token`, `-t` | string | Ghi đè API key |
| `--role` | string | Ghi đè role, gửi đi qua header `X-Role` |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |
| `--json-output`, `-j` / `--no-json-output` | boolean | Có output JSON gốc hay không, mặc định bật |

## Ví dụ

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Lệnh liên quan

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
