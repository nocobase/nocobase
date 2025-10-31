# 服务端概述

本章介绍 NocoBase 服务端插件的目录结构、生命周期钩子以及常用 API，帮助你在自定义插件中扩展数据模型、命令和业务逻辑。

## 目录结构回顾

创建一个空插件时，服务端相关目录通常包含下列文件：

```bash
packages/plugins/@my-project/plugin-hello/
├─ package.json
├─ server.d.ts               # 服务端类型声明
├─ server.js                 # 服务端编译产物（构建后生成）
└─ src/
   ├─ index.ts               # 默认导出，桥接前后端
   ├─ server/
   │  ├─ index.ts            # 默认导出的服务端插件类
   │  ├─ plugin.ts           # 插件主类（继承 @nocobase/server Plugin）
   │  ├─ collections/        # 可选：数据集合定义
   │  ├─ commands/           # 可选：自定义 CLI 命令
   │  ├─ migrations/         # 可选：数据库迁移
   │  └─ utils/              # 可选：服务端工具方法
   ├─ locale/                # 可选：多语言资源
   └─ utils/                 # 可选：共享工具函数
```

> 构建产物 `server.js` 在插件启用时加载，开发阶段主要编辑 `src/server` 下的源码。

## Plugin 类与生命周期

服务端插件需要继承 `@nocobase/server` 提供的 `Plugin` 基类。常用钩子如下：

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {
    // 插件被添加到应用（pm.add）后触发，可注册全局事件监听
    this.app.on('beforeLoad', () => {
      this.logger.debug('app will load');
    });
  }

  async beforeLoad() {
    // 所有已激活插件已实例化，可注册数据模型、资源以及事件
    this.db.registerModels(/* ... */);
    this.app.resourceManager.define(/* ... */);
  }

  async load() {
    // 插件主体逻辑初始化，例如挂载服务、装配配置
  }

  async install() {
    // 首次启用或执行 install 命令时调用，可写入初始数据
  }

  async afterEnable() {
    // 插件启用完成，可启动后台任务或输出提示
  }

  async beforeDisable() {
    // 插件即将禁用，停止任务或解除事件绑定
  }

  async afterDisable() {
    // 插件禁用完成，可写入状态或日志
  }

  async remove() {
    // 插件卸载时调用，清理数据或释放资源
  }

  static async staticImport() {
    // 与插件启用状态无关：执行任一 nocobase CLI 命令（含自定义命令）时都会调用，可在此注册全局命令或做一次性初始化
    // 常规应用启动（未通过执行 CLI 命令入口）不会触发 staticImport
  }
}

export default PluginHelloServer;
```

### 生命周期顺序概览

- **激活插件**时：`afterAdd` -> `beforeLoad` → `loadCollections` → `load` -> `beforeEnable` → `install`（仅首次）→ `afterEnable`
- **禁用插件**时：`beforeDisable` → `afterDisable`
- **应用启动/重启**且插件已启用时：`afterAdd` → `beforeLoad` → `loadCollections` → `load`

补充说明：
- 执行 `pm enable`、`pm disable` 时，应用必须能够正常启动（需要完整加载以触发生命周期）
- `pm create`、`pm add`、`pm remove --force` 仅进行包的创建 / 下载 / 强制移除，不加载应用，也不会触发上述任何生命周期钩子，可在应用未启动时执行

## 约定式目录加载

激活状态下的插件，会自动解析 `src/server` 下的约定目录：

- `collections/`：在 `beforeLoad` → `load` 之间加载，注册数据表结构、关联关系等。
- `commands/`：在执行 CLI 命令前加载，常用于扩展 `nocobase` 自身命令。
- `migrations/`：在运行 `nocobase upgrade` 前加载，执行数据库迁移。
- `locale/`：按当前语言动态合并插件多语言资源。

未启用的插件不会加载这些目录内容。

## 常用属性与工具

在插件实例方法中可以访问以下对象：

- `this.app`：服务应用实例，提供 `resourceManager`、`command`、`i18n` 等能力。
- `this.pm`：插件管理器，可获取其他插件实例或依赖信息。
- `this.db`：数据库访问层，可注册模型、字段、操作符等。
- `this.logger`：插件级日志记录器。
- `this.t()` / `this.app.i18n`：多语言工具。

在迁移、命令等场景下，也提供对应的上下文对象：

- **Migration**：`migration.db`、`migration.app`、`migration.pluginVersion` 等。
- **CLI Command**：`app.command()`、`app.findCommand()`、`app.addCommand()`。
- **Koa Context**：`ctx.app`、`ctx.db`、`ctx.body`、`ctx.throw()` 等。

## 常见使用场景

1. **自定义类、注册事件**：在 `beforeLoad` 中定义。
2. **资源和操作的配置**：在 `load` 中定义。
3. **扩展 CLI**：在 `commands/` 目录或 `staticImport` 中注册命令，支持自动化脚本。
4. **管理权限**：通过 `app.acl` 配置访问控制。
5. **本地化**：将文案放在 `locale/` 中，并使用 `this.t()` 在代码中引用。

## 进一步学习

- 初次编写插件可先完成《[编写第一个插件](../write-your-first-plugin)》中的示例。
- 如需了解前端插件侧能力，请阅读《[客户端概述](../client/index)》（待补充）。
- 深入 API 可查阅 `@nocobase/server` 包中的类型定义与示例代码。
