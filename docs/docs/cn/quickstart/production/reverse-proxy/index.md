---
title: "生产环境反向代理"
description: "基于 nb proxy nginx 和 nb proxy caddy 为 CLI 托管的 NocoBase env 生成并管理反向代理配置。"
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,反向代理,Nginx,Caddy,生产环境"
---

# 生产环境反向代理

在 NocoBase CLI 里，生产环境反向代理的推荐入口有两条：

- `nb proxy nginx`
- `nb proxy caddy`

其中：

- `proxy` 用来管理入口层
- `nginx` 和 `caddy` 表示你选择的代理实现
- `docker` 和 `local` 表示当前代理的运行方式
- `--env <name>` 用来指定为哪个 CLI env 生成配置

只要你的应用已经保存成 CLI 托管 env，并且属于 `local` 或 `docker`，通常直接让 CLI 生成并管理反向代理配置就够了。这样 WebSocket、子路径、SPA 回退页和后续更新这些容易漏掉的细节，都由 CLI 统一维护。

如果你的应用不是 CLI 托管的，或者你明确要完全手写代理配置，再去看各 provider 页里的手写配置部分就行。

## 先确认这条路径适不适合你

- 应用已经能通过内网地址正常访问，比如 `http://127.0.0.1:13000`
- 这个应用已经保存成 CLI env，并且 env 类型是 `local` 或 `docker`
- 这个 env 已经保存了 `appPort`

如果命令提示 env 缺少 `appPort`，先执行 [`nb env update`](../../../api/cli/env/update.md) 补上。

如果你后来又改了 `app-port`、`app-public-path` 这类会影响代理结果的配置，记得重新执行对应的 `generate` 命令。

## 默认路径：先选运行方式，再生成配置，再启动

如果你已经知道入口层要继续用哪个 provider，推荐按下面的顺序操作。

使用 Nginx：

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

使用 Caddy：

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

这几个步骤的分工是：

- `use docker|local`：选择当前 provider 的运行方式
- `generate --env <name> --host <domain>`：为指定 env 生成反向代理配置
- `start`：启动当前 provider 对应的本地进程或 Docker 容器

如果你后续更新了配置，通常优先使用 `reload`；如果你需要完整重启入口层，再使用 `restart`。

## 这组命令怎么分工

以 Nginx 为例：

| 命令 | 用途 |
| --- | --- |
| `nb proxy nginx use docker` | 将 Nginx 的运行方式切换为 Docker |
| `nb proxy nginx use local` | 将 Nginx 的运行方式切换为本地进程 |
| `nb proxy nginx current` | 查看当前正在使用的运行方式 |
| `nb proxy nginx generate --env <name> --host <domain>` | 为指定 env 生成 Nginx 配置 |
| `nb proxy nginx start` | 启动 Nginx |
| `nb proxy nginx reload` | 重新加载 Nginx 配置 |
| `nb proxy nginx restart` | 重启 Nginx |
| `nb proxy nginx stop` | 停止 Nginx |
| `nb proxy nginx status` | 查看 Nginx 状态 |
| `nb proxy nginx info` | 查看当前配置、路径和状态等完整信息 |

Caddy 与 Nginx 共享同一组动作，只是 provider 不同。

## CLI 会帮你维护什么

CLI 不只是生成一段代理片段，还会顺手维护 provider 需要的辅助文件和站点入口结构。两种 provider 的输出结构不一样：

- Nginx 会维护 `snippets`、`app.conf`、`public/index-v1.html`、`public/index-v2.html` 等文件
- Caddy 会维护 `nocobase.caddy`、`app.caddy`、`public/index-v1.html`、`public/index-v2.html` 等文件，其中 `app.caddy` 是单个 env 的完整站点配置

:::warning 注意

如果你需要补站点级别的配置，Nginx 通常改 `app.conf`，Caddy 通常以 `app.caddy` 为基准调整。不要手改 CLI 托管的辅助文件；另外，Caddy 的 `app.caddy` 在重新执行 `generate` 时会整体覆盖，而 `nocobase.caddy` 主要作为 provider 级总入口使用。

:::

## 默认先看哪一页

| 我想要…… | 去哪里看 |
| --- | --- |
| 沿用 Nginx 管理站点、证书、缓存或访问控制 | [Nginx](./nginx.md) |
| 尽快把 HTTPS 跑通，少维护一些 TLS 细节 | [Caddy](./caddy.md) |
| 先调整可能影响代理结果的 env 配置，比如 `app-port`、`app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| 先把应用安装成 CLI 托管 env | [使用 CLI 安装（推荐）](../../installation/cli.md) |

## 什么时候不适合直接用 CLI 管理反向代理

通常来说，下面几种情况更适合直接去看 provider 页里的手写配置部分：

- 你的应用不是 CLI 托管的
- 这个 env 只有远程 API 连接，或者本身是 SSH env
- 你就是想完全自己维护整份 Nginx 配置或 `Caddyfile`

不过只要应用已经保存成 CLI env，而且当前机器能访问它的运行态，默认还是优先用这组命令。这样后面切域名、补站点配置、切换运行方式或者重新生成时，整体会省心很多。

## 相关链接

- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [应用环境变量](../../installation/env.md)
- [使用 CLI 安装（推荐）](../../installation/cli.md)
