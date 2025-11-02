# Command

In NocoBase, a Command is used to execute operations related to the application or plugins in the command line, such as running system tasks, performing migrations or sync operations, initializing configurations, or interacting with a running application instance. Developers can define custom commands for plugins and register them through the `app` object, which can be executed in the CLI as `nocobase <command>`.

## Command Types

In NocoBase, commands are registered in two ways:

| Type | Registration Method | Plugin Enabled Required | Typical Scenarios |
|------|------------|------------------|-----------|
| Dynamic Command | `app.command()` | ✅ Yes | Plugin business-related commands |
| Static Command | `Application.registerStaticCommand()` | ❌ No | Installation, initialization, maintenance commands |

## Dynamic Commands

Use `app.command()` to define plugin commands, which can only be executed after the plugin is enabled. Command files should be placed in the plugin's `src/server/commands/*.ts` directory.

Example

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

Description

- `app.command('echo')`: Defines a command named `echo`.
- `.option('-v, --version')`: Adds an option to the command.
- `.action()`: Defines the command's execution logic.
- `app.version.get()`: Gets the current application version.

Execute Command

```bash
nocobase echo
nocobase echo -v
```

## Static Commands

Registered using `Application.registerStaticCommand()`, static commands can be executed without enabling the plugin, making them suitable for tasks like installation, initialization, migration, or debugging. They are registered in the plugin class's `staticImport()` method.

Example

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

Execute Command

```bash
nocobase echo
nocobase echo --version
```

Description

- `Application.registerStaticCommand()` registers the command before the application is instantiated.
- Static commands are typically used to execute global tasks that are independent of the application or plugin state.

## Command API

The command object provides three optional helper methods to control the command's execution context:

| Method | Function | Example |
|------|------|------|
| `ipc()` | Communicate with the running application instance (via IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Verify that the database configuration is correct | `app.command('seed').auth().action()` |
| `preload()` | Preload application configuration (executes `app.load()`) | `app.command('sync').preload().action()` |

Configuration Details

- **`ipc()`**
  By default, a command executes in a new application instance.
  When `ipc()` is enabled, the command interacts with the currently running application instance via inter-process communication (IPC), which is suitable for real-time operations like refreshing the cache or sending notifications.

- **`auth()`**
  Checks if the database configuration is available before executing the command.
  If the database configuration is incorrect or the connection fails, the command will not proceed. This is often used for tasks involving database writes or reads.

- **`preload()`**
  Preloads the application configuration before executing the command, which is equivalent to running `app.load()`.
  Suitable for commands that depend on the configuration or plugin context.

For more API methods, please refer to [AppCommand](/api/server/app-command).

## Common Examples

Initialize Default Data

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

Reload Cache on a Running Instance (IPC Mode)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

Statically Register an Installation Command

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```