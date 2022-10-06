# Application

基于 [Koa](https://koajs.com/) 实现的 WEB 框架，兼容所有的 Koa 插件。

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

### `cli`

命令行工具实例，参考 npm 包 [Commander](https://www.npmjs.com/package/commander)。

### `db`

数据库实例，相关 API 参考 [Database](/api/database)。

### `resourcer`

应用初始化自动创建的资源路由管理实例，相关 API 参考 [Resourcer](/api/resourcer)。

### `acl`

ACL 实例，相关 API 参考 [ACL](/api/acl)。

### `i18n`

I18next 实例，相关 API 参考 [I18next](https://www.i18next.com/overview/api)。

### `pm`

插件管理器实例，相关 API 参考 [PluginManager](./plugin-manager)。

### `version`

应用版本实例，相关 API 参考 [ApplicationVersion](./application-version)。

### `middleware`

内置的中间件有：

- i18next
- bodyParser
- cors
- dataWrapping
- collection2resource
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
| `ctx.i18n` | `I18n` | 国际化实例 |
| `ctx.t` | `i18n.t` | 国际化翻译函数快捷方式 |
| `ctx.getBearerToken()` | `Function` | 获取请求头中的 bearer token |

## 实例方法

### `use()`

注册中间件，兼容所有 [Koa 插件](https://www.npmjs.com/search?q=koa)

### `on()`

订阅应用级事件，主要与生命周期相关，等同于 `eventEmitter.on()`。所有可订阅事件参考 [事件](#事件)。

### `command()`

### `findCommand()`

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


**示例**

```ts
app.on('beforeStart', async () => {
  console.log('app before start');
});
```

### beforeLoadAll
### afterLoadAll
### beforeLoadPlugin
### afterLoadPlugin
### beforeInstallPlugin
### afterInstallPlugin
### beforeInstall
### afterInstall
### beforeUpgrade
### afterUpgrade
### beforeStart
### afterStart
### beforeStop
### afterStop
### beforeDestroy
### afterDestroy
