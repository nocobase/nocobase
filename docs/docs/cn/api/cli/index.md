---
title: "NocoBase CLI"
description: "NocoBase CLI（nb 命令）参考：初始化、环境管理、应用运行、源码、数据库、插件、API、CLI 自更新和 Skills 管理。"
keywords: "NocoBase CLI,nb,命令行,命令参考,环境管理,插件管理,API"
---

# NocoBase CLI

## 描述

NocoBase CLI（`nb`）是 NocoBase 的命令行入口，用于在本地工作区初始化、连接和管理 NocoBase 应用。

它支持两种常见初始化路径：

- 连接已有的 NocoBase 应用，并保存为 CLI env
- 通过 Docker、npm 或 Git 安装新的 NocoBase 应用，再保存为 CLI env

创建新的本地应用时，[`nb init`](./init.md) 也可以安装或更新 NocoBase AI coding skills。需要跳过这一步时，可以使用 `--skip-skills`。

## 用法

```bash
nb [command]
```

根命令本身主要用于显示帮助，并将调用分发给命令组或独立命令。

## 命令组（Topics）

`nb --help` 中会显示以下命令组：

| 命令组 | 说明 |
| --- | --- |
| [`nb api`](./api/index.md) | 通过 CLI 调用 NocoBase API。 |
| [`nb app`](./app/index.md) | 管理应用运行态：启动、停止、重启、日志和升级。 |
| [`nb db`](./db/index.md) | 管理选中 env 的内置数据库。 |
| [`nb env`](./env/index.md) | 管理 NocoBase 项目环境、状态、详情和运行时命令。 |
| [`nb plugin`](./plugin/index.md) | 管理选中 NocoBase env 的插件。 |
| [`nb scaffold`](./scaffold/index.md) | 生成 NocoBase 插件开发脚手架。 |
| [`nb self`](./self/index.md) | 检查或更新 NocoBase CLI 本身。 |
| [`nb skills`](./skills/index.md) | 检查或同步当前工作区的 NocoBase AI coding skills。 |
| [`nb source`](./source/index.md) | 管理本地源码工程：下载、开发、构建和测试。 |

## 命令（Commands）

当前根命令直接暴露的独立命令：

| 命令 | 说明 |
| --- | --- |
| [`nb init`](./init.md) | 初始化 NocoBase，让 coding agent 可以连接并工作。 |

## 查看帮助

查看根命令帮助：

```bash
nb --help
```

查看某个命令或命令组的帮助：

```bash
nb init --help
nb app --help
nb api resource --help
```

## 示例

交互式初始化：

```bash
nb init
```

使用浏览器表单初始化：

```bash
nb init --ui
```

非交互方式创建一个 Docker 应用：

```bash
nb init --env app1 --yes --source docker --version alpha
```

连接已有应用：

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

启动应用并刷新运行时命令：

```bash
nb app start -e app1
nb env update app1
```

调用 API：

```bash
nb api resource list --resource users -e app1
```

## 环境变量

下列环境变量会影响 CLI 的行为：

| 变量 | 说明 |
| --- | --- |
| `NB_CLI_ROOT` | CLI 保存 `.nocobase` 配置和本地应用文件的根目录。默认是当前用户主目录。 |
| `NB_LOCALE` | CLI 提示语言和本地初始化 UI 语言，支持 `en-US` 和 `zh-CN`。 |

示例：

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## 配置文件

默认配置文件：

```text
~/.nocobase/config.json
```

设置 `NB_CLI_ROOT=/your/workspace` 后，配置文件路径会变为：

```text
/your/workspace/.nocobase/config.json
```

CLI 也兼容读取当前工作目录下的旧 project 配置。

运行时命令缓存保存在：

```text
.nocobase/versions/<hash>/commands.json
```

这个文件由 [`nb env update`](./env/update.md) 生成或刷新，用于缓存从目标应用同步出来的运行时命令。

## 相关链接

- [快速开始](../../ai/quick-start.mdx)
- [安装、升级与迁移](../../ai/install-upgrade-migration.mdx)
- [全局环境变量](../app/env.md)
- [AI 搭建](../../ai-builder/index.md)
- [插件开发](../../plugin-development/index.md)
