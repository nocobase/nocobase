---
title: "nb env use"
description: "nb env use 命令参考：切换当前 NocoBase CLI env。"
keywords: "nb env use,NocoBase CLI,切换环境,current env"
---

# nb env use

切换当前 CLI env。之后省略 `--env` 的命令会默认使用该 env。

如果当前 shell 或 runtime 已经启用 session mode，那么这个切换只影响当前 session。

如果没有启用 session mode，那么这个切换会回退到更新全局 `last env`。这种情况下，其他没有 session 隔离的终端或 agent runtime 也可能受到影响。

## 用法

```bash
nb env use <name>
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<name>` | string | 要切换到的已配置环境名称 |

## 示例

```bash
nb env use local
```

## 建议

默认推荐先执行一次 [`nb session setup`](../session/setup.md)。这样 `nb env use` 的行为会更接近数据库里的 `use dbname`——先切换当前会话上下文，再执行后续依赖 env 的操作。

## 相关命令

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
