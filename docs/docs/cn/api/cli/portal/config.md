---
title: "nb portal config"
description: "nb portal config 命令参考：更新 Portal 工作区的 source storage 和 Git 源码配置。"
keywords: "nb portal config,NocoBase CLI,Portal,source storage,Git,portal.config.json"
---

# nb portal config

更新 Portal 工作区的源码配置。它会写入本地工作区的 `portal.config.json`，如果远端 Portal 记录存在，也会把配置同步到远端记录。

这个命令适合在 Portal 已经创建或拉取到本地后，调整源码保存方式。比如先用默认的 `nocobase` 快速开发，后续再切换到 Git 仓库管理源码。

## 用法

```bash
nb portal config <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--dir` | string | Portal 工作区目录，默认是当前目录 |
| `<portal>` | string | Portal 名称或 slug |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--source-storage` | `nocobase` \| `git` | Portal 源码保存方式 |
| `--git-repo` | string | 当 `--source-storage=git` 时使用的 Git 仓库 URL |
| `--git-branch` | string | 当 `--source-storage=git` 时使用的 Git 分支 |
| `--git-path` | string | Git 仓库内保存该 Portal 的目录，省略时使用仓库根目录（`.`） |

## 示例

切回默认的 NocoBase source storage：

```bash
nb portal config customer --source-storage nocobase
```

把源码配置为 Git 存储：

```bash
nb portal config customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
```

调整 Git 分支和目录：

```bash
nb portal config customer --git-branch main --git-path portals/customer
```

在指定 env 中更新：

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
```

## 说明

必须至少传入一个配置项：`--source-storage`、`--git-repo`、`--git-branch` 或 `--git-path`。如果没有任何配置变化，命令会直接退出并提示。

`config` 要求本地 Portal 工作区已经存在。如果本地还没有工作区，先使用 [`nb portal create`](./create.md) 创建，或者使用 [`nb portal pull`](./pull.md) 拉取已有源码。

当 `--source-storage=git` 时，`--git-repo` 必须是完整 Git remote URL，比如 `https://...`、`ssh://...`、`file://...` 或 `git@host:path/repo.git`。`--git-path` 必须是仓库内的相对路径，不能是绝对路径，也不能包含 `..`。

如果远端 Portal 记录不存在，命令仍会更新本地 `portal.config.json`，并提示远端记录未同步。

## 相关命令

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
