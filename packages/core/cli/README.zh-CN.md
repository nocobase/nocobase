# NocoBase CLI

NocoBase CLI (`nb`) 是用于在本地工作区初始化、连接和管理 NocoBase 应用的命令行工具。它可以帮助你准备 NocoBase 应用、保存 CLI env 配置，并提供启动、停止、查看日志、升级和清理等日常管理命令，让 coding agent 可以连接并使用 NocoBase。

CLI 支持两种常见的初始化方式：

- 连接已有的 NocoBase 应用，让 coding agent 直接使用。
- 通过 Docker、npm 或 Git 安装一个新的 NocoBase 应用，并保存为 CLI env。

## 前提条件

- Node.js v20+
- Yarn 1.x
- Git：选择 Git 源码安装时需要
- Docker：使用 Docker 方式安装，或使用内置数据库时需要

## 安装

全局安装 CLI：

```bash
npm install -g @nocobase/cli@alpha
```

查看可用命令：

```bash
nb --help
nb init --help
```

## 核心概念

- **Workspace**：当前项目目录，CLI 会在这里保存 `.nocobase` 配置。
- **Env**：CLI 保存的一个 NocoBase 连接配置。在 `nb init` 中，app name 也就是 env name。
- **Source**：本地应用的来源，支持 `docker`、`npm` 和 `git`。
- **Remote env**：只保存已有 NocoBase 应用 API 连接的 env。
- **Runtime resources**：由 CLI 管理的本地运行资源，包括应用进程、Docker 应用容器、内置数据库容器、源码目录和存储目录。

## 快速开始

### 交互式初始化

在终端中启动引导式初始化：

```bash
nb init
```

使用浏览器表单完成初始化：

```bash
nb init --ui
```

`nb init` 可以连接已有的 NocoBase 应用，也可以安装一个新的 NocoBase 应用。创建新应用时，还可以全局安装 NocoBase AI coding skills (`nocobase/skills`)。

### 非交互式初始化

跳过交互提示时，必须提供 app/env name：

```bash
nb init --env app1 --yes
```

使用 Docker 安装：

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

对于 Git 源码安装，`--version alpha` 实际会解析为 `develop` 分支。

使用 Git 分支安装：

```bash
nb init --env app1 --yes --source git --version fix/cli-v2
```

`--version` 是三种 source 共用的版本参数：

- npm：包版本号
- Docker：镜像 tag
- Git：git ref，例如 branch 或 tag

默认情况下，新建本地应用会使用以下目录：

- 源码目录：`./<envName>/source/`
- 存储目录：`./<envName>/storage/`

### 恢复中断的初始化

如果 `nb init` 在 env 配置已经保存之后中断了，可以继续上一次初始化流程：

```bash
nb init --env app1 --resume
```

`--resume` 会复用工作区里已保存的 env config，包括应用、source、数据库和 env 连接相关配置。在交互模式下，只会继续补齐缺失的初始化参数。

在非交互模式下，需要重新传这些只用于初始化、不会保存到 env config 的参数：

- `--lang`
- `--root-username`
- `--root-email`
- `--root-password`
- `--root-nickname`

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `nb init` | 初始化 NocoBase，并连接为 coding agent 可使用的 CLI env。 |
| `nb app` | 管理应用运行态：启动、停止、重启、日志、状态、清理和升级。 |
| `nb source` | 管理本地源码工程：下载、开发、构建和测试。 |
| `nb db` | 查看或管理本地 env 的内置数据库运行状态。 |
| `nb env` | 管理已保存的 CLI env 连接。 |
| `nb api` | 通过 CLI 调用 NocoBase API 资源。 |
| `nb plugin` | 管理选中 NocoBase env 的插件。 |

