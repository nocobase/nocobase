---
title: "nb db start"
description: "nb db start 命令参考：启动指定 env 的内置数据库容器。"
keywords: "nb db start,NocoBase CLI,启动数据库,Docker"
---

# nb db start

启动指定 env 的内置数据库容器。该命令只适用于启用了 CLI 托管内置数据库的 env。

## 用法

```bash
nb db start [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要启动内置数据库的 CLI env 名称，省略时使用当前 env |
| `--verbose` | boolean | 显示底层 Docker 命令输出 |

## 示例

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## 相关命令

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
