# 项目目录结构

无论是通过 Git 克隆源码，还是使用 `create-nocobase-app` 初始化项目，生成的 NocoBase 项目本质上都是一个基于 Yarn Workspace 的多包仓库。

## 顶层目录速览

以下示例以 `my-nocobase-app/` 为根目录，不同环境可能存在少数差异。

```text
my-nocobase-app/
├── packages/              # 项目源码
│   ├── plugins/           # 开发中的插件源码（未编译）
├── storage/               # 运行时数据与动态产物
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # 已编译的插件，包括从界面上传的插件
│   └── tar/               # 生成的插件压缩包
├── scripts/               # 常用脚本与工具命令
├── .env*                  # 按环境划分的变量配置
├── lerna.json             # Lerna 工作区配置
├── package.json           # 根包配置，声明 workspace 与脚本
├── tsconfig*.json         # TypeScript 配置（前端、服务端、路径映射）
├── vitest.config.mts      # Vitest 测试配置
└── playwright.config.ts   # Playwright E2E 配置
```

## packages/ 子目录

`packages/` 目录承载了 NocoBase 的核心能力及可扩展包，实际内容取决于项目来源：

- **通过 `create-nocobase-app` 创建的工程**：默认只提供 `packages/plugins/`，用于放置你自己的插件源码，结构上每个子目录都是独立的 npm 包。
- **直接克隆官方源码仓库**：会看到 `core/`、`plugins/`、`pro-plugins/`、`presets/` 等更多子目录，它们包含框架内核、内置插件和官方预设方案。

无论采用哪种方式，`packages/plugins` 都是开发者编写和调试自定义插件的首选位置。

## storage/ 运行时目录

`storage/` 保存的是运行时生成的数据和构建产物，常见子目录含义如下：

- `apps/`：多应用场景下的应用配置与缓存。
- `logs/`：运行日志、调试输出。
- `uploads/`：用户上传的附件、媒体资源。
- `plugins/`：通过界面上传或从远程拉取的打包插件（若已安装）。
- `tar/`：执行 `yarn build <plugin> --tar` 后生成的插件压缩包（命令执行后出现）。

> `storage` 目录通常配置 Git 忽略，部署或备份时需要单独处理。

## 环境配置与工程脚本

- `.env`、`.env.test`、`.env.e2e`：分别用于本地运行、单元/集成测试、端到端测试的环境变量。
- `scripts/`：维护脚本（如数据库初始化、发布辅助脚本等）。

## 插件存放路径与优先级

插件可能同时存在于多个目录。NocoBase 启动时会按优先级加载：

1. `packages/plugins` 中的源码版本（适合集成开发与调试）。
2. `storage/plugins` 中的打包版本（通过界面上传或 CLI 导入）。
3. `node_modules` 中的依赖包（通过 npm/yarn 安装或框架内置）。

当同名插件同时存在于源码和打包目录时，会优先加载源码版本，方便在本地覆盖线上版本进行调试。

## 单个插件目录模板

使用 CLI 初始化插件：

```bash
yarn pm create @my-project/plugin-hello
```

生成后的结构示例：

```text
packages/plugins/@my-project/plugin-hello/
├── dist/                    # 构建产物（按需生成）
├── src/                     # 源码目录
│   ├── client/              # 前端代码（区块、页面、模型等）
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
├── index.ts                 # 默认导出（桥接前后端）
├── client.d.ts              # 前端类型声明
├── client.js                # 客户端编译产物（构建后生成）
├── server.d.ts              # 服务端类型声明
├── server.js                # 服务端编译产物（构建后生成）
├── .npmignore               # 发布忽略配置
└── package.json
```

> 构建后生成的 `dist` `client.js`、`server.js` 会在插件启用时被加载；日常开发修改 `src/` 目录即可，发布前再执行 `yarn build <plugin>` 或 `yarn build <plugin> --tar`。
