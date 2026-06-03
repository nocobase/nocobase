# 使用 CLI 安装（推荐）

NocoBase 2.1.0 之后，官方提供了基于 CLI 的安装和管理方式。你可以用它完成安装、连接、升级和日常维护，也可以顺手给 AI Agent 准备一个可连接、可操作的环境。

## 安装 NocoBase CLI

如果你已经装过，可以跳过这一步。

先全局安装 CLI：

```bash
npm install -g @nocobase/cli@beta
nb --version
```

如果你打算长期用中文界面，通常来说先把 locale 设好就够了：

```bash
nb config set locale zh-CN
```

CLI 默认会检查自更新。你可以按自己的习惯调整更新策略：

- `prompt`：发现新版本时提示
- `auto`：自动更新
- `off`：关闭自动更新

```bash
nb config set update.policy prompt
nb config set update.policy auto
nb config set update.policy off
```

:::tip 建议先开启 session mode

如果你会同时开多个终端、多个 shell，或者要让 AI Agent 和你自己并行操作，默认推荐先执行一次 [`nb session setup`](../../api/cli/session/setup.md)。这样每个会话都能维护自己的 `current env`，不容易互相影响。

```bash
nb session setup
```

:::

## 安装 NocoBase

### 方式一：通过 UI 向导安装

这是默认推荐的入口。你只需要运行：

```bash
nb init --ui
```

![nb init UI 向导](https://static-docs.nocobase.com/2026-06-03-20-54-01.png)

向导会根据当前场景，带你一步一步完成安装或连接所需的配置。

### 方式二：通过终端交互

如果你更习惯在终端里一步一步输入，可以直接运行：

```bash
nb init
```

![2026-06-03-21-36-33](https://static-docs.nocobase.com/2026-06-03-21-36-33.png)

### 方式三：通过非交互命令

如果你在脚本、CI/CD 或其他非交互环境里运行，直接用 `--yes` 就行。这个模式下必须显式传 `--env`，没有显式指定的参数会按默认值处理。

#### 新安装一个应用

最简单的默认安装方式：

```bash
nb init --yes --env app1
```

这条命令默认会走 `install-new` 流程，通常会使用 Docker 作为来源，并创建一个带内置 PostgreSQL 的本地应用。

使用 Docker 安装指定版本：

```bash
nb init --yes --env app1 --source docker --version latest
nb init --yes --env app1 --source docker --version beta
nb init --yes --env app1 --source docker --version alpha

nb init --yes --env app1 --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
```

使用 npm 安装：

```bash
nb init --yes --env app1 --source npm --version latest
nb init --yes --env app1 --source npm --version beta
nb init --yes --env app1 --source npm --version alpha
nb init --yes --env app1 --source npm --version beta --app-port 13080
```

使用 Git 源码安装：

```bash
nb init --yes --env app1 --source git --version latest
nb init --yes --env app1 --source git --version beta
nb init --yes --env app1 --source git --version alpha
nb init --yes --env app1 --source git --version feat/plugin-workflow-timeout

nb init --yes --env app1 --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

如果你需要自定义数据库命名，也可以一起带上：

```bash
nb init --yes --env app1 \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

#### 快速安装并使用 basic 认证

如果你想在非交互模式里快速安装一个本地应用，并且安装完成后直接用 `basic` 认证，也可以这样写。这样就不需要打开浏览器完成 OAuth。

如果你沿用 `--yes` 模式下默认的管理员账号，最短可以这样写。

缺失时，默认管理员账号是 `nocobase`，默认密码是 `admin123`：

```bash
nb init --yes --env app1 --auth-type basic
```

如果你想同时自定义管理员账号，也可以这样写：

```bash
nb init --yes --env app1 \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

#### 在 CI/CD 里连接一个已有应用

如果你不是要新装一个本地应用，而是想在 CI/CD 或脚本里先保存一个已有应用的 env，也可以直接用 `basic` 认证。这样就不需要打开浏览器完成 OAuth。

```bash
nb init --yes --env staging \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>
```

#### 其他常用参数

更完整的参数说明见 [`nb init` 命令参考](../../api/cli/init.md)。

## 安装完成后先确认什么

`--env` 是 CLI 里的环境名。通常来说，安装完成后你接下来做的事都围绕这个 env 展开。

### 安装目录

如果你刚用 `nb init --env app1` 新装了一个本地应用，可以通过 `nb env info app1 --field app.appPath` 查看完整路径。

默认情况下，CLI 会在 `app-path` 下按下面这套约定组织本地文件：

```text
<app-path>/
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

通常来说：

- `source/` 主要对应 npm / Git env 的本地应用目录。对于 Docker env，CLI 也会保留这套默认路径推导，不过大多数时候你不需要手动关心它
- `storage/` 用来放运行时数据，比如内置数据库数据、插件、日志等内容
- `.env` 是可选的应用环境变量文件。只有当你需要自定义环境变量时，才需要在 `<app-path>/.env` 里添加它；如果这个文件存在，Docker、npm 和 Git 这几种安装来源默认都会读取它

更完整的说明见 [`nb init` 命令参考](../../api/cli/init.md)。

### 日常操作

你可以先确认这个 env 是否已经保存成功：

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

如果你想继续做安装后的日常操作，可以按下面这个索引往下看：

| 我想要…… | 去哪里看 |
| --- | --- |
| 确认 env 是否保存成功、查看当前用了哪个 env、在多个 env 之间切换。 | [`nb env`](../../api/cli/env/index.md)、[多环境管理](../operations/multi-environment.md)。 |
| 启动、停止、重启应用，查看日志，或者继续升级应用。 | [`nb app`](../../api/cli/app/index.md)、[管理应用](../operations/manage-app.md)。 |
| 检查数据库连接、查看内置数据库状态，或者排查数据库容器问题。 | [`nb db`](../../api/cli/db/index.md)。 |
| 查看已安装插件，启用或停用插件。 | [`nb plugin`](../../api/cli/plugin/index.md)。 |
| 激活商业授权、查看授权状态、同步商业插件。 | [`nb license`](../../api/cli/license/index.md)、[商业插件](../plugins/commercial.md)。 |
| 管理本地源码工程，比如下载源码、启动开发模式、构建或测试。这个通常用于 npm / Git env。 | [`nb source`](../../api/cli/source/index.md)。 |

如果你刚装完一个本地应用，通常可以先跑这几条命令：

```bash
nb env use app1
nb app start
nb app logs
nb plugin list
```

如果你同时维护多个 env，后续切换和查看状态的方式见 [多环境管理](../operations/multi-environment.md)。

如果你后续要升级应用，直接看 [管理应用](../operations/manage-app.md) 和 [`nb app upgrade` 命令参考](../../api/cli/app/upgrade.md) 就行。

## 相关链接

- [`nb init` 命令参考](../../api/cli/init.md)
- [`nb env info` 命令参考](../../api/cli/env/info.md)
- [从旧方式迁移到 CLI](./migration.md)
- [多环境管理](../operations/multi-environment.md)
- [管理应用](../operations/manage-app.md)
