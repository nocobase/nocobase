---
title: "nb config"
description: "nb config 命令参考：管理 NocoBase CLI 的默认配置项。"
keywords: "nb config,NocoBase CLI,配置,默认配置"
---

# nb config

管理 CLI 默认配置。当前支持的配置项包括：

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## 用法

```bash
nb config <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb config get`](./get.md) | 读取某个配置项的生效值 |
| [`nb config set`](./set.md) | 设置某个配置项 |
| [`nb config delete`](./delete.md) | 删除某个显式配置项 |
| [`nb config list`](./list.md) | 列出当前显式设置过的配置项 |

## 示例

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## 相关命令

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
