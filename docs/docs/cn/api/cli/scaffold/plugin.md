---
title: "nb scaffold plugin"
description: "nb scaffold plugin 命令参考：生成 NocoBase 插件脚手架。"
keywords: "nb scaffold plugin,NocoBase CLI,插件脚手架"
---

# nb scaffold plugin

生成 NocoBase 插件脚手架代码。

## 用法

```bash
nb scaffold plugin <pkg> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<pkg>` | string | 插件包名，必填 |
| `--force-recreate`, `-f` | boolean | 强制重新创建插件脚手架 |

## 示例

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## 相关命令

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
