---
title: "nb license plugins list"
description: "nb license plugins list 命令参考：查看指定 env 当前授权对应的商业插件列表。"
keywords: "nb license plugins list,NocoBase CLI,商业插件列表"
---

# nb license plugins list

查看指定 env 当前保存的 license key 对应的商业插件列表。

## 用法

```bash
nb license plugins list [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

## 说明

如果显式传入 `--env`，并且它与当前 env 不一致，CLI 会先要求确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
