---
title: "nb scaffold migration"
description: "nb scaffold migration 命令参考：生成 NocoBase 插件迁移脚本。"
keywords: "nb scaffold migration,NocoBase CLI,迁移脚本,migration"
---

# nb scaffold migration

生成插件迁移脚本文件。

## 用法

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<name>` | string | 迁移脚本名称，必填 |
| `--pkg` | string | 所属插件包名，必填 |
| `--on` | string | 执行时机：`beforeLoad`、`afterSync` 或 `afterLoad` |

## 示例

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## 相关命令

- [`nb scaffold plugin`](./plugin.md)
- [插件开发](../../../plugin-development/index.md)
