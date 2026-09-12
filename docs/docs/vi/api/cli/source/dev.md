---
title: "nb source dev"
description: "Tài liệu lệnh nb source dev: khởi động chế độ dev của NocoBase trong env có source npm hoặc Git."
keywords: "nb source dev,NocoBase CLI,Chế độ dev,Hot reload"
---

# nb source dev

Khởi động chế độ dev trong env có source npm hoặc Git. Với env Docker, hãy dùng [`nb app logs`](../app/logs.md) để xem log runtime.

## Cách dùng

```bash
nb source dev [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn vào chế độ dev, bỏ qua thì dùng env hiện tại |
| `--db-sync` | boolean | Đồng bộ database trước khi vào chế độ dev |
| `--port`, `-p` | string | Port của dev server |
| `--client`, `-c` | boolean | Chỉ khởi động client |
| `--server`, `-s` | boolean | Chỉ khởi động server |
| `--inspect`, `-i` | string | Port debug Node.js inspect cho server |

## Ví dụ

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Lệnh liên quan

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
