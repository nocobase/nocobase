---
title: "nb env proxy"
description: "nb env proxy 命令组参考：查看和选择 Nginx、Caddy 代理子命令。"
keywords: "nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,代理配置"
---

# nb env proxy

在 NocoBase CLI 中，`nb env proxy` 是反向代理相关命令的统一入口，主要用来查看和选择 Nginx、Caddy 两个 provider 子命令。

如果你已经把应用保存成 CLI 托管 env，并且这个 env 属于 `local` 或 `docker`，通常来说直接选一个 provider 子命令就够了。

## 用法

```bash
nb env proxy
```

## 默认先看哪一个子命令

| 我想要…… | 去哪里看 |
| --- | --- |
| 沿用 Nginx 管理站点、证书、缓存或访问控制 | [`nb env proxy nginx`](./nginx.md) |
| 尽快把 HTTPS 跑通，少维护一点 TLS 细节 | [`nb env proxy caddy`](./caddy.md) |
| 先调整可能影响代理结果的 env 配置，比如 `app-port`、`app-public-path` | [`nb env update`](../update.md) |

## 说明

- `nb env proxy` 自己没有独立的 flags
- 实际生成配置时，使用 `nb env proxy nginx` 或 `nb env proxy caddy`
- 这两个子命令都只适用于当前机器上可访问运行态的托管 env，也就是 `local` 或 `docker`
- 如果你用 `nb env update` 修改了 `app-port`、`app-public-path` 这类会影响入口路径、资源地址或回源结果的配置，改完后通常还要重新执行对应的 proxy 子命令
- 如果一个 env 只有远程 API 连接，或者是 SSH env，那么这组命令暂时不能用

## 示例

```bash
# 查看命令组帮助
nb env proxy

# 为指定 env 生成 Nginx 配置
nb env proxy nginx --env demo --host demo.local.nocobase.com

# 为指定 env 生成 Caddy 配置
nb env proxy caddy --env demo --host demo.local.nocobase.com
```

## 相关命令

- [`nb env proxy nginx`](./nginx.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb env info`](../info.md)
- [`nb config`](../../config/index.md)
