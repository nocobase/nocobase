---
title: "部署与源码管理"
description: "AI Portal 的开发、推送、部署完整流程，以及 source storage 的两种模式和多环境部署方式。"
keywords: "AI Portal,部署,source storage,Git,nb portal deploy,nb portal push,多环境"
---

# 部署与源码管理

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 模式开发快速开始](./index.md) 跑通了第一个 Portal。

:::

Portal 的源码有三个位置：本地源码目录、source storage 和已部署的产物。`nb portal` 负责在这三者之间同步。

## 完整生命周期

日常开发的循环是这样的：

```text
dev（本地开发）→ push（推送源码）→ deploy（构建部署）
```

其中：

1. `nb portal dev <portal>` — 启动本地开发服务，改代码看效果
2. `nb portal push <portal>` — 把本地源码变更推送到 source storage
3. `nb portal deploy <portal>` — 构建并部署，让改动对用户生效

如果你接手的是同事已经建好的 Portal，或者换了台机器，先拉到本地再开发：

```bash
nb portal list                 # 看看有哪些 Portal
nb portal pull customer        # 拉取源码到本地
nb portal dev customer         # 开始开发
```

`pull` 拉完会自动执行 `pnpm install`。在 CI 里或者你想自己装依赖，可以加 `--no-install` 跳过。

## 新增一个 Portal

一个应用可以有多个 Portal，页面和权限彼此独立，数据则是共用的。比如内部员工一个入口、外部客户一个入口：

```bash
nb portal create customer
```

创建时会基于 `@nocobase/portal-template-default` 模板生成源码，写入 `.env`、`.env.local` 和 `portal.config.json`，然后自动安装依赖。

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

Portal 名称只能用小写字母、数字、下划线和连字符，并且以小写字母或数字开头。

## source storage

创建 Portal 时可以选择源码保存在哪里：

| 方式 | 说明 | 什么时候用 |
| --- | --- | --- |
| `nocobase` | 默认方式，源码由 NocoBase 侧的 source storage 管理 | 快速起步、一个人开发、不需要代码评审 |
| `git` | 源码保存到指定的 Git 仓库 | 团队协作、需要代码评审、要接 CI |

默认的 `nocobase` 起步最快，不用先准备仓库。不过它没有版本历史，改错了只能整个覆盖回退。**如果这个 Portal 会长期迭代，建议早点切到 Git。**

### 创建时就用 Git

```bash
nb portal create customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git
```

`--git-branch` 省略时用 `main`，`--git-path` 省略时用仓库根目录。

### 后续切换到 Git

已经在用默认存储的 Portal 也可以随时切换：

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` 会更新本地的 `portal.config.json` 并同步到远端 Portal 记录，之后的 `push` 就会走 Git 了。

一个仓库放一个 Portal 时，`--git-path` 用默认的仓库根目录就行。只有当你想把多个 Portal 放进同一个仓库，才需要指定子目录：

```bash
nb portal config customer --git-path portals/customer
```

## env 类型的差异

`nb portal` 在不同 env 下的同步行为不一样：

| env 类型 | 说明 |
| --- | --- |
| `local` | 本地源码目录和应用 storage 在同一台机器上，用默认 `nocobase` 存储时 `pull` / `push` 通常不需要额外同步 |
| `docker` | 通过 Docker volume 共享，同上 |
| `http` | 通过 API 同步，`pull` / `push` 会下载或上传源码归档 |

`ssh` env 当前还不支持 Portal 管理。

## 多环境部署

同一个 Portal 可以部署到不同环境，用 `--env` 指定目标：

```bash
nb portal deploy customer --env prod --yes
```

`--yes` 用于跳过交互确认。当你显式传入的 `--env` 和当前 env 不一致时，CLI 默认会停下来问一句；在脚本或 CI 里执行时记得带上 `--yes`，否则命令会卡在确认环节。

跨环境的数据表结构和配置发布，请参阅 [发布管理](../ai-builder/publish.md)。

## 访问路径

部署完成后，Portal 的访问路径是：

```text
<appPublicPath>/x/<portal>/
```

如果是子应用下的 Portal：

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

`/x/` 这个前缀是 AI Portal 专用的，无代码 Portal 用的是 `/v/`。

## 删除 Portal

```bash
nb portal destroy customer
```

这个操作会同时删除 Portal 记录和本地源码目录，执行前确认源码已经推送或者确实不需要了。

## 相关链接

- [AI 模式开发快速开始](./index.md) — 跑通第一个由 AI 编写的前端入口
- [与 AI Agent 协作搭建](./agent-workflow.md) — 用自然语言驱动 AI 编写页面
- [项目结构与技术栈](./project-structure.md) — 构建命令和环境变量说明
- [发布管理](../ai-builder/publish.md) — 跨环境发布数据表结构和配置
- [`nb portal` 命令参考](../api/cli/portal/index.md) — 所有 Portal 命令的完整参数说明
- [`nb portal create`](../api/cli/portal/create.md) — 创建 Portal 的全部参数
- [`nb portal config`](../api/cli/portal/config.md) — 调整 source storage 配置
- [`nb portal push`](../api/cli/portal/push.md) — 推送源码到 source storage
- [`nb portal deploy`](../api/cli/portal/deploy.md) — 构建并部署 Portal
- [`nb portal pull`](../api/cli/portal/pull.md) — 从 source storage 拉取源码
- [`nb portal destroy`](../api/cli/portal/destroy.md) — 删除 Portal 记录和本地源码目录
