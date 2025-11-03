# 项目目录结构

无论是通过 Git 克隆源码，还是使用 `create-nocobase-app` 初始化项目，生成的 NocoBase 工程本质上都是一个基于 **Yarn Workspace** 的多包仓库。

## 顶层目录概览

以下示例以 `my-nocobase-app/` 为项目目录。不同环境下可能略有差异：

```bash
my-nocobase-app/
├── packages/              # 项目源代码
│   ├── plugins/           # 正在开发的插件源码（未编译）
├── storage/               # 运行时数据与动态生成内容
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # 已编译插件（包括通过界面上传的）
│   └── tar/               # 插件打包文件（.tar）
├── scripts/               # 实用脚本与工具命令
├── .env*                  # 不同环境的变量配置
├── lerna.json             # Lerna 工作区配置
├── package.json           # 根包配置，声明 workspace 与脚本
├── tsconfig*.json         # TypeScript 配置（前端、后端、路径映射）
├── vitest.config.mts      # Vitest 单元测试配置
└── playwright.config.ts   # Playwright E2E 测试配置
```

## packages/ 子目录说明

`packages/` 目录包含 NocoBase 的核心模块与可扩展包，内容取决于项目来源：

- **通过 `create-nocobase-app` 创建的项目**：默认仅包含 `packages/plugins/`，用于存放自定义插件源码。每个子目录都是独立的 npm 包。
- **克隆官方源码仓库**：可见更多子目录，如 `core/`、`plugins/`、`pro-plugins/`、`presets/` 等，分别对应框架核心、内置插件与官方预设方案。

无论哪种情况，`packages/plugins` 都是开发和调试自定义插件的主要位置。

## storage/ 运行时目录

`storage/` 存放运行时生成的数据与构建输出。常见子目录说明如下：

- `apps/`：多应用场景下的配置与缓存。
- `logs/`：运行日志与调试输出。
- `uploads/`：用户上传的文件和媒体资源。
- `plugins/`：通过界面上传或 CLI 导入的打包插件。
- `tar/`：执行 `yarn build <plugin> --tar` 后生成的插件压缩包。

> 通常建议将 `storage` 目录加入 `.gitignore`，在部署或备份时单独处理。

## 环境配置与工程脚本

- `.env`、`.env.test`、`.env.e2e`：分别用于本地运行、单元/集成测试、端到端测试。
- `scripts/`：存放常用运维脚本（如数据库初始化、发布辅助工具等）。

## 插件加载路径与优先级

插件可能存在于多个位置，NocoBase 启动时会按以下优先级加载：

1. `packages/plugins` 中的源代码版本（用于本地开发与调试）。  
2. `storage/plugins` 中的打包版本（通过界面上传或 CLI 导入）。  
3. `node_modules` 中的依赖包（通过 npm/yarn 安装或框架内置）。

当同名插件同时存在于源码目录与打包目录时，系统会优先加载源码版本，方便本地覆盖与调试。

## 插件目录模板

使用 CLI 创建插件：

```bash
yarn pm create @my-project/plugin-hello
```

生成的目录结构如下：

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # 构建输出（按需生成）
├── src/                     # 源代码目录
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
├── index.ts                 # 前后端桥接导出
├── client.d.ts              # 前端类型声明
├── client.js                # 前端构建产物
├── server.d.ts              # 服务端类型声明
├── server.js                # 服务端构建产物
├── .npmignore               # 发布忽略配置
└── package.json
```

> 构建完成后，`dist/` 及 `client.js`、`server.js` 文件会在插件启用时被加载。  
> 开发阶段只需修改 `src/` 目录，发布前执行 `yarn build <plugin>` 或 `yarn build <plugin> --tar` 即可。