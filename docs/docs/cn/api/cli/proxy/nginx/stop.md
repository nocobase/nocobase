---
title: "nb proxy nginx stop"
description: "nb proxy nginx stop 命令参考：按当前 driver 停止 Nginx 代理。"
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,停止"
---

# nb proxy nginx stop

按当前 driver 停止 Nginx 代理。

## 用法

```bash
nb proxy nginx stop
```

## 示例

```bash
nb proxy nginx stop
```

## 说明

- `local` driver 下会停止本地 Nginx 进程
- `docker` driver 下会停止代理容器
- 如果当前代理已经停止，命令会提示已经停止

## 相关命令

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
