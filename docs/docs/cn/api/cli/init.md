---
title: "nb init"
description: "nb init 命令参考：新安装、接管本机已有应用或连接远程应用，并保存为 CLI env。"
keywords: "nb init,NocoBase CLI,初始化,env,Docker,npm,Git,远程连接"
---

# nb init

初始化当前工作区，让 coding agent 可以连接和使用 NocoBase。

`nb init` 可以新安装一个本地 NocoBase 应用，也可以保存一个已有应用的连接信息。

另外，`nb init` 默认还会同步 NocoBase AI coding skills。只有当你已经自行管理 skills，或者在 CI、离线环境里运行时，才需要加 `--skip-skills`。

## 用法

```bash
nb init [flags]
```

## 交互方式

`nb init` 支持三种交互方式：

- `nb init`：在终端里一步一步完成引导
- `nb init --ui`：打开本地浏览器表单，用可视化向导完成 setup
- `nb init --yes --env app1`：跳过提示，直接使用 flags；没有显式传入的参数会按默认值处理

`--yes` 模式适合脚本、CI/CD 或其他非交互场景。这个模式下，`--env <envName>` 是必填的。通常来说，它会默认新安装一个本地应用；如果你没有指定 `--source`，会默认使用 `docker` 作为安装来源。

## 恢复中断的初始化

安装类流程会先保存 env 配置，再执行下载、数据库和应用安装。如果中途失败，可以继续：

```bash
nb init --env app1 --resume
```

`--resume` 只适用于已经保存过 env 配置的初始化流程，并且必须显式传入 `--env`。

## 先准备 env，稍后再安装应用

`--prepare-only` 适用于需要先准备 env、再激活 license、最后再安装并启动应用的场景。

如果你想先保存 env 配置、准备数据库，并暂时不下载依赖、不执行应用安装和首次启动，可以使用：

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

这个模式适用于本地安装类流程，包括 `--ui` 向导；但不适用于远程连接流程。CLI 会把当前 env 保存为 prepared 状态，后续你可以按下面的方式继续：

```bash
nb license activate --env app1
nb app start --env app1
```

之后 `nb app start` 会完成首次安装，并把 env 从 prepared 状态切换为普通的 installed 状态。

## 安装目录说明

可以通过 `nb env info app1 --field app.appPath` 查看完整路径。

默认情况下，CLI 会在 `app-path` 下按下面这套约定组织本地文件：

```text
<app-path>/
├── .nb/      # CLI 为当前 env 保存的元数据，比如 hooks.mjs
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

通常来说：

- `.nb/` 用来保存 CLI 管理的元数据。通过 `--hook-script` 传入的脚本会复制到 `<app-path>/.nb/hooks.mjs`，后续 `nb app upgrade` 和本地 source 恢复会复用它
- `source/` 主要对应 npm / Git env 的本地应用目录。对于 Docker env，CLI 也会保留这套默认路径推导，不过大多数时候你不需要手动关心它。需要特别注意的是，升级应用时，`source/` 目录会被删除后重新下载，不要把需要保留的文件放在这里
- `storage/` 用来放运行时数据，比如内置数据库数据、插件、日志等内容
- `.env` 是可选的应用环境变量文件。只有当你需要自定义环境变量时，才需要在 `<app-path>/.env` 里添加它；如果这个文件存在，Docker、npm 和 Git 这几种安装来源默认都会读取它

这表示的是 CLI 的默认目录约定。不同安装来源、不同插件和不同运行阶段，实际生成的目录内容可能会不完全一样。

## 注意事项

:::warning 注意

- `--ui` 不能和 `--yes` 一起使用
- `--ui` 也不能和 `--resume` 一起使用
- `--ui-host`、`--ui-port` 只能和 `--ui` 一起使用
- `--skip-auth` 不能和 `--access-token` 或 `--token` 一起使用

:::

## 按 Steps 快速定位

不同 setup 路径看到的 Steps 不完全一样。比如连接已有应用时，通常只会用到 `Getting started` 和 `Remote connection`。

如果你是跟着本地 UI 向导一步一步操作，可以先按下面这张表快速定位：

| Step | 主要关注的参数 |
| --- | --- |
| `Getting started` | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume` |
| `App environment` | `--lang`、`--app-path`、`--app-port`、`--force` |
| `App source and version` | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts`、`--hook-script` |
| `Configure the database` | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored` |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname` |
| `Remote connection` | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth` |

## 参数

参数比较多，按使用场景拆开看会更清楚。

下面的“默认值”表示你省略该参数时，`nb init` 通常会采用的值或行为。

