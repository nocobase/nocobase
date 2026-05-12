---
title: "nb plugin list"
description: "nb plugin list 命令参考：列出选中 NocoBase env 的插件。"
keywords: "nb plugin list,NocoBase CLI,插件列表"
---

# nb plugin list

列出选中 env 的已安装插件。

## 用法

```bash
nb plugin list [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

## 示例

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
