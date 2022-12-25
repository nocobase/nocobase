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

NocoBase Application is designed as a highly extensible framework, plugins can be written and injected to extend the functionality of the application. For example, the above-mentioned Web service can be replaced with a plugin.

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

## Life Cycle

Depending on the running mode, the Application has three life cycle stages.

### Install

Use the `install` command in `cli` to invoke the installation. Generally, if needs to write new tables or data to the database before using the plugin, you need to do it during installation. Installation is also required when using NocoBase for the first time.

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

Create an instance.

**Signature**

* `constructor(options: ApplicationOptions)`

**Parameters**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.database` | `IDatabaseOptions` or `Database` | `{}` | Database configuration |
| `options.resourcer` | `ResourcerOptions` | `{}` | Resource route configuration |
| `options.logger` | `AppLoggerOptions` | `{}` | Log |
| `options.cors` | [`CorsOptions`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/koa__cors/index.d.ts#L24) | `{}` | Cross-domain configuration, refer to [@koa/cors](https://npmjs.com/package/@koa/cors) |
| `options.dataWrapping` | `boolean` | `true` | Whether or not to wrap the response data, `true` will wrap the usual `ctx.body` into a `{ data, meta }` structure. |
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

NocoBase injects the following members to context by default, which can be used directly in the request function:

| 变量名 | 类型 | 描述 |
| --- | --- | --- |
| `ctx.app` | `Application` | 应用实例 |
| `ctx.db` | `Database` | 数据库实例 |
| `ctx.resourcer` | `Resourcer` | 资源路由管理器实例 |
| `ctx.action` | `Action` | 资源操作相关对象实例 |
| `ctx.logger` | `Winston` | 日志实例 |
| `ctx.i18n` | `I18n` | 国际化实例 |
| `ctx.t` | `i18n.t` | 国际化翻译函数快捷方式 |
| `ctx.getBearerToken()` | `Function` | 获取请求头中的 bearer token |

## 实例方法

### `use()`

注册中间件，兼容所有 [Koa 插件](https://www.npmjs.com/search?q=koa)

### `on()`

订阅应用级事件，主要与生命周期相关，等同于 `eventEmitter.on()`。所有可订阅事件参考 [事件](#事件)。

### `command()`

自定义 command

### `findCommand()`

查找已定义 command

### `runAsCLI()`

以 CLI 的方式运行。

### `load()`

加载应用配置。

**签名**

* `async load(): Promise<void>`

### `reload()`

重载应用配置。

### `install()`

初始化安装应用，同步安装插件。

### `upgrade()`

升级应用，同步升级插件。

### `start()`

启动应用，如果配置了监听的端口，将启动监听，之后应用即可接受 HTTP 请求。

**签名**

* `async start(options: StartOptions): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.listen?` | `ListenOptions` | `{}` | HTTP 监听参数对象 |
| `options.listen.port?` | `number` | 13000 | 端口 |
| `options.listen.host?` | `string` | `'localhost'` | 域名 |

### `stop()`

停止应用，此方法会关闭数据库连接，关闭 HTTP 端口，不会删除数据。

### `destroy()`

删除应用，此方法会删除应用对应的数据库。

## 事件

### `'beforeLoad'` / `'afterLoad'`
### `'beforeInstall'` / `'afterInstall'`
### `'beforeUpgrade'` / `'afterUpgrade'`
### `'beforeStart'` / `'afterStart'`
### `'beforeStop'` / `'afterStop'`
### `'beforeDestroy'` / `'afterDestroy'`
