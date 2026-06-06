---
title: "生产环境反向代理"
description: "基于 nb env proxy nginx 和 nb env proxy caddy 为 CLI 托管的 NocoBase env 生成反向代理配置。"
keywords: "NocoBase,nb env proxy nginx,nb env proxy caddy,反向代理,Nginx,Caddy,生产环境"
---

# 生产环境反向代理

在 NocoBase CLI 里，给生产环境接反向代理的推荐入口有两条：

- `nb env proxy nginx`
- `nb env proxy caddy`

`nb env proxy` 现在只是一个 topic，用来查看这两个子命令的帮助信息。只要你的应用已经保存成 CLI env，并且属于 `local` 或 `docker`，通常来说直接让 CLI 生成配置就够了。这样 WebSocket、子路径、SPA 回退页和后续更新这些容易漏掉的细节都由 CLI 维护，你只需要决定入口层继续用 Nginx 还是 Caddy。

如果你的应用不是 CLI 托管的，或者你明确要完全手写代理配置，再去看各 provider 页里的手写配置部分就行。

## 先确认这条路径适不适合你

- 应用已经能通过内网地址正常访问，比如 `http://127.0.0.1:13000`
- 这个应用已经保存成 CLI env，并且 env 类型是 `local` 或 `docker`
- 这个 env 已经保存了 `appPort`

如果命令提示 env 缺少 `appPort`，先执行 [`nb env update`](../../../api/cli/env/update.md) 补上。

如果你后来又改了 `app-port`、`app-public-path` 这类会影响代理结果的配置，记得重新执行对应的 proxy 子命令。

## 默认路径：先让 CLI 生成配置

如果你已经知道入口层要继续用哪个 provider，直接选对应子命令就行：

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy caddy --env demo --host demo.example.com
```

如果你已经切到了当前 env，也可以省略 `--env`：

```bash
nb env proxy nginx --host demo.example.com
```

其中：

- 如果你已经在用 Nginx 管理站点、缓存、访问控制或证书，默认先看 [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- 如果你想尽快把 HTTPS 跑通，另外不想自己维护太多 TLS 细节，默认先看 [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- `--port` 指的是代理入口端口，不是 NocoBase 应用本身的 `appPort`

如果你希望 CLI 顺手把共享配置接进 provider 主配置，并立即校验后重载，可以再加上：

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

更完整的命令说明见 [`nb env proxy`](../../../api/cli/env/proxy/index.md)。

## CLI 会帮你维护什么

CLI 不只是生成一段代理片段，还会顺手维护 provider 需要的辅助文件。两种 provider 的输出结构不一样：

- Nginx 会维护 `app.conf`、`public/index-v1.html`、`public/index-v2.html`、共享 `nocobase.conf`，以及共享 `snippets/`
- Caddy 会维护 `generated.caddy`、`app.caddy` 和共享 `nocobase.caddy`

:::warning 注意

如果你需要补站点级别的配置，改 `app.conf` 或 `app.caddy` 就行。不要手改 CLI 托管的辅助文件，下次执行命令时它们会被覆盖。

:::

## 默认先看哪一页

| 我想要…… | 去哪里看 |
| --- | --- |
| 沿用 Nginx 管理站点、证书、缓存或访问控制 | [Nginx](./nginx.md) |
| 尽快把 HTTPS 跑通，少维护一点证书和 TLS 细节 | [Caddy](./caddy.md) |
| 先看命令树和 provider 选择 | [`nb env proxy`](../../../api/cli/env/proxy/index.md) |
| 先看 Nginx 子命令的参数、输出文件和示例 | [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md) |
| 先看 Caddy 子命令的参数、输出文件和示例 | [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md) |
| 先调整可能影响代理结果的 env 配置，比如 `app-port`、`app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| 先把应用安装成 CLI 托管 env | [使用 CLI 安装（推荐）](../../installation/cli.md) |

## 什么时候不适合直接用 CLI 生成代理配置

通常来说，下面几种情况更适合直接去看 provider 页里的手写配置部分：

- 你的应用不是 CLI 托管的
- 这个 env 只有远程 API 连接，或者本身是 SSH env
- 你就是想完全自己维护整份 Nginx 配置或 `Caddyfile`

不过只要应用已经保存成 CLI env，而且当前机器能访问它的运行态，默认还是优先用这组命令。这样后面切域名、补站点配置或者重新生成时，整体会省心很多。

## 相关链接

- [`nb env proxy`](../../../api/cli/env/proxy/index.md)
- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [应用环境变量](../../installation/env.md)
- [使用 CLI 安装（推荐）](../../installation/cli.md)
