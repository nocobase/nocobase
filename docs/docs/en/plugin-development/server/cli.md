# Command Line

In a plugin, custom commands must be placed in the `src/server/commands/*.ts` directory of the plugin, with the following content:

```ts
import { Application } from '@nocobase/server';

export default function(app: Application) {
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

:::warning
Custom commands in a plugin are only effective after the plugin is installed and activated.
:::

Special Configuration for Commands

- `ipc()` When the app is running, the command line sends instructions via IPC to operate the running app instance. If `ipc()` is not configured, a new application instance will be created to perform the operation (without interfering with the running app instance).
- `auth()` Performs a database check. If the database configuration is incorrect, the command will not be executed.
- `preload()` Whether to preload the application configuration, i.e., execute `app.load()`.

You can configure it according to the actual use of the command. The examples are as follows:

```ts
app.command('a').ipc().action()
app.command('a').auth().action()
app.command('a').preload().action()
```