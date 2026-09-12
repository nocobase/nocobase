---
title: "nb app stop"
description: "nb app stop 命令参考：停止指定 env 的 NocoBase 应用，并按需一并清理 CLI 托管的内置数据库容器。"
keywords: "nb app stop,NocoBase CLI,停止应用,Docker,with-db,内置数据库"
---

# nb app stop

停止指定 env 的 NocoBase 应用。npm/Git 安装会停止本地应用进程，Docker 安装会清理已保存的应用容器。

如果你传入 `--with-db`，并且这个 env 使用的是 CLI 托管的内置数据库，那么命令还会一并清理数据库容器。如果这个 env 用的是外部数据库，那么数据库资源不会被触碰。

## 用法

```bash
nb app stop [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要停止的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--with-db` | boolean | 在存在 CLI 托管内置数据库时，一并清理数据库容器 |
| `--verbose` | boolean | 显示底层本地或 Docker 命令输出 |

## 示例

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

`--with-db` 只会影响 CLI 托管的内置数据库容器。通常来说，如果你只是想停掉应用本身，不需要带这个参数；只有当你也想把当前机器上的内置数据库运行时一起停掉时，才需要加上它。

这个命令只能操作当前机器上的 local 或 Docker 运行时。如果某个 env 只是一个 HTTP API 连接，或者是预留中的 SSH env，那么 `nb app stop` 不能替你远程停机。

## 相关命令

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
