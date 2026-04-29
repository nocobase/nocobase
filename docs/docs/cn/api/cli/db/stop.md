---
title: "nb db stop"
description: "nb db stop 命令参考：停止指定 env 的内置数据库容器。"
keywords: "nb db stop,NocoBase CLI,停止数据库,Docker"
---

# nb db stop

停止指定 env 的内置数据库容器。该命令只适用于启用了 CLI 托管内置数据库的 env。

## 用法

```bash
nb db stop [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要停止内置数据库的 CLI env 名称，省略时使用当前 env |
| `--verbose` | boolean | 显示底层 Docker 命令输出 |

## 示例

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## 相关命令

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
