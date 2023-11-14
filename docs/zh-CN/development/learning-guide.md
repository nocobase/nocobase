# 学习路线指南

## 1. 从安装运行 NocoBase 开始

**相关文档：<a href="/welcome/getting-started/installation" target="_blank">快速开始</a>**

主要命令包括：

下载

```bash
yarn create/git clone
yarn install
```

安装

```bash
yarn nocobase install
```

运行

```bash
# for development
yarn dev

# for production
yarn build
yarn start
```

## 2. 了解 NocoBase 平台提供的核心功能

**相关文档：<a href="/manual" target="_blank">使用手册</a>**

主要的三部分包括：

- UI 设计器：主要包括区块、字段和操作
- 插件管理器：功能需求扩展
- 配置中心：已激活插件提供的配置功能

## 3. 进一步了解插件管理器的使用

**相关文档：<a href="/development" target="_blank">插件开发</a>**

NocoBase 提供了简易的插件管理器界面，但是在界面上只能处理本地插件的 enable、disable 和 remove，完整的操作需要通过 CLI

```bash
# 创建插件
yarn pm create hello
# 注册插件
yarn pm add hello
# 激活插件
yarn pm enable hello
# 禁用插件
yarn pm disable hello
# 删除插件
yarn pm remove hello
```

更多插件示例，查看 packages/samples，通过 samples 插件能够了解插件的基本用法，就可以进一步开发插件了。

## 4. 开发新插件，了解模块分布

**相关文档：<a href="/development/guide" target="_blank">扩展指南</a>**

[编写第一个插件](/development/your-fisrt-plugin) 章节，虽然简单的讲述了插件的主要开发流程，但是为了更快速的介入插件细节，你可能需要进一步了解 NocoBase 框架的模块分布：

- Server
  - Collections & Fields：主要用于系统表配置，业务表建议在「配置中心 - 数据表配置」里配置
  - Resources & Actions：主要用于扩展 Action API
  - Middleware：中间件
  - Events：事件
  - I18n：服务端国际化
- Client
  - UI Schema Designer：页面设计器
  - UI Router：有自定义页面需求时
  - Plugin Settings Manager：为插件提供配置页面
  - I18n：客户端国际化
- Devtools
  - Commands：自定义命令行
  - Migrations：迁移脚本

## 5. 查阅各模块主要 API

**相关文档：<a href="/api" target="_blank">API 参考</a>**

查看各模块的 packages/samples，进一步了解模块主要 API 的用法

- Server
  - Collections & Fields
    - db.collection
    - db.import
  - Resources & Actions
    - app.resourcer.define
    - app.resourcer.registerActions
  - Middleware
    - app.use
    - app.acl.use
    - app.resourcer.use
  - Events
    - app.on
    - app.db.on
  - I18n
    - app.i18n
    - ctx.i18n
- Client
  - UI Schema Designer
    - SchemaComponent
    - SchemaInitializer
    - SchemaSettings
  - UI Router
    - RouteSwitchProvider
    - RouteSwitch
  - I18n
    - app.i18n
    - useTranslation
- Devtools
  - Commands
    - app.command
    - app.findCommand
  - Migrations
    - app.db.addMigration
    - app.db.addMigrations
