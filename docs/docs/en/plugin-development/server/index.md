# Server-side Overview

This chapter introduces the directory structure, lifecycle hooks, and common APIs of NocoBase server-side plugins, helping you extend data models, commands, and business logic in your custom plugins.

## Directory Structure Review

When creating an empty plugin, the server-side related directories usually contain the following files:

```bash
packages/plugins/@my-project/plugin-hello/
├─ package.json
├─ server.d.ts               # Server-side type declarations
├─ server.js                 # Server-side build artifact (generated after build)
└─ src/
   ├─ index.ts               # Default export, bridges front-end and back-end
   ├─ server/
   │  ├─ index.ts            # Default exported server-side plugin class
   │  ├─ plugin.ts           # Main plugin class (extends @nocobase/server Plugin)
   │  ├─ collections/        # Optional: Collection definitions
   │  ├─ commands/           # Optional: Custom CLI commands
   │  ├─ migrations/         # Optional: Database migrations
   │  └─ utils/              # Optional: Server-side utility methods
   ├─ locale/                # Optional: Locale resources
   └─ utils/                 # Optional: Shared utility functions
```

> The build artifact `server.js` is loaded when the plugin is enabled. During the development phase, you will mainly edit the source code under `src/server`.

## Plugin Class and Lifecycle

Server-side plugins need to extend the `Plugin` base class provided by `@nocobase/server`. The common hooks are as follows:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {
    // Triggered after the plugin is added to the application (pm.add), can register global event listeners
    this.app.on('beforeLoad', () => {
      this.logger.debug('app will load');
    });
  }

  async beforeLoad() {
    // All activated plugins have been instantiated, can register data models, resources, and events
    this.db.registerModels(/* ... */);
    this.app.resourceManager.define(/* ... */);
  }

  async load() {
    // Main plugin logic initialization, e.g., mounting services, assembling configurations
  }

  async install() {
    // Called on first enable or when executing the install command, can write initial data
  }

  async afterEnable() {
    // Plugin enabling is complete, can start background tasks or output prompts
  }

  async beforeDisable() {
    // Plugin is about to be disabled, stop tasks or unbind events
  }

  async afterDisable() {
    // Plugin disabling is complete, can write status or logs
  }

  async remove() {
    // Called when the plugin is uninstalled, cleans up data or releases resources
  }

  static async staticImport() {
    // Independent of plugin enable status: called when any nocobase CLI command (including custom commands) is executed, can register global commands or perform one-time initialization here
    // Normal application startup (not through the CLI command entry point) will not trigger staticImport
  }
}

export default PluginHelloServer;
```

### Lifecycle Order Overview

- **When activating a plugin**: `afterAdd` -> `beforeLoad` → `loadCollections` → `load` -> `beforeEnable` → `install` (first time only) → `afterEnable`
- **When disabling a plugin**: `beforeDisable` → `afterDisable`
- **On application startup/restart** when the plugin is already enabled: `afterAdd` → `beforeLoad` → `loadCollections` → `load`

Additional notes:
- When executing `pm enable` or `pm disable`, the application must be able to start normally (it needs to be fully loaded to trigger the lifecycle).
- `pm create`, `pm add`, and `pm remove --force` only create/download/force-remove the package, do not load the application, and will not trigger any of the lifecycle hooks mentioned above. They can be executed when the application is not running.

## Convention-based Directory Loading

For plugins in an activated state, NocoBase will automatically parse the conventional directories under `src/server`:

- `collections/`: Loaded between `beforeLoad` → `load` to register collection structures, relationships, etc.
- `commands/`: Loaded before executing CLI commands, often used to extend `nocobase`'s own commands.
- `migrations/`: Loaded before running `nocobase upgrade` to execute database migrations.
- `locale/`: Dynamically merges the plugin's locale resources according to the current language.

Disabled plugins will not load the contents of these directories.

## Common Properties and Utilities

In plugin instance methods, you can access the following objects:

- `this.app`: The server application instance, providing capabilities like `resourceManager`, `command`, `i18n`, etc.
- `this.pm`: The plugin manager, which can be used to get other plugin instances or dependency information.
- `this.db`: The database access layer, where you can register models, fields, operators, etc.
- `this.logger`: The plugin-level logger.
- `this.t()` / `this.app.i18n`: Internationalization (i18n) utilities.

In scenarios like migrations and commands, corresponding context objects are also provided:

- **Migration**: `migration.db`, `migration.app`, `migration.pluginVersion`, etc.
- **CLI Command**: `app.command()`, `app.findCommand()`, `app.addCommand()`.
- **Koa Context**: `ctx.app`, `ctx.db`, `ctx.body`, `ctx.throw()`, etc.

## Common Use Cases

1. **Customizing classes, registering events**: Define in `beforeLoad`.
2. **Configuring resources and actions**: Define in `load`.
3. **Extending the CLI**: Register commands in the `commands/` directory or in `staticImport` to support automation scripts.
4. **Managing permissions**: Configure access control via `app.acl`.
5. **Localization**: Place text in `locale/` and reference it in the code using `this.t()`.

## Further Learning

- When writing a plugin for the first time, you can start by completing the example in "[Write Your First Plugin](../write-your-first-plugin)".
- To learn about the capabilities of client-side plugins, please read "[Client-side Overview](../client/index)" (to be added).
- For a deeper dive into the API, you can refer to the type definitions and example code in the `@nocobase/server` package.