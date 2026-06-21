---
title: "nb api resource create"
description: "Tài liệu lệnh nb api resource create: tạo bản ghi cho tài nguyên NocoBase được chỉ định."
keywords: "nb api resource create,NocoBase CLI,Tạo bản ghi,CRUD"
---

# nb api resource create

Tạo bản ghi cho tài nguyên được chỉ định. Nội dung bản ghi được truyền qua `--values` ở dạng JSON object.

## Cách dùng

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--resource` | string | Tên tài nguyên, bắt buộc |
| `--data-source` | string | Key của data source, mặc định `main` |
| `--source-id` | string | ID bản ghi nguồn của tài nguyên quan hệ |
| `--values` | string | Dữ liệu để tạo bản ghi, JSON object, bắt buộc |
| `--whitelist` | string[] | Các field được phép ghi, có thể truyền nhiều lần hoặc truyền JSON array |
| `--blacklist` | string[] | Các field bị cấm ghi, có thể truyền nhiều lần hoặc truyền JSON array |

Cũng hỗ trợ các tham số kết nối chung của [`nb api resource`](./index.md).

## Ví dụ

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Lệnh liên quan

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
