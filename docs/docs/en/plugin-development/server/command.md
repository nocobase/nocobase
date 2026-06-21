---
title: "Command"
description: "NocoBase server-side custom commands: app.command, commander, CLI extensions, yarn nocobase subcommands."
keywords: "Command,app.command,commander,CLI,yarn nocobase,NocoBase"
---

# Command

In NocoBase, commands are used to execute operations related to applications or plugins in the command line -- such as running system tasks, executing migrations, initializing configuration, or interacting with running application instances. You can define custom commands for plugins and register them through the `app` object, executing them in CLI as `nocobase <command>`.

## Command Types

In NocoBase, command registration is divided into two types:

| Type        | Registration Method                          | Does Plugin Need to be Enabled | Typical Scenarios |
| ----------- | -------------------------------------------- | ----------------------------- | ----------------- |
| Dynamic Command | `app.command()`                            | ✅ Yes                        | Plugin business-related commands |
| Static Command | `Application.registerStaticCommand()`       | ❌ No                         | Installation, initialization, maintenance commands |

## Dynamic Commands

Use `app.command()` to define plugin commands. Commands can only be executed after the plugin is enabled. Command files are typically placed in `src/server/commands/*.ts` in the plugin directory.

### Example

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Where:

- `app.command('echo')` -- Defines a command named `echo`.
- `.option('-v, --version')` -- Adds an option to the command.
- `.action()` -- Defines command execution logic.
- `app.version.get()` -- Gets the current application version.

### Execute Command

```bash
nocobase echo
nocobase echo -v
```

## Static Commands

Use `Application.registerStaticCommand()` to register. Static commands can be executed without enabling plugins, suitable for installation, initialization, migration, or debugging tasks. They are typically registered in the plugin class's `staticImport()` method.

### Example

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

### Execute Command

```bash
nocobase echo
nocobase echo --version
```

Where:

- `Application.registerStaticCommand()` registers commands before the application is instantiated.
- Static commands are usually used to execute global tasks unrelated to application or plugin state.

## Command API

Command objects provide three optional helper methods to control command execution context:

| Method     | Purpose                                    | Example                               |
| ---------- | ------------------------------------------ | ------------------------------------- |
| `ipc()`    | Communicate with running application instances (via IPC) | `app.command('reload').ipc().action()` |
| `auth()`   | Verify database configuration is correct   | `app.command('seed').auth().action()` |
| `preload()` | Preload application configuration (execute `app.load()`) | `app.command('sync').preload().action()` |

### Configuration Description

- **`ipc()`**
  Generally speaking, commands execute in a new application instance. After enabling `ipc()`, commands interact with the currently running application instance through inter-process communication (IPC), suitable for real-time operation commands (such as refreshing cache, sending notifications).

- **`auth()`**
  Check whether database configuration is available before command execution. If database configuration is incorrect or connection fails, the command will not continue. Commonly used for tasks involving database writes or reads.

- **`preload()`**
  Preload application configuration before executing the command, equivalent to executing `app.load()`. Suitable for commands that depend on configuration or plugin context.

For more API methods, see [AppCommand API](../../api/server/app-command.md).

## Common Examples

### Initialize Default Data

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

### Reload Cache for Running Instance (IPC Mode)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

### Static Registration of Installation Command

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```

## Related Links

- [Plugin](./plugin.md) -- Plugin lifecycle and core API
- [Server Development Overview](./index.md) -- Overview of all server-side modules
- [Test](./test.md) -- How to write server-side plugin tests
- [Migration](./migration.md) -- Data migration and upgrade scripts
- [Plugin Development Overview](../index.md) -- Overall plugin development introduction
- [AppCommand API](../../api/server/app-command.md) -- Complete API reference for AppCommand

