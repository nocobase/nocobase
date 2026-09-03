---
title: "生产环境反向代理"
description: "基于 nb proxy nginx 和 nb proxy caddy 为 CLI 托管的 NocoBase env 生成并管理反向代理配置。"
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,反向代理,Nginx,Caddy,生产环境"
---

# 反向代理

这篇只适用于使用 `nb init` 安装的应用。

在 NocoBase 里，生产环境反向代理不只是简单把请求转发到应用进程。通常还要同时处理 WebSocket、子路径、前端静态资源、上传目录、文件访问入口 `/files/` 和 SPA 回退页这些细节。

`nb proxy` 的作用，就是把这些容易漏掉的细节统一收进一组稳定的命令入口里。

## 核心流程

如果只看最核心的流程，先记住这三条命令就够了：

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

如果你用的是 Caddy，把命令里的 `nginx` 换成 `caddy` 就行。

`use local` 和 `use docker` 可以直接这样判断：

- 本地已经安装好了 Nginx 或 Caddy，就用 `use local`
- 本地没有安装，准备让 CLI 用 Docker 管理代理，就用 `use docker`

多数场景下，先执行 `use`，再执行 `generate`，最后执行 `reload` 就够了。具体到 Nginx 或 Caddy 的细节，继续看各自的页面。

## 什么时候选 Nginx，什么时候选 Caddy

通常可以这样判断：

| 场景 | 推荐 |
| --- | --- |
| 你已经在用 Nginx 管理站点、证书、缓存或访问控制 | [Nginx](./nginx.md) |
| 你已经有域名，想尽快把 HTTPS 跑通，少维护一些 TLS 细节 | [Caddy](./caddy.md) |

## 继续往下看

| 我想要…… | 去哪里看 |
| --- | --- |
| 沿用 Nginx 管理站点入口 | [Nginx](./nginx.md) |
| 尽快接好 HTTPS | [Caddy](./caddy.md) |
| 先调整会影响代理结果的 env 配置，比如 `app-port`、`app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| 先确认应用的安装和 env 配置 | [使用 CLI 安装应用](../../installation/cli.md) |
