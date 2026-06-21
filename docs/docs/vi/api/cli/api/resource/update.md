---
title: "nb api resource update"
description: "Tài liệu lệnh nb api resource update: cập nhật bản ghi của tài nguyên NocoBase được chỉ định."
keywords: "nb api resource update,NocoBase CLI,Cập nhật bản ghi,CRUD"
---

# nb api resource update

Cập nhật bản ghi của tài nguyên được chỉ định. Bạn có thể dùng `--filter-by-tk` hoặc `--filter` để định vị bản ghi và truyền nội dung cập nhật qua `--values`.

## Cách dùng

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--resource` | string | Tên tài nguyên, bắt buộc |
| `--data-source` | string | Key của data source, mặc định `main` |
| `--source-id` | string | ID bản ghi nguồn của tài nguyên quan hệ |
| `--filter-by-tk` | string | Giá trị khóa chính; nếu là composite hoặc nhiều key có thể truyền JSON array |
| `--filter` | string | Điều kiện lọc dạng JSON object |
| `--values` | string | Dữ liệu cập nhật bản ghi, JSON object, bắt buộc |
| `--whitelist` | string[] | Các field được phép ghi, có thể truyền nhiều lần hoặc truyền JSON array |
| `--blacklist` | string[] | Các field bị cấm ghi, có thể truyền nhiều lần hoặc truyền JSON array |
| `--update-association-values` | string[] | Các field quan hệ cần cập nhật cùng lúc, có thể truyền nhiều lần hoặc truyền JSON array |
| `--force-update` / `--no-force-update` | boolean | Có ép ghi giá trị không thay đổi hay không |

Cũng hỗ trợ các tham số kết nối chung của [`nb api resource`](./index.md).

## Ví dụ

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Lệnh liên quan

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