### 基础与交互

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `--yes`, `-y` | boolean | `false` | 跳过提示，使用 flags 和默认值 |
| `--env`, `-e` | string | 无 | 本次初始化保存的 env 名称，`--yes` 和 `--resume` 模式必填 |
| `--ui` | boolean | `false` | 打开本地浏览器向导，不能和 `--yes`、`--resume` 一起使用 |
| `--verbose` | boolean | `false` | 显示详细命令输出 |
| `--skip-skills` | boolean | `false` | 跳过同步 NocoBase AI coding skills |
| `--ui-host` | string | `127.0.0.1` | `--ui` 向导页面 URL 中展示给浏览器访问的 host；本地服务固定监听 `0.0.0.0` |
| `--ui-port` | integer | `0` | `--ui` 本地服务端口，`0` 表示自动分配 |
| `--locale` | string | 跟随 `NB_LOCALE`、CLI 配置或系统 locale；最终回退 `en-US` | CLI 提示和本地 setup UI 语言：`en-US` 或 `zh-CN` |
| `--resume` | boolean | `false` | 继续上一次未完成的初始化，复用已保存的 workspace env config |
| `--prepare-only` | boolean | `false` | 保存并准备本地安装 env，包括 `--ui` 流程，但暂时不安装也不启动应用 |

### 连接已有应用

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `--api-base-url`, `-u` | string | 无 | API 根地址，必须包含 `/api` 前缀 |
| `--auth-type`, `-a` | string | `oauth` | 认证方式：`basic`、`token` 或 `oauth`。通常来说默认用 `oauth` 就行；某些 CI/CD 场景里也可以用 `basic` |
| `--access-token`, `-t` | string | 无 | `token` 认证使用的 API key 或 access token |
| `--username` | string | 无 | `basic` 认证使用的用户名 |
| `--password` | string | 无 | `basic` 认证使用的密码 |
| `--skip-auth` | boolean | `false` | 先保存 env 和认证方式，稍后再通过 `nb env auth` 完成登录 |

### 本地安装基础参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `--lang`, `-l` | string | `en-US` | 新安装应用的界面语言 |
| `--force`, `-f` | boolean | `false` | 重新配置已有 env，并在需要时替换冲突的运行资源 |
| `--app-path` | string | `./<envName>/` | 本地 npm/Git 应用目录 |
| `--app-port` | string | `13000` | 本地应用 HTTP 端口；`--yes` 模式会自动选择可用端口 |
| `--root-username` | string | `nocobase`（`--yes` 模式） | 初始管理员用户名 |
| `--root-email` | string | `admin@nocobase.com`（`--yes` 模式） | 初始管理员邮箱 |
| `--root-password` | string | `admin123`（`--yes` 模式） | 初始管理员密码 |
| `--root-nickname` | string | `Super Admin`（`--yes` 模式） | 初始管理员显示名 |

### 数据库参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | `true` | 是否创建并连接 CLI 托管的内置数据库 |
| `--db-dialect` | string | `postgres` | 数据库类型：`postgres`、`mysql`、`mariadb`、`kingbase` |
| `--builtin-db-image` | string | 跟随 `--db-dialect` 和 locale | 内置数据库容器镜像 |
| `--db-host` | string | 内置数据库时为 `postgres`；外部数据库时为 `127.0.0.1` | 数据库主机地址 |
| `--db-port` | string | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321` | 数据库端口 |
| `--db-database` | string | `nocobase`；KingbaseES 时为 `kingbase` | 数据库名称 |
| `--db-user` | string | `nocobase` | 数据库用户名 |
| `--db-password` | string | `nocobase` | 数据库密码 |
| `--db-schema` | string | 无 | 数据库 schema；仅 PostgreSQL 使用 |
| `--db-table-prefix` | string | 无 | 数据表前缀 |
| `--db-underscored` / `--no-db-underscored` | boolean | `false` | 数据库表名和字段名是否使用下划线风格 |

### 下载与源码参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `--skip-download` | boolean | `false` | 跳过下载，复用已有的本地应用目录或 Docker 镜像 |
| `--source`, `-s` | string | `docker` | 获取 NocoBase 的方式：`docker`、`npm` 或 `git` |
| `--version`, `-v` | string | `beta` | 版本参数：npm 包版本、Docker 镜像 tag 或 Git ref |
| `--replace`, `-r` | boolean | `false` | 目标目录已存在时替换 |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false` | npm/Git 安装时是否安装 devDependencies |
| `--output-dir`, `-o` | string | npm/Git 时跟随 `--app-path` 推导；Docker + `--docker-save` 时为 `./nocobase-<version>` | 下载目标目录，或启用 `--docker-save` 时的 tarball 保存目录 |
| `--git-url` | string | `https://github.com/nocobase/nocobase.git` | Git 仓库地址 |
| `--docker-registry` | string | `nocobase/nocobase`；`zh-CN` locale 下为 `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Docker 镜像仓库名，不含 tag |
| `--docker-platform` | string | `auto` | Docker 镜像平台：`auto`、`linux/amd64`、`linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | `false` | 拉取 Docker 镜像后是否额外保存为 tarball |
| `--npm-registry` | string | 空 | npm/Git 下载和依赖安装使用的 registry |
| `--build` / `--no-build` | boolean | `true` | npm/Git 依赖安装后是否构建 |
| `--build-dts` | boolean | `false` | npm/Git 构建时是否生成 TypeScript 声明文件 |
| `--hook-script` | string | 无 | 将指定的 hook 模块复制到 `<app-path>/.nb/hooks.mjs` 并保存到 env config；支持 `beforeDependencyInstall`、`beforeAppInstall` 和 `afterAppStart` 生命周期 |

