# 使用 CLI 安装应用

NocoBase 2.1.0 之后，官方提供了基于 CLI 的安装和管理方式。你可以用它完成安装、连接、升级和日常维护，也可以顺手给 AI Agent 准备一个可连接、可操作的环境。

## 安装 NocoBase CLI

仅在第一次安装 CLI 时执行。

先全局安装 CLI：

```bash
npm install -g @nocobase/cli
nb --version
```

:::tip 建议先开启 session mode

如果你会同时开多个终端、多个 shell，或者要让 AI Agent 和你自己并行操作，默认推荐先执行一次 [`nb session setup`](../../api/cli/session/setup.md)。这样每个会话都能维护自己的 `current env`，不容易互相影响。

```bash
nb session setup
```

:::

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

如果你准备把 NocoBase 部署到服务器上，并且希望从远程浏览器打开 `nb init --ui` 向导，建议先把 CLI 的默认 host 改成当前服务器 IP：

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

将 `<server-ip>` 替换为当前服务器对你可访问的实际 IP。

`nb config` 是 CLI 的全局配置。通常只需要设置一次，后续再次运行 `nb init --ui` 时会自动沿用这些默认值，不需要每次重复配置。

通常来说：

- `default-ui-host` 用于 `nb init --ui` 启动向导页面时生成浏览器访问 URL；向导服务本身固定监听 `0.0.0.0`
- `default-api-host` 用于新安装时默认生成的 API 地址

如果是在服务器上部署，这两个值通常都应该改成当前服务器可访问的 IP，而不是继续使用默认的本机地址。

:::warning 这只是安装向导或临时访问方式，不是生产环境推荐入口

把 `default-ui-host` / `default-api-host` 设成服务器 IP，主要是为了让你能从远程浏览器打开 `nb init --ui`，或者在安装完成后临时验证服务是否可访问。

这不代表生产环境应该长期使用 `IP + port` 对外提供服务。正式部署时，仍然推荐使用域名，并通过 Nginx 或 Caddy 这类反向代理统一接入，再启用 HTTPS。

:::

## 安装 NocoBase

### 方式一：通过 UI 向导安装

这是默认推荐的入口。你只需要运行：

```bash
nb init --ui
```

如果你想给向导页面指定一个固定端口，可以直接加上 `--ui-port`，例如：

```bash
nb init --ui --ui-port 3000
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

最短的默认写法是：

```bash
nb init --yes --env app1
```

具体到不同安装来源、版本选择、`basic` 认证、CI/CD 连接已有应用，以及数据库命名这类常见组合，直接看 [`nb init` 命令参考的示例](../../api/cli/init.md#示例) 就行。

## 安装完成后先确认什么

`--env` 是 CLI 里的环境名。通常来说，安装完成后你接下来做的事都围绕这个 env 展开。

通常建议先确认这 3 件事：

1. env 是否已经创建并保存成功
2. 应用是否可以正常启动、日志是否正常
3. 如果准备正式对外开放，是否已经规划好生产环境入口，而不是继续直接使用 `IP + port`

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

### 生产环境部署提醒

如果你现在只是刚装完，想先验证安装结果，那么用 `IP + port` 打开页面通常没有问题。

但如果这个 env 接下来要正式对外提供服务，需要特别注意：

- `nb init --ui` 本身只是安装向导的临时页面，用来完成安装或初始化，不是应用正式对外服务入口
- 通过 `nb init` 安装完成后，应用当前暴露出来的 `IP + port` 更适合调试阶段、验证阶段或内网临时访问
- 生产环境不建议直接把 NocoBase 应用端口暴露给公网长期使用
- 正式对外访问时，推荐使用域名，并通过 Nginx 或 Caddy 反向代理到 NocoBase
- 生产环境应优先启用 HTTPS，而不是长期使用裸露的 `http://IP:port`

也就是说，`default-ui-host` 和 `default-api-host` 只是为了让安装向导和默认地址生成更方便，并不代表最终生产环境的访问入口。

如果这个 env 准备正式上线，建议把“接入反向代理并启用 HTTPS”视为安装完成后的下一步，而不是可选优化项。

如果你现在就准备继续做正式部署，建议先从 [生产环境部署](../production/index.md) 开始，再按需要继续看 [Nginx](../production/reverse-proxy/nginx.md) 或 [Caddy](../production/reverse-proxy/caddy.md) 的反向代理配置。

### 日常操作

你可以先确认这个 env 是否已经保存成功：

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

如果你想继续做安装后的后续操作，可以按下面这个索引往下看：

| 我想要…… | 去哪里看 |
| --- | --- |
| 如果你准备把这个 env 正式对外开放，给它接上生产环境反向代理，并使用域名和 HTTPS 暴露服务。 | [Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)。 |
| 确认 env 是否保存成功、查看当前用了哪个 env、在多个 env 之间切换。 | [`nb env`](../../api/cli/env/index.md)、[多环境管理](../operations/multi-environment.md)。 |
| 启动、停止、重启应用，查看日志，或者继续升级应用。 | [`nb app`](../../api/cli/app/index.md)、[管理应用](../operations/manage-app.md)。 |
| 检查数据库连接、查看内置数据库状态，或者排查数据库容器问题。 | [`nb db`](../../api/cli/db/index.md)。 |
| 查看已安装插件，启用或停用插件。 | [`nb plugin`](../../api/cli/plugin/index.md)。 |
| 激活商业授权、查看授权状态、同步商业插件。 | [`nb license`](../../api/cli/license/index.md)。 |
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
- [生产环境反向代理：Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)
- [从旧方式迁移到 CLI](./migration.md)
- [多环境管理](../operations/multi-environment.md)
- [管理应用](../operations/manage-app.md)
