---
title: "nb init"
description: "nb init 命令参考：初始化 NocoBase，连接已有应用或安装新应用，并保存为 CLI env。"
keywords: "nb init,NocoBase CLI,初始化,env,Docker,npm,Git"
---

# nb init

初始化当前工作区，让 coding agent 可以连接和使用 NocoBase。`nb init` 可以连接已有应用，也可以通过 Docker、npm 或 Git 安装一个新应用。

## 用法

```bash
nb init [flags]
```

## 说明

`nb init` 支持三种提示模式：

- 默认模式：在终端中逐步填写。
- `--ui`：打开本地浏览器表单完成引导流程。
- `--yes`：跳过提示并使用默认值。此模式必须传入 `--env <envName>`，并会创建新的本地应用。

如果初始化在 env 配置保存后中断，可以使用 `--resume` 继续：

```bash
nb init --env app1 --resume
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | 跳过提示，使用 flags 和默认值 |
| `--env`, `-e` | string | 本次初始化的 env 名称，`--yes` 和 `--resume` 模式必填 |
| `--ui` | boolean | 打开浏览器可视化向导，不能和 `--yes` 同时使用 |
| `--verbose` | boolean | 显示详细命令输出 |
| `--ui-host` | string | `--ui` 本地服务绑定地址，默认 `127.0.0.1` |
| `--ui-port` | integer | `--ui` 本地服务端口，`0` 表示自动分配 |
| `--locale` | string | CLI 提示和 UI 语言：`en-US` 或 `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase API 地址，包含 `/api` 前缀 |
| `--auth-type`, `-a` | string | 认证方式：`token` 或 `oauth` |
| `--access-token`, `-t` | string | `token` 认证方式使用的 API key 或 access token |
| `--resume` | boolean | 复用已保存的 workspace env config 继续初始化 |
| `--lang`, `-l` | string | 安装后 NocoBase 应用的语言 |
| `--force`, `-f` | boolean | 重新配置已有 env，并在需要时替换冲突的运行资源 |
| `--app-root-path` | string | 本地 npm/Git 应用源码目录，默认 `./<envName>/source/` |
| `--app-port` | string | 本地应用端口，默认 `13000`，`--yes` 模式会自动选择可用端口 |
| `--storage-path` | string | 上传文件和托管数据库数据目录，默认 `./<envName>/storage/` |
| `--root-username` | string | 初始管理员用户名 |
| `--root-email` | string | 初始管理员邮箱 |
| `--root-password` | string | 初始管理员密码 |
| `--root-nickname` | string | 初始管理员昵称 |
| `--builtin-db`, `--no-builtin-db` | boolean | 是否创建 CLI 托管的内置数据库 |
| `--db-dialect` | string | 数据库类型：`postgres`、`mysql`、`mariadb`、`kingbase` |
| `--builtin-db-image` | string | 内置数据库容器镜像 |
| `--db-host` | string | 数据库地址 |
| `--db-port` | string | 数据库端口 |
| `--db-database` | string | 数据库名 |
| `--db-user` | string | 数据库用户 |
| `--db-password` | string | 数据库密码 |
| `--fetch-source` | boolean | 安装前下载应用文件或拉取 Docker 镜像 |
| `--source`, `-s` | string | 获取 NocoBase 的方式：`docker`、`npm` 或 `git` |
| `--version`, `-v` | string | 版本参数：npm 版本、Docker 镜像 tag 或 Git ref |
| `--replace`, `-r` | boolean | 目标目录已存在时替换 |
| `--dev-dependencies`, `-D` | boolean | npm/Git 安装时是否安装 devDependencies |
| `--output-dir`, `-o` | string | 下载目标目录，或保存 Docker tarball 的目录 |
| `--git-url` | string | Git 仓库地址 |
| `--docker-registry` | string | Docker 镜像仓库名，不含 tag |
| `--docker-platform` | string | Docker 镜像平台：`auto`、`linux/amd64`、`linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | 拉取 Docker 镜像后是否保存为 tarball |
| `--npm-registry` | string | npm/Git 下载和依赖安装使用的 registry |
| `--build`, `--no-build` | boolean | npm/Git 依赖安装后是否构建 |
| `--build-dts` | boolean | npm/Git 构建时是否生成 TypeScript 声明文件 |

## 示例

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --resume
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## 相关命令

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
