---
title: '手动创建应用'
description: '在终端准备环境、创建 NocoBase 3 项目并启动应用。'
---

# 手动创建应用

你也可以在终端直接创建并启动应用。如果希望由 AI Agent 完成这些操作，查看[AI Agent 创建应用](./create-app)。两种方式选择一种即可。

## 检查环境

安装 Node.js 24 和 pnpm 11。在终端检查是否可用：

```bash
node --version
pnpm --version
```

项目生成后，使用项目 `package.json` 中指定的 pnpm 版本。以下命令在 Linux / WSL 的终端执行，Windows 用户可以在 WSL 中完成这一轮操作。

## 创建项目

如果手动创建，可以在终端从应用目录的父目录执行。比如已经准备好的空目录名为 `my-app`：

```bash
# 允许下载刚发布的版本，并创建应用
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app my-app
```

`my-app` 是目标目录名，也会作为应用的默认名称。名称必须以小写英文字母或数字开头，且仅包含小写英文字母、数字、点（`.`）、短横线（`-`）或下划线（`_`），不能包含中文、空格或大写字母。建议使用 `my-app`、`crm-demo` 或 `order-system` 这样的名称。目标目录可以尚不存在，也可以是已准备好的空目录。

命令会下载应用模板、生成项目和配置文件、安装依赖，并同步插件的开发指引。等待终端显示完成，再进入下一步。

NocoBase 包发布在公共 npm 包源。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 只对本次创建进程生效，用于下载刚发布的版本。

创建命令到此为止，得到的是一个可以配置的项目。它不会生成 `config.yml`，下一步才会。

## 配置应用

```bash
cd my-app
pnpm nocobase config init
```

这一步以 `config.example.yml` 为底生成 `config.yml`，保留其中的注释，并填入认证与会话密钥。该文件包含应用配置和密钥，保留在本地，不提交到代码仓库。

默认使用 SQLite——模板已经依赖它，也不需要单独的数据库服务。使用其他数据库时，先安装驱动，再在配置时指定：

```bash
pnpm add @nocobase/db-postgres
pnpm nocobase config init --dialect postgres
```

`pnpm nocobase config init` 不会安装任何东西：驱动缺失时它会报出对应的安装命令，并且不写入任何文件，装好之后重新运行即可。在终端里运行时，非 SQLite 数据库会逐项询问连接信息，并在写入前先测一次连接。也可以之后再设置，密码从环境变量读取，不会留在 shell 历史里:

```bash
pnpm nocobase config set database.connections.main.host=db.internal database.connections.main.username=crm
pnpm nocobase config set --from-env database.connections.main.password=CRM_DB_PASSWORD
```

## 检查配置

```bash
pnpm nocobase config check
```

它会按应用启动时的方式加载配置，数据库不是 SQLite 时还会实际连一次，并报出所有会导致无法启动的问题，比如缺少驱动、缺少 secret、数据库连不上，每一项都附带修复命令。

## 启动应用

```bash
pnpm dev
```

保持终端运行，打开它打印的 `Local` 地址。比如 `http://127.0.0.1:13000/main/`；端口被占用时可能变化，以你的终端输出为准。

## 登录应用

浏览器会进入登录页：

![新应用的登录页面](https://static-docs.nocobase.com/nb3-docs-20260916-login-en.png)

使用模板初始管理员时，登录信息如下：

| 项目 | 初始值               |
| ---- | -------------------- |
| 邮箱 | `admin@nocobase.com` |
| 密码 | `admin123`           |

这组账号用于本地首次体验。对外开放应用前，应更改初始密码并配置正式访问方式。如果安装时设置了自己的管理员账号，或连接已有数据库，以实际设置为准。

登录后会看到应用首页。通过右上角账户菜单的「Language / 语言」可切换为中文。

![登录后应用首页，示例已添加订单菜单](https://static-docs.nocobase.com/nb3-docs-20260916-home-cn.png)

图中的「订单管理」是下一页添加的功能，新创建的应用暂时没有这个菜单。

## 停止和再次启动

在运行服务的终端按 `Ctrl+C` 停止。下次进入同一个应用目录，再运行 `pnpm dev`。不需要重新执行创建命令；已有数据库也不需要重新生成。

开发时使用 `pnpm dev`。`pnpm build` 和 `pnpm start` 用于构建后运行，首次跟随文档先保持开发模式。

## 遇到问题

- **提示目录已存在**：换一个新目录名，或进入原项目继续操作，不要为了重试删除已有应用。
- **依赖安装没有完成**：先查看终端的错误；如果项目已经生成，在项目目录修复问题并重新运行 `pnpm install`，再执行 `pnpm nocobase skills sync`。
- **打开地址失败**：确认终端仍在运行，复制它实际打印的地址。如果浏览器与应用不在同一台机器，需要先配置相应端口访问。
- **类型检查显示同名包来自两个版本**：检查依赖树中是否安装了同一个包的多个版本。可以在应用目录执行 `pnpm dedupe` 合并兼容的重复依赖，再运行类型检查。

## 下一步

在生成的应用目录中启动 AI Agent 会话，让它读取 `AGENTS.md` 和相关开发指引，再继续[让 AI Agent 做第一个功能](./first-feature)。
