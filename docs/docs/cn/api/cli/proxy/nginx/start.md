---
title: "nb proxy nginx start"
description: "nb proxy nginx start 命令参考：按当前 driver 启动 Nginx 代理。"
keywords: "nb proxy nginx start,NocoBase CLI,nginx,启动"
---

# nb proxy nginx start

按当前 driver 启动 Nginx 代理。

## 用法

```bash
nb proxy nginx start
```

## 示例

```bash
nb proxy nginx start
```

## 说明

- `local` driver 下会启动本地 Nginx 进程
- `docker` driver 下会启动或创建 Docker 容器
- 如果当前代理已经在运行，命令会提示已经运行

## 相关命令

- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
