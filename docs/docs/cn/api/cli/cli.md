---
title: "NocoBase CLI"
description: "NocoBase CLI（nb 命令）完整命令参考：初始化、安装、环境管理、构建运行、插件管理、脚手架、API 操作。"
keywords: "NocoBase CLI,nb,命令行,命令参考,安装,环境管理,插件管理,API"
---

# NocoBase CLI

NocoBase CLI（`nb`）是用于在本地工作区初始化、连接和管理 NocoBase 应用的命令行工具。它可以帮你准备 NocoBase 应用、保存 CLI env 配置，并提供启动、停止、查看日志、升级和清理等日常管理命令，让 AI Agent 可以连接并使用 NocoBase。

CLI 支持两种常见的初始化方式：

- 连接已有的 NocoBase 应用，让 AI Agent 直接使用。
- 通过 Docker、npm 或 Git 安装一个新的 NocoBase 应用，并保存为 CLI env。

## 安装

```bash
npm install -g @nocobase/cli@beta
```

所有命令都支持 `nb <command> --help` 查看完整参数说明。详细安装流程请参阅[快速开始](../../ai/quick-start.md)。

## 核心概念

| 概念           | 说明                                                      |
| -------------- | --------------------------------------------------------- |
| **Workspace**  | 当前项目目录，CLI 会在这里保存 `.nocobase` 配置           |
| **Env**        | CLI 保存的一个 NocoBase 连接配置，`nb init` 中的 env name |
| **Source**     | 本地应用的来源，支持 `docker`、`npm` 和 `git`             |
| **Remote env** | 只保存已有 NocoBase 应用 API 连接的 env                   |

## 常用场景

### 安装新的 NocoBase 应用

使用浏览器表单完成交互式初始化：

```bash
nb init --ui
```

使用 Docker 安装（非交互式）：

```bash
nb init --env app1 --yes --source docker --version alpha
```

使用 npm 安装：

```bash
nb init --env app1 --yes --source npm --version alpha --app-port 13080
```

使用 Git 源码安装：

```bash
nb init --env app1 --yes --source git --version alpha
```

### 连接已有的 NocoBase 应用

```bash
nb env add app1 --base-url http://localhost:13000/api
```

`nb env add` 会在需要时自动进入认证流程。

### 启动、停止和查看日志

```bash
nb start --env app1     # 启动应用或 Docker 容器
nb stop --env app1      # 停止应用或 Docker 容器
nb logs --env app1      # 查看应用日志
nb ps                   # 查看所有 env 运行状态
```

### 升级

```bash
nb upgrade --env app1          # 更新源码/镜像并重启
nb upgrade --env app1 -s       # 跳过代码更新，仅重启
```

### 数据库管理

```bash
nb db ps                       # 查看数据库运行状态
nb db start --env app1         # 启动内置数据库
nb db stop --env app1          # 停止内置数据库
nb db logs --env app1          # 查看数据库日志
```

### 清理

```bash
nb down --env app1                    # 停止并移除容器（保留数据和配置）
nb down --env app1 --remove-data      # 同时删除 storage 和数据库数据
nb down --env app1 --remove-source    # 同时删除源码目录
nb down --env app1 --remove-env       # 同时删除 CLI env 配置
```

### 环境管理

```bash
nb env                         # 查看当前 env
nb env list                    # 列出所有 env
nb env use app1                # 切换当前 env
nb env auth app1               # 重新认证
nb env update app1             # 更新运行时命令元数据
```

