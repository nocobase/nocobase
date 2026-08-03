---
title: "nb portal create"
description: "nb portal create 命令参考：基于模板创建本地 Portal 开发工作区，并创建或更新 Portal 记录。"
keywords: "nb portal create,NocoBase CLI,Portal,创建工作区,template,path"
---

# nb portal create

基于模板创建本地 Portal 开发工作区，并创建或更新 NocoBase 中的 Portal 记录。

默认模板是 `@nocobase/portal-template-default`。开发工作区默认创建到当前命令执行目录下的 `./<portal>`，也可以通过 `--path` 指定。

## 用法

```bash
nb portal create <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<portal>` | string | Portal 名称或 slug |
| `--template` | string | 模板包、本地路径或 `file://` URL，默认是 `@nocobase/portal-template-default` |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--title` | string | Portal 显示标题，省略时根据 Portal slug 自动生成 |
| `--path` | string | Portal 开发工作区目录，默认是 `./<portal>` |
| `--force` | boolean | 删除已有本地 Portal 工作区并重新创建 |

## 示例

使用默认模板创建 Portal：

```bash
nb portal create customer
```

指定开发工作区路径：

```bash
nb portal create customer --path ./portals/customer
```

指定模板：

```bash
nb portal create customer --template @nocobase/portal-template-default
```

在指定 env 中创建：

```bash
nb portal create customer --env dev --yes
```

## 说明

`--force` 会先删除已有本地 Portal 开发工作区，再重新创建。这个参数适合本地工作区已经损坏、或者你明确希望重新从模板生成的情况。

创建时会在本地工作区写入 `.env` 和 `.env.local`。其中 `.env.local` 使用完整的 `apiBaseUrl`，开发工作区路径会保存到 CLI env config 的 `portals.<portal>.path`。

如果模板里有 `package.json`，创建完成后会自动执行 `pnpm install`。如果模板里没有 `package.json`，会跳过依赖安装。

Portal 名称必须使用小写字母、数字、下划线或连字符，并且以小写字母或数字开头。

如果希望调整 source storage 或 Git 配置，创建完成后使用 [`nb portal config`](./config.md)。

## 相关命令

- [`nb portal dev`](./dev.md)
- [`nb portal config`](./config.md)
- [`nb portal push`](./push.md)
- [`nb portal list`](./list.md)
