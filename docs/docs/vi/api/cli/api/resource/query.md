---
title: "nb api resource query"
description: "Tài liệu lệnh nb api resource query: thực hiện truy vấn tổng hợp trên một tài nguyên NocoBase được chỉ định."
keywords: "nb api resource query,NocoBase CLI,Truy vấn tổng hợp,Thống kê"
---

# nb api resource query

Thực hiện truy vấn tổng hợp trên tài nguyên được chỉ định. Các tham số `--measures`, `--dimensions` và `--orders` đều dùng định dạng JSON array.

## Cách dùng

```bash
nb api resource query --resource <resource> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--resource` | string | Tên tài nguyên, bắt buộc |
| `--data-source` | string | Key của data source, mặc định `main` |
| `--measures` | string | Định nghĩa measure dạng JSON array |
| `--dimensions` | string | Định nghĩa dimension dạng JSON array |
| `--orders` | string | Định nghĩa sắp xếp dạng JSON array |
| `--filter` | string | Điều kiện lọc dạng JSON object |
| `--having` | string | Điều kiện lọc sau group dạng JSON object |
| `--limit` | integer | Giới hạn số dòng trả về |
| `--offset` | integer | Số dòng bỏ qua |
| `--timezone` | string | Múi giờ dùng cho định dạng truy vấn |

Cũng hỗ trợ các tham số kết nối chung của [`nb api resource`](./index.md).

## Ví dụ

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Lệnh liên quan

- [`nb api resource list`](./list.md)
- [`nb api Lệnh động`](../dynamic.md)
