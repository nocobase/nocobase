---
title: "nb portal pull"
description: "nb portal pull 命令参考：从 source storage 拉取 Portal 源码到本地工作区。"
keywords: "nb portal pull,NocoBase CLI,Portal,拉取源码,source storage,工作区"
---

# nb portal pull

从 source storage 拉取 Portal 源码到本地工作区。

这个命令适合接手已有 Portal、换机器开发，或者本地工作区丢失后重新拉取源码。

## 用法

```bash
nb portal pull <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--dir` | string | 本地工作区目录；省略时使用当前 Portal 工作区，否则使用 `<当前目录>/<portal>` |
| `<portal>` | string | Portal 名称或 slug |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--force` | boolean | 删除已有本地工作区并重新拉取 |
| `--install` / `--no-install` | boolean | 拉取源码后是否执行 `pnpm install`，默认执行 |

## 示例

拉取当前 env 中的 Portal：

```bash
nb portal pull customer
```

拉取指定 env 中的 Portal：

```bash
nb portal pull customer --env prod --yes
```

重新拉取并覆盖本地工作区：

```bash
nb portal pull customer --force
```

拉取源码但跳过依赖安装：

```bash
nb portal pull customer --no-install
```

## 说明

`--force` 会删除已有本地工作区再重新拉取。使用前确认本地没有未提交或未推送的源码变更。

如果拉取后的工作区包含 `package.json`，默认会自动执行 `pnpm install`。在 CI、脚本或你准备手动安装依赖时，可以传入 `--no-install` 跳过。

如果 Portal 使用 Git source storage，`pull` 会 clone 配置中的仓库和分支，并复制 `--git-path` 对应目录。配置中的分支不存在时，CLI 会尝试基于仓库默认分支创建本地分支；如果配置目录不存在，命令会报错。

如果 Portal 使用默认的 `nocobase` source storage，`local`、`docker` 和 `http` env 都会通过 API 下载源码归档，并展开到本地工作区。

## 相关命令

- [`nb portal list`](./list.md)
- [`nb portal info`](./info.md)
- [`nb portal config`](./config.md)
- [`nb portal push`](./push.md)
