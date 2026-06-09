---
title: "nb proxy nginx generate"
description: "nb proxy nginx generate 命令参考：为指定 CLI 托管 env 生成或刷新 Nginx 配置。"
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,代理配置"
---

# nb proxy nginx generate

为指定 CLI 托管 env 生成或刷新 Nginx 入口配置。

## 用法

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要生成配置的 CLI 托管 env 名称 |
| `--host` | string | 写入入口配置的域名，例如 `app1.example.com` |
| `--port` | string | 写入入口配置的监听端口，例如 `8080` |

## 生成结果

以 env `test2` 为例，通常会维护这些文件和目录：

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

生成出来的入口会覆盖这些主要能力：

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## 示例

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## 说明

- `generate` 只负责生成或刷新配置，不会自动启动 Nginx
- `app.conf` 是可编辑入口文件，但其中的托管区块必须保留
- 如果你通过 `nb env update` 修改了 `app-port`、`app-public-path` 等影响代理结果的配置，通常需要重新执行一次本命令
- 只有 `local` 或 `docker` 类型的 CLI 托管 env 可以使用这条命令

## 相关命令

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
