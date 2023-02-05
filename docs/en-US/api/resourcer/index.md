# Resourcer

## Overview

The interfaces in NocoBase follow a resource-oriented design pattern. Resourcer is mainly used to manage API resources and routes.

```javascript
const Koa = require('koa');
const { Resourcer } = require('@nocobase/resourcer');

const resourcer = new Resourcer();

// Define a resourcer
resourcer.define({
  name: 'users',
  actions: {
    async list(ctx) {
      ctx.body = [
        {
          name: "u1",
          age: 18
        },
        {
          name: "u2",
          age: 20
        }
      ]  
    }
  },
});

const app = new Koa();

// Use the resourcer in instance koa
app.use(
  resourcer.middleware({
    prefix: '/api', // Route prefix of resourcer
  }),
);

app.listen(3000);
```

After starting the service, make request using `curl`:

```bash
>$ curl localhost:3000/api/users
[{"name":"u1","age":18},{"name":"u2","age":20}]
```

More instructions of Resourcer can be found in [Resources and Actions](/development/guide/resources-actions). Resourcer is built into [NocoBase Application](/api/server/application#resourcer), you can access it through `app.resourcer`.

## Constructor

To create resourcer manager instances.

**Signature**

* `constructor(options: ResourcerOptions)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `prefix` | `string` | - | Route prefix |
| `accessors` | `Object` | _The following values of members_ | Name identifier of the default operation method |
| `accessors.list` | `string` | `'list'` | Name identifier of the list operation method |
| `accessors.get` | `string` | `'get'` | Name identifier of the get operation method |
| `accessors.create` | `string` | `'create'` | Name identifier of the create operation method |
| `accessors.update` | `string` | `'update'` | Name identifier of the update operation method |
| `accessors.delete` | `string` | `'destroy'` | Name identifier of the delete operation method |
| `accessors.add` | `string` | `'add'` | Name identifier of the add association operation method |
| `accessors.remove` | `string` | `'remove'` | Name identifier of the remove association operation method |
| `accessors.set` | `string` | `'set'` | Name identifier of the global set association operation method |

**Example**

Pass in through the `resourcer` option when creating app:

```ts
const app = new Application({
  // Correspond to the configuration item of the default resourcer instance
  resourcer: {
    prefix: process.env.API_BASE_PATH
  }
});
```

## Instance Methods

### `define()`

定义并向资源管理器注册一个资源对象。通常代替 `Resource` 类的构造函数使用。

**Signature**

* `define(options: ResourceOptions): Resource`

**Parameter**

详见 [Resource 构造函数](/api/server/resourcer/resource#构造函数)。

**Example**

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

**Signature**

* `isDefined(name: string): boolean`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | 资源名称 |

**Example**

```ts
app.resourcer.isDefined('books'); // true
```

### `registerAction()`

向资源管理器注册一个操作，可以指定针对特定的资源，如不指定资源名称，则认为是针对全局所有资源都可访问的操作。

**Signature**

* `registerAction(name: string, handler: HandlerType): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | 操作名称 |
| `handler` | `HandlerType` | - | 操作处理函数 |

`name` 的值如果以 `<resourceName>:` 开头则代表仅针对 `<resourceName>` 资源可访问，否则认为是全局操作。

**Example**

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

**Signature**

* `registerActions(actions: { [name: string]: HandlerType }): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | `{ [name: string]: HandlerType }` | - | 操作集合 |

**Example**

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

**Signature**

* `getResource(name: string): Resource`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | 资源名称 |

**Example**

```ts
app.resourcer.getResource('books');
```

### `getAction()`

获取对应名称的操作处理函数。

**Signature**

* `getAction(name: string): HandlerType`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | 操作名称 |

`name` 的值如果以 `<resourceName>:` 开头则代表仅针对 `<resourceName>` 资源的操作，否则认为是全局操作。

**Example**

```ts
app.resourcer.getAction('upload');
app.resourcer.getAction('attachments:upload');
```

### `use()`

以 Koa 的形式注册一个中间件，中间件形成一个队列，并排在所有资源的操作处理函数之前执行。

**Signature**

* `use(middleware: Middleware | Middleware[]): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `middleware` | `Middleware \| Middleware[]` | - | 中间件 |

**Example**

```ts
app.resourcer.use(async (ctx, next) => {
  console.log(ctx.req.url);
  await next();
});
```

### `middleware()`

生成一个兼容 Koa 的中间件，用于将资源的路由处理注入到应用中。

**Signature**

* `middleware(options: KoaMiddlewareOptions): KoaMiddleware`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.prefix?` | `string` | `''` | 路径前缀。 |
| `options.accessors?` | `Object` | `{}` | 常用方法的名称映射，与构造函数的 `accessors` 参数结构相同。 |

**Example**

```ts
const koa = new Koa();

const resourcer = new Resourcer();

// 生成兼容 Koa 的中间件
koa.use(resourcer.middleware());
```
