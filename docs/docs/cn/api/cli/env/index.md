---
title: "nb env"
description: "nb env 命令参考：管理 NocoBase CLI env，包括添加、查看 current env、状态检查、切换、更新、认证和移除。"
keywords: "nb env,NocoBase CLI,环境管理,env,current env,认证,OpenAPI"
---

# nb env

管理已保存的 NocoBase CLI env。env 会保存 API 地址、认证信息、本地应用路径、数据库配置等连接和本地运行信息。

从这一版开始，CLI 把两个概念拆开了：

- `current env`：当前 shell 或 agent runtime 正在使用的 env，优先按 `NB_SESSION_ID` 隔离
- `last env`：全局最后一次使用的 env，作为没有 session mode 时的回退值

## 用法

```bash
nb env <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb env add`](./add.md) | 保存一个 NocoBase API endpoint，并切换到这个 env |
| [`nb env current`](./current.md) | 查看当前生效的 env |
| [`nb env update`](./update.md) | 更新已保存的 env 配置，并按情况自动处理后续同步 |
| [`nb env list`](./list.md) | 列出已配置 env |
| [`nb env status`](./status.md) | 查看当前 env、指定 env 或全部 env 的状态 |
| [`nb env info`](./info.md) | 查看单个 env 的详细信息 |
| [`nb env remove`](./remove.md) | 停止托管运行态后移除 env 配置 |
| [`nb env auth`](./auth.md) | 对已保存 env 执行 OAuth 登录 |
| [`nb env use`](./use.md) | 切换当前 env |

## 示例

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

默认推荐开启 session mode。这样不同终端、不同 shell，或者不同 agent runtime 里的 `current env` 可以互相隔离，不会并行互相影响。

如果没有开启 session mode，那么 `nb env use` 会更新全局 `last env`，其他没有 session 隔离的会话也会跟着受到影响。

开启方式见 [`nb session setup`](../session/setup.md)。

## 相关命令

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
