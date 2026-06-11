---
title: 安装 NocoBase 应用
description: 安装 NocoBase CLI，并通过 nb init --ui 快速创建一个新的 NocoBase 应用，让 AI Agent 直接开始工作。
---

# 安装 NocoBase 应用

如果你还没有 NocoBase 应用，最快的方式就是先装 `@nocobase/cli`，再运行一次 `nb init --ui`。大部分场景按向导默认配置走就够了。

## 前置条件

- Node.js >= 22
- Yarn 1.x
- 如果你打算用 Docker 安装，先确保 Docker 已启动

## 第一步：安装 CLI

先全局安装 NocoBase CLI：

```bash
npm install -g @nocobase/cli
nb --version
```

如果你会同时开多个终端，或者要和 AI Agent 并行操作，建议额外执行一次 `nb session setup`。这样每个会话都会维护自己的 `current env`，不容易互相影响。

## 第二步：初始化应用

默认推荐直接打开可视化向导：

```bash
nb init --ui
```

向导里按顺序完成这几件事：

1. 设置应用名称——它同时也是 CLI 里的 env 名
2. 选择「全新安装」
3. 选择安装方式——Docker、npm 或 Git
4. 设置端口、数据库和管理员账号
5. 等待下载、安装和启动完成

如果你更习惯终端交互，也可以直接运行：

```bash
nb init
```

如果你在脚本或 CI 里初始化，可以用非交互模式：

```bash
nb init --yes --env app1
```

:::tip 远程服务器安装

如果你是在服务器上执行 `nb init --ui`，建议先把默认 host 改成当前服务器 IP。这样你才能从本地浏览器打开向导页面。

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## 第三步：确认应用可用

安装完成后，通常建议先确认这 3 件事：

- env 是否已经保存成功
- 应用是否已经正常启动
- 你能否用管理员账号登录页面

常用命令是：

```bash
nb env list
nb env status
nb app logs
```

如果是本地默认安装，浏览器通常可以直接打开 `http://localhost:13000`。登录后，再新开或重启一次 AI Agent 会话，AI 就可以开始操作这个 NocoBase 应用了。

CLI 的配置默认保存在 `~/.nocobase/`，所以 AI Agent 通常可以在任意工作目录访问它。

如果这个应用后面要正式对外提供服务，不建议长期直接使用 `IP + port`。下一步通常就是接入反向代理，并启用 HTTPS。

## 接下来

- 如果你已经有一个运行中的 NocoBase，直接看 [AI Agent 接入指南](./quick-start.mdx)
- 如果你要继续做生产环境部署，直接看 [使用 CLI 安装应用](../nocobase-cli/installation/cli.md) 和 [生产环境部署概述](../nocobase-cli/production/index.md)
- 如果你想继续让 AI 开始搭建应用，直接看 [AI 搭建](../ai-builder/index.md)

