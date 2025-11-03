# Plugin 插件

在 NocoBase 中，服务端插件（Server Plugin）提供了一种模块化的方式，用于扩展和定制服务端的功能。开发者可以通过继承 `@nocobase/server` 的 `Plugin` 类，在不同的生命周期阶段注册事件、接口、权限配置等自定义逻辑。

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

插件的生命周期方法按照以下顺序执行，每个方法都有其特定的执行时机和用途：

| 生命周期方法 | 执行时机 | 说明 |
|--------------|----------|------|
| **staticImport()** | 插件加载前 | 类的静态方法，在应用或插件状态无关的初始化阶段执行，用于执行不依赖插件实例的初始化工作。 |
| **afterAdd()** | 插件被添加到插件管理器后立即执行 | 此时插件实例已创建，但并非所有插件都已初始化完成。可以执行一些基础的初始化工作。 |
| **beforeLoad()** | 在所有插件的 `load()` 之前执行 | 此时可以获取到所有**已启用的插件实例**。适合注册数据库模型、监听数据库事件、注册中间件等准备工作。 |
| **load()** | 插件加载时执行 | 所有插件的 `beforeLoad()` 执行完毕后才会开始执行 `load()`。适合注册资源、API 接口、服务等核心业务逻辑。 |
| **install()** | 插件首次激活时执行 | 仅在插件第一次被启用时执行一次，一般用于初始化数据库表结构、插入初始数据等安装逻辑。 |
| **afterEnable()** | 插件被启用后执行 | 每次插件被启用时都会执行，可用于启动定时任务、注册计划任务、建立连接等启用后的动作。 |
| **afterDisable()** | 插件被禁用后执行 | 插件被禁用时执行，可用于清理资源、停止任务、关闭连接等清理工作。 |
| **remove()** | 插件被删除时执行 | 插件被完全删除时执行，用于编写卸载逻辑，例如删除数据库表、清理文件等。 |
| **handleSyncMessage(message)** | 多节点部署时的消息同步 | 当应用运行在多节点模式下时，用于处理从其他节点同步过来的消息。 |

### 执行顺序说明

生命周期方法的典型执行流程：

1. **静态初始化阶段**：`staticImport()`
2. **应用启动阶段**：`afterAdd()` → `beforeLoad()` → `load()`
3. **插件首次启用阶段**：`afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **插件二次启用阶段**：`afterAdd()` → `beforeLoad()` → `load()`
4. **插件禁用阶段**：禁用插件时执行 `afterDisable()`
5. **插件删除阶段**：删除插件时执行 `remove()`

## app 及相关成员

在插件开发中，通过 `this.app` 可以访问应用实例提供的各种 API，这是插件扩展功能的核心接口。`app` 对象包含了系统的各个功能模块，开发者可以在插件的生命周期方法中使用这些模块来实现业务需求。

### app 成员列表

| 成员名称 | 类型/模块 | 主要用途 |
|-----------|------------|-----------|
| **logger** | `Logger` | 记录系统日志，支持不同级别（info、warn、error、debug）的日志输出，便于调试和监控。详见 [日志](./logger.md) |
| **db** | `Database` | 提供 ORM 层操作、模型注册、事件监听、事务控制等数据库相关功能。详见 [数据库](./database.md)。 |
| **resourceManager** | `ResourceManager` | 用于注册和管理 REST API 资源与操作处理器。详见 [资源管理](./resource-manager.md)。 |
| **acl** | `ACL` | 访问控制层，用于定义权限、角色和资源访问策略，实现细粒度的权限控制。详见 [权限控制](./acl.md)。 |
| **cacheManager** | `CacheManager` | 管理系统级缓存，支持 Redis、内存缓存等多种缓存后端，提升应用性能。详见 [缓存](./cache.md) |
| **cronJobManager** | `CronJobManager` | 用于注册、启动和管理定时任务，支持 Cron 表达式配置。详见 [定时任务](./cron-job-manager.md) |
| **i18n** | `I18n` | 国际化支持，提供多语言翻译和本地化功能，便于插件支持多语言。详见 [国际化](./i18n.md) |
| **cli** | `CLI` | 管理命令行接口，注册和执行自定义命令，扩展 NocoBase CLI 功能。详见 [命令行](./command.md) |
| **dataSourceManager** | `DataSourceManager` | 管理多个数据源实例及其连接，支持多数据源场景。详见 [数据源管理](./collections.md) |
| **pm** | `PluginManager` | 插件管理器，用于动态加载、启用、禁用、删除插件，管理插件间的依赖关系。 |

> 提示：各个模块的详细使用方法，请参考相应的文档章节。