## 示例

最常见的几种用法如下。

### 在终端里一步一步完成引导

```bash
nb init
```

### 打开本地浏览器向导

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### 先准备，再激活 license 并稍后启动

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### 非交互方式新安装一个本地应用

如果你不指定 `--source`，通常会使用 Docker 作为安装来源。

```bash
nb init --env app1 --yes
```

使用 Docker 安装指定版本：

```bash
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
```

使用 npm 安装：

```bash
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
```

使用 Git 源码安装：

```bash
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### 使用 hook 脚本扩展安装流程

如果你需要在安装流程里准备额外内容，可以通过 `--hook-script` 传入一个本地 ESM 模块：

```bash
nb init --env app1 --yes --source git --hook-script ./hooks.mjs
```

CLI 会把这个文件复制到 `<app-path>/.nb/hooks.mjs`，并在 env config 中保存 `hookScript: ".nb/hooks.mjs"`。后续 `nb app start`、`nb app restart` 和 `nb app upgrade` 会从这个位置复用它。

hook 文件需要默认导出对象。通常来说可以按需实现下面几个方法：

```js
export default {
  beforeDependencyInstall: async (context) => {
    // 在 git clone / npm scaffold 之后、yarn install 之前执行。
  },
  beforeAppInstall: async (context) => {
    // 在应用安装或升级命令执行前运行。
  },
  afterAppStart: async (context) => {
    // 在应用真正启动，并通过 health check 后运行。
  },
};
```

其中：

- `beforeDependencyInstall` 只对 npm/Git source 生效，在真正执行 `yarn install` 前运行；Docker source 不会执行它
- `beforeAppInstall` 会在应用级安装或升级命令前运行，npm/Git/Docker source 都可以使用
- `afterAppStart` 会在应用真正启动并通过 `__health_check` 后运行，`nb app start`、`nb app restart` 和 `nb app upgrade` 都可能触发它

`--prepare-only` 只会保存 env config 并复制 hook 文件，不会执行 hook。后续第一次运行 `nb app start` 时，CLI 才会执行首次安装相关的 hook，此时 `context.phase` 是 `init`，`context.command` 是 `app:start`。

`context` 会包含当前生命周期信息，比如 `phase`、`command`、`source`、`version`、`appPath`、`sourcePath`、`storagePath`、`hookScript` 和 `envConfig`。如果 hook 抛出错误，当前 CLI 命令会失败。由于 `afterAppStart` 可能在 start、restart 和 upgrade 中重复运行，建议把它写成可重复执行的逻辑。

### 快速安装并使用 basic 认证

如果你想在非交互模式里快速安装一个本地应用，并且安装完成后直接保存 `basic` 认证，也可以这样写。这样就不需要再打开浏览器完成 OAuth。

如果你沿用 `--yes` 模式下默认的管理员账号，最短可以这样写。

缺失时，默认管理员账号是 `nocobase`，默认密码是 `admin123`：

```bash
nb init --env app1 --yes --auth-type basic
```

如果你想同时自定义管理员账号，也可以这样写：

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### 连接一个已有应用

默认用 OAuth 就行。如果你在某些 CI/CD 场景里不方便打开浏览器，也可以直接保存 `basic` 认证；如果你已经有 API token，也可以直接保存 `token` 认证。

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api
```

在 CI/CD 或脚本里直接保存 `basic` 认证：

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>
```

如果你已经有 API token，也可以直接保存 `token` 认证：

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>
```

如果你想先保存 env，稍后再完成 OAuth 登录，也可以这样写：

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### 自定义数据库命名

如果你需要指定 PostgreSQL schema、数据表前缀或下划线命名，可以这样传参：

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### 继续上一次中断的初始化

```bash
nb init --env app1 --resume
```

### 排障时显示详细日志

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## 相关命令

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
