# 从旧方式迁移到 CLI

如果你现在还是按旧文档使用 Docker、`create-nocobase-app` 或 Git 源码方式安装和维护 NocoBase，可以逐步切换到基于 CLI 的安装和管理方式。

默认先迁移测试环境就够了。只有当你已经确认备份、环境变量和数据库配置都没问题时，再迁移生产环境。

## 迁移前先确认

1. 已备份数据库。
2. 已备份 `storage` 目录。
3. 已记录旧应用的关键环境变量，比如 `APP_KEY`、`TZ`、`DB_*`、`DB_UNDERSCORED`。

## 方式一：连接已有应用

如果你的旧应用已经稳定运行，默认先用这个方式。风险最低，CLI 只保存连接信息，不会直接接管旧应用的启动、停止和升级流程。

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

## 方式二：新建 CLI env 后迁移

如果你希望后续统一用 `nb app`、`nb env`、`nb source` 管理本地应用，可以新建一个 CLI env，再把旧应用的数据和配置迁过去。

先创建新的 CLI env：

```bash
nb init --yes --env app1
```

创建完成后，再根据你的旧安装方式迁移数据库、`storage` 和环境变量配置。

## 下一步去哪里看

- 如果你只是想开始用新的 CLI 方式安装和维护应用，继续看 [使用 CLI 安装（推荐）](./cli.md)
- 如果你需要完整的迁移步骤，继续看 [安装与升级迁移指南：使用 NocoBase CLI](/ai/install-upgrade-migration#从旧方式迁移到-cli)
