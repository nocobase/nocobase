---
title: "nb license plugins"
description: "nb license plugins 命令参考：查看或同步当前商业授权允许使用的插件。"
keywords: "nb license plugins,NocoBase CLI,商业插件,授权插件"
---

# nb license plugins

查看或同步当前商业授权允许使用的插件。

## 用法

```bash
nb license plugins <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb license plugins list`](./list.md) | 查看当前授权对应的商业插件列表 |
| [`nb license plugins sync`](./sync.md) | 同步当前授权允许使用的商业插件到本地 |
| [`nb license plugins clean`](./clean.md) | 清理当前 env 已下载的商业插件 |

## 示例

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## 相关命令

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
