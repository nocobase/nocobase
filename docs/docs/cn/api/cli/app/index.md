---
title: "nb app"
description: "nb app 命令参考：管理 NocoBase 应用运行态，包括启动、停止、重启、日志、清理和升级。"
keywords: "nb app,NocoBase CLI,启动,停止,重启,日志,升级"
---

# nb app

管理 NocoBase 应用运行态。npm/Git env 会在本地源码目录中执行应用命令，Docker env 会管理已保存的应用容器。

## 用法

```bash
nb app <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb app start`](./start.md) | 启动应用或 Docker 容器 |
| [`nb app stop`](./stop.md) | 停止应用或 Docker 容器 |
| [`nb app restart`](./restart.md) | 先停止再启动应用 |
| [`nb app logs`](./logs.md) | 查看应用日志 |
| [`nb app down`](./down.md) | 停止并清理本地运行资源 |
| [`nb app upgrade`](./upgrade.md) | 更新源码或镜像并重启应用 |

## 示例

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## 相关命令

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
