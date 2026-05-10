---
title: "nb plugin disable"
description: "nb plugin disable 命令参考：停用选中 NocoBase env 中的一个或多个插件。"
keywords: "nb plugin disable,NocoBase CLI,停用插件"
---

# nb plugin disable

停用选中 env 中的一个或多个插件。

## 用法

```bash
nb plugin disable <packages...> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<packages...>` | string[] | 插件包名，必填，支持传入多个 |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

## 示例

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
