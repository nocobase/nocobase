---
title: "nb app stop"
description: "nb app stop 命令参考：停止指定 env 的 NocoBase 应用，并在 Docker env 中清理应用容器。"
keywords: "nb app stop,NocoBase CLI,停止应用,Docker"
---

# nb app stop

停止指定 env 的 NocoBase 应用。npm/Git 安装会停止本地应用进程，Docker 安装会清理已保存的应用容器。

## 用法

```bash
nb app stop [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要停止的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--verbose` | boolean | 显示底层本地或 Docker 命令输出 |

## 示例

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
