---
title: "nb app restart"
description: "nb app restart 命令参考：重启指定 env 的 NocoBase 应用，并在 Docker env 中按已保存配置重建应用容器。"
keywords: "nb app restart,NocoBase CLI,重启应用,Docker"
---

# nb app restart

先停止再启动指定 env 的 NocoBase 应用。本地 env 会复用 `nb app stop` 和 `nb app start` 的流程；Docker env 会先清理当前容器，再按已保存配置重建应用容器。

## 用法

```bash
nb app restart [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要重启的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--quickstart` | boolean | 停止后快速启动应用 |
| `--port`, `-p` | string | 覆盖 env 配置中的 `appPort` |
| `--daemon`, `-d` / `--no-daemon` | boolean | 停止后是否以守护进程模式运行，默认开启 |
| `--instances`, `-i` | integer | 停止后运行的实例数 |
| `--launch-mode` | string | 启动方式：`pm2` 或 `node` |
| `--verbose` | boolean | 显示底层停止和启动命令输出 |

## 示例

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local --verbose
nb app restart --env local-docker
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

只要 CLI 需要等待应用就绪，就会检查 `__health_check` 接口：先输出一条等待日志，之后每 10 秒输出一条进度提示，直到应用可用或超时。如果本地 env 传入 `--no-daemon`，应用会以前台模式运行，此时 CLI 不会在启动后继续等待健康检查。

## 相关命令

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
