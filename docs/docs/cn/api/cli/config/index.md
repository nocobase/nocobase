---
title: "nb config"
description: "nb config 命令参考：管理 NocoBase CLI 的默认配置项。"
keywords: "nb config,NocoBase CLI,配置,默认配置"
---

# nb config

管理 CLI 默认配置。当前支持的配置项包括：

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## 常用配置项

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `locale` | 按 CLI 当前规则解析 | 覆盖 CLI 使用的语言 |
| `update.policy` | `prompt` | 启动时更新策略：`prompt`、`auto` 或 `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | 商业包使用的包仓库地址 |
| `docker.network` | `nocobase` | CLI 管理的 Docker 应用默认网络 |
| `docker.container-prefix` | `nb` | CLI 管理的 Docker 容器默认前缀 |
| `bin.docker` | `docker` | 覆盖 Docker 可执行文件路径 |
| `bin.git` | `git` | 覆盖 Git 可执行文件路径 |
| `bin.yarn` | `yarn` | 覆盖 Yarn 可执行文件路径 |

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
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## 相关命令

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
