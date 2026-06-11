---
title: "nb api resource list"
description: "Tài liệu lệnh nb api resource list: liệt kê bản ghi của một tài nguyên NocoBase được chỉ định."
keywords: "nb api resource list,NocoBase CLI,Truy vấn danh sách,Tài nguyên"
---

# nb api resource list

Liệt kê bản ghi của tài nguyên được chỉ định. Bạn có thể dùng các tham số `--filter`, `--fields`, `--sort`, `--page`,... để điều khiển truy vấn.

## Cách dùng

```bash
nb api resource list --resource <resource> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--resource` | string | Tên tài nguyên, bắt buộc |
| `--data-source` | string | Key của data source, mặc định `main` |
| `--source-id` | string | ID bản ghi nguồn của tài nguyên quan hệ |
| `--filter` | string | Điều kiện lọc dạng JSON object |
| `--fields` | string[] | Field cần truy vấn, có thể truyền nhiều lần hoặc truyền JSON array |
| `--appends` | string[] | Các field quan hệ cần thêm, có thể truyền nhiều lần hoặc truyền JSON array |
| `--except` | string[] | Các field cần loại bỏ, có thể truyền nhiều lần hoặc truyền JSON array |
| `--sort` | string[] | Field sắp xếp, ví dụ `-createdAt`, có thể truyền nhiều lần hoặc truyền JSON array |
| `--page` | integer | Số trang |
| `--page-size` | integer | Số bản ghi mỗi trang |
| `--paginate` / `--no-paginate` | boolean | Có phân trang hay không |

Cũng hỗ trợ các tham số kết nối chung của [`nb api resource`](./index.md).

## Ví dụ

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Lệnh liên quan

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
