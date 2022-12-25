# Middleware

与 Koa 的中间件类似，但提供了更多增强的功能，可以方便的进行更多的扩展。

中间件定义后可以在资源管理器等多处进行插入使用，由开发者自行控制调用的时机。

## 构造函数

**签名**

* `constructor(options: Function)`
* `constructor(options: MiddlewareOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `Function` | - | 中间件处理函数 |
| `options` | `MiddlewareOptions ` | - | 中间件配置项 |
| `options.only` | `string[]` | - | 仅允许指定的操作 |
| `options.except` | `string[]` | - | 排除指定的操作 |
| `options.handler` | `Function` | - | 处理函数 |

**示例**

简单定义：

```ts
const middleware = new Middleware((ctx, next) => {
  await next();
});
```

使用相关参数：

```ts
const middleware = new Middleware({
  only: ['create', 'update'],
  async handler(ctx, next) {
    await next();
  },
});
```

## 实例方法

### `getHandler()`

返回已经过编排的处理函数。

**示例**

以下中间件在请求时会先输出 `1`，再输出 `2`。

```ts
const middleware = new Middleware((ctx, next) => {
  console.log(1);
  await next();
});

middleware.use(async (ctx, next) => {
  console.log(2);
  await next();
});

app.resourcer.use(middleware.getHandler());
```

### `use()`

对当前中间件添加中间件函数。用于提供中间件的扩展点。示例见 `getHandler()`。

**签名**

* `use(middleware: Function)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `middleware` | `Function` | - | 中间件处理函数 |

### `disuse()`

移除当前中间件已添加的中间件函数。

**签名**

* `disuse(middleware: Function)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `middleware` | `Function` | - | 中间件处理函数 |

**示例**

以下示例在请求处理是只输出 `1`，不执行 fn1 中的 `2` 输出。

```ts
const middleware = new Middleware((ctx, next) => {
  console.log(1);
  await next();
});

async function fn1(ctx, next) {
  console.log(2);
  await next();
}

middleware.use(fn1);

app.resourcer.use(middleware.getHandler());

middleware.disuse(fn1);
```

### `canAccess()`

判断当前中间件针对特定操作是否要被调用，通常由资源管理器内部处理。

**签名**

* `canAccess(name: string): boolean`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 操作名称 |

## 其他导出

### `branch()`

创建一个分支中间件，用于在中间件中进行分支处理。

**签名**

* `branch(map: { [key: string]: Function }, reducer: Function, options): Function`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `map` | `{ [key: string]: Function }` | - | 分支处理函数映射表，键名由后续计算函数在调用时给出 |
| `reducer` | `(ctx) => string` | - | 计算函数，用于基于上下文计算出分支的键名 |
| `options?` | `Object` | - | 分支配置项 |
| `options.keyNotFound?` | `Function` | `ctx.throw(404)` | 未找到键名时的处理函数 |
| `options.handlerNotSet?` | `Function` | `ctx.throw(404)` | 未定义处理函数时的处理 |

**示例**

用户验证时，根据请求 URL 中 query 部分的 `authenticator` 参数的值决定后续需要如何处理：

```ts
app.resourcer.use(branch({
  'password': async (ctx, next) => {
    // ...
  },
  'sms': async (ctx, next) => {
    // ...
  },
}, (ctx) => {
  return ctx.action.params.authenticator ?? 'password';
}));
```
