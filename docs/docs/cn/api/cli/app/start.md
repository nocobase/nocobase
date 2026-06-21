---
title: "nb app start"
description: "nb app start 命令参考：启动指定 env 的 NocoBase 应用；在适用时会先自动同步当前授权允许使用的商业插件，本地 env 再完成安装或升级准备，Docker env 则按已保存配置重建应用容器。"
keywords: "nb app start,NocoBase CLI,启动应用,Docker,pm2"
---

# nb app start

启动指定 env 的 NocoBase 应用。在适用时，CLI 会先自动同步当前授权允许使用的商业插件；随后 npm/Git 安装会继续完成安装或升级准备，再运行本地应用命令；Docker 安装会根据已保存的 env 配置重建应用容器。

## 用法

```bash
nb app start [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要启动的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--verbose` | boolean | 显示底层本地或 Docker 命令输出 |

## 示例

```bash
nb app start
nb app start --env local
nb app start --env local --verbose
nb app start --env local-docker
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

默认情况下，在适用时 CLI 会先执行 `nb license plugins sync --skip-if-no-license`，同步当前授权允许使用的商业插件；然后本地 env 会自动完成必要的安装或升级准备，再以后台模式启动；Docker env 会按已保存配置重建应用容器。只要 CLI 需要等待应用就绪，就会检查 `__health_check` 接口：先输出一条等待日志，之后每 10 秒输出一条进度提示，直到应用可用或超时。
## 相关命令

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
