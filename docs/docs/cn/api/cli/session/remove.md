---
title: "nb session remove"
description: "nb session remove 命令参考：移除 NB_SESSION_ID 的 shell 或 runtime 集成。"
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,remove session integration"
---

# nb session remove

移除 `NB_SESSION_ID` 的 session 集成。

这个命令会清理之前由 [`nb session setup`](./setup.md) 写入的 shell 配置；如果检测到 opencode 插件配置，也会一起移除对应的集成。

## 用法

```bash
nb session remove [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--shell` | string | 指定目标 shell，支持 `bash`、`zsh`、`fish`、`powershell`、`cmd` |

## 示例

```bash
nb session remove
nb session remove --shell zsh
```

## 相关命令

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
