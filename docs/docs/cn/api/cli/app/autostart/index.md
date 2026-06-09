---
title: "nb app autostart"
description: "nb app autostart 命令组参考：为 local 或 Docker env 开启、关闭自启动标记，并批量启动所有已启用的 env。"
keywords: "nb app autostart,NocoBase CLI,自启动,autostart,local,docker"
---

# nb app autostart

管理应用自启动相关设置。

这组命令分成两类：

- 为某个 env 开启或关闭自启动标记
- 在系统启动后，批量启动所有已经开启自启动的 env

`nb app autostart` 只适用于当前机器上由 CLI 托管运行态的 env，也就是 `local` 和 `docker`。如果一个 env 只是远程 API 连接，或者不是当前机器上可启动的 CLI 托管应用，那么它不能加入这组命令的自动启动流程。

## 用法

```bash
nb app autostart <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | 为指定 env 开启自启动标记 |
| [`nb app autostart disable`](./disable.md) | 为指定 env 关闭自启动标记 |
| [`nb app autostart list`](./list.md) | 查看所有 env 的自启动状态 |
| [`nb app autostart run`](./run.md) | 启动所有已开启自启动的 env |

## 说明

`nb app autostart enable` 只是把某个 env 标记为“允许自动启动”，并不会立刻把它接进系统级启动流程。通常来说，你还需要在自己的宿主机启动流程里执行 `nb app autostart run`，比如接进 `systemd`、容器平台启动脚本，或其他已经在用的主机自启动机制。

另外，`nb app autostart run` 会逐个检查已经开启自启动的 env。能启动的会继续调用 `nb app start --env <name> --yes`；不适合在当前机器上自动启动的 env，会在结果表里显示为 `skipped` 或 `failed`。

## 示例

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1 --yes

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

## 相关命令

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
