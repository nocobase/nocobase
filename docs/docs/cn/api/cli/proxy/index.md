---
title: "nb proxy"
description: "nb proxy 命令组参考：选择 Nginx 或 Caddy provider，并管理 CLI 托管 env 的反向代理入口。"
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,代理配置"
---

# nb proxy

在 NocoBase CLI 中，`nb proxy` 是反向代理相关命令的统一入口。

它把“env 配置”和“入口层管理”拆开了：

- `nb env` 负责保存和维护应用 env
- `nb proxy` 负责为这些 CLI 托管 env 生成并管理 Nginx 或 Caddy 入口

只要你的应用已经保存成 CLI 托管 env，并且这个 env 属于 `local` 或 `docker`，通常直接选择一个 provider 子命令就够了。

## 用法

```bash
nb proxy <provider> <command>
```

## 命令树

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Provider

| 我想要…… | 去哪里看 |
| --- | --- |
| 沿用 Nginx 管理站点、证书、缓存或访问控制 | [`nb proxy nginx`](./nginx/index.md) |
| 尽快把 HTTPS 跑通，少维护一点 TLS 细节 | [`nb proxy caddy`](./caddy/index.md) |
| 先调整可能影响代理结果的 env 配置，比如 `app-port`、`app-public-path` | [`nb env update`](../env/update.md) |

## 说明

- `nb proxy` 自己没有独立 flags
- 实际生成和管理入口时，使用 `nb proxy nginx` 或 `nb proxy caddy`
- 两个 provider 都只适用于当前机器上可访问运行态的托管 env，也就是 `local` 或 `docker`
- 两个 provider 都支持两类 driver：`local` 和 `docker`
- `use` 会写入默认 driver，`current` 会直接输出当前 driver
- `generate` 负责生成或刷新入口配置文件，不会自动启动代理进程
- `start`、`restart`、`reload`、`stop`、`status`、`info` 都基于当前 provider 的当前 driver 工作
- 如果你用 `nb env update` 修改了 `app-port`、`app-public-path` 这类会影响入口路径、资源地址或回源结果的配置，改完后通常还要重新执行对应的 `generate`
- 如果一个 env 只有远程 API 连接，或者是 SSH env，那么这组命令暂时不能用

## 典型流程

```bash
# 1. 选择 provider 和运行方式
nb proxy nginx use docker

# 2. 为某个 CLI 托管 env 生成入口配置
nb proxy nginx generate --env app1 --host app1.example.com

# 3. 启动代理
nb proxy nginx start

# 4. 查看当前状态和路径信息
nb proxy nginx status
nb proxy nginx info

# 5. 配置更新后重载
nb proxy nginx reload
```

如果你选择的是 Caddy，把命令中的 `nginx` 替换成 `caddy` 即可。

## 常见命令区别

| 命令 | 作用 |
| --- | --- |
| `use` | 切换当前 provider 默认使用的 driver |
| `current` | 输出当前 provider 的 driver，例如 `local` 或 `docker` |
| `generate` | 生成或刷新指定 env 的代理入口文件 |
| `start` | 按当前 driver 启动代理 |
| `reload` | 在不停止服务的情况下重载配置 |
| `restart` | 先停止再启动 |
| `stop` | 停止代理 |
| `status` | 查看运行状态 |
| `info` | 查看 driver、配置文件路径、运行根路径、回源主机等信息 |

## 示例

```bash
# 为指定 env 生成 Nginx 配置并启动
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# 为指定 env 生成 Caddy 配置并启动
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## 相关命令

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
