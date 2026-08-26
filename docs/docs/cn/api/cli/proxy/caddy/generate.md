---
title: "nb proxy caddy generate"
description: "nb proxy caddy generate 命令参考：为指定 CLI 托管 env 生成或刷新 Caddy 配置。"
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,代理配置"
---

# nb proxy caddy generate

为指定 CLI 托管 env 生成或刷新 Caddy 入口配置。

## 用法

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要生成配置的 CLI 托管 env 名称 |
| `--host` | string | 写入站点地址的域名，例如 `app1.example.com` |
| `--port` | string | 写入站点地址的监听端口，例如 `8080` |

## 生成结果

以 env `test2` 为例，通常会维护这些文件和目录：

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

当前方案里，`app.caddy` 已经是单个 env 的完整站点配置，不再拆成单独的 `generated.caddy`。

## 示例

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## 说明

- `generate` 只负责生成或刷新配置，不会自动启动 Caddy
- 重新执行 `generate` 会整体覆盖 `app.caddy`
- 如果你通过 `nb env update` 修改了 `app-port`、`app-public-path` 等影响代理结果的配置，通常需要重新执行一次本命令
- 只有 `local` 或 `docker` 类型的 CLI 托管 env 可以使用这条命令

## 相关命令

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
