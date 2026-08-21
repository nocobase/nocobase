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
| `--cwd`, `-c` | string | 指定应用根目录路径 |
| `--force-recreate`, `-f` | boolean | 强制重新创建插件脚手架 |

## 示例

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## 说明

对于 CLI 管理的 source app（通过 `nb init` 创建的应用），插件会生成在 `<app-path>/plugins/` 目录下，`nb` 会自动将插件同步到 `source/packages/plugins/` 供开发和构建流程使用。

如果目标插件已存在，命令默认会报错。使用 `--force-recreate` 可以强制重建。如果 source 侧存在冲突的目录或外部符号链接，需要先手动移除冲突项再重试。

## 相关命令

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
