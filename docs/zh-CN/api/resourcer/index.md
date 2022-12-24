# Resourcer

## 概览

Nocobase 中的接口遵循面向资源的设计模式。Resourcer 主要用于管理 API 资源与路由。

```javascript
const Koa = require('koa');
const { Resourcer } = require('@nocobase/resourcer');

const resourcer = new Resourcer();

// 定义一个资源接口
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

// 可在 koa 实例中使用
app.use(
  resourcer.middleware({
    prefix: '/api', // resourcer 路由前缀
  }),
);

app.listen(3000);
```

启动服务后，使用`curl`发起请求：
```bash
>$ curl localhost:3000/api/users
[{"name":"u1","age":18},{"name":"u2","age":20}]
```
更多 Resourcer 的使用说明可参考[资源与操作](/development/guide/resources-actions)。 Resourcer 内置于 [NocoBase Application](/api/server/application#resourcer) ，可以通过 `app.resourcer` 访问。


## 构造函数

用于创建 Resourcer 管理器实例。

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
