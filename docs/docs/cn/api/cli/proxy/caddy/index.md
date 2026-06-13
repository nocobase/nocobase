---
title: "nb proxy caddy"
description: "nb proxy caddy 命令组参考：管理 Caddy provider 的 driver、配置生成和运行控制。"
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,代理配置"
---

# nb proxy caddy

`nb proxy caddy` 是 Caddy provider 的命令组入口。

如果你已经有域名，想尽快把 HTTPS 跑通，并且不想自己维护太多 TLS 细节，通常可以选择这组命令。它负责两件事：

- 选择 Caddy 的运行方式，也就是 `local` 或 `docker`
- 为 CLI 托管 env 生成、启动、重载和检查 Caddy 入口

## 用法

```bash
nb proxy caddy <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | 切换 Caddy driver |
| [`nb proxy caddy current`](./current.md) | 输出当前 driver |
| [`nb proxy caddy generate`](./generate.md) | 为指定 env 生成或刷新 Caddy 配置 |
| [`nb proxy caddy start`](./start.md) | 启动 Caddy 代理 |
| [`nb proxy caddy restart`](./restart.md) | 重启 Caddy 代理 |
| [`nb proxy caddy reload`](./reload.md) | 重载 Caddy 配置 |
| [`nb proxy caddy stop`](./stop.md) | 停止 Caddy 代理 |
| [`nb proxy caddy status`](./status.md) | 查看 Caddy 运行状态 |
| [`nb proxy caddy info`](./info.md) | 查看 driver、配置路径和运行信息 |

## 说明

- 当前 driver 保存在 `proxy.caddy-driver`
- 默认 driver 是 `local`
- 本地 driver 会调用 `bin.caddy` 指向的可执行文件，默认值是 `caddy`
- Docker driver 会使用 `caddy:latest`
- Docker 容器名默认是 `<docker.container-prefix>-caddy-proxy`
- Docker driver 会把宿主机 `NB_CLI_ROOT` 挂载到容器内 `/apps`

## 典型流程

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## 相关命令

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
