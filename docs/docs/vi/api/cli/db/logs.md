---
title: "nb db logs"
description: "Tài liệu lệnh nb db logs: xem log của container database tích hợp trong env được chỉ định."
keywords: "nb db logs,NocoBase CLI,Log database,Docker logs"
---

# nb db logs

Xem log của container database tích hợp trong env được chỉ định. Lệnh này chỉ áp dụng cho env có database tích hợp do CLI quản lý.

## Cách dùng

```bash
nb db logs [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn xem log database tích hợp, bỏ qua thì dùng env hiện tại |
| `--tail` | integer | Số dòng log gần nhất hiển thị trước khi follow, mặc định `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Có liên tục follow log mới hay không |

## Ví dụ

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## Lệnh liên quan

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
