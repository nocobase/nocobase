---
title: 本地开发搭建
description: 为本地安装 NocoBase CLI 和运行 NocoBase 应用准备操作系统环境，覆盖 Windows WSL、macOS、Linux 的 Node.js、Yarn 和 Docker 配置。
---

# 本地开发搭建

这篇用于在本机准备 NocoBase CLI 和 NocoBase 应用运行环境。它适合本地开发、功能体验，以及让 AI Agent 在你的电脑上安装和管理 NocoBase 应用。

如果你要部署给真实用户使用，先看 [生产环境系统要求](../get-started/system-requirements.md)。

## Windows：推荐使用 WSL

在 Windows 本地搭建 NocoBase 时，推荐把主要开发环境放在 WSL 2 里：在 WSL 的 Linux 发行版中安装 Node.js、Yarn 和 NocoBase CLI，并从 WSL 终端运行相关命令。

WSL 更接近 NocoBase 常见的 Linux 部署环境。这样做有几个好处：

- 依赖安装、构建、启动和日志排查更接近服务器上的实际流程
- Docker Desktop 开启 WSL integration 后，可以直接在 WSL 里运行 `docker` 命令
- 可以减少 Windows 原生环境里的路径格式、文件权限、软链接、原生依赖编译等额外问题
- 更适合 AI Agent 操作。Agent 执行 `nb`、`yarn`、`docker` 等命令时，使用的是同一套 Linux 文件路径、shell 语法和运行环境，排查问题更直接

如果你还没有准备好 WSL 本地开发环境，先看 [Windows 使用 WSL 搭建本地开发环境](./windows-wsl.md)。

推荐组合：

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop（如果你要用 Docker 安装 NocoBase）

通常来说，Node.js、Yarn 和 NocoBase CLI 都安装在 WSL 里。如果使用 Docker Desktop，需要在 Docker Desktop 中开启 WSL integration，让 WSL 可以访问 Docker。

确认命令：

```bash
node -v
yarn -v
docker version
```

:::tip 提示

NocoBase 也可以安装在 Windows Server 上。这里推荐 WSL，主要是面向个人电脑上的本地开发和 AI Agent 搭建场景，不表示 Windows Server 不能用于部署。

:::

## macOS

macOS 可以直接使用本机终端搭建本地环境。

需要准备：

- Node.js >= 22
- Yarn 1.x
- Docker Desktop、OrbStack 或 Colima（如果你要用 Docker 安装 NocoBase）

确认命令：

```bash
node -v
yarn -v
docker version
```

如果不使用 Docker 安装，可以不检查 `docker version`。

## Linux

Linux 可以直接作为本地开发环境。推荐使用 Ubuntu、Debian 或其他常见发行版。

需要准备：

- Node.js >= 22
- Yarn 1.x
- Docker Engine（如果你要用 Docker 安装 NocoBase）

确认命令：

```bash
node -v
yarn -v
docker version
```

如果不使用 Docker 安装，可以不检查 `docker version`。

## 下一步

- [安装方式和版本对比](../get-started/quickstart.md) — 先比较不同安装方式和版本通道
- [安装 NocoBase 应用](./install-nocobase-app.md) — 使用 NocoBase CLI 初始化一个本地应用
- [AI Agent 接入指南](./quick-start.mdx) — 让 AI Agent 连接并操作 NocoBase
