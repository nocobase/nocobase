---
title: "nb portal create"
description: "nb portal create 命令参考：基于模板创建本地 Portal 工作区，并创建或更新 Portal 记录。"
keywords: "nb portal create,NocoBase CLI,Portal,创建工作区,template,source storage,git"
---

# nb portal create

基于模板创建本地 Portal 工作区，并创建或更新 NocoBase 中的 Portal 记录。

默认模板是 `@nocobase/portal-template-default`，源码默认保存到 NocoBase 侧的 source storage。如果你希望用 Git 管理 Portal 源码，可以在创建时把 `--source-storage` 设置为 `git`。

## 用法

```bash
nb portal create <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--dir` | string | 本地工作区目录，默认是 `<当前目录>/<portal>` |
| `<portal>` | string | Portal 名称或 slug |
| `--template` | string | 模板包、本地路径或 `file://` URL，默认是 `@nocobase/portal-template-default` |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--title` | string | Portal 显示标题，省略时根据 Portal slug 自动生成 |
| `--force` | boolean | 删除已有本地 Portal 工作区并重新创建 |
| `--source-storage` | `nocobase` \| `git` | Portal 源码保存方式，默认是 `nocobase` |
| `--git-repo` | string | 当 `--source-storage=git` 时使用的 Git 仓库 URL |
| `--git-branch` | string | 当 `--source-storage=git` 时使用的 Git 分支，省略时按配置默认值处理 |
| `--git-path` | string | Git 仓库内保存该 Portal 的目录，省略时使用仓库根目录（`.`） |

## 示例

使用默认模板创建 Portal：

```bash
nb portal create customer
```

指定模板：

```bash
nb portal create customer --template @nocobase/portal-template-default
```

在指定 env 中创建：

```bash
nb portal create customer --env dev --yes
```

把源码保存到 Git 仓库：

```bash
nb portal create customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
```

## 说明

`--force` 会先删除已有本地 Portal 工作区，再重新创建。这个参数适合本地工作区已经损坏、或者你明确希望重新从模板生成的情况。

创建时会在本地工作区写入 `.env`、`.env.local` 和 `portal.config.json`。其中 `.env.local` 使用完整的 `apiBaseUrl`，`portal.config.json` 保存 Portal 名称、source storage 和 Git 配置。

如果模板里有 `package.json`，创建完成后会自动执行 `pnpm install`。如果模板里没有 `package.json`，会跳过依赖安装。

Portal 名称必须使用小写字母、数字、下划线或连字符，并且以小写字母或数字开头。

如果选择 `--source-storage=git`，必须同时传入完整的 `--git-repo`。`--git-branch` 省略时使用 `main`，`--git-path` 省略时使用仓库根目录（`.`）。

## 相关命令

- [`nb portal dev`](./dev.md)
- [`nb portal config`](./config.md)
- [`nb portal push`](./push.md)
- [`nb portal list`](./list.md)
