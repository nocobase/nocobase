# Application

## 概览

### Web服务 
Nocobase Application 是基于 [Koa](https://koajs.com/) 实现的 WEB 框架，兼容 Koa 的 API。

```javascript
// index.js
const { Application } = require('@nocobase/server');

// 创建App实例，并配置数据库连接信息
const app = new Application({
    database: {
        dialect: 'sqlite',
        storage: ':memory:',
    }
});

// 注册中间件 响应请求
app.use(async ctx => {
  ctx.body = 'Hello World';
});

// 以命令行模式启动
app.runAsCLI();
```

在命令行中运行 `node index.js start` 启动服务后，使用 `curl` 请求服务。

```bash
$> curl localhost:3000
Hello World
```

### 命令行工具
Nocobase Application 中也内置了 `cli commander`，可以当作命令行工具运行。

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

在命令行中运行

```bash
$> node cmd.js hello
hello world
```

### 插件注入

Nocobase Application 被设计为高度可扩展的框架，可以编写插件注入到应用中扩展功能。
例如上面的 Web 服务可以替换为插件形式。

```javascript
const { Application, Plugin } = require('@nocobase/server');

// 通过继承 Plugin 类来编写插件
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

// 注入插件
app.plugin(HelloWordPlugin, { name: 'hello-world-plugin'} );

app.runAsCLI()
```

### 更多示例

更加详细的插件开发文档请参考 [插件开发](./plugin.md)。
Application 类的更多示例可参考 [examples](https://github.com/nocobase/nocobase/blob/main/examples/index.md)

## 生命周期

根据不同运行模式，Application 有三种生命周期：

### 安装
使用 `cli` 中的 `install` 命令调用安装。
一般来说，插件在使用之前若需要在数据库中写入新表或者数据，都需要在安装时执行。在初次使用 Nocobase 时也需要调用安装。

* 调用 `load` 方法，载入已注册的插件。
* 触发 `beforeInstall` 事件。
* 调用 `db.sync` 方法，同步数据库。
* 调用 `pm.install` 方法，执行已注册插件的 `install` 方法。
* 写入 `nocobase` 版本。
* 触发 `afterInstall`。
* 调用 `stop` 方法，结束安装。

### 启动
使用 `cli` 中的 `start` 命令来启动 Nocobase Web 服务。

* 调用 `load` 方法，载入已注册的插件。
* 调用 `start` 方法
  * 触发 `beforeStart`
  * 启动端口监听
  * 触发 `afterStart`

### 更新

当需要更新 Nocobase 时，可使用 `cli` 中的 `upgrade` 命令。

* 调用 `load` 方法，载入已注册的插件。
* 触发 `beforeUpgrade`。
* 调用 `db.migrator.up` 方法，执行数据库迁移。
* 调用 `db.sync` 方法，同步数据库。
* 调用 `version.update` 方法，更新 `nocobase` 版本。
* 触发 `afterUpgrade`。
* 调用 `stop` 方法，结束更新。

## 构造函数

### `constructor()`

创建一个应用实例。

**签名**

* `constructor(options: ApplicationOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.database` | `IDatabaseOptions` or `Database` | `{}` | 数据库配置 |
| `options.resourcer` | `ResourcerOptions` | `{}` | 资源路由配置 |
| `options.logger` | `AppLoggerOptions` | `{}` | 日志 |
| `options.cors` | [`CorsOptions`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/koa__cors/index.d.ts#L24) | `{}` | 跨域配置，参考 [@koa/cors](https://npmjs.com/package/@koa/cors) |
| `options.dataWrapping` | `boolean` | `true` | 是否包装响应数据，`true` 则将把通常的 `ctx.body` 包装为 `{ data, meta }` 的结构。 |
| `options.registerActions` | `boolean` | `true` | 是否注册默认的 [actions](#) |
| `options.i18n` | `I18nOptions` | `{}` | 国际化配置，参考 [i18next](https://www.i18next.com/overview/api) |
| `options.plugins` | `PluginConfiguration[]` | `[]` | 默认启用的插件配置 |

Type

```ts
interface ApplicationOptions {

}
```

## 实例成员

### `cli`

命令行工具实例，参考 npm 包 [Commander](https://www.npmjs.com/package/commander)。

### `db`

数据库实例，相关 API 参考 [Database](/api/database)。

### `resourcer`

应用初始化自动创建的资源路由管理实例，相关 API 参考 [Resourcer](/api/resourcer)。

### `acl`

ACL 实例，相关 API 参考 [ACL](/api/acl)。


### `logger`

Winston 实例，相关 API 参考 [Winston](https://github.com/winstonjs/winston#table-of-contents)。

### `i18n`

I18next 实例，相关 API 参考 [I18next](https://www.i18next.com/overview/api)。

### `pm`

插件管理器实例，相关 API 参考 [PluginManager](./plugin-manager)。

### `version`

应用版本实例，相关 API 参考 [ApplicationVersion](./application-version)。

### `middleware`

内置的中间件有：

- logger
- i18next
- bodyParser
- cors
- dataWrapping
- db2resource
- restApiMiddleware

### `context`

继承自 koa 的 context，可以通过 `app.context` 访问，用于向每个请求注入上下文可访问的内容。参考 [Koa Context](https://koajs.com/#app-context)。

NocoBase 默认对 context 注入了以下成员，可以在请求处理函数中直接使用：

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
