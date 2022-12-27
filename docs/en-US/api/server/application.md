# Application

## Overview

### Web Service

NocoBase Application is a web framework implemented based on [Koa](https://koajs.com/), compatible with Koa API.

```javascript
// index.js
const { Application } = require('@nocobase/server');

// Create App instance and configure the database
const app = new Application({
    database: {
        dialect: 'sqlite',
        storage: ':memory:',
    }
});

// Register middleware, response to requests
app.use(async ctx => {
  ctx.body = 'Hello World';
});

// Run in the CLI mode
app.runAsCLI();
```

After running `node index.js start` in CLI to start service, use `curl` to request service.

```bash
$> curl localhost:3000
Hello World
```

### CLI Tool

NocoBase Application has a built-in `cli commander`, which can be run as CLI tool.

```javascript
// cmd.js
const {Application} = require('@nocobase/server');
const app = new Application({
  database: {
    dialect: 'sqlite',
    storage: ':memory:',
  }
});

app.cli.command('hello').action(async () => {
  console.log("hello world")
});

app.runAsCLI()
```

Run in CLI:

```bash
$> node cmd.js hello
hello world
```

### Inject Plugin

NocoBase Application is designed as a highly extensible framework, plugins can be written and injected to the applicationto to extend its functionality. For example, the above-mentioned web service can be replaced with a plugin.

```javascript
const { Application, Plugin } = require('@nocobase/server');

// Write plugin by inheriting the Plugin class
class HelloWordPlugin extends Plugin {
  load() {
    this.app.use(async (ctx, next) => {
      ctx.body = "Hello World";
    })
  }
}

const app = new Application({
  database: {
    dialect: 'sqlite',
    storage: ':memory:',
  }
});

// Inject plugin
app.plugin(HelloWordPlugin, { name: 'hello-world-plugin'} );

app.runAsCLI()
```

### More Examples

Please refer to the detailed guides of [plugin development](./plugin.md). Read more [examples](https://github.com/nocobase/nocobase/blob/main/examples/index.md) of the Application class.

## Lifecycle

Application has three lifecycle stages depends on the running mode.

### Install

Use the `install` command in `cli` to invoke the installation. Generally, if needs to write new tables or data to the database before using the plugin, you have to do it during installation. Installation is also required when using NocoBase for the first time.

* Call the `load` method to load registered plugins.
* Trigger the `beforeInstall` event.
* Call the `db.sync` method to synchronize database. 
* Call the `pm.install` method to execute the `install` methods of registered plugins.
* Write the version of `nocobase`.
* Trigger the `afterInstall` event.
* Call the `stop` method to end installation.

### Start

Use the `start` command in `cli` to start NocoBase Web service.

* Call the `load` method to load registered plugins.
* Call the `start` medthod:
  * Trigger the `beforeStart` event
  * Start port listening
  * Trigger the `afterStart` event

### Upgrade

Use the `upgrade` command in `cli` to upgrade NocoBase Web service when needed.

* Call the `load` method to load registered plugins.
* Trigger the `beforeUpgrade` event.
* Call the `db.migrator.up` method to migrate database.
* Call the `db.sync` method to synchronize database.
* Call the `version.update` method to update the version of `nocobase`.
* Trigger the `afterUpgrade` event.
* Call the `stop` medthod to end upgrade.

## Constructor

### `constructor()`

Create an application instance.

**Signature**

* `constructor(options: ApplicationOptions)`

**Parameters**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.database` | `IDatabaseOptions` or `Database` | `{}` | Database configuration |
| `options.resourcer` | `ResourcerOptions` | `{}` | Resource route configuration |
| `options.logger` | `AppLoggerOptions` | `{}` | Log |
| `options.cors` | [`CorsOptions`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/koa__cors/index.d.ts#L24) | `{}` | Cross-domain configuration, refer to [@koa/cors](https://npmjs.com/package/@koa/cors) |
| `options.dataWrapping` | `boolean` | `true` | Whether or not to wrap the response data, `true` will wrap the usual `ctx.body` into a `{ data, meta }` structure |
| `options.registerActions` | `boolean` | `true` | Whether or not to register the default [actions](#) |
| `options.i18n` | `I18nOptions` | `{}` | Internationalization configuration, refer to [i18next](https://www.i18next.com/overview/api) |
| `options.plugins` | `PluginConfiguration[]` | `[]` | Configuration of the plugins enabled by default |

Type

```ts
interface ApplicationOptions {

}
```

## Instance Members

### `cli`

CLI tool instance, refer to the npm package [Commander](https://www.npmjs.com/package/commander)。

### `db`

Database instance, refer to [Database](/api/database) for the related API.

### `resourcer`

Resource route management instance created automatically during app initialization, refer to [Resourcer](/api/resourcer) for the related API.

### `acl`

ACL instance, refer to [ACL](/api/acl) for the related API.

### `logger`

Winston instance, refer to [Winston](https://github.com/winstonjs/winston#table-of-contents) for the related API.

### `i18n`

I18next instance, refer to [I18next](https://www.i18next.com/overview/api) for the related API.

### `pm`

Plugin manager instance, refer to [PluginManager](./plugin-manager) for the related API.

### `version`

App version instance, refer to [ApplicationVersion](./application-version) for the related API.

### `middleware`

Built-in middleware includes:

- logger
- i18next
- bodyParser
- cors
- dataWrapping
- db2resource
- restApiMiddleware

### `context`

Context inherited from koa, accessible via `app.context`, is used to inject context-accessible content to each request. Refer to [Koa Context](https://koajs.com/#app-context).

NocoBase injects the following members to context by default, which can be used directly in the request handler function:

| Variable Name | Type | Description |
| --- | --- | --- |
| `ctx.app` | `Application` | Application instance |
| `ctx.db` | `Database` | Database instance |
| `ctx.resourcer` | `Resourcer` | Resource route manager instance |
| `ctx.action` | `Action` | Resource action related object instance |
| `ctx.logger` | `Winston` | Log instance |
| `ctx.i18n` | `I18n` | Internationlization instance |
| `ctx.t` | `i18n.t` | Shortcut of internationalized translation function |
| `ctx.getBearerToken()` | `Function` | Get the bearer token in the header of request |

## Instance Methods

### `use()`

Register middleware, compatible with all [Koa plugins](https://www.npmjs.com/search?q=koa).

### `on()`

Subscribe to application-level events, mainly are related to lifecycle. It is equivalent to `eventEmitter.on()`. Refer to [events](#events) for all subscribable events.

### `command()`

Customize command.

### `findCommand()`

Find defined command.

### `runAsCLI()`

Run as CLI.

### `load()`

Load application configuration.

**Signature**

* `async load(): Promise<void>`

### `reload()`

Reload application configuration.

### `install()`

Initialize the installation of the application, meanwhile, install the plugin.

### `upgrade()`

Upgrade application, meanwhile, upgrade plugin.

### `start()`

Start application, listening will also be started if the listening port is configured, then the application can accept HTTP requests.

**Signature**

* `async start(options: StartOptions): Promise<void>`

**Parameters**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.listen?` | `ListenOptions` | `{}` | HTTP Listening parameters object |
| `options.listen.port?` | `number` | 13000 | Port |
| `options.listen.host?` | `string` | `'localhost'` | Domain name |

### `stop()`

Stop application. This method will deconnect database, close HTTP port, but will not delete data.

### `destroy()`

Delete application. This methos will delete the corresponding database of application.

## Events

### `'beforeLoad'` / `'afterLoad'`
### `'beforeInstall'` / `'afterInstall'`
### `'beforeUpgrade'` / `'afterUpgrade'`
### `'beforeStart'` / `'afterStart'`
### `'beforeStop'` / `'afterStop'`
### `'beforeDestroy'` / `'afterDestroy'`
