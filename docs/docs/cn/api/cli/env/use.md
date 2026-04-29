---
title: "nb env use"
description: "nb env use 命令参考：切换当前 NocoBase CLI env。"
keywords: "nb env use,NocoBase CLI,切换环境,current env"
---

# nb env use

切换当前 CLI env。之后省略 `--env` 的命令会默认使用该 env。

## 用法

```bash
nb env use <name>
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<name>` | string | 已配置的环境名称 |

## 示例

```bash
nb env use local
```

## 相关命令

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
