---
title: "nb db stop"
description: "Tài liệu lệnh nb db stop: dừng container database tích hợp của env được chỉ định."
keywords: "nb db stop,NocoBase CLI,Dừng database,Docker"
---

# nb db stop

Dừng container database tích hợp của env được chỉ định. Lệnh này chỉ áp dụng cho env có database tích hợp do CLI quản lý.

## Cách dùng

```bash
nb db stop [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn dừng database tích hợp, bỏ qua thì dùng env hiện tại |
| `--verbose` | boolean | Hiển thị output của lệnh Docker bên dưới |

## Ví dụ

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Lệnh liên quan

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
