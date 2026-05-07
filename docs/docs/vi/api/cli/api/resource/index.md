---
title: "nb api resource"
description: "Tài liệu lệnh nb api resource: thực hiện CRUD và truy vấn tổng hợp trên bất kỳ tài nguyên NocoBase nào."
keywords: "nb api resource,NocoBase CLI,CRUD,Tài nguyên,Bảng dữ liệu"
---

# nb api resource

Thực hiện CRUD và truy vấn tổng hợp trên bất kỳ tài nguyên NocoBase nào. Tên tài nguyên có thể là tài nguyên thường, ví dụ `users`, hoặc tài nguyên quan hệ, ví dụ `posts.comments`.

## Cách dùng

```bash
nb api resource <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb api resource list`](./list.md) | Liệt kê các bản ghi tài nguyên |
| [`nb api resource get`](./get.md) | Lấy một bản ghi tài nguyên |
| [`nb api resource create`](./create.md) | Tạo bản ghi tài nguyên |
| [`nb api resource update`](./update.md) | Cập nhật bản ghi tài nguyên |
| [`nb api resource destroy`](./destroy.md) | Xóa bản ghi tài nguyên |
| [`nb api resource query`](./query.md) | Thực hiện truy vấn tổng hợp |

## Tham số chung

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--api-base-url` | string | Địa chỉ API NocoBase, ví dụ `http://localhost:13000/api` |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |
| `--env`, `-e` | string | Tên môi trường |
| `--role` | string | Ghi đè role, gửi đi qua header `X-Role` |
| `--token`, `-t` | string | Ghi đè API key |
| `--json-output`, `-j` / `--no-json-output` | boolean | Có output JSON gốc hay không, mặc định bật |
| `--resource` | string | Tên tài nguyên, bắt buộc, ví dụ `users`, `orders`, `posts.comments` |
| `--data-source` | string | Key của data source, mặc định `main` |

Các lệnh tài nguyên quan hệ còn có thể kết hợp với `--source-id` để chỉ định ID bản ghi nguồn.

## Ví dụ

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Lệnh liên quan

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
