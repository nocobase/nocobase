---
title: "nb session setup"
description: "nb session setup 命令参考：安装 NB_SESSION_ID 的 shell 或 runtime 集成。"
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,shell integration"
---

# nb session setup

安装 `NB_SESSION_ID` 的 session 集成。

这个命令会根据当前 shell，或者你通过 `--shell` 指定的目标 shell，写入对应的初始化文件，让新打开的 shell 会话自动注入 `NB_SESSION_ID`。

如果检测到本机已经安装了 opencode 配置，还会顺手写入它的插件配置，让 agent runtime 也能注入自己的 `NB_SESSION_ID`。

## 用法

```bash
nb session setup [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--shell` | string | 指定目标 shell，支持 `bash`、`zsh`、`fish`、`powershell`、`cmd` |

## 说明

通常来说，你只需要执行一次。

执行完成后，重新打开一个新的 shell session，或者重新加载 profile，`NB_SESSION_ID` 就会自动生效。

在 Codex 这类 agent runtime 里，如果运行时本身已经注入了类似 `CODEX_THREAD_ID` 的上下文，CLI 会优先复用这个值。

## 示例

```bash
nb session setup
nb session setup --shell zsh
nb session setup --shell powershell
```

## 相关命令

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
