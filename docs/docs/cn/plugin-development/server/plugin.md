---
title: "Server Plugin 服务端插件"
description: "NocoBase 服务端插件：继承 Plugin 类、afterAdd、beforeLoad、load、install 生命周期、注册资源与事件。"
keywords: "Server Plugin,Plugin 类,afterAdd,beforeLoad,load,install,服务端插件,NocoBase"
---

# Plugin 插件

在 NocoBase 中，**服务端插件（Server Plugin）** 是扩展服务端功能的主要方式。你可以在插件目录的 `src/server/plugin.ts` 里继承 `@nocobase/server` 提供的 `Plugin` 基类，然后在不同的生命周期阶段注册事件、接口、权限等自定义逻辑。

## 插件类

一个基本的插件类结构如下：

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## 生命周期

插件的生命周期方法按以下顺序执行，每个方法都有特定的执行时机和用途：

| 生命周期方法 | 执行时机 | 说明 |
|--------------|----------|------|
| **staticImport()** | 插件加载前 | 类的静态方法，在跟应用或插件状态无关的初始化阶段执行，用于不依赖插件实例的初始化工作。 |
| **afterAdd()** | 插件被添加到 PluginManager 后立即执行 | 此时插件实例已创建，但并非所有插件都已初始化完成，可以做一些基础的初始化。 |
| **beforeLoad()** | 在所有插件的 `load()` 之前执行 | 此时已经能拿到所有**已启用的插件实例**。适合注册数据库模型、监听数据库事件、注册中间件等准备工作。 |
| **load()** | 插件加载时执行 | 所有插件的 `beforeLoad()` 执行完毕后才会开始执行 `load()`。适合注册资源、API 接口等核心业务逻辑——比如通过 `resourceManager` 注册[自定义 REST API](./resource-manager.md)。**注意：** `load()` 阶段数据库还没有完成同步，不能执行数据库查询或写入操作——数据库操作应放在 `install()` 或请求处理函数中。 |
| **install()** | 插件首次激活时执行 | 只在插件第一次被启用时执行一次，通常来说用于初始化数据库表结构、插入初始数据等安装逻辑。`install()` 只在首次激活时执行——如果后续版本需要变更表结构或迁移数据，应该用 [Migration 升级脚本](./migration.md) 来处理。 |
| **afterEnable()** | 插件被启用后执行 | 每次插件被启用时都会执行，可以用来启动定时任务、建立连接等。 |
| **afterDisable()** | 插件被禁用后执行 | 可以用来清理资源、停止任务、关闭连接等。 |
| **remove()** | 插件被删除时执行 | 用于编写卸载逻辑，比如删除数据库表、清理文件等。 |
| **handleSyncMessage(message)** | 多节点部署时的消息同步 | 应用运行在多节点模式下时，用于处理从其他节点同步过来的消息。 |

### 执行顺序说明

生命周期方法的典型执行流程：

1. **静态初始化阶段**：`staticImport()`
2. **应用启动阶段**：`afterAdd()` → `beforeLoad()` → `load()`
3. **插件首次启用阶段**：`afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **插件二次启用阶段**：`afterAdd()` → `beforeLoad()` → `load()`
5. **插件禁用阶段**：禁用插件时执行 `afterDisable()`
6. **插件删除阶段**：删除插件时执行 `remove()`

## app 及相关成员

在插件开发中，通过 `this.app` 可以访问应用实例提供的各种 API——这是插件扩展功能的核心入口。`app` 对象包含了系统的各个功能模块，你可以在插件的生命周期方法中使用它们。

### app 成员列表

| 成员名称 | 类型/模块 | 主要用途 |
|-----------|------------|-----------|
| **logger** | `Logger` | 记录系统日志，支持 info、warn、error、debug 等级别。详见 [Logger 日志](./logger.md) |
| **db** | `Database` | ORM 层操作、模型注册、事件监听、事务控制等。详见 [Database 数据库](./database.md) |
| **resourceManager** | `ResourceManager` | 注册和管理 REST API 资源与操作处理器。详见 [ResourceManager 资源管理](./resource-manager.md) |
| **acl** | `ACL` | 定义权限、角色和资源访问策略。详见 [ACL 权限控制](./acl.md) |
| **cacheManager** | `CacheManager` | 管理系统级缓存，支持 Redis、内存缓存等多种后端。详见 [Cache 缓存](./cache.md) |
| **cronJobManager** | `CronJobManager` | 注册和管理定时任务，支持 Cron 表达式。详见 [CronJobManager 定时任务](./cron-job-manager.md) |
| **i18n** | `I18n` | 多语言翻译和本地化。详见 [I18n 国际化](./i18n.md) |
| **cli** | `CLI` | 注册自定义命令，扩展 NocoBase CLI。详见 [Command 命令行](./command.md) |
| **dataSourceManager** | `DataSourceManager` | 管理多个数据源实例及其连接。详见 [DataSourceManager 数据源管理](./data-source-manager.md) |
| **pm** | `PluginManager` | 动态加载、启用、禁用、删除插件，管理插件间的依赖关系。 |

:::tip 提示

各个模块的详细用法，请参考对应的文档章节。

:::

## 相关链接

- [服务端开发概述](./index.md) — 服务端各模块的总览和导航
- [Collections 数据表](./collections.md) — 用代码定义或扩展数据表结构
- [Database 数据库](./database.md) — CRUD、Repository、事务与数据库事件
- [Migration 数据迁移](./migration.md) — 插件升级时的数据迁移脚本
- [Event 事件](./event.md) — 应用级和数据库级的事件监听与处理
- [ResourceManager 资源管理](./resource-manager.md) — 注册自定义 REST API 和操作
- [编写第一个插件](../write-your-first-plugin.md) — 从零开始创建一个完整的插件
- [Logger 日志](./logger.md) — 记录系统日志
- [ACL 权限控制](./acl.md) — 定义权限和访问策略
- [Cache 缓存](./cache.md) — 管理系统级缓存
- [CronJobManager 定时任务](./cron-job-manager.md) — 注册和管理定时任务
- [I18n 国际化](./i18n.md) — 多语言翻译
- [Command 命令行](./command.md) — 注册自定义 CLI 命令
- [DataSourceManager 数据源管理](./data-source-manager.md) — 管理多个数据源
