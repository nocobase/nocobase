---
title: "nb proxy nginx"
description: "nb proxy nginx 命令组参考：管理 Nginx provider 的 driver、配置生成和运行控制。"
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,代理配置"
---

# nb proxy nginx

`nb proxy nginx` 是 Nginx provider 的命令组入口。

如果你已经使用 Nginx 管理站点、证书、缓存或访问控制，通常就从这组命令开始。它负责两件事：

- 选择 Nginx 的运行方式，也就是 `local` 或 `docker`
- 为 CLI 托管 env 生成、启动、重载和检查 Nginx 入口

## 用法

```bash
nb proxy nginx <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | 切换 Nginx driver |
| [`nb proxy nginx current`](./current.md) | 输出当前 driver |
| [`nb proxy nginx generate`](./generate.md) | 为指定 env 生成或刷新 Nginx 配置 |
| [`nb proxy nginx start`](./start.md) | 启动 Nginx 代理 |
| [`nb proxy nginx restart`](./restart.md) | 重启 Nginx 代理 |
| [`nb proxy nginx reload`](./reload.md) | 重载 Nginx 配置 |
| [`nb proxy nginx stop`](./stop.md) | 停止 Nginx 代理 |
| [`nb proxy nginx status`](./status.md) | 查看 Nginx 运行状态 |
| [`nb proxy nginx info`](./info.md) | 查看 driver、配置路径和运行信息 |

## 说明

- 当前 driver 保存在 `proxy.nginx-driver`
- 默认 driver 是 `local`
- 本地 driver 会调用 `bin.nginx` 指向的可执行文件，默认值是 `nginx`
- Docker driver 会使用 `nginx:latest`
- Docker 容器名默认是 `<docker.container-prefix>-nginx-proxy`
- Docker driver 会把宿主机 `NB_CLI_ROOT` 挂载到容器内 `/apps`

## 典型流程

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## 相关命令

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
