---
title: "NocoBase CLI"
description: "NocoBase CLI（nb 命令）参考总览：初始化、安装、环境管理、应用运行、源码、数据库、插件、API、CLI 自更新和 Skills 管理。"
keywords: "NocoBase CLI,nb,命令行,命令参考,安装,环境管理,插件管理,API"
---

# NocoBase CLI

NocoBase CLI（`nb`）用于在本地工作区初始化、连接和管理 NocoBase 应用。它可以保存 CLI env 配置，管理本地应用、Docker 容器、内置数据库、源码目录和存储目录，并让 coding agent 通过统一的命令连接 NocoBase。

CLI 支持两种常见初始化方式：

- 连接已有的 NocoBase 应用，让 coding agent 直接使用。
- 通过 Docker、npm 或 Git 安装新的 NocoBase 应用，并保存为 CLI env。

## 前提条件

- Node.js v20+
- Yarn 1.x
- Git：使用 Git 源码安装时需要
- Docker：使用 Docker 安装或内置数据库时需要

## 安装

```bash
npm install -g @nocobase/cli@alpha
```

查看可用命令：

```bash
nb --help
nb init --help
```

所有命令都可以使用 `nb <command> --help` 查看参数说明。详细安装流程请参阅[快速开始](../../ai/quick-start.mdx)。

## 核心概念

| 概念                  | 说明                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------- |
| Workspace             | 当前项目目录，CLI 会在这里保存 `.nocobase` 配置                                       |
| Env                   | CLI 保存的一个 NocoBase 连接配置，`nb init` 中的 app name 也是 env name               |
| Source                | 本地应用的来源，支持 `docker`、`npm` 和 `git`                                         |
| Remote env            | 只保存已有 NocoBase 应用 API 连接的 env                                               |
| Runtime resources     | CLI 管理的应用进程、Docker 应用容器、内置数据库容器、源码目录和存储目录              |

## 快速开始

使用浏览器表单完成交互式初始化：

```bash
nb init --ui
```

使用 Docker 非交互式安装：

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

连接已有 NocoBase 应用：

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

启动、停止和查看日志：

```bash
nb app start --env app1
nb app stop --env app1
nb app restart --env app1
nb app logs --env app1
```

## 命令

| 命令 | 说明 |
| --- | --- |
| [`nb init`](./init.md) | 初始化 NocoBase，并连接为 CLI env |
| [`nb app`](./app/) | 管理应用运行态：启动、停止、重启、日志、清理和升级 |
| [`nb source`](./source/) | 管理本地源码工程：下载、开发、构建和测试 |
| [`nb db`](./db/) | 查看或管理内置数据库运行状态 |
| [`nb env`](./env/) | 管理已保存的 CLI env 连接 |
| [`nb api`](./api/) | 通过 CLI 调用 NocoBase API |
| [`nb plugin`](./plugin/) | 管理选中 NocoBase env 的插件 |
| [`nb self`](./self/) | 检查或更新已安装的 NocoBase CLI |
| [`nb skills`](./skills/) | 检查、安装、更新或移除 NocoBase AI coding skills |
| [`nb scaffold`](./scaffold/) | 生成插件和迁移脚本脚手架 |

## 配置文件

NocoBase CLI 默认使用全局配置目录：

```text
~/.nocobase/config.json
```

可以通过 `NB_CLI_ROOT` 调整配置和本地应用文件的根目录：

```bash
export NB_CLI_ROOT=/your/workspace
```

设置后，配置文件会保存到 `/your/workspace/.nocobase/config.json`。没有设置 `NB_CLI_ROOT` 时，CLI 也会兼容读取当前工作目录下的旧 project 配置。

配置文件结构示例：

```json
{
  "currentEnv": "local",
  "envs": {
    "local": {
      "apiBaseUrl": "http://localhost:13000/api",
      "auth": { "type": "token", "accessToken": "..." },
      "appRootPath": "./local/source",
      "storagePath": "./local/storage",
      "appPort": "13000",
      "dbDialect": "postgres"
    }
  }
}
```

运行时命令缓存存储在 `.nocobase/versions/<hash>/commands.json`，由 [`nb env update`](./env/update.md) 自动生成和更新。

## 相关链接

- [快速开始](../../ai/quick-start.mdx)
- [环境变量](../app/env.md)
- [AI 搭建](../../ai-builder/index.md)
- [插件开发](../../plugin-development/index.md)
