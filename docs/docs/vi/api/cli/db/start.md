---
title: "nb db start"
description: "Tài liệu lệnh nb db start: khởi động container database tích hợp của env được chỉ định."
keywords: "nb db start,NocoBase CLI,Khởi động database,Docker"
---

# nb db start

Khởi động container database tích hợp của env được chỉ định. Lệnh này chỉ áp dụng cho env có database tích hợp do CLI quản lý.

## Cách dùng

```bash
nb db start [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn khởi động database tích hợp, bỏ qua thì dùng env hiện tại |
| `--verbose` | boolean | Hiển thị output của lệnh Docker bên dưới |

## Ví dụ

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Lệnh liên quan

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
