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

## 示例

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
```

## 相关命令

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
