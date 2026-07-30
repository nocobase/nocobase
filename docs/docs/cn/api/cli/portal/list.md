---
title: "nb portal list"
description: "nb portal list 命令参考：列出 Portal 记录和本地源码目录同步状态。"
keywords: "nb portal list,NocoBase CLI,Portal,本地源码目录列表,同步状态,json-output"
---

# nb portal list

列出 Portal 记录和本地源码目录同步状态。你可以用它快速确认目标 env 下有哪些 Portal，以及本地是否已经有对应的源码目录。

## 用法

```bash
nb portal list [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json-output`, `-j` | boolean | 以 JSON 输出 Portal 记录 |

## 示例

列出当前 env 的 Portal：

```bash
nb portal list
```

列出指定 env 的 Portal：

```bash
nb portal list --env dev --yes
```

以 JSON 输出：

```bash
nb portal list --json-output
```

## 说明

如果列表里存在远端记录但本地没有源码目录，可以使用 [`nb portal pull`](./pull.md) 拉取源码。如果本地源码目录已经存在但需要重新生成，可以根据情况使用 [`nb portal create --force`](./create.md) 或 [`nb portal pull --force`](./pull.md)。

列表会显示名称、访问 URL、Portal 类型、source storage、本地路径、启用状态和本地同步状态。只有 `portalType` 为 `ai` 的 Portal 才会检查本地源码目录；其他类型的 Portal，本地同步状态为空。

`--json-output` 输出的字段包括 `name`、`url`、`portalType`、`localPath`、`enabled`、`sourceStorage` 和 `localSynced`。

## 相关命令

- [`nb portal info`](./info.md)
- [`nb portal pull`](./pull.md)
- [`nb portal create`](./create.md)
