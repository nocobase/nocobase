---
title: "nb plugin enable"
description: "nb plugin enable 命令参考：启用选中 NocoBase env 中的一个或多个插件。"
keywords: "nb plugin enable,NocoBase CLI,启用插件"
---

# nb plugin enable

启用选中 env 中的一个或多个插件。

## 用法

```bash
nb plugin enable <packages...> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<packages...>` | string[] | 插件包名，必填，支持传入多个 |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |

## 示例

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## 相关命令

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
