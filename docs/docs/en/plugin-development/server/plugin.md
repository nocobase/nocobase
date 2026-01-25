# Plugin

In NocoBase, Server Plugin provides a modular way to extend and customize server-side functionality. Developers can extend the `Plugin` class from `@nocobase/server` to register events, APIs, permission configurations, and other custom logic at different lifecycle stages.

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

Plugin lifecycle methods execute in the following order. Each method has its specific execution timing and purpose:

| Lifecycle Method          | Execution Timing | Description |
| ------------------------- | ---------------- | ----------- |
| **staticImport()**        | Before plugin loads | Static class method, executed during initialization phase independent of application or plugin state, used for initialization work that doesn't depend on plugin instances. |
| **afterAdd()**            | Executed immediately after plugin is added to plugin manager | Plugin instance has been created, but not all plugins have finished initializing. Can perform some basic initialization work. |
| **beforeLoad()**          | Executed before all plugins' `load()` | Can access all **enabled plugin instances** at this point. Suitable for registering database models, listening to database events, registering middleware, and other preparation work. |
| **load()**                | Executed when plugin loads | All plugins' `beforeLoad()` complete before `load()` starts. Suitable for registering resources, API interfaces, services, and other core business logic. |
| **install()**              | Executed when plugin is first activated | Only executed once when plugin is first enabled, generally used for initializing database table structures, inserting initial data, and other installation logic. |
| **afterEnable()**         | Executed after plugin is enabled | Executed every time plugin is enabled, can be used to start scheduled tasks, register scheduled tasks, establish connections, and other post-enable actions. |
| **afterDisable()**        | Executed after plugin is disabled | Executed when plugin is disabled, can be used to clean up resources, stop tasks, close connections, and other cleanup work. |
| **remove()**               | Executed when plugin is removed | Executed when plugin is completely removed, used to write uninstallation logic, such as deleting database tables, cleaning files, etc. |
| **handleSyncMessage(message)** | Message synchronization in multi-node deployment | When the application runs in multi-node mode, used to handle messages synchronized from other nodes. |

### Execution Order Description

Typical execution flow of lifecycle methods:

1. **Static Initialization Phase**: `staticImport()`
2. **Application Startup Phase**: `afterAdd()` → `beforeLoad()` → `load()`
3. **First Plugin Enable Phase**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Second Plugin Enable Phase**: `afterAdd()` → `beforeLoad()` → `load()`
5. **Plugin Disable Phase**: `afterDisable()` is executed when plugin is disabled
6. **Plugin Remove Phase**: `remove()` is executed when plugin is removed

## app and Related Members

In plugin development, you can access various APIs provided by the application instance through `this.app`, which is the core interface for extending plugin functionality. The `app` object contains various functional modules of the system. Developers can use these modules in plugin lifecycle methods to implement business requirements.

### app Member List

| Member Name        | Type/Module     | Main Purpose |
| ------------------ | --------------- | ------------ |
| **logger**         | `Logger`        | Record system logs, support different levels (info, warn, error, debug) of log output, convenient for debugging and monitoring. See [Logger](./logger.md) |
| **db**             | `Database`      | Provide ORM layer operations, model registration, event listening, transaction control, and other database-related functions. See [Database](./database.md). |
| **resourceManager** | `ResourceManager` | Used to register and manage REST API resources and operation handlers. See [Resource Manager](./resource-manager.md). |
| **acl**            | `ACL`           | Access control layer, used to define permissions, roles, and resource access policies, implementing fine-grained permission control. See [ACL](./acl.md). |
| **cacheManager**   | `CacheManager`  | Manage system-level cache, support Redis, memory cache, and other cache backends to improve application performance. See [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Used to register, start, and manage scheduled tasks, support Cron expression configuration. See [Scheduled Tasks](./cron-job-manager.md) |
| **i18n**           | `I18n`          | Internationalization support, provide multi-language translation and localization functionality, convenient for plugins to support multiple languages. See [Internationalization](./i18n.md) |
| **cli**            | `CLI`           | Manage command-line interface, register and execute custom commands, extend NocoBase CLI functionality. See [Command Line](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Manage multiple data source instances and their connections, support multi-data-source scenarios. See [Data Source Management](./collections.md) |
| **pm**             | `PluginManager` | Plugin manager, used to dynamically load, enable, disable, and remove plugins, manage plugin dependencies. |

> Note: For detailed usage of each module, please refer to the corresponding documentation chapters.

