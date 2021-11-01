---
order: 2
toc: menu
---

# 快速入门

本篇文章将帮助你快速安装并启动 NocoBase，并介绍基本的使用方法。

## 1. 环境要求

请确保你的系统已经安装了 Node.js 12.x 或以上版本。

```bash
$ node -v
v12.13.1
```

如果你没有安装 Node.js 可以从官网下载并安装[最新的 LTS 版本](https://nodejs.org/en/download/)。如果你打算长期与 Node.js 打交道，推荐使用 [nvm](https://github.com/nvm-sh/nvm)（Win 系统可以使用 [nvm-windows](https://github.com/coreybutler/nvm-windows) ）来管理 Node.js 版本。

另外，推荐使用 yarn 包管理器。

```bash
$ npm install --global yarn
```

由于国内网络环境的原因，强烈建议你更换国内镜像。

```bash
$ yarn config set registry https://registry.npm.taobao.org/
```

环境准备就绪，下一步我们来安装一个 NocoBase 应用。

## 2. 安装与启动

为了方便新人快速的安装并启动， NocoBase 提供了一行非常简单的命令：

```bash
$ yarn create nocobase-app my-nocobase-app --quickstart
```

上面这行命令会帮助你快速的下载、安装并启动 NocoBase 应用。如果你喜欢分步执行，也可以这样：

```bash
# 1. 创建项目
$ yarn create nocobase-app my-nocobase-app

# 2. 切换到项目根目录
$ cd my-nocobase-app

# 3. 初始化数据
$ yarn nocobase init --import-demo

# 4. 启动项目
$ yarn start
```

分步执行有助于理解整个流程，也更易于排查安装过程中出现的问题。如果出现问题，你也无法自行解决，请将终端输出的错误日志贴在 [GitHub Issue](https://github.com/nocobase/nocobase/issues) 上，大家会一起帮你解决问题。

当你看到下面内容，说明你刚才创建的 NocoBase 已经安装并启动了。

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/c77012649cab2677117c7628fd11960a.jpg" style="max-width: 800px; width: 100%; box-shadow: 0 8px 24px -2px rgb(0 0 0 / 5%); border-radius: 15px;">

## 3. 登录 NocoBase

使用浏览器打开 http://localhost:8000 ，你会看到 NocoBase 的登录页面，初始的账号为 `admin@nocobase.com`，密码为 `admin`。

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/158b580706930486132d1f927a71691a.jpg" style="max-width: 800px; width: 100%; box-shadow: 0 8px 24px -2px rgb(0 0 0 / 5%); border-radius: 10px;">

## 4. 创建数据表和字段

NocoBase 提供了一个全局的数据表配置面板，方便用户快速的创建数据表和字段。

<video src="https://nocobase.oss-cn-beijing.aliyuncs.com/6e2df7073bf3ea23a10c5d4620dc2be0.m4v" style="max-width: 800px; width: 100%; border-radius: 5px;" controls="controls">
your browser does not support the video tag
</video>

按照视频的提示，创建文章（posts）和标签（tags）两张数据表和若干字段。

## 5. 配置菜单和页面

接着，添加新的菜单分组和页面用于管理刚才创建的文章和标签数据。

<video src="https://nocobase.oss-cn-beijing.aliyuncs.com/405d1d3a6d8db31d247e06f5af18de4b.m4v" style="max-width: 800px; width: 100%; border-radius: 5px;" controls="controls">
your browser does not support the video tag
</video>

## 6. 在页面内布置区块

在上一步配置的页面里创建文章和标签的表格区块，并启用需要开放的操作。

```ts
// 视频
```

## 7. 添加文章和标签数据

现在可以添加文章和标签了。

```ts
// 视频
```

## 8. 通过 API 访问

除了可视化界面以外，也可以通过 NocoBase 提供的 [REST API](/zh-CN/api/rest-api) 访问数据资源。

- 文章资源：http://localhost:8000/api/posts
- 标签资源：http://localhost:8000/api/tags

你可以直接点击打开上面 API 地址，或者使用类似 Postman 的工具访问。NocoBase 也提供了更贴合的 API Client（JavaScript SDK）来管理 NocoBase 数据资源，更多内容请查看 [API Client](/zh-CN/api/client#apiclient) 章节。