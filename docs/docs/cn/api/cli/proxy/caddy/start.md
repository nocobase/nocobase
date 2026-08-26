---
title: "nb proxy caddy start"
description: "nb proxy caddy start 命令参考：按当前 driver 启动 Caddy 代理。"
keywords: "nb proxy caddy start,NocoBase CLI,caddy,启动"
---

# nb proxy caddy start

按当前 driver 启动 Caddy 代理。

## 用法

```bash
nb proxy caddy start
```

## 示例

```bash
nb proxy caddy start
```

## 说明

- `local` driver 下会启动本地 Caddy 进程
- `docker` driver 下会启动或创建 Docker 容器
- 如果当前代理已经在运行，命令会提示已经运行

## 相关命令

- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
