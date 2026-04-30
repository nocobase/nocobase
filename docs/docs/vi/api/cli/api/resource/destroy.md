---
title: "nb api resource destroy"
description: "Tài liệu lệnh nb api resource destroy: xóa bản ghi của tài nguyên NocoBase được chỉ định."
keywords: "nb api resource destroy,NocoBase CLI,Xóa bản ghi,CRUD"
---

# nb api resource destroy

Xóa bản ghi của tài nguyên được chỉ định. Bạn có thể dùng `--filter-by-tk` hoặc `--filter` để định vị bản ghi.

## Cách dùng

```bash
nb api resource destroy --resource <resource> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--resource` | string | Tên tài nguyên, bắt buộc |
| `--data-source` | string | Key của data source, mặc định `main` |
| `--source-id` | string | ID bản ghi nguồn của tài nguyên quan hệ |
| `--filter-by-tk` | string | Giá trị khóa chính; nếu là composite hoặc nhiều key có thể truyền JSON array |
| `--filter` | string | Điều kiện lọc dạng JSON object |

Cũng hỗ trợ các tham số kết nối chung của [`nb api resource`](./index.md).

## Ví dụ

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Lệnh liên quan

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
