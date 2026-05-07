---
title: "nb plugin"
description: "nb plugin 命令参考：管理选中 NocoBase env 的插件。"
keywords: "nb plugin,NocoBase CLI,插件管理,enable,disable,list"
---

# nb plugin

管理选中 NocoBase env 的插件。npm/Git env 会在本地执行插件命令，Docker env 会在已保存的应用容器中执行，HTTP env 会在可用时回退到 API。

## 用法

```bash
nb plugin <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb plugin list`](./list.md) | 列出已安装插件 |
| [`nb plugin enable`](./enable.md) | 启用一个或多个插件 |
| [`nb plugin disable`](./disable.md) | 停用一个或多个插件 |

## 示例

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## 相关命令

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
