---
title: "nb app restart"
description: "nb app restart 命令参考：重启指定 env 的 NocoBase 应用；在适用时会先自动同步当前授权允许使用的商业插件，本地 env 再完成安装或升级准备，Docker env 则按已保存配置重建应用容器。"
keywords: "nb app restart,NocoBase CLI,重启应用,Docker"
---

# nb app restart

先停止再启动指定 env 的 NocoBase 应用。在适用时，CLI 会先自动同步当前授权允许使用的商业插件；随后本地 env 会复用 `nb app stop` 和 `nb app start` 的流程，并默认在重新启动前自动完成安装或升级准备；Docker env 会先清理当前容器，再按已保存配置重建应用容器。

## 用法

```bash
nb app restart [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要重启的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--verbose` | boolean | 显示底层停止和启动命令输出 |

## 示例

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

默认情况下，在适用时 CLI 会先执行 `nb license plugins sync --skip-if-no-license`，同步当前授权允许使用的商业插件；然后本地 env 会在重新启动前自动完成必要的安装或升级准备，Docker env 会在重建容器前完成这一步。只要 CLI 需要等待应用就绪，就会检查 `__health_check` 接口：先输出一条等待日志，之后每 10 秒输出一条进度提示，直到应用可用或超时。

## Hook 脚本

如果当前 env 通过 `nb init --hook-script` 保存了 hook，`nb app restart` 会在应用重启并通过 `__health_check` 后执行一次 `afterAppStart(context)`。此时 `context.phase = 'app-start'`，`context.command = 'app:restart'`。

## 相关命令

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
