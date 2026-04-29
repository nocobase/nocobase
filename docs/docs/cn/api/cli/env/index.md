---
title: "nb env"
description: "nb env 命令参考：管理 NocoBase CLI env，包括添加、刷新、查看、切换、认证和移除。"
keywords: "nb env,NocoBase CLI,环境管理,env,认证,OpenAPI"
---

# nb env

管理已保存的 NocoBase CLI env。env 保存 API 地址、认证信息、本地应用路径、数据库配置和运行时命令缓存。

## 用法

```bash
nb env <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb env add`](./add.md) | 保存一个 NocoBase API endpoint，并切换为当前 env |
| [`nb env update`](./update.md) | 从应用刷新 OpenAPI Schema 和运行时命令缓存 |
| [`nb env list`](./list.md) | 列出已配置 env 和 API 认证状态 |
| [`nb env info`](./info.md) | 查看单个 env 的详细信息 |
| [`nb env remove`](./remove.md) | 移除 env 配置 |
| [`nb env auth`](./auth.md) | 对已保存 env 执行 OAuth 登录 |
| [`nb env use`](./use.md) | 切换当前 env |

## 示例

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## 相关命令

- [`nb init`](../init.md)
- [`nb api`](../api/)
- [`nb app`](../app/)
