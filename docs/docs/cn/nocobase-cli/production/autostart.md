---
title: "应用自启动"
description: "使用 nb app autostart 为 CLI 托管的 NocoBase env 配置统一的应用自启动入口。"
keywords: "NocoBase,应用自启动,nb app autostart,systemd,Docker,PM2"
---

# 应用自启动

在 NocoBase CLI 里，`nb app autostart` 用来管理“哪些 env 允许自动启动”，以及“系统启动后怎么统一把这些 env 拉起来”。

如果你准备把一个 CLI 托管的应用正式跑在服务器上，这通常是生产环境里默认先做的一步。

## 为什么还需要 `nb app autostart`

这个问题很常见。

很多人第一次看到这里时，都会觉得既然底层已经有 Docker、PM2，或者系统本身已经有 `systemd`，为什么还要再多一层 `nb app autostart`。

原因在于，这几层解决的其实不是同一个问题：

- Docker、PM2、Supervisor 这类能力，解决的是“应用平时怎么运行，以及怎么管理应用进程”
- `systemd`、`launchd`、宿主机启动脚本这类能力，解决的是“系统启动时运行什么命令”
- `nb app autostart` 解决的是“在 NocoBase CLI 这一层，怎么统一管理哪些 env 允许自动启动，以及系统启动后怎么把它们统一拉起来”

也就是说，CLI 并不是不用 Docker、PM2 或 Supervisor，而是把不同的进程管理方式统一适配进来，再对外收敛成一组稳定的自启动管理入口，降低用户心智。

系统启动这一层，则继续交给 `systemd`、`launchd` 或宿主机启动脚本。它们负责在机器启动时执行：

```bash
nb app autostart run
```

这条命令再去统一拉起所有已经启用自启动的应用。

如果没有这一层，那么一旦底层运行方式不同，你就需要分别记住 Docker、PM2 或其他方式各自的自启动配置和恢复流程。加上 `nb app autostart` 之后，你只需要继续记住同一套 NocoBase CLI 的使用心智。

如果你想先看这套设计为什么这样拆，继续看 [nb app 的设计意图](../cli-design/nb-app-design-intent.md#为什么还需要-nb-app-autostart)。

## 这组命令分别负责什么

最常用的是这几条：

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

如果只看最常见的两层职责，可以这样理解：

- `enable` / `disable` 负责管理某个 env 是否允许自动启动
- `run` 负责在系统启动阶段，统一拉起所有已开启自启动的 env

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

如果你不再希望某个 env 随系统一起启动，也可以取消这个标记：

```bash
nb app autostart disable --env app1 --yes
```

## 它和 Docker、PM2、systemd 是什么关系

这里有一个边界很容易混淆。

`nb app` 这一层解决的是“应用怎么运行”的问题，底层可以适配不同运行方式，比如 Docker、PM2，后续也可以继续扩展。

`nb app autostart` 这一层解决的是“机器启动后，怎么统一把允许自动启动的 env 拉起来”的问题。它更像是在给宿主机启动机制提供一个稳定入口，而不是替代某一种具体的进程管理工具。

换句话说：

- Docker、PM2、Supervisor 这类能力，更接近应用运行方式
- `systemd`、`launchd`、宿主机启动脚本，更接近系统启动层

这也是为什么正式环境里，通常还需要把 `nb app autostart run` 接进你自己的系统启动流程里，例如 `systemd`、`launchd`、容器平台启动脚本，或其他你已经在用的主机自启动机制。

## 适用范围

`nb app autostart` 只适用于有 CLI 托管运行时的 env，也就是：

- `local`
- `docker`

如果这个 env 只是远程 API 连接，或者不是当前机器上由 CLI 管理运行的应用，那么这组命令不适合用来做自启动。

## 默认做法

多数场景下，按下面这条顺序做就够了：

1. 先确认应用已经能在当前机器上正常启动
2. 执行 `nb app autostart enable --env <name> --yes`
3. 把 `nb app autostart run` 接入系统启动流程
4. 重启机器或手动执行一次 `run` 验证是否正常恢复

如果你接下来还要做生产入口层配置，继续看 [反向代理](./reverse-proxy/index.md)。

## 相关命令

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## 相关链接

- [生产环境部署概述](./index.md)
- [反向代理](./reverse-proxy/index.md)
- [nb app 的设计意图](../cli-design/nb-app-design-intent.md)
- [管理应用](../operations/manage-app.md)