推荐在应用和运行时相关命令里显式使用 `--env`；`-e` 是它的简写：

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app ps --env app1
nb db ps --env app1
```

等价的简写示例：

```bash
nb app start -e app1
nb app restart -e app1
nb app logs -e app1
nb app upgrade -e app1
nb db start -e app1
```

## 运行方式

### Docker

Docker env 会通过已保存的 Docker 容器和镜像进行管理：

```bash
nb init --env app1 --yes --source docker --version alpha
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app stop --env app1
```

Docker 下载支持指定平台：

```bash
nb source download --source docker --version alpha --docker-platform auto
nb source download --source docker --version alpha --docker-platform linux/amd64
nb source download --source docker --version alpha --docker-platform linux/arm64
```

### npm 和 Git

npm 和 Git env 会使用本地源码目录，并支持开发模式：

```bash
nb init --env app1 --yes --source git --version alpha
nb source dev --env app1
```

`nb source dev` 只支持 npm/Git 源码 env。Docker env 可以通过 `nb app logs` 查看日志，remote env 只支持 API 和 env 相关操作。

### 已有 NocoBase 应用

如果要连接已有应用，可以运行 `nb init` 并选择已有应用流程，也可以直接添加 env：

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

`nb env add` 会在需要时自动进入认证流程。

## 升级

升级会更新已保存的源码或镜像，然后重启应用：

```bash
nb app upgrade --env app1
```

如果只想使用当前已保存的本地源码或 Docker 镜像重启应用，可以使用 `--skip-code-update` 或 `-s`：

```bash
nb app upgrade --env app1 -s
```

## 数据库命令

可以使用 `nb db` 查看或管理本地 env 的内置数据库运行状态：

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

说明：

- `nb db start` 和 `nb db stop` 只适用于启用了内置数据库的 env。
- `nb db logs` 只适用于启用了内置数据库的 env。
- 对于没有 CLI 托管数据库容器的 env，`nb db ps` 也会显示 `external` 或 `remote` 状态。

## 清理

关闭并清理某个本地 env：

```bash
nb app down --env app1
```

默认情况下，`nb app down` 会停止应用，并在存在时移除应用容器和数据库容器。它不会删除用户数据、源码文件和 CLI env 配置。
对于本地 env，它还会删除已保存的本地 app 目录。默认仍会保留 storage 数据和 CLI env 配置。

如需执行破坏性清理，需要显式指定参数：

```bash
nb app down --env app1 --all --yes
```

- `--all`：删除该 env 的所有内容，包括 storage 数据和已保存的 CLI env 配置。必须同时传 `--yes`。

## Env 管理

查看当前 env：

```bash
nb env
```

查看已配置的 env：

```bash
nb env list
```

切换当前 env：

```bash
nb env use app1
```

当凭证需要刷新时，重新认证某个 env：

```bash
nb env auth app1
```

从选中的应用更新运行时命令元数据：

```bash
nb env update app1
```

## API 命令

CLI 可以通过已配置的 env 调用 NocoBase 资源 API：

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
```

如果需要输出原始 JSON，可以使用 `-j, --json-output`：

```bash
nb api resource list --resource users -e app1 -j
```

可用的 API 命令分类：

| 命令 | 说明 |
| --- | --- |
| `nb api acl` | 基于角色、资源和操作管理访问控制。 |
| `nb api api-keys` | 管理用于 HTTP API 访问的 API keys。 |
| `nb api app` | 管理应用相关资源。 |
| `nb api authenticators` | 管理用户认证，包括密码认证、短信认证、SSO 协议和可扩展认证方式。 |
| `nb api data-modeling` | 管理数据源、数据表和数据库建模资源。 |
| `nb api file-manager` | 管理文件存储服务、文件集合和附件字段。 |
| `nb api flow-surfaces` | 组合和更新页面、标签页、区块、字段和操作等界面结构。 |
| `nb api pm` | 通过 API 命令管理插件。 |
| `nb api resource` | 操作通用集合资源。 |
| `nb api system-settings` | 调整系统标题、Logo、语言和其他全局设置。 |
| `nb api theme-editor` | 自定义 UI 颜色和尺寸，保存并切换主题。 |
| `nb api workflow` | 管理用于业务自动化的工作流资源。 |

## 本地数据

CLI 会在工作区的 `.nocobase` 中保存配置：

- `config.json`：env 定义、当前 env 和工作区级配置。
- `versions/<version>/commands.json`：从目标应用生成并缓存的运行时命令。

源码文件、storage 文件、Docker 容器和数据库数据等运行时数据，会根据 env 的 source 和安装选项分别管理。
