---
title: "nb db"
description: "Tài liệu lệnh nb db: xem hoặc quản lý trạng thái runtime của database tích hợp trong env đã chọn."
keywords: "nb db,NocoBase CLI,Database tích hợp,Docker,Trạng thái database"
---

# nb db

Xem hoặc quản lý database tích hợp do CLI quản lý. Với env không có container database do CLI quản lý, `nb db ps` cũng sẽ hiển thị trạng thái như `external` hoặc `remote`.

## Cách dùng

```bash
nb db <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb db ps`](./ps.md) | Xem trạng thái runtime của database tích hợp |
| [`nb db start`](./start.md) | Khởi động container database tích hợp |
| [`nb db stop`](./stop.md) | Dừng container database tích hợp |
| [`nb db logs`](./logs.md) | Xem log của container database tích hợp |

## Ví dụ

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Lệnh liên quan

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
