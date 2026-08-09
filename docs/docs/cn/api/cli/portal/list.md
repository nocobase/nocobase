---
title: "nb portal list"
description: "nb portal list 命令参考：列出 Portal 记录和开发路径。"
keywords: "nb portal list,NocoBase CLI,Portal,工作区列表,开发路径,json-output"
---

# nb portal list

列出 Portal 记录和开发路径。你可以用它快速确认目标 env 下有哪些 Portal，以及每个 Portal 当前配置的开发工作区位置。

## 用法

```bash
nb portal list [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json-output`, `--json`, `-j` | boolean | 以 JSON 输出 Portal 记录 |

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
nb portal list --json
```

## 说明

如果列表里存在远端记录但开发路径还没有源码，可以使用 [`nb portal pull`](./pull.md) 拉取源码。如果本地工作区已经存在但需要重新生成，可以根据情况使用 [`nb portal create --force`](./create.md) 或 [`nb portal pull --force`](./pull.md)。

列表会显示名称、访问 URL、Portal 类型、source storage、开发路径、启用状态和默认状态。

`--json-output` 及其别名 `--json` 输出的字段包括 `name`、`url`、`portalType`、`developmentPath`、`deploymentPath`、`enabled`、`isDefault` 和 `sourceStorage`。

## 相关命令

- [`nb portal info`](./info.md)
- [`nb portal pull`](./pull.md)
- [`nb portal create`](./create.md)
