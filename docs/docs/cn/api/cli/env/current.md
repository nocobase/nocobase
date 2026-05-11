---
title: "nb env current"
description: "nb env current 命令参考：查看当前生效的 NocoBase CLI env。"
keywords: "nb env current,NocoBase CLI,current env,session env"
---

# nb env current

显示当前生效的 env 名称。

默认会优先读取当前 `NB_SESSION_ID` 对应的 session env；如果当前 shell 或 runtime 没有开启 session mode，则回退到全局 `last env`。

## 用法

```bash
nb env current
```

## 示例

```bash
nb env current
```

## 相关命令

- [`nb env use`](./use.md)
- [`nb env status`](./status.md)
- [`nb session setup`](../session/setup.md)