### API 调用

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 -j    # 输出原始 JSON
```

## 配置文件

NocoBase CLI 的配置存储在 `.nocobase/` 目录下，分两个范围：

- **project** — 当前工作目录下的 `.nocobase/`
- **global** — `~/.nocobase/`（可通过环境变量 `NOCOBASE_CTL_HOME` 覆盖）

如果当前目录存在 `.nocobase/`，默认使用 project 范围；否则使用 global。

配置文件 `.nocobase/config.json` 的结构：

```json
{
  "currentEnv": "local",
  "envs": {
    "local": {
      "baseUrl": "http://localhost:13000/api",
      "auth": { "type": "token", "accessToken": "..." },
      "appRootPath": "./nocobase",
      "appPort": "13000",
      "dbDialect": "postgres"
    }
  }
}
```

运行时缓存存储在 `.nocobase/versions/<hash>/commands.json`，由 `nb env update` 自动生成和更新。


## 命令参考

以下是所有命令的完整参数说明。

## nb init

初始化工作目录。运行后会依次引导你完成 Skills 安装、NocoBase 安装或环境配置。

```bash
nb init
```

| 参数          | 类型    | 默认值    | 说明                                                                   |
| ------------- | ------- | --------- | ---------------------------------------------------------------------- |
| `--yes`, `-y` | boolean | `false`   | 跳过所有提示，使用默认配置（自动安装 Skills，全新安装 NocoBase）       |
| `--env`, `-e` | string  |           | 环境名称，非交互模式下必填                                             |
| `--source`    | string  |           | 来源：`docker`、`npm`、`git`                                           |
| `--version`   | string  |           | 版本：dist-tag、镜像标签或分支                                         |
| `--ui`        | boolean | `false`   | 打开浏览器可视化向导，不能和 `--yes` 同时使用                          |
| `--ui-host`   | string  | `0.0.0.0` | `--ui` 模式的绑定地址，需配合 `--ui` 使用                              |
| `--ui-port`   | integer | `0`       | `--ui` 模式的端口，`0` 表示系统自动分配，需配合 `--ui` 使用            |
| `--locale`    | string  |           | `--ui` 模式的界面语言，目前支持 `zh-CN` 和 `en-US`，需配合 `--ui` 使用 |

`nb init` 内部会按顺序执行以下步骤：

1. 询问是否安装 [NocoBase Skills](https://github.com/nocobase/skills)（默认安装）
2. 询问是否已有 NocoBase 应用
   - 如果没有：运行 `nb install` 全新安装
   - 如果有：运行 `nb env add` 配置已有环境

## nb install

安装 NocoBase 应用——包括数据库初始化、存储目录创建和管理员账号设置。

```bash
nb install -e local
```

| 参数                    | 类型    | 默认值            | 说明                                                   |
| ----------------------- | ------- | ----------------- | ------------------------------------------------------ |
| `--env`, `-e`           | string  |                   | 环境名称（必填），存储目录默认为 `./storage/<name>`    |
| `--yes`, `-y`           | boolean | `false`           | 跳过交互提示                                           |
| `--lang`, `-l`          | string  | `en-US`           | 安装时的语言                                           |
| `--force`, `-f`         | boolean | `false`           | 强制重新安装（清空数据库）                             |
| `--app-root-path`       | string  | `./nocobase`      | 应用根目录                                             |
| `--app-port`            | string  | `13000`           | 应用端口                                               |
| `--storage-path`        | string  | `./storage/<env>` | 存储目录                                               |
| `--root-username`, `-u` | string  |                   | 管理员用户名                                           |
| `--root-email`, `-m`    | string  |                   | 管理员邮箱                                             |
| `--root-password`, `-p` | string  |                   | 管理员密码                                             |
| `--root-nickname`, `-n` | string  |                   | 管理员昵称                                             |
| `--fetch-source`        | boolean | `false`           | 安装前先运行 `nb download` 下载源码                    |
| `--start-builtin-db`    | boolean | `false`           | 安装前先启动内置数据库                                 |
| `--db-dialect`          | string  | `postgres`        | 数据库类型：`postgres`、`mysql`、`mariadb`、`kingbase` |
| `--db-host`             | string  |                   | 数据库地址                                             |
| `--db-port`             | string  |                   | 数据库端口                                             |
| `--db-database`         | string  |                   | 数据库名                                               |
| `--db-user`             | string  |                   | 数据库用户                                             |
| `--db-password`         | string  |                   | 数据库密码                                             |

安装完成后会自动以守护进程模式启动应用（`nb start -e <env> -d`），并将环境信息写入 `.nocobase/config.json`。

## nb download

下载 NocoBase 源码或镜像，支持 npm、Docker 和 Git 三种方式。

```bash
nb download -s npm
```

| 参数                       | 类型    | 默认值                                     | 说明                                                          |
| -------------------------- | ------- | ------------------------------------------ | ------------------------------------------------------------- |
| `--source`, `-s`           | string  |                                            | 下载方式：`npm`、`docker`、`git`                              |
| `--version`, `-v`          | string  | `latest`                                   | 版本——npm 为 dist-tag 或版本号，docker 为镜像标签，git 为分支 |
| `--yes`, `-y`              | boolean | `false`                                    | 跳过交互提示                                                  |
| `--replace`, `-r`          | boolean | `false`                                    | 删除已有目标目录后重新下载                                    |
| `--output-dir`, `-o`       | string  | `./nocobase-<version>`                     | 输出目录                                                      |
| `--dev-dependencies`, `-D` | boolean | `false`                                    | npm：是否安装 devDependencies                                 |
| `--git-url`                | string  | `https://github.com/nocobase/nocobase.git` | git：远程仓库地址                                             |
| `--docker-registry`        | string  | `nocobase/nocobase`                        | docker：镜像名称（不含标签）                                  |
| `--docker-platform`        | string  |                                            | docker：平台，比如 `linux/amd64`、`linux/arm64`               |
| `--docker-save`            | boolean | `false`                                    | docker：是否将镜像保存为 `.tar` 文件                          |
| `--npm-registry`           | string  |                                            | npm / git：自定义 registry 地址                               |
| `--build`                  | boolean | `true`                                     | npm / git：下载后是否运行 `nb build`                          |
| `--build-dts`              | boolean | `false`                                    | npm / git：构建时是否生成 `.d.ts` 声明文件                    |

