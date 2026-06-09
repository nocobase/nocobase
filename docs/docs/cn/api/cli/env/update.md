---
title: "nb env update"
description: "nb env update 命令参考：更新已保存的 API、认证、源码、应用和数据库配置。"
keywords: "nb env update,NocoBase CLI,env 配置,认证,数据库,源码"
---

# nb env update

`nb env update` 用来更新一个已保存 env 的配置。你可以用它调整 API 地址、认证方式、源码来源、本地应用路径、公开访问路径、端口、数据库参数等。更新完成后，CLI 会根据变更自动处理后续事宜。

如果你不带配置参数，CLI 也会按当前 env 状态做一次重新同步。

## 用法

```bash
nb env update [name] [flags]
```

## 通用参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 要更新的已配置环境名称；省略时使用当前 env。 |
| `--verbose` | boolean | 显示详细进度。 |

## API 与认证参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | NocoBase API 地址，包含 `/api` 前缀。 |
| `--auth-type` | string | 认证方式：`basic`、`token`、`oauth`。 |
| `--access-token`, `--token`, `-t` | string | `token` 认证使用的 API key 或 access token。保存后会把认证方式切到 `token`。 |
| `--username` | string | `basic` 认证保存的用户名。只能在当前 env 使用 `basic` 认证，或同时传入 `--auth-type basic` 时使用。 |

## 源码与下载参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--source` | string | 已保存的应用来源：`docker`、`git`、`local`、`npm`。 |
| `--download-version`, `--version` | string | 已保存的版本参数：Docker tag、npm 包版本或 Git ref。 |
| `--docker-registry` | string | Docker 镜像仓库名，不含 tag。 |
| `--docker-platform` | string | Docker 镜像平台：`auto`、`linux/amd64`、`linux/arm64`。 |
| `--git-url` | string | Git 仓库地址。 |
| `--npm-registry` | string | npm/Git 下载和依赖安装使用的 registry。 |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | npm/Git 安装时是否安装 devDependencies。 |
| `--build` / `--no-build` | boolean | npm/Git 下载后是否自动构建。 |
| `--build-dts` / `--no-build-dts` | boolean | 构建时是否生成 TypeScript 声明文件。 |

## 应用参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--app-path` | string | 应用目录。现在默认推荐优先用这个参数管理本地目录。 |
| `--app-public-path` | string | 应用公开访问路径（`APP_PUBLIC_PATH`），比如 `/` 或 `/nocobase/`。 |
| `--app-port` | string | 应用 HTTP 端口。 |
| `--cdn-base-url` | string | 客户端静态资源 CDN 基地址（`CDN_BASE_URL`）。 |
| `--app-key` | string | 应用密钥（`APP_KEY`）。 |
| `--timezone` | string | 应用时区（`TZ`）。 |

## 数据库参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | 是否使用 CLI 托管的内置数据库。 |
| `--db-dialect` | string | 数据库类型：`postgres`、`mysql`、`mariadb`、`kingbase`。 |
| `--builtin-db-image` | string | 内置数据库容器镜像。 |
| `--db-host` | string | 数据库主机地址。 |
| `--db-port` | string | 数据库端口。 |
| `--db-database` | string | 数据库名称。 |
| `--db-user` | string | 数据库用户名。 |
| `--db-password` | string | 数据库密码。 |
| `--db-schema` | string | 数据库 schema。通常只有 PostgreSQL 会用到。 |
| `--db-table-prefix` | string | 数据表前缀。 |
| `--db-underscored` / `--no-db-underscored` | boolean | 数据表名和字段名是否使用下划线风格。 |

## 配置清理参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--unset` | string[] | 按 flag 的规范名清空一个或多个已保存字段。支持重复传入，也支持逗号分隔，比如 `--unset git-url,username`。 |

## 说明

:::tip

如果你只是想让 CLI 按当前 env 的最新状态重新同步，直接执行 `nb env update` 或 `nb env update <name>` 就够了，不需要额外参数。

:::

- 更新完成后，CLI 会根据这次变更自动处理需要的后续同步
- 其他参数只会更新已保存的 env 配置，不会自动重启应用，也不会自动替换本地源码或 Docker 镜像
- 修改 `app-path`、`app-port`、`timezone`、`db-*` 这类配置后，CLI 通常会提示你后续执行 `nb app restart --env <name>`；如果变更涉及 CLI 托管的内置数据库，则会提示使用 `nb app restart --env <name> --with-db`
- 修改 `app-port`、`app-public-path`、`cdn-base-url` 这类会影响反向代理渲染结果的配置后，如果你已经在用 `nb proxy nginx` 或 `nb proxy caddy`，通常还要重新执行对应的 `generate`
- 更新 `source`、`download-version`、`docker-registry`、`git-url`、`npm-registry` 这类源码设置时，只会改保存值。现有本地源码、依赖和镜像不会自动替换
- `--access-token` 不能和 `--auth-type basic` 或 `--auth-type oauth` 一起使用
- 同一个字段不能同时用 `--unset` 和显式赋值。比如不能同时写 `--unset git-url` 和 `--git-url ...`
- 如果你把认证方式切到 `basic` 或 `oauth`，或者清空了 token，后续通常还要执行 `nb env auth <name>`

## 示例

```bash
# 让当前 env 按最新状态重新同步
nb env update

# 让指定 env 按最新状态重新同步
nb env update prod

# 更新 API 地址
nb env update prod --api-base-url http://localhost:13000/api

# 更新 token，并把认证方式切到 token
nb env update prod --access-token <token>

# 切到 basic 认证，只保存用户名，稍后再执行 nb env auth
nb env update prod --auth-type basic --username admin

# 调整源码来源和版本，只更新已保存配置
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# 调整应用端口和时区，稍后再重启应用
nb env update local --app-port 13080 --timezone Asia/Shanghai

# 调整应用公开访问路径，改完后通常还要重新生成 proxy
nb env update local --app-public-path /nocobase/

# 保存客户端静态资源的 CDN 基地址
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# 清空已保存的字段
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## 相关命令

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
