# 旧安装方式如何接入 AI 与迁移到 CLI

如果你现在还是按旧文档使用 Docker、`create-nocobase-app` 或 Git 源码方式安装和维护 NocoBase，也可以继续这样使用，不需要为了接入 AI 立刻重装应用。

这篇页主要帮你先判断路线：

- 继续沿用原来的安装和升级方式
- 让现有应用先接入 AI agent
- 迁移到基于 CLI 的新方式

默认推荐先看清楚自己属于哪一种，再进入对应文档。这样更稳，也更不容易误操作生产环境。

## 我该选哪种方式

| 如果你现在想要…… | 默认怎么做 |
| --- | --- |
| 继续按原来的方式安装、升级和维护应用 | 直接继续沿用旧方式，先看下面的相关文档入口 |
| 让一个已经稳定运行的旧应用接入 AI agent | 默认先用远程连接方式接入，风险最低 |
| 后续统一用 `nb app`、`nb env`、`nb source` 管理应用 | 新建一个 CLI 应用，再把旧数据迁移过去 |

## 继续使用原安装方式

如果你已经习惯之前的安装方式，完全可以继续使用。安装、升级和环境变量配置仍然按原来的文档走就行。

### 安装 NocoBase

- [Docker 安装](/get-started/installation/docker)
- [create-nocobase-app 安装](/get-started/installation/create-nocobase-app)
- [Git 源码安装](/get-started/installation/git)
- [环境变量](/get-started/installation/env)

### 升级 NocoBase

- [Docker 安装的升级](/get-started/upgrading/docker)
- [create-nocobase-app 安装的升级](/get-started/upgrading/create-nocobase-app)
- [Git 源码安装的升级](/get-started/upgrading/git)

## 方式一：先让现有应用接入 AI agent

如果你的旧应用已经稳定运行，默认先用这个方式。

这种方式的重点，是先把现有应用通过远程连接方式接入 CLI 和 AI agent。这样做风险最低，因为它不会直接接管你现在的安装、启动、停止和升级流程。

不过也要先明确边界：

- 这种方式不具备 `nb app` 相关能力
- 它不会替你接管旧应用的运行时管理
- 但 AI 搭建相关能力可以正常使用

也就是说，如果你当前最在意的是"先把 AI 接上"，而不是"马上把整个运行管理体系切到 CLI"，默认就先走这条路。

连接已有应用时，可以这样初始化一个 CLI env：

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

如果后续需要重新认证，可以执行：

```bash
nb env auth app1
```

如果你接下来只是想开始用 AI 搭建能力，继续看 [AI 搭建快速开始](/ai-builder/) 就行。

## 方式二：迁移到 CLI

如果你希望后续统一用 `nb app`、`nb env`、`nb source` 管理本地应用，那么当前更稳妥的做法，不是直接接管现有应用，而是新建一个应用，再把旧应用的数据迁移过去。

原因也很简单：目前"接管现有应用"的能力还在开发中。

所以在当下，默认推荐的迁移路线是：

1. 先新建一个 CLI 应用
2. 再把旧应用的数据库、`storage` 和环境变量迁过去
3. 在新应用上验证运行、升级和 AI 能力都正常后，再决定是否切换生产环境

先创建新的 CLI env：

```bash
nb init --yes --env app1
```

迁移前，建议先确认这些内容已经准备好：

1. 已备份数据库
2. 已备份 `storage` 目录
3. 已记录旧应用的关键环境变量，比如 `APP_KEY`、`TZ`、`DB_*`、`DB_UNDERSCORED`

默认先迁移测试环境就够了。只有当你已经确认备份、环境变量和数据库配置都没问题时，再迁移生产环境。

## 下一步去哪里看

- 如果你准备按新的方式安装和管理应用，继续看 [使用 CLI 安装（推荐）](./cli.md)
- 如果你只是继续沿用原来的安装方式，直接回到上面的安装和升级文档入口即可