Git 模式的版本别名：`latest` → `main`，`beta` → `next`，`alpha` → `develop`。

## nb env

查看当前环境。

```bash
nb env
```

## nb env add

添加一个环境配置——指定 NocoBase 的 API 地址和认证方式，保存到 `.nocobase/config.json`。

```bash
nb env add my-app
```

| 参数                   | 类型    | 说明                                                          |
| ---------------------- | ------- | ------------------------------------------------------------- |
| `[name]`               | string  | 环境名称，交互模式下非必填                                    |
| `--scope`, `-s`        | string  | 配置存储范围：`project`（当前目录）或 `global`（全局）        |
| `--api-base-url`, `-u` | string  | API 地址，包含 `/api` 前缀，比如 `http://localhost:13000/api` |
| `--auth-type`, `-a`    | string  | 认证方式：`token` 或 `oauth`                                  |
| `--access-token`, `-t` | string  | API Key（`token` 认证方式使用）                               |
| `--verbose`            | boolean | 显示详细输出                                                  |

在终端交互模式下，缺少的参数会以提示方式引导填写。选择 `oauth` 认证方式时会自动运行 `nb env auth` 打开浏览器完成登录。

## nb env update

刷新环境的运行时信息——从 NocoBase 应用获取最新的 OpenAPI Schema 并更新本地缓存。

```bash
nb env update my-app
```

| 参数            | 类型    | 说明                                 |
| --------------- | ------- | ------------------------------------ |
| `[name]`        | string  | 环境名称，省略时使用当前环境         |
| `--scope`, `-s` | string  | 配置存储范围：`project` 或 `global`  |
| `--base-url`    | string  | 覆盖 API 地址（会持久化保存）        |
| `--token`, `-t` | string  | 覆盖 API Key（会持久化保存）         |
| `--role`        | string  | 角色覆盖（作为 `X-Role` 请求头发送） |
| `--verbose`     | boolean | 显示详细输出                         |

运行后会重新生成 `nb api` 下的动态命令，缓存到 `.nocobase/versions/<hash>/commands.json`。

## nb env list

列出所有已配置的环境。

```bash
nb env list
```

| 参数            | 类型   | 说明                                |
| --------------- | ------ | ----------------------------------- |
| `--scope`, `-s` | string | 配置存储范围：`project` 或 `global` |

输出表格包含：当前环境标记（`*`）、名称、API 地址、认证方式、运行时版本。

## nb env remove

移除一个环境配置。

```bash
nb env remove my-app
```

| 参数            | 类型    | 说明                                |
| --------------- | ------- | ----------------------------------- |
| `<name>`        | string  | 环境名称（必填）                    |
| `--force`, `-f` | boolean | 跳过确认直接删除                    |
| `--scope`, `-s` | string  | 配置存储范围：`project` 或 `global` |
| `--verbose`     | boolean | 显示详细输出                        |

## nb env auth

对指定环境执行 OAuth 认证——打开浏览器完成登录，自动获取并保存 token。

```bash
nb env auth my-app
```

| 参数            | 类型   | 说明                                |
| --------------- | ------ | ----------------------------------- |
| `<name>`        | string | 环境名称（必填）                    |
| `--scope`, `-s` | string | 配置存储范围：`project` 或 `global` |

