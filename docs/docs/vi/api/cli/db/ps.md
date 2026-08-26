---
title: "nb db ps"
description: "Tài liệu lệnh nb db ps: xem trạng thái runtime của database tích hợp trong các env đã cấu hình."
keywords: "nb db ps,NocoBase CLI,Trạng thái database"
---

# nb db ps

Xem trạng thái runtime của database tích hợp, không khởi động hay dừng tài nguyên nào. Khi bỏ qua `--env`, lệnh sẽ hiển thị trạng thái database của tất cả env đã cấu hình.

## Cách dùng

```bash
nb db ps [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn xem, bỏ qua thì hiển thị tất cả env |

## Ví dụ

```bash
nb db ps
nb db ps --env app1
```

## Lệnh liên quan

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
