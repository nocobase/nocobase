---
title: "nb proxy caddy stop"
description: "nb proxy caddy stop 命令参考：按当前 driver 停止 Caddy 代理。"
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,停止"
---

# nb proxy caddy stop

按当前 driver 停止 Caddy 代理。

## 用法

```bash
nb proxy caddy stop
```

## 示例

```bash
nb proxy caddy stop
```

## 说明

- `local` driver 下会停止本地 Caddy 进程
- `docker` driver 下会停止代理容器
- 如果当前代理已经停止，命令会提示已经停止

## 相关命令

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
