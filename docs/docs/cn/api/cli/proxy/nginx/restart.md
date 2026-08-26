---
title: "nb proxy nginx restart"
description: "nb proxy nginx restart 命令参考：按当前 driver 重启 Nginx 代理。"
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,重启"
---

# nb proxy nginx restart

按当前 driver 重启 Nginx 代理。

## 用法

```bash
nb proxy nginx restart
```

## 示例

```bash
nb proxy nginx restart
```

## 说明

- 命令会先执行停止，再重新启动
- 当前 driver 为 `local` 或 `docker` 时，行为会分别作用在本地进程或 Docker 容器上

## 相关命令

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
