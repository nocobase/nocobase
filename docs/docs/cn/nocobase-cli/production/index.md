---
title: "生产环境部署概述"
description: "生产环境部署的整体说明：确认应用运行正常后，再补上应用自启动和反向代理入口。"
keywords: "NocoBase,生产环境部署,概述,应用自启动,反向代理,Nginx,Caddy"
---

# 生产环境部署概述

如果你的 NocoBase 已经能在服务器上正常跑起来，正式上线前通常还要再补两块能力：

1. 让应用在机器重启后能自动恢复运行
2. 给应用接上反向代理入口，对外提供稳定访问

对应到 NocoBase CLI，主要就是下面两组命令：

- `nb app autostart`
- `nb proxy`

这组文档主要分成两部分：

1. 应用自启动：让应用在机器重启后能恢复运行
2. 反向代理：给应用提供稳定的对外访问入口

你可以先看自己当前更需要哪一块，再进入对应页面。

## 生产环境里这两块分别解决什么问题

也就是说：

- `nb app autostart` 解决的是“应用怎么在系统启动后恢复运行”
- `nb proxy` 解决的是“应用怎么对外提供稳定访问”

:::tip 为什么这里不是直接用 Docker、PM2 或 Supervisor 自己的自启动配置

`nb app autostart` 并不是绕开这些进程管理方式，而是把不同的进程管理方式统一适配进来，再对外收敛成一组稳定的自启动管理入口。这样你不需要因为底层是 Docker、PM2 还是未来可能支持的 Supervisor，再去记一套不同的自启动配置心智。

系统启动这一层，则继续交给 `systemd`、`launchd` 或宿主机启动脚本处理。它们负责在机器启动时执行一次：

```bash
nb app autostart run
```

这条命令再去统一拉起所有已经启用自启动的应用。

这里有两层东西不要混在一起：

- Docker、PM2、Supervisor 这类能力，更接近“应用平时怎么运行，以及怎么管理应用进程”
- `systemd`、`launchd`、宿主机启动脚本这类能力，更接近“系统启动时执行什么命令”

如果你正好卡在“为什么还需要 `nb app autostart`”这里，继续看 [应用自启动](./autostart.md) 和 [nb app 的设计意图](../cli-design/nb-app-design-intent.md) 就行。

:::

## 我现在该先看哪一页

| 我想要…… | 去哪里看 |
| --- | --- |
| 先让服务器重启后应用也能自动恢复运行 | [应用自启动](./autostart.md) |
| 先理解 Nginx / Caddy 在这套 CLI 里的入口关系 | [反向代理](./reverse-proxy/index.md) |
| 继续用 Nginx 管理站点入口 | [Nginx](./reverse-proxy/nginx.md) |
| 尽快接好 HTTPS，少维护一些 TLS 细节 | [Caddy](./reverse-proxy/caddy.md) |
| 查看应用本身的启动、停止、日志和升级 | [管理应用](../operations/manage-app.md) |

## 进入生产环境前，先确认这些前提

- 应用已经保存成 CLI env
- 应用已经能在服务器本机正常启动
- 如果准备接反向代理，env 里已经保存了 `appPort`
- 如果准备正式对外开放，已经规划好域名、入口端口和 HTTPS 方案

如果你还没有完成 CLI 安装或 env 初始化，先回到 [使用 CLI 安装应用](../installation/cli.md)。

如果命令提示 env 缺少 `appPort`，先执行 [`nb env update`](../../api/cli/env/update.md) 补上。

## 相关链接

- [应用自启动](./autostart.md)
- [反向代理](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [管理应用](../operations/manage-app.md)
