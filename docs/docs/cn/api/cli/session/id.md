---
title: "nb session id"
description: "nb session id 命令参考：显示当前生效的 NB_SESSION_ID。"
keywords: "nb session id,NocoBase CLI,NB_SESSION_ID,session id"
---

# nb session id

显示当前生效的 session id。

如果当前 shell 或 runtime 里还没有可用的 `NB_SESSION_ID`，命令会提示你先执行 [`nb session setup`](./setup.md)，再打开新的 shell session 或 runtime。

## 用法

```bash
nb session id
```

## 示例

```bash
nb session id
```

## 相关命令

- [`nb session setup`](./setup.md)
- [`nb env current`](../env/current.md)
