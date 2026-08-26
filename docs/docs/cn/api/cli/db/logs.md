---
title: "nb db logs"
description: "nb db logs 命令参考：查看指定 env 的内置数据库容器日志。"
keywords: "nb db logs,NocoBase CLI,数据库日志,Docker logs"
---

# nb db logs

查看指定 env 的内置数据库容器日志。该命令只适用于启用了 CLI 托管内置数据库的 env。

## 用法

```bash
nb db logs [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要查看内置数据库日志的 CLI env 名称，省略时使用当前 env |
| `--tail` | integer | 跟随日志前显示的最近日志行数，默认 `100` |
| `--follow`, `-f` / `--no-follow` | boolean | 是否持续跟随新日志 |

## 示例

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## 相关命令

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
