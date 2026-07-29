---
title: "nb portal"
description: "nb portal 命令参考：管理 Portal 工作区，包括配置、创建、开发、查看、拉取、推送、部署和删除。"
keywords: "nb portal,NocoBase CLI,Portal,多入口,工作区,源码同步,部署"
---

# nb portal

管理 Portal 工作区。Portal 可以有独立的前端源码、入口和部署结果，`nb portal` 负责把 NocoBase 中的 Portal 记录、本地工作区和 source storage 串起来。

通常来说，Portal 的完整流程是：先创建本地工作区，再进入开发模式；开发完成后，把源码推送到 source storage，最后构建并部署。如果你接手的是已有 Portal，则可以先 `pull` 到本地，再继续开发。

## 用法

```bash
nb portal <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb portal config`](./config.md) | 更新本地 Portal 工作区的源码配置，并尽量同步到远端 Portal 记录 |
| [`nb portal create`](./create.md) | 基于模板创建本地 Portal 工作区，并创建或更新 Portal 记录 |
| [`nb portal deploy`](./deploy.md) | 构建并部署指定 Portal 工作区 |
| [`nb portal destroy`](./destroy.md) | 删除 Portal 记录和本地工作区 |
| [`nb portal dev`](./dev.md) | 启动指定 Portal 工作区的开发模式 |
| [`nb portal info`](./info.md) | 查看指定 Portal 记录和本地工作区详情 |
| [`nb portal list`](./list.md) | 列出 Portal 记录和本地工作区同步状态 |
| [`nb portal pull`](./pull.md) | 从 source storage 拉取 Portal 源码到本地工作区 |
| [`nb portal push`](./push.md) | 把本地 Portal 源码变更推送到 source storage |

## 典型流程

创建一个名为 `customer` 的 Portal：

```bash
nb portal create customer -e dev --yes
```

启动本地开发模式：

```bash
nb portal dev customer -e dev --yes
```

查看本地工作区和远端记录状态：

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

推送源码并部署：

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

接手已有 Portal：

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

切换源码保存方式：

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

创建 Portal 时，可以选择源码保存方式：

| 方式 | 说明 |
| --- | --- |
| `nocobase` | 默认方式，源码由 NocoBase 侧的 source storage 管理 |
| `git` | 源码保存到指定 Git 仓库，可以通过 `--git-repo`、`--git-branch` 和 `--git-path` 指定位置 |

如果只是快速创建和开发 Portal，默认的 `nocobase` 就够了。只有当你希望把 Portal 源码纳入已有 Git 仓库、走团队代码评审或 CI 流程时，才需要选择 `git`。

源码配置会写入本地工作区的 `portal.config.json`。`create`、`pull` 和 `config` 都会维护这个文件；`push` 和 `deploy` 会读取它，并按配置同步源码或部署产物。

## env 类型

`nb portal` 当前主要支持 `local`、`docker` 和 `http` env：

| env 类型 | 说明 |
| --- | --- |
| `local` | 本地工作区和应用 storage 在当前机器上，`pull`/`push` 对默认 `nocobase` 存储通常不需要做额外同步 |
| `docker` | 本地工作区通过 Docker volume 和应用共享，`pull`/`push` 对默认 `nocobase` 存储通常不需要做额外同步 |
| `http` | 通过 API 同步源码和部署产物，`pull`/`push` 会下载或上传源码归档 |

`ssh` env 在当前版本暂不支持 Portal 工作区管理。

## 本地工作区路径

Portal 工作区会放在当前 env 的 storage 下：

```text
<storagePath>/portals/<app>/<portal>
```

主应用的访问路径通常是：

```text
<appPublicPath>/x/<portal>/
```

子应用的访问路径通常是：

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## env 确认

多数 `nb portal` 子命令都支持 `--env` 和 `--yes`：

| 参数 | 说明 |
| --- | --- |
| `--env`, `-e` | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

如果你在脚本或 AI agent 场景下执行命令，建议显式传入 `--env` 和 `--yes`，避免命令停在交互确认里。

## 相关命令

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
