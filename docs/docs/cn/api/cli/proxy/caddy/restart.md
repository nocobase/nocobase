---
title: "nb proxy caddy restart"
description: "nb proxy caddy restart 命令参考：按当前 driver 重启 Caddy 代理。"
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,重启"
---

# nb proxy caddy restart

按当前 driver 重启 Caddy 代理。

## 用法

```bash
nb proxy caddy restart
```

## 示例

```bash
nb proxy caddy restart
```

## 说明

- 命令会先执行停止，再重新启动
- 当前 driver 为 `local` 或 `docker` 时，行为会分别作用在本地进程或 Docker 容器上

## 相关命令

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
