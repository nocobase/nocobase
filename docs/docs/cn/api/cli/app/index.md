---
title: "nb app"
description: "nb app 命令参考：管理 NocoBase 应用运行态，包括启动、停止、重启、日志和升级。"
keywords: "nb app,NocoBase CLI,启动,停止,重启,日志,升级"
---

# nb app

管理 NocoBase 应用运行态。npm/Git env 会在本地源码目录中执行应用命令，Docker env 会基于已保存配置管理应用容器。

## 用法

```bash
nb app <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb app start`](./start.md) | 启动应用或重建 Docker 容器 |
| [`nb app stop`](./stop.md) | 停止应用或清理 Docker 容器 |
| [`nb app restart`](./restart.md) | 先停止再启动应用 |
| [`nb app autostart`](./autostart/index.md) | 管理应用自启动标记，并批量拉起已启用的 env |
| [`nb app logs`](./logs.md) | 查看应用日志 |
| [`nb app upgrade`](./upgrade.md) | 停止应用、替换源码或镜像后再启动 |

## 示例

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## 相关命令

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
