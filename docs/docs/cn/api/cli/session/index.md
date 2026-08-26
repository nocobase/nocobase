---
title: "nb session"
description: "nb session 命令参考：配置和查看 NB_SESSION_ID，让 current env 按 shell 或 agent runtime 隔离。"
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

管理 `NB_SESSION_ID` 相关的 session mode。

开启 session mode 后，`nb env use` 和 `nb env current` 会优先使用当前 shell 或 agent runtime 的会话上下文，不再直接共享一个全局 current env。

## 用法

```bash
nb session <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb session setup`](./setup.md) | 安装 `NB_SESSION_ID` 的 shell 或 runtime 集成 |
| [`nb session id`](./id.md) | 显示当前生效的 session id |
| [`nb session remove`](./remove.md) | 移除 `NB_SESSION_ID` 的 shell 或 runtime 集成 |

## 什么时候需要它

默认推荐在第一次使用 CLI 时执行一次 `nb session setup`。这样：

- 终端 1 可以使用 `env1`
- 终端 2 可以同时使用 `env2`
- agent runtime 也可以维护自己的 current env

如果没有开启 session mode，那么不同会话之间会共享全局 `last env` 作为回退值，并行操作时更容易互相影响。

## 相关命令

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
