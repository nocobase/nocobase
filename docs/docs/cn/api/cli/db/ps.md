---
title: "nb db ps"
description: "nb db ps 命令参考：查看已配置 env 的内置数据库运行状态。"
keywords: "nb db ps,NocoBase CLI,数据库状态"
---

# nb db ps

查看内置数据库运行状态，不会启动或停止任何资源。省略 `--env` 时显示所有已配置 env 的数据库状态。

## 用法

```bash
nb db ps [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要查看的 CLI env 名称，省略时显示所有 env |

## 示例

```bash
nb db ps
nb db ps --env app1
```

## 相关命令

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
