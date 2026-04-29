---
title: "nb app start"
description: "nb app start 命令参考：启动指定 env 的 NocoBase 应用或 Docker 容器。"
keywords: "nb app start,NocoBase CLI,启动应用,Docker,pm2"
---

# nb app start

启动指定 env 的 NocoBase 应用。npm/Git 安装会运行本地应用命令，Docker 安装会启动已保存的应用容器。

## 用法

```bash
nb app start [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要启动的 CLI env 名称，省略时使用当前 env |
| `--quickstart` | boolean | 快速启动应用 |
| `--port`, `-p` | string | 覆盖 env 配置中的 `appPort` |
| `--daemon`, `-d` / `--no-daemon` | boolean | 是否以守护进程模式运行，默认开启 |
| `--instances`, `-i` | integer | 运行实例数 |
| `--launch-mode` | string | 启动方式：`pm2` 或 `node` |
| `--verbose` | boolean | 显示底层本地或 Docker 命令输出 |

## 示例

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local-docker
```

## 相关命令

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
