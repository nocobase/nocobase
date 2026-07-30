---
title: "nb portal push"
description: "nb portal push 命令参考：把本地 Portal 源码变更推送到 source storage。"
keywords: "nb portal push,NocoBase CLI,Portal,推送源码,source storage,Git,commit message"
---

# nb portal push

把本地 Portal 源码变更推送到 source storage。

如果 Portal 使用 Git 管理源码，`--message` 会作为 Git commit message。默认 source storage 是 `nocobase` 时，也可以用 `--message` 记录这次源码更新的说明。

## 用法

```bash
nb portal push <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--dir` | string | Portal 工作区目录，默认是当前目录 |
| `<portal>` | string | Portal 名称或 slug |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--message`, `-m` | string | 源码更新说明；当 Portal 使用 Git 管理源码时，会作为 Git commit message |

## 示例

推送当前 env 中的 Portal：

```bash
nb portal push customer
```

推送指定 env 中的 Portal：

```bash
nb portal push customer --env prod --yes
```

带更新说明推送：

```bash
nb portal push customer --message "Update customer portal"
```

## 说明

`push` 面向已经存在的本地 Portal 工作区。如果你只想部署当前本地构建结果，使用 [`nb portal deploy`](./deploy.md)；如果你还需要同步源码，先执行 `push`。

执行时会读取本地工作区的 `portal.config.json`，并先把源码配置同步到远端 Portal 记录。

如果 Portal 使用 Git source storage，`push` 会 clone 配置中的仓库和分支，把本地 Portal 工作区复制到配置的 Git 目录，然后提交并推送。没有源码变更时不会创建 commit；如果没有传入 `--message`，默认 commit message 是 `chore(portal): update <portal>`。

如果 Portal 使用默认的 `nocobase` source storage，`local`、`docker` 和 `http` env 都会打包本地源码并通过 API 上传。

## 相关命令

- [`nb portal pull`](./pull.md)
- [`nb portal config`](./config.md)
- [`nb portal deploy`](./deploy.md)
- [`nb portal info`](./info.md)
