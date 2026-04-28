---
title: "nb db"
description: "nb db 命令参考：查看或管理选中 env 的内置数据库运行状态。"
keywords: "nb db,NocoBase CLI,内置数据库,Docker,数据库状态"
---

# nb db

查看或管理 CLI 托管的内置数据库。对于没有 CLI 托管数据库容器的 env，`nb db ps` 也会显示 `external` 或 `remote` 等状态。

## 用法

```bash
nb db <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb db ps`](./ps.md) | 查看内置数据库运行状态 |
| [`nb db start`](./start.md) | 启动内置数据库容器 |
| [`nb db stop`](./stop.md) | 停止内置数据库容器 |
| [`nb db logs`](./logs.md) | 查看内置数据库容器日志 |

## 示例

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## 相关命令

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
