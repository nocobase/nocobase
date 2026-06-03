---
title: "nb config get"
description: "nb config get 命令参考：读取某个 CLI 配置项的生效值。"
keywords: "nb config get,NocoBase CLI,读取配置"
---

# nb config get

读取指定 CLI 配置项的生效值。若未显式设置，则返回默认值。

## 用法

```bash
nb config get <key>
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<key>` | string | 配置项名称：`locale`、`update.policy`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git` 或 `bin.yarn` |

## 示例

```bash
nb config get locale
nb config get update.policy
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## 相关命令

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
