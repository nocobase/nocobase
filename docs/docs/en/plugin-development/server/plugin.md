# Plugin

In NocoBase, a Server Plugin provides a modular way to extend and customize server-side functionality. Developers can extend the `Plugin` class from `@nocobase/server` to register events, APIs, permission configurations, and other custom logic at different lifecycle stages.

## Plugin Class

A basic plugin class structure is as follows:

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

## Lifecycle

The plugin's lifecycle methods are executed in the following order, with each method having a specific execution time and purpose:

| Lifecycle Method | Execution Time | Description |
|--------------|----------|------|
| **staticImport()** | Before plugin loading | A static method of the class, executed during an initialization phase that is independent of the application or plugin state. It is used for initialization work that does not depend on the plugin instance. |
| **afterAdd()** | Executes immediately after the plugin is added to the plugin manager | At this point, the plugin instance has been created, but not all plugins have been fully initialized. Basic initialization work can be performed here. |
| **beforeLoad()** | Executes before the `load()` of all plugins | At this point, all **enabled plugin instances** are accessible. It is suitable for preparatory work such as registering database models, listening to database events, and registering middleware. |
| **load()** | Executes when the plugin is loaded | The `load()` method starts executing only after all plugins' `beforeLoad()` methods have completed. It is suitable for registering resources, API interfaces, services, and other core business logic. |
| **install()** | Executes when the plugin is activated for the first time | Executes only once when the plugin is enabled for the first time. It is generally used for installation logic such as initializing database table structures and inserting initial data. |
| **afterEnable()** | Executes after the plugin is enabled | Executes every time the plugin is enabled. It can be used for post-enablement actions such as starting scheduled tasks, registering scheduled tasks, and establishing connections. |
| **afterDisable()** | Executes after the plugin is disabled | Executes when the plugin is disabled. It can be used for cleanup work such as cleaning up resources, stopping tasks, and closing connections. |
| **remove()** | Executes when the plugin is deleted | Executes when the plugin is completely removed. It is used for writing uninstall logic, such as deleting database tables and cleaning up files. |
| **handleSyncMessage(message)** | Message synchronization in multi-node deployments | When the application is running in multi-node mode, this is used to handle messages synchronized from other nodes. |

### Execution Order Description

The typical execution flow of lifecycle methods:

1.  **Static Initialization Phase**: `staticImport()`
2.  **Application Startup Phase**: `afterAdd()` → `beforeLoad()` → `load()`
3.  **First-time Plugin Enablement Phase**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Subsequent Plugin Enablement Phase**: `afterAdd()` → `beforeLoad()` → `load()`
5.  **Plugin Disablement Phase**: `afterDisable()` is executed when disabling a plugin
6.  **Plugin Deletion Phase**: `remove()` is executed when deleting a plugin

## app and its Members

In plugin development, you can access various APIs provided by the application instance through `this.app`. This is the core interface for extending plugin functionality. The `app` object contains various functional modules of the system, and developers can use these modules in the plugin's lifecycle methods to implement business requirements.

### app Member List

| Member Name | Type/Module | Main Purpose |
|-----------|------------|-----------|
| **logger** | `Logger` | Records system logs, supports different levels (info, warn, error, debug) of log output, facilitating debugging and monitoring. See [Logging](./logger.md) |
| **db** | `Database` | Provides database-related functions such as ORM layer operations, model registration, event listening, and transaction control. See [Database](./database.md). |
| **resourceManager** | `ResourceManager` | Used to register and manage REST API resources and action handlers. See [Resource Management](./resource-manager.md). |
| **acl** | `ACL` | Access Control Layer, used to define permissions, roles, and resource access policies to achieve fine-grained access control. See [Access Control](./acl.md). |
| **cacheManager** | `CacheManager` | Manages system-level cache, supports multiple cache backends such as Redis and in-memory cache, improving application performance. See [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Used to register, start, and manage scheduled tasks, supports Cron expression configuration. See [Scheduled Tasks](./cron-job-manager.md) |
| **i18n** | `I18n` | Internationalization support, provides multilingual translation and localization functions, making it easy for plugins to support multiple languages. See [Internationalization](./i18n.md) |
| **cli** | `CLI` | Manages the command-line interface, registering and executing custom commands, extending NocoBase CLI functionality. See [Command Line](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Manages multiple data source instances and their connections, supports multi-data source scenarios. See [Data Source Management](./collections.md) |
| **pm** | `PluginManager` | Plugin Manager, used for dynamically loading, enabling, disabling, and deleting plugins, and managing dependencies between plugins. |

> Note: For detailed usage of each module, please refer to the corresponding documentation chapters.