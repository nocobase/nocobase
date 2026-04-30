---
title: "nb app"
description: "Referensi perintah nb app: mengelola runtime aplikasi NocoBase, termasuk start, stop, restart, logs, cleanup, dan upgrade."
keywords: "nb app,NocoBase CLI,start,stop,restart,logs,upgrade"
---

# nb app

Mengelola runtime aplikasi NocoBase. Env npm/Git akan menjalankan perintah aplikasi di direktori source code lokal, env Docker akan mengelola container aplikasi yang tersimpan.

## Penggunaan

```bash
nb app <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb app start`](./start.md) | Memulai aplikasi atau container Docker |
| [`nb app stop`](./stop.md) | Menghentikan aplikasi atau container Docker |
| [`nb app restart`](./restart.md) | Menghentikan lalu memulai aplikasi |
| [`nb app logs`](./logs.md) | Melihat log aplikasi |
| [`nb app down`](./down.md) | Menghentikan dan membersihkan resource runtime lokal |
| [`nb app upgrade`](./upgrade.md) | Memperbarui source code atau image dan me-restart aplikasi |

## Contoh

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## Perintah Terkait

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
