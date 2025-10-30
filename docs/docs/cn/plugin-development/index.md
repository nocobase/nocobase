# 插件开发概述

NocoBase 采用微内核架构，核心只负责插件生命周期调度、依赖管理与基础能力封装。所有业务特性（包括界面、权限、自动化处理等）都以插件的形式提供或扩展。因此，理解插件的组织方式、生命周期与管理手段，是定制化 NocoBase 的第一步。

## 核心理念

- **即插即用**：插件可以按需安装、启用或停用，核心无需修改即可组合出不同的业务形态。
- **前后端一体**：一个插件通常同时包含服务端与客户端实现，以保持数据逻辑与界面行为的一致性。
- **模块化演进**：通过插件的依赖关系，可以拆分大型功能，逐步迭代和复用已有能力。

## 插件基础结构

每个插件都是独立的 npm 包，并约定了最小目录结构：

```bash
plugin-hello/
├─ package.json          # 声明名称、依赖以及 nocobase 插件元信息
├─ client.js             # 编译产物，供前端运行时加载
├─ server.js             # 编译产物，供服务端运行时加载
├─ src/
│  ├─ client             # 客户端源码，可注册区块、操作、字段等
│  │  └─ ...
│  └─ server             # 服务端源码，可注册资源、事件、命令行等
│     └─ ...
```

- `package.json` 中的 `name` 与 `version` 需要符合 npm 规范，并在 `nocobase` 字段里描述插件元数据（如启用状态、依赖等）。
- `client.js`、`server.js` 通常由 `yarn build` 过程生成。开发时直接编辑 `src` 目录；发布时需构建为 JS 文件供运行时加载。

## 目录约定与加载顺序

NocoBase 默认会扫描以下目录寻找插件：

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # 源码方式开发的插件（优先级高）
└── storage/
    └── plugins/          # 已编译的插件，包括从界面上传的插件
```

- `packages/plugins`：适合与应用源码共同维护，支持 TypeScript 与源码调试。
- `storage/plugins`：存放已打包的插件压缩包或构建产物，多用于生产环境或从 UI 上传的插件。
- 若同名插件同时存在于两个目录，会优先加载 `packages/plugins` 中的版本，方便本地调试覆盖线上版本。

## 插件生命周期与状态

一个插件通常会经历以下状态：

1. **创建（create）**：通过 CLI 初始化插件骨架或从外部导入源码。
2. **拉取（add）**：下载（或在 monorepo 中建立依赖链接）插件包到本地，尚未写入数据库注册信息。
3. **启用（enable）**：首次启用时会完成“注册 + 初始化”——写入数据库元数据并加载前后端入口；后续再次启用仅执行加载逻辑。
4. **停用（disable）**：卸载前后端入口，释放资源但保留已注册信息。
5. **卸载（remove）**：彻底移除插件及其持久化配置与注册记录。

说明：
- add 仅负责获取（下载）插件包；真正的安装由首次 enable 触发。
- 若只是把包 add 下来但未 enable，插件不会出现在运行时的功能中。

这些操作既可在管理界面完成，也可通过 CLI 批量执行：

```bash
# 1. 创建插件骨架
yarn pm create @my-project/plugin-hello
# 2. 拉取（下载/链接）插件包
yarn pm add @my-project/plugin-hello
# 3. 启用（如果第一次启用同时完成安装）
yarn pm enable @my-project/plugin-hello
# 4. 停用
yarn pm disable @my-project/plugin-hello
# 5. 卸载
yarn pm remove @my-project/plugin-hello
```

若插件之间存在依赖关系，系统会在首次 enable 时检查版本约束，并在停用或卸载时提示可能受影响的插件。

## 插件管理界面

在浏览器访问插件管理器（默认地址：http://localhost:13000/admin/settings/plugin-manager），即可：

- 查看插件列表及状态（已安装、已启用、未启用等）。
- 上传插件包，方便在不同环境之间迁移。
- 查看插件描述、版本与依赖信息。

![插件管理器](https://static-docs.nocobase.com/f914d978dbfd8c45a650bd88ef867832.png)

界面操作与 CLI 命令共用同一套底层逻辑，选择哪种方式取决于场景：批量操作更适合命令行，零散管理或非技术同学更适合使用界面。