内部使用 PKCE 流程：启动本地回调服务 → 打开浏览器授权 → 交换 token → 保存到配置文件。超时时间 5 分钟。

## nb env use

切换当前环境。

```bash
nb env use my-app
```

| 参数            | 类型   | 说明                                |
| --------------- | ------ | ----------------------------------- |
| `<name>`        | string | 环境名称（必填）                    |
| `--scope`, `-s` | string | 配置存储范围：`project` 或 `global` |

## nb build

构建 NocoBase 应用。

```bash
nb build
```

| 参数            | 类型     | 说明                                                   |
| --------------- | -------- | ------------------------------------------------------ |
| `[packages...]` | string[] | 指定要构建的包名，比如 `@nocobase/acl`，省略则构建全部 |
| `--cwd`, `-c`   | string   | 工作目录                                               |
| `--no-dts`      | boolean  | 不生成 `.d.ts` 声明文件                                |
| `--sourcemap`   | boolean  | 生成 sourcemap                                         |

## nb start

启动 NocoBase 应用或 Docker 容器。

```bash
nb start
```

| 参数                | 类型    | 说明                                |
| ------------------- | ------- | ----------------------------------- |
| `--env`, `-e`       | string  | 环境名称，省略时使用当前环境        |
| `--scope`, `-s`     | string  | 配置存储范围：`project` 或 `global` |
| `--port`, `-p`      | string  | 端口，覆盖环境配置中的端口          |
| `--daemon`, `-d`    | boolean | 以守护进程模式运行                  |
| `--instances`, `-i` | integer | 运行实例数                          |
| `--launch-mode`     | string  | 启动方式：`pm2` 或 `node`           |
| `--quickstart`      | boolean | 快速启动                            |

## nb stop

停止 NocoBase 应用或 Docker 容器。

```bash
nb stop
```

| 参数            | 类型   | 说明                                |
| --------------- | ------ | ----------------------------------- |
| `--env`, `-e`   | string | 环境名称，省略时使用当前环境        |
| `--scope`, `-s` | string | 配置存储范围：`project` 或 `global` |

## nb logs

查看应用日志。

```bash
nb logs app1
```

| 参数          | 类型   | 说明                         |
| ------------- | ------ | ---------------------------- |
| `[name]`      | string | 环境名称，省略时使用当前环境 |
| `--env`, `-e` | string | 环境名称（和位置参数二选一） |

## nb ps

查看环境运行状态。

```bash
nb ps
```

| 参数          | 类型   | 说明                         |
| ------------- | ------ | ---------------------------- |
| `--env`, `-e` | string | 环境名称，省略时显示所有环境 |

## nb down

停止并移除本地运行容器。数据、源码和环境配置默认保留，可通过参数选择性删除。

```bash
nb down app1
```

| 参数              | 类型    | 说明                                    |
| ----------------- | ------- | --------------------------------------- |
| `[name]`          | string  | 环境名称                                |
| `--env`, `-e`     | string  | 环境名称（和位置参数二选一）            |
| `--remove-data`   | boolean | 删除 storage 和数据库数据（需二次确认） |
| `--remove-source` | boolean | 删除 npm/Git 源码目录                   |
| `--remove-env`    | boolean | 删除 CLI 环境配置                       |

## nb dev

启动开发模式（支持热更新）。仅支持 npm/Git 来源的环境，Docker 环境请使用 `nb logs` 查看日志。

```bash
nb dev
```

| 参数              | 类型    | 说明             |
| ----------------- | ------- | ---------------- |
| `--env`, `-e`     | string  | 环境名称         |
| `--port`, `-p`    | string  | 端口             |
| `--db-sync`       | boolean | 同步数据库       |
| `--client`, `-c`  | boolean | 仅启动客户端     |
| `--server`, `-s`  | boolean | 仅启动服务端     |
| `--inspect`, `-i` | string  | Node.js 调试端口 |

## nb upgrade

更新源码或镜像并重启 NocoBase 应用。

```bash
nb upgrade
```

| 参数                       | 类型    | 说明                 |
| -------------------------- | ------- | -------------------- |
| `--env`, `-e`              | string  | 环境名称             |
| `--skip-code-update`, `-s` | boolean | 跳过代码更新，仅重启 |

## nb pm list

列出所有已安装的插件。

```bash
nb pm list
```

