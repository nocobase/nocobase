---
title: "nb api resource get"
description: "Tài liệu lệnh nb api resource get: lấy một bản ghi của tài nguyên NocoBase được chỉ định."
keywords: "nb api resource get,NocoBase CLI,Lấy bản ghi,Khóa chính"
---

# nb api resource get

Lấy một bản ghi của tài nguyên được chỉ định. Thường dùng `--filter-by-tk` để chỉ định khóa chính.

## Cách dùng

```bash
nb api resource get --resource <resource> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--resource` | string | Tên tài nguyên, bắt buộc |
| `--data-source` | string | Key của data source, mặc định `main` |
| `--source-id` | string | ID bản ghi nguồn của tài nguyên quan hệ |
| `--filter-by-tk` | string | Giá trị khóa chính; nếu là composite hoặc nhiều key có thể truyền JSON array |
| `--fields` | string[] | Field cần truy vấn, có thể truyền nhiều lần hoặc truyền JSON array |
| `--appends` | string[] | Các field quan hệ cần thêm, có thể truyền nhiều lần hoặc truyền JSON array |
| `--except` | string[] | Các field cần loại bỏ, có thể truyền nhiều lần hoặc truyền JSON array |

Cũng hỗ trợ các tham số kết nối chung của [`nb api resource`](./index.md).

## Ví dụ

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Lệnh liên quan

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
