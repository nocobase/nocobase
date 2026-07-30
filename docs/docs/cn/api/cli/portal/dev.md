---
title: "nb portal dev"
description: "nb portal dev 命令参考：启动指定 Portal 工作区的开发模式。"
keywords: "nb portal dev,NocoBase CLI,Portal,开发模式,本地开发"
---

# nb portal dev

启动指定 Portal 工作区的开发模式。通常在执行 [`nb portal create`](./create.md) 或 [`nb portal pull`](./pull.md) 后使用。

执行时会刷新工作区里的 `.env` 和 `.env.local`，然后在 Portal 工作区中运行 `pnpm dev`。

## 用法

```bash
nb portal dev <portal> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--dir` | string | Portal 工作区目录，默认是当前目录 |
| `<portal>` | string | Portal 名称或 slug |
| `--env`, `-e` | string | CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

## 示例

启动当前 env 中的 Portal 开发模式：

```bash
nb portal dev customer
```

启动指定 env 中的 Portal 开发模式：

```bash
nb portal dev customer --env dev --yes
```

## 说明

`dev` 使用本地 Portal 工作区启动开发服务。它不会创建 Portal 记录，也不会拉取远端源码；如果本地工作区不存在，先使用 [`nb portal create`](./create.md) 或 [`nb portal pull`](./pull.md)。

工作区必须包含 `package.json`。`ssh` env 当前暂不支持启动 Portal 开发模式。

## 相关命令

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
