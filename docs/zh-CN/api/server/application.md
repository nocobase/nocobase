# Application

NocoBase 的应用程序类，服务端的应用进程将实例化该类并启动。因为继承自 [Koa](https://koajs.com/)，所以也可以直接调用 Koa 实例的方法。

同时因为 Koa 还继承自 [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter)，所以也可以通过 `app.on` 监听事件。

## 构造函数

**签名**

* `constructor(options: ApplicationOptions)`

创建一个应用实例。

**参数列表**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.database` | `IDatabaseOptions` or `Database` | `{}` | 数据库配置 |
| `options.resourcer` | `ResourcerOptions` | `{}` | 资源路由配置 |
| `options.cors` | `CorsOptions` | `{}` | 跨域配置，参考 [@koa/cors](https://npmjs.com/package/@koa/cors) |
| `options.dataWrapping` | `boolean` | `true` | 是否包装响应数据，`true` 则将把通常的 `ctx.body` 包装为 `{ data, meta }` 的结构。 |
| `options.registerActions` | `boolean` | `true` | 是否注册默认的 action |
| `options.i18n` | `I18nOptions` | `{}` | 国际化配置，参考 [i18next](https://www.npmjs.com/package/i18next) |
| `options.plugins` | `PluginConfiguration[]` | `[]` | 默认启用的插件配置 |

**示例**

```ts
import Application from '@nocobase/server';

const app = new Application({
  database: {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456',
    database: 'test',
  },
  resourcer: {
    prefix: '/api',
  },
  cors: {
    origin: '*',
  }
});
```

## 实例成员

### `db`

应用自动创建的数据库实例，通过 `@nocobase/database` 封装的数据库访问类，相关方法参考 [Database](./database)。

### `resourcer`

应用自动创建的资源路由管理实例，相关方法参考 [Resourcer](./resourcer)。

### `cli`

### `acl`

### `i18n`

### `appManager`

### `pm`

## 实例方法

### `getVersion()`

获取当前版本。

**签名**

* `getVersion(): string`

**示例**

```ts
console.log(app.getVersion()); // 0.7.4-alpha.7
```

### `plugin()`

向应用中注册插件的快捷方法，等同于 `app.pm.add()`，参考 [PluginManager](./plugin-manager#add)。

### `loadPluginConfig()`

批量注册插件与默认参数。

**签名**

* `loadPluginConfig(pluginsConfigurations: PluginConfiguration[]): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `pluginsConfigurations[]` | `string` | - | 插件的 npm 包名 |
| `pluginsConfigurations[]` | `[string, any]` | - | 插件的 npm 包名与默认参数 |

### `getPlugin()`

获取已注册的插件实例，等同于 `app.pm.get(name)`，参考 [PluginManager](./plugin-manager#get)。

### `use()`

注册应用级中间件的快捷方法，等同于 `koa.use()`。

### `collection()`

向数据库注册数据表模型的快捷方法，等同于 `app.db.collection()`，参考 [Database](./database#collection)。

### `resource()`

向资源路由管理器注册资源的快捷方法，等同于 `app.resourcer.define()`，参考 [Resourcer](./resourcer#define)。

### `actions()`

向资源路由管理器注册 action 的快捷方法，等同于 `app.resourcer.registerActions()`，参考 [Resourcer](./resourcer#registerActions)。

### `command()`

向命令行工具注册命令的快捷方法，等同于 `app.cli.command()`，参考 [cli](./cli)。

### `load()`

应用生命周期方法，用于加载所有已注册的插件，等同于 `app.pm.load()`，参考 [PluginManager](./plugin-manager#load)。

**签名**

* `async load(): Promise<void>`

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

**事件**

`start()` 调用会触发两个事件：

* `'beforeStart'`：在应用启动前触发。
* `'afterStart'`：在应用启动后触发。

### `stop()`

停止应用，如果应用正在监听，将停止监听，并关闭数据库连接。

**签名**

* `async stop(options: any): Promise<void>`

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options?` | `any` | - | 将透传至停止事件的参数 |

**事件**

`stop()` 调用会触发两个事件：

* `'beforeStop'`：在应用停止前触发。
* `'afterStop'`：在应用停止后触发。

### `destroy()`

销毁并停止应用，包含 `stop()` 的调用。

**事件**

`destroy()` 调用会触发两个事件：

* `'beforeDestroy'`：在应用销毁前触发。
* `'afterDestroy'`：在应用销毁后触发。

插件相关的销毁事件可以基于该事件进行扩展。

### `install()`

### `upgrade()`

## 事件

### `'beforeStart'`

### `'afterStart'`

### `'beforeStop'`

### `'afterStop'`

### `'beforeDestroy'`

### `'afterDestroy'`