## nb pm enable

启用一个或多个插件。

```bash
nb pm enable @nocobase/plugin-sample
```

| 参数            | 类型     | 说明                                 |
| --------------- | -------- | ------------------------------------ |
| `<packages...>` | string[] | 插件包名（必填），支持多个，空格分隔 |

## nb pm disable

停用一个或多个插件。

```bash
nb pm disable @nocobase/plugin-sample
```

| 参数            | 类型     | 说明                                 |
| --------------- | -------- | ------------------------------------ |
| `<packages...>` | string[] | 插件包名（必填），支持多个，空格分隔 |

## nb scaffold plugin

生成插件脚手架代码。

```bash
nb scaffold plugin @nocobase-example/plugin-hello
```

| 参数                     | 类型    | 说明                         |
| ------------------------ | ------- | ---------------------------- |
| `<pkg>`                  | string  | 插件包名（必填）             |
| `--force-recreate`, `-f` | boolean | 强制重新创建（覆盖已有文件） |

## nb scaffold migration

生成数据库迁移脚本脚手架。

```bash
nb scaffold migration add-status-field --pkg @nocobase/plugin-sample
```

| 参数     | 类型   | 说明                                               |
| -------- | ------ | -------------------------------------------------- |
| `<name>` | string | 迁移脚本名称（必填）                               |
| `--pkg`  | string | 所属插件包名（必填）                               |
| `--on`   | string | 执行时机：`beforeLoad`、`afterSync` 或 `afterLoad` |

## nb api resource

对任意 NocoBase 数据表执行通用 CRUD 操作。所有 `nb api resource` 子命令共享以下全局参数：

| 参数                  | 类型    | 说明                                                 |
| --------------------- | ------- | ---------------------------------------------------- |
| `--base-url`          | string  | NocoBase API 地址，比如 `http://localhost:13000/api` |
| `--env`, `-e`         | string  | 环境名称                                             |
| `--token`, `-t`       | string  | API Key                                              |
| `--role`              | string  | 角色覆盖（`X-Role` 请求头）                          |
| `--verbose`           | boolean | 显示详细输出                                         |
| `--json-output`, `-j` | boolean | 输出原始 JSON（默认开启）                            |

### nb api resource list

列出资源记录。

```bash
nb api resource list --resource users --page 1 --page-size 20
```

| 参数            | 类型     | 说明                                             |
| --------------- | -------- | ------------------------------------------------ |
| `--resource`    | string   | 资源名称（必填），比如 `users`、`posts.comments` |
| `--data-source` | string   | 数据源，默认 `main`                              |
| `--source-id`   | string   | 关联资源的源记录 ID                              |
| `--filter`      | string   | 过滤条件，JSON 格式                              |
| `--fields`      | string[] | 查询字段，可重复指定                             |
| `--appends`     | string[] | 追加关联字段，可重复指定                         |
| `--except`      | string[] | 排除字段，可重复指定                             |
| `--sort`        | string[] | 排序字段，比如 `-createdAt` 表示倒序，可重复指定 |
| `--page`        | integer  | 页码                                             |
| `--page-size`   | integer  | 每页条数                                         |
| `--paginate`    | boolean  | 是否分页                                         |

### nb api resource get

获取单条记录。

```bash
nb api resource get --resource users --filter-by-tk 1
```

| 参数             | 类型     | 说明                |
| ---------------- | -------- | ------------------- |
| `--resource`     | string   | 资源名称（必填）    |
| `--filter-by-tk` | string   | 按主键筛选          |
| `--data-source`  | string   | 数据源              |
| `--source-id`    | string   | 关联资源的源记录 ID |
| `--fields`       | string[] | 查询字段            |
| `--appends`      | string[] | 追加关联字段        |
| `--except`       | string[] | 排除字段            |

### nb api resource create

创建记录。

```bash
nb api resource create --resource users --values '{"username":"test","email":"test@example.com"}'
```

| 参数            | 类型     | 说明                        |
| --------------- | -------- | --------------------------- |
| `--resource`    | string   | 资源名称（必填）            |
| `--values`      | string   | 记录数据，JSON 格式（必填） |
| `--data-source` | string   | 数据源                      |
| `--source-id`   | string   | 关联资源的源记录 ID         |
| `--whitelist`   | string[] | 允许写入的字段白名单        |
| `--blacklist`   | string[] | 禁止写入的字段黑名单        |

