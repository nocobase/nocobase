---
title: "生产环境部署"
description: "快速完成 NocoBase 生产环境部署：先配置应用自启动，再配置反向代理。"
keywords: "NocoBase,生产环境部署,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# 生产环境部署

如果你的 NocoBase 已经能在服务器上正常跑起来，正式上线时通常只需要再补两件事：

1. 让应用在机器重启后能自动恢复运行
2. 给应用加上反向代理入口，对外提供稳定访问

对应到 NocoBase CLI，主要就是下面两组命令：

- `nb app autostart`
- `nb proxy`

这篇页先把整体路径讲清楚，具体到 Nginx 或 Caddy 的配置细节，再继续看各自的子页。

## 第一步：配置应用自启动

生产环境里，第一件事不是“先配域名”，而是先确认服务本身能稳定恢复。否则机器重启、容器重建或者运维操作之后，应用可能不会自动起来。

在 CLI 里，`nb app autostart` 是一组子命令，不是单条直接完成所有事情的命令。最常用的是：

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

先为当前 env 开启自启动标记：

```bash
nb app autostart enable
```

如果你要操作的不是当前 env，可以显式指定：

```bash
nb app autostart enable --env app1 --yes
```

开启后，可以检查哪些 env 已经标记为自启动：

```bash
nb app autostart list
```

当系统启动后，需要执行下面这条命令，把所有已开启自启动的 env 拉起来：

```bash
nb app autostart run
```

如果你想在排查时看到底层启动输出，可以加上：

```bash
nb app autostart run --verbose
```

:::tip 这一步到底做了什么

`nb app autostart enable` 的作用，是把某个 CLI 托管 env 标记为“允许自动启动”；`nb app autostart run` 的作用，是实际启动所有已经开启自启动的 env。

也就是说，正式环境里通常还需要把 `nb app autostart run` 接进你自己的系统启动流程里，例如 `systemd`、容器平台启动脚本，或其他你已经在用的主机自启动机制。

:::

### 适用范围

`nb app autostart` 只适用于有 CLI 托管运行时的 env，也就是：

- `local`
- `docker`

如果这个 env 只是远程 API 连接，或者不是当前机器上由 CLI 管理运行的应用，那么这组命令不适合用来做自启动。

## 第二步：配置反向代理

应用能自动恢复运行之后，第二步再处理外部访问入口。对生产环境来说，反向代理通常负责这几件事：

- 绑定域名或入口端口
- 转发 HTTP / WebSocket 请求到 NocoBase
- 接管 HTTPS、证书、缓存或访问控制

在 NocoBase CLI 里，推荐入口是：

- `nb proxy nginx`
- `nb proxy caddy`

### 默认做法

如果你的应用已经保存成 CLI env，并且属于 `local` 或 `docker`，通常直接让 CLI 生成配置就够了：

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

生成完成后，再启动对应 provider：

```bash
nb proxy nginx start
nb proxy caddy start
```

CLI 会顺手帮你处理几类手写时很容易漏掉的细节，比如：

- WebSocket 转发
- 子路径场景下的入口和静态资源地址
- SPA 回退页
- provider 共享配置文件

### 什么时候选 Nginx，什么时候选 Caddy

通常可以这样判断：

| 场景 | 推荐 |
| --- | --- |
| 你已经在用 Nginx 管理站点、缓存、证书或访问控制 | [Nginx](./reverse-proxy/nginx.md) |
| 你已经有域名，想尽快把 HTTPS 跑通，少维护一点 TLS 细节 | [Caddy](./reverse-proxy/caddy.md) |
| 先看这组命令的整体说明 | [生产环境反向代理](./reverse-proxy/index.md) |

如果你修改了 `app-port`、`app-public-path` 这类会影响代理结果的 env 配置，记得重新执行对应的 proxy 子命令。

## 默认上线路径

如果你想按最省心的方式完成生产环境上线，通常照这个顺序就可以：

1. 先确认应用已经能在服务器本机正常启动
2. 执行 `nb app autostart enable`
3. 把 `nb app autostart run` 接入系统启动流程
4. 选择 Nginx 或 Caddy，并执行对应的 `nb proxy` 子命令
5. 用域名或入口地址验证外部访问是否正常

## 快速索引

| 我想要…… | 去哪里看 |
| --- | --- |
| 先看反向代理的整体说明 | [生产环境反向代理](./reverse-proxy/index.md) |
| 继续用 Nginx 管理入口层 | [Nginx](./reverse-proxy/nginx.md) |
| 用 Caddy 更快接入 HTTPS | [Caddy](./reverse-proxy/caddy.md) |
| 查看应用的启动、停止、日志和升级 | [管理应用](../operations/manage-app.md) |
| 查看 `nb proxy nginx` 的命令参考 | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| 查看 `nb proxy caddy` 的命令参考 | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## 相关命令

```bash
# 开启某个 env 的自启动标记
nb app autostart enable --env app1 --yes

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 选择 Nginx 的运行方式并生成配置
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# 选择 Caddy 的运行方式并生成配置
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
