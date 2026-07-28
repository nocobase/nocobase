---
title: "nb portal deploy"
description: "nb portal deploy 命令参考：构建并部署指定 Portal 工作区。"
keywords: "nb portal deploy,NocoBase CLI,Portal,构建,部署"
---

# nb portal deploy

构建并部署指定 Portal 工作区。通常在本地开发完成，并且需要把 Portal 更新到目标 env 时使用。

执行时会先刷新工作区里的 `.env` 和 `.env.local`，再运行 `pnpm build`。构建产物需要包含 `dist/index.html`。

## 用法

```bash
nb portal deploy <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<portal>` | string | Portal 名称或 slug |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

## 示例

部署当前 env 中的 Portal：

```bash
nb portal deploy customer
```

部署指定 env 中的 Portal：

```bash
nb portal deploy customer --env dev --yes
```

## 说明

`deploy` 面向已经存在的 Portal 工作区。如果本地还没有工作区，先使用 [`nb portal create`](./create.md) 创建，或者使用 [`nb portal pull`](./pull.md) 从 source storage 拉取。

对于 `local` 和 `docker` env，部署会同步 Portal 记录，并直接使用本地或 volume 中的 `dist` 目录。对于 `http` env，CLI 会把 `dist` 打包上传到目标 NocoBase，再同步 Portal 记录。

部署时会读取本地工作区的 `portal.config.json`，并把源码配置同步到远端 Portal 记录。

## 相关命令

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
