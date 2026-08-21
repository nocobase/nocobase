---
title: "插件项目目录结构"
description: "NocoBase 插件项目结构：nb init 应用布局、plugins 插件目录、source 源码工程、storage 运行时目录。"
keywords: "项目结构,nb init,plugins,插件目录,NocoBase"
---

# 项目目录结构

通过 NocoBase CLI（`nb init`）初始化的应用，会生成一个标准的应用目录。CLI 支持 npm（`create-nocobase-app`）和 Git 两种来源，应用的顶层结构是一致的。

## 顶层目录概览

```bash
<app-path>/
├── .nb/                   # CLI 为当前 env 保存的元数据
├── source/                # 应用源码工程（NocoBase 核心 + 内置插件）
├── storage/               # 运行时数据目录
│   ├── plugins/           # 已编译插件（上传或导入的）
│   └── tar/               # 插件打包文件（.tgz）
├── plugins/               # 你的插件源码（nb scaffold plugin 生成在这里）
├── .env                   # 应用环境变量文件
```

## plugins/ 插件开发目录

`plugins/` 是你开发自定义插件的主要位置。通过 `nb scaffold plugin` 创建的插件会放在这里。

`nb` 会自动将 `plugins/` 下的插件以符号链接的形式同步到 `source/packages/plugins/`，供开发和构建流程使用。你不需要手动操作 `source/` 目录下的内容。

## source/ 源码工程目录

`source/` 目录包含 NocoBase 的完整源码工程，具体内容和项目来源有关：

- **npm 来源**（`create-nocobase-app`）：默认只有 `packages/plugins/` 等基础目录。
- **Git 来源**（推荐）：包含完整的框架核心源码（`packages/core/`）、内置插件等，AI 开发时可以直接参考。

## storage/ 运行时目录

`storage/` 存放运行时生成的数据与构建输出：

- `plugins/`：通过界面上传或 CLI 导入的打包插件。
- `tar/`：执行 `nb source build <plugin> --tar` 后生成的插件压缩包。

## 插件加载路径与优先级

插件可能存在于多个位置，NocoBase 启动时按以下优先级加载：

1. `source/packages/plugins` 中的源代码版本（用于本地开发与调试，由 `nb` 从 `plugins/` 自动同步）。
2. `storage/plugins` 中的打包版本（通过界面上传或 CLI 导入）。
3. `node_modules` 中的依赖包（通过 npm/yarn 安装或框架内置）。

如果同名插件同时存在于源码目录和打包目录，NocoBase 会优先加载源码版本，方便本地覆盖与调试。

## 插件目录模板

用 CLI 创建插件：

```bash
nb scaffold plugin @my-project/plugin-hello
```

生成的目录结构如下：

```bash
plugins/@my-project/plugin-hello/
├── dist/                    # 构建输出（按需生成）
├── src/                     # 源代码目录
│   ├── client-v2/           # 前端代码（区块、页面、模型等）
│   │   ├── plugin.ts        # 客户端插件主类
│   │   └── index.ts         # 客户端入口
│   ├── locale/              # 多语言资源（前后端共享）
│   ├── swagger/             # OpenAPI/Swagger 文档
│   └── server/              # 服务端代码
│       ├── collections/     # 数据表 / 集合定义
│       ├── commands/        # 自定义命令
│       ├── migrations/      # 数据库迁移脚本
│       ├── plugin.ts        # 服务端插件主类
│       └── index.ts         # 服务端入口
├── index.ts                 # 前后端桥接导出
├── client-v2.d.ts           # 前端类型声明
├── client-v2.js             # 前端构建产物
├── server.d.ts              # 服务端类型声明
├── server.js                # 服务端构建产物
├── .npmignore               # 发布忽略配置
└── package.json
```

:::tip 提示

构建完成后，`dist/` 及 `client-v2.js`、`server.js` 文件会在插件启用时被加载。开发阶段只需修改 `src/` 目录，发布前执行 `nb source build <plugin>` 或 `nb source build <plugin> --tar` 即可。

:::

## 相关链接

- [编写第一个插件](./write-your-first-plugin.md) — 从零创建插件并体验完整开发流程
- [服务端开发概述](./server/index.md) — 服务端插件的整体介绍与核心概念
- [客户端开发概述](./client/index.md) — 客户端插件的整体介绍与核心概念
- [构建与打包](./build.md) — 插件的构建、打包与分发流程
- [依赖管理](./dependency-management.md) — 插件依赖的声明与管理方式