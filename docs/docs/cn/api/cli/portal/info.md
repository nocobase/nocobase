---
title: "nb portal info"
description: "nb portal info 命令参考：查看指定 Portal 记录和本地工作区详情。"
keywords: "nb portal info,NocoBase CLI,Portal,工作区详情,json-output"
---

# nb portal info

查看指定 Portal 记录和本地工作区详情。遇到本地状态和远端记录不一致时，可以先用这个命令确认当前 Portal 的来源、路径和同步状态。

## 用法

```bash
nb portal info <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<portal>` | string | Portal 名称或 slug |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json-output`, `-j` | boolean | 以 JSON 输出 Portal 详情 |

## 示例

查看当前 env 中的 Portal：

```bash
nb portal info customer
```

查看指定 env 中的 Portal：

```bash
nb portal info customer --env dev --yes
```

以 JSON 输出：

```bash
nb portal info customer --json-output
```

## 说明

`--json-output` 更适合脚本和 agent 链路继续消费。如果只是人工查看，默认表格或文本输出通常更直观。

文本输出会显示名称、访问 URL、Portal 类型、本地路径、启用状态和本地同步状态。`--json-output` 输出的字段包括 `name`、`url`、`portalType`、`localPath`、`enabled`、`sourceStorage` 和 `localSynced`。

可以传入 Portal 的 `routeName` 或 `uid` 查询。

## 相关命令

- [`nb portal list`](./list.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