### nb api resource update

更新记录。

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"新昵称"}'
```

| 参数                          | 类型     | 说明                        |
| ----------------------------- | -------- | --------------------------- |
| `--resource`                  | string   | 资源名称（必填）            |
| `--values`                    | string   | 更新数据，JSON 格式（必填） |
| `--filter-by-tk`              | string   | 按主键筛选                  |
| `--filter`                    | string   | 过滤条件，JSON 格式         |
| `--data-source`               | string   | 数据源                      |
| `--source-id`                 | string   | 关联资源的源记录 ID         |
| `--whitelist`                 | string[] | 允许写入的字段白名单        |
| `--blacklist`                 | string[] | 禁止写入的字段黑名单        |
| `--update-association-values` | string[] | 同时更新关联数据            |
| `--force-update`              | boolean  | 强制更新                    |

### nb api resource destroy

删除记录。

```bash
nb api resource destroy --resource users --filter-by-tk 1
```

| 参数             | 类型   | 说明                |
| ---------------- | ------ | ------------------- |
| `--resource`     | string | 资源名称（必填）    |
| `--filter-by-tk` | string | 按主键筛选          |
| `--filter`       | string | 过滤条件，JSON 格式 |
| `--data-source`  | string | 数据源              |
| `--source-id`    | string | 关联资源的源记录 ID |

### nb api resource query

聚合查询。

```bash
nb api resource query --resource orders --measures '[{"field":"amount","aggregation":"sum"}]'
```

| 参数           | 类型    | 说明             |
| -------------- | ------- | ---------------- |
| `--resource`   | string  | 资源名称（必填） |
| `--measures`   | string  | 度量，JSON 数组  |
| `--dimensions` | string  | 维度，JSON 数组  |
| `--orders`     | string  | 排序，JSON 数组  |
| `--filter`     | string  | 过滤条件         |
| `--having`     | string  | 聚合后过滤条件   |
| `--limit`      | integer | 返回条数上限     |
| `--offset`     | integer | 跳过条数         |
| `--timezone`   | string  | 时区             |

## nb api 动态命令

除了 `nb api resource` 之外，`nb api` 下还有一组根据 NocoBase 应用的 OpenAPI Schema 动态生成的命令。这些命令在你首次运行 `nb env add` 或 `nb env update` 时自动生成并缓存。

可用的命令分组：

| 命令                     | 说明                               |
| ------------------------ | ---------------------------------- |
| `nb api acl`             | 权限管理——角色、资源权限和操作权限 |
| `nb api api-keys`        | API Key 管理                       |
| `nb api app`             | 应用管理                           |
| `nb api authenticators`  | 认证管理——密码、短信、SSO 等       |
| `nb api data-modeling`   | 数据建模——数据源、数据表和字段     |
| `nb api file-manager`    | 文件管理——存储服务和附件           |
| `nb api flow-surfaces`   | 页面编排——页面、区块、字段和操作   |
| `nb api system-settings` | 系统设置——标题、Logo、语言等       |
| `nb api theme-editor`    | 主题管理——颜色、尺寸和主题切换     |
| `nb api workflow`        | 工作流——自动化流程管理             |

每个分组下的具体命令取决于你连接的 NocoBase 应用版本和已启用的插件。运行 `nb api <topic> --help` 查看当前可用的子命令。

所有动态命令共享以下全局参数：

| 参数                  | 类型    | 说明                        |
| --------------------- | ------- | --------------------------- |
| `--base-url`          | string  | NocoBase API 地址           |
| `--env`, `-e`         | string  | 环境名称                    |
| `--token`, `-t`       | string  | API Key                     |
| `--role`              | string  | 角色覆盖（`X-Role` 请求头） |
| `--verbose`           | boolean | 显示详细输出                |
| `--json-output`, `-j` | boolean | 输出原始 JSON               |

带请求体的命令还支持 `--body`（JSON 字符串）或 `--body-file`（JSON 文件路径），两者互斥。

## 相关链接

- [快速开始](../../ai/quick-start.md) — 安装引导和使用入门
- [环境变量](../app/env) — NocoBase 支持的全局环境变量
- [AI 搭建](../../ai-builder/index.md) — 用 AI 从零搭建 NocoBase 应用
- [插件开发](../../plugin-development/index.md) — 学习如何创建和发布自定义插件
