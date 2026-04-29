---
title: "nb scaffold"
description: "nb scaffold 命令参考：生成 NocoBase 插件和迁移脚本脚手架。"
keywords: "nb scaffold,NocoBase CLI,脚手架,插件,migration"
---

# nb scaffold

生成 NocoBase 插件开发相关脚手架。

## 用法

```bash
nb scaffold <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | 生成 NocoBase 插件脚手架 |
| [`nb scaffold migration`](./migration.md) | 生成插件迁移脚本 |

## 示例

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## 相关命令

- [`nb plugin`](../plugin/)
- [插件开发](../../../plugin-development/index.md)
