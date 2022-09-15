# Resourcer

Resourcer 主要用于管理 API 资源与路由，也是 NocoBase 的内置模块，app 默认会自动创建一个 Resourcer 实例，大部分情况你可以通过 `app.resourcer` 访问。

资源路由管理器主要通过 [资源](/api/server/resourcer/resource) + [操作](/api/server/resourcer/action) 的概念定义服务端 API 接口，与 RESTful 的概念相似。大部分资源通过映射数据库表生成，包含常规的 CRUD 操作，以覆盖常见场景。但如果有额外需求，也可以在此基础上扩展更多的资源类型和操作类型。

## 包结构

可通过以下方式引入相关实体：

```ts
import Resourcer, {
  Resource,
  Action,
  Middleware,
  branch
} from '@nocobase/resourcer';
```

## 构造函数

用于创建 Resourcer 管理器实例。由于 app 默认创建一个内置实例，所以通常不会直接使用构造函数。

**签名**

* `constructor(options: ResourcerOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `prefix` | `string` | - | 路由路径前缀 |
| `accessors` | `Object` | _以下成员值_ | 默认操作方法名称标识 |
| `accessors.list` | `string` | `'list'` | 列举操作方法名称标识 |
| `accessors.get` | `string` | `'get'` | 获取操作方法名称标识 |
| `accessors.create` | `string` | `'create'` | 创建操作方法名称标识 |
| `accessors.update` | `string` | `'update'` | 更新操作方法名称标识 |
| `accessors.delete` | `string` | `'destroy'` | 删除操作方法名称标识 |
| `accessors.add` | `string` | `'add'` | 增加关联操作方法名称标识 |
| `accessors.remove` | `string` | `'remove'` | 移除关联操作方法名称标识 |
| `accessors.set` | `string` | `'set'` | 全量设置关联操作方法名称标识 |

**示例**

在创建 app 时件时，可以通过 `resourcer` 选项传入：

```ts
const app = new Application({
  // 对应默认 resourcer 实例的配置项
  resourcer: {
    prefix: process.env.API_BASE_PATH
  }
});
```

## 实例方法

### `define()`

定义并向资源管理器注册一个资源对象。通常代替 `Resource` 类的构造函数使用。

**签名**

* `define(options: ResourceOptions): Resource`

**参数**

详见 [Resource 构造函数](/api/server/resourcer/resource#构造函数)。

**示例**

```ts
app.resourcer.define({
  name: 'books',
  actions: {
    // 扩展的 action
    publish(ctx, next) {
      ctx.body = 'ok';
    }
  }
});
```

### `isDefined()`

检查对应名称的资源是否已被注册。

**签名**

* `isDefined(name: string): boolean`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 资源名称 |

**示例**

```ts
app.resourcer.isDefined('books'); // true
```

### `registerAction()`

向资源管理器注册一个操作，可以指定针对特定的资源，如不指定资源名称，则认为是针对全局所有资源都可访问的操作。

**签名**

* `registerAction(name: string, handler: HandlerType): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 操作名称 |
| `handler` | `HandlerType` | - | 操作处理函数 |

`name` 的值如果以 `<resourceName>:` 开头则代表仅针对 `<resourceName>` 资源可访问，否则认为是全局操作。

**示例**

```ts
// 注册后任意资源都可以进行 upload 操作
app.resourcer.registerAction('upload', async (ctx, next) => {
  ctx.body = 'ok';
});

// 仅针对 attachments 资源注册 upload 操作
app.resourcer.registerAction('attachments:upload', async (ctx, next) => {
  ctx.body = 'ok';
});
```

### `registerActions()`

向资源管理器注册多个操作的集合方法。

**签名**

* `registerActions(actions: { [name: string]: HandlerType }): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `actions` | `{ [name: string]: HandlerType }` | - | 操作集合 |

**示例**

```ts
app.resourcer.registerActions({
  upload: async (ctx, next) => {
    ctx.body = 'ok';
  },
  'attachments:upload': async (ctx, next) => {
    ctx.body = 'ok';
  }
});
```

### `getResource()`

获取对应名称的资源对象。

**签名**

* `getResource(name: string): Resource`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 资源名称 |

**示例**

```ts
app.resourcer.getResource('books');
```

### `getAction()`

获取对应名称的操作处理函数。

**签名**

* `getAction(name: string): HandlerType`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 操作名称 |

`name` 的值如果以 `<resourceName>:` 开头则代表仅针对 `<resourceName>` 资源的操作，否则认为是全局操作。

**示例**

```ts
app.resourcer.getAction('upload');
app.resourcer.getAction('attachments:upload');
```

### `use()`

以 Koa 的形式注册一个中间件，中间件形成一个队列，并排在所有资源的操作处理函数之前执行。

**签名**

* `use(middleware: Middleware | Middleware[]): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `middleware` | `Middleware \| Middleware[]` | - | 中间件 |

**示例**

```ts
app.resourcer.use(async (ctx, next) => {
  console.log(ctx.req.url);
  await next();
});
```

### `middleware()`

生成一个兼容 Koa 的中间件，用于将资源的路由处理注入到应用中。

**签名**

* `middleware(options: KoaMiddlewareOptions): KoaMiddleware`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.prefix?` | `string` | `''` | 路径前缀。 |
| `options.accessors?` | `Object` | `{}` | 常用方法的名称映射，与构造函数的 `accessors` 参数结构相同。 |

**示例**

```ts
const koa = new Koa();

const resourcer = new Resourcer();

// 生成兼容 Koa 的中间件
koa.use(resourcer.middleware());
```
