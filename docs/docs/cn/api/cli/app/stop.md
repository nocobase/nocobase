---
title: "nb app stop"
description: "nb app stop 命令参考：停止指定 env 的 NocoBase 应用或 Docker 容器。"
keywords: "nb app stop,NocoBase CLI,停止应用,Docker"
---

# nb app stop

停止指定 env 的 NocoBase 应用。npm/Git 安装会停止本地应用进程，Docker 安装会停止已保存的应用容器。

## 用法

```bash
nb app stop [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要停止的 CLI env 名称，省略时使用当前 env |
| `--verbose` | boolean | 显示底层本地或 Docker 命令输出 |

## 示例

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## 相关命令

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
