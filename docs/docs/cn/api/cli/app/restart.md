---
title: "nb app restart"
description: "nb app restart 命令参考：重启指定 env 的 NocoBase 应用或 Docker 容器。"
keywords: "nb app restart,NocoBase CLI,重启应用,Docker"
---

# nb app restart

先停止再启动指定 env 的 NocoBase 应用。

## 用法

```bash
nb app restart [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要重启的 CLI env 名称，省略时使用当前 env |
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
nb app restart --env local-docker
```

## 相关命令

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
