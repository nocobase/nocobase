# 快速开始

如果你是第一次接触这套 CLI，不需要一开始就把所有命令都记住。先用 `nb init --ui` 安装一个应用，后面的事再按场景继续看就行。

## 先建立一个最重要的心智

在 NocoBase CLI 里，后续操作默认不是围绕“某个目录”或“某个端口”展开，而是围绕 **env** 展开。

你可以把 env 理解成“CLI 记住的一套应用连接和运行信息”。只要它已经保存成功，后面的很多命令就能直接接着用：

- 用 `nb init` 新装一个应用，并顺手保存成 env
- 用 `nb env add` 把一个已有应用接入 CLI
- 用 `nb app start`、`nb app logs`、`nb app upgrade` 管理这个 env
- 用 `nb backup` 备份和恢复这个 env
- 用 `nb app autostart`、`nb proxy` 继续补生产环境能力

先把这件事记住，后面的文档会顺很多。

## 默认推荐路径

如果你不确定该从哪里开始，通常来说按下面这条路径走最省心：

1. 先看 [使用 CLI 安装（推荐）](./installation/cli.md)，完成一次 `nb init`。
2. 应用保存成 env 之后，再看 [多环境管理](./operations/multi-environment.md)，确认当前 env、切换 env、查看状态。
3. 日常启动、停止、日志和升级，继续看 [管理应用](./operations/manage-app.md)。
4. 做升级、迁移或重要变更前，先看 [备份还原](./operations/backup-restore.md)。
5. 如果准备正式上线，再进入 [生产环境部署概述](./production/index.md)。

前三步覆盖大多数使用场景。

## 快速索引

| 我想要…… | 去哪里看 |
| --- | --- |
| 还没有应用，先装一个新的 NocoBase，并保存成 CLI env | [使用 CLI 安装（推荐）](./installation/cli.md) |
| 已经有一个运行中的 NocoBase，想接入 CLI 管理 | [使用 CLI 安装（推荐）](./installation/cli.md) |
| 把旧的安装方式逐步迁移到 CLI | [从旧方式迁移到 CLI](./installation/migration.md) |
| 看本地保存了哪些 env、切换当前 env、检查状态 | [多环境管理](./operations/multi-environment.md) |
| 启动、停止、重启应用，查看日志，或者继续升级 | [管理应用](./operations/manage-app.md) |
| 升级、迁移或批量改数据前先做备份，需要时再恢复 | [备份还原](./operations/backup-restore.md) |
| 先确认应用运行需要的关键环境变量 | [应用环境变量](./installation/env.md) |
| 安装第三方插件 | [第三方插件安装与升级](./plugins/third-party.md) |
| 让应用进入生产环境：自动启动、稳定对外访问、反向代理 | [生产环境部署概述](./production/index.md) |

## 什么时候看命令参考

这组快速开始文档更偏“我现在要做什么”。如果你已经知道自己要执行哪条命令，只是想继续看完整参数，再去看 [NocoBase CLI 命令参考](../api/cli/index.md) 就行。

默认建议是：

- 先用快速开始文档建立路径感
- 再在具体命令页里查参数细节

这样比一上来就读完整命令树更容易上手。
