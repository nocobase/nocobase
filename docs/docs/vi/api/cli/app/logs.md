---
title: "nb app logs"
description: "Tài liệu lệnh nb app logs: xem log của ứng dụng NocoBase trong env được chỉ định."
keywords: "nb app logs,NocoBase CLI,Log ứng dụng,Docker logs,pm2 logs"
---

# nb app logs

Xem log ứng dụng. Cài đặt npm/Git sẽ đọc log pm2, còn cài đặt Docker sẽ đọc log của Docker container.

## Cách dùng

```bash
nb app logs [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn xem log, bỏ qua thì dùng env hiện tại |
| `--tail` | integer | Số dòng log gần nhất hiển thị trước khi follow, mặc định `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Có liên tục follow log mới hay không |

## Ví dụ

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## Lệnh liên quan

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
