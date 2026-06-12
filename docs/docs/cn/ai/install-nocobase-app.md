---
title: 安装 NocoBase 应用
description: 安装 NocoBase CLI，并通过 nb init --ui 快速创建一个新的 NocoBase 应用，让 AI Agent 直接开始工作。
---

# 安装 NocoBase 应用

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
nb init --ui --locale zh-CN
```

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

不同 setup 路径看到的步骤不完全一样。不过如果你走的是默认的「新安装」路径，通常会依次看到这 6 步：

1. 「开始设置」——设置 `--env` 标识，并选择「新安装」
2. 「应用环境信息」——设置应用的基础信息、存储位置和运行端口
3. 「应用来源和版本」——选择应用的获取方式，以及要使用的来源和版本
4. 「配置数据库」——选择内置数据库或自定义数据库
5. 「创建管理员账号」——设置第一个管理员账号
6. 「连接与认证」——填写应用访问地址并选择认证方式

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
nb env info
nb app logs
```

如果是本地默认安装，浏览器通常可以直接打开 `http://localhost:13000`。登录后，再新开或重启一次 AI Agent 会话，AI 就可以开始操作这个 NocoBase 应用了。

CLI 的配置默认保存在 `~/.nocobase/`，所以 AI Agent 通常可以在任意工作目录访问它。

如果这个应用后面要正式对外提供服务，不建议长期直接使用 `IP + port`。下一步通常就是接入反向代理，并启用 HTTPS。

## 接下来

- 如果你已经有一个运行中的 NocoBase，直接看 [AI Agent 接入指南](./quick-start.mdx)
- 如果你要管理应用的启动、停止、日志和升级，直接看 [管理应用](../nocobase-cli/operations/manage-app.md)
- 如果你要继续做生产环境部署，直接看 [使用 CLI 安装应用](../nocobase-cli/installation/cli.md) 和 [生产环境部署概述](../nocobase-cli/production/index.md)
- 如果你想继续让 AI 开始搭建应用，直接看 [AI 搭建](../ai-builder/index.md)

## 相关链接

- [安装方式和版本对比](../get-started/quickstart.md) — 先比较不同安装方式和版本通道，再决定怎么安装
- [AI Agent 接入指南](./quick-start.mdx) — 连接已有的 NocoBase 应用，让 AI Agent 开始工作
- [`nb init` 命令参考](../api/cli/init.md) — 初始化应用、接管本机已有应用或连接远程应用
- [`nb env info` 命令参考](../api/cli/env/info.md) — 查看当前 env 的连接信息和运行配置
- [NocoBase CLI 命令参考](../api/cli/index.md) — 所有 `nb` 命令的完整参数说明
- [管理应用](../nocobase-cli/operations/manage-app.md) — 启动、停止、重启、查看日志和升级应用
- [多环境管理](../nocobase-cli/operations/multi-environment.md) — 同时维护多个 env 时的常用操作
