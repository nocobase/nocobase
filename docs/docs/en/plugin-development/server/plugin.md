---
title: "Server Plugin"
description: "NocoBase server-side plugin: extending the Plugin class, afterAdd, beforeLoad, load, install lifecycle, registering resources and events."
keywords: "Server Plugin,Plugin class,afterAdd,beforeLoad,load,install,server plugin,NocoBase"
---

# Plugin

In NocoBase, **Server Plugin** is the primary way to extend server-side functionality. You can extend the `Plugin` base class provided by `@nocobase/server` in your plugin directory's `src/server/plugin.ts`, then register events, APIs, permissions, and other custom logic at different lifecycle stages.

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
| **afterAdd()**            | Executed immediately after plugin is added to PluginManager | Plugin instance has been created, but not all plugins have finished initializing. Can perform some basic initialization. |
| **beforeLoad()**          | Executed before all plugins' `load()` | Can access all **enabled plugin instances** at this point. Suitable for registering database models, listening to database events, registering middleware, and other preparation work. |
| **load()**                | Executed when plugin loads | All plugins' `beforeLoad()` complete before `load()` starts. Suitable for registering resources, API interfaces, and other core business logic -- for example, registering [custom REST APIs](./resource-manager.md) via `resourceManager`. **Note:** The database has not finished synchronizing during the `load()` phase, so you cannot perform database queries or writes -- database operations should be placed in `install()` or request handlers. |
| **install()**              | Executed when plugin is first activated | Only executed once when plugin is first enabled, typically used for initializing database table structures, inserting initial data, and other installation logic. `install()` only runs on first activation -- if subsequent versions need to change table structures or migrate data, use [Migration](./migration.md) scripts instead. |
| **afterEnable()**         | Executed after plugin is enabled | Executed every time plugin is enabled, can be used to start scheduled tasks, establish connections, etc. |
| **afterDisable()**        | Executed after plugin is disabled | Can be used to clean up resources, stop tasks, close connections, etc. |
| **remove()**               | Executed when plugin is removed | Used to write uninstallation logic, such as deleting database tables, cleaning files, etc. |
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

In plugin development, you can access various APIs provided by the application instance through `this.app` -- this is the core entry point for extending plugin functionality. The `app` object contains various functional modules of the system, which you can use in plugin lifecycle methods.

### app Member List

| Member Name | Type/Module | Main Purpose |
|-------------|------------|--------------|
| **logger** | `Logger` | Record system logs, supporting info, warn, error, debug levels. See [Logger](./logger.md) |
| **db** | `Database` | ORM layer operations, model registration, event listening, transaction control, etc. See [Database](./database.md) |
| **resourceManager** | `ResourceManager` | Register and manage REST API resources and action handlers. See [ResourceManager](./resource-manager.md) |
| **acl** | `ACL` | Define permissions, roles, and resource access policies. See [ACL](./acl.md) |
| **cacheManager** | `CacheManager` | Manage system-level cache, supporting Redis, memory cache, and other backends. See [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Register and manage scheduled tasks, supporting Cron expressions. See [CronJobManager](./cron-job-manager.md) |
| **i18n** | `I18n` | Multi-language translation and localization. See [I18n](./i18n.md) |
| **cli** | `CLI` | Register custom commands, extending NocoBase CLI. See [Command](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Manage multiple data source instances and their connections. See [DataSourceManager](./data-source-manager.md) |
| **pm** | `PluginManager` | Dynamically load, enable, disable, and remove plugins, managing inter-plugin dependencies. |

:::tip Tip

For detailed usage of each module, please refer to the corresponding documentation chapters.

:::

## Related Links

- [Server Development Overview](./index.md) -- Overview and navigation for all server-side modules
- [Collections](./collections.md) -- Define or extend data table structures with code
- [Database](./database.md) -- CRUD, Repository, transactions, and database events
- [Migration](./migration.md) -- Data migration scripts for plugin upgrades
- [Event](./event.md) -- Application-level and database-level event listening and handling
- [ResourceManager](./resource-manager.md) -- Register custom REST APIs and actions
- [Writing Your First Plugin](../write-your-first-plugin.md) -- Create a complete plugin from scratch
- [Logger](./logger.md) -- Record system logs
- [ACL](./acl.md) -- Define permissions and access policies
- [Cache](./cache.md) -- Manage system-level cache
- [CronJobManager](./cron-job-manager.md) -- Register and manage scheduled tasks
- [I18n](./i18n.md) -- Multi-language translation
- [Command](./command.md) -- Register custom CLI commands
- [DataSourceManager](./data-source-manager.md) -- Manage multiple data sources

