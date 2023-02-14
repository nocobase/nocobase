# Middleware

It is similar to the middleware of Koa, but with more enhanced features for easy extensions.

The defined middleware can be inserted for use in multiple places, such as the resourcer, and it is up to the developer for when to invoke it.

## Constructor

**Signature**

* `constructor(options: Function)`
* `constructor(options: MiddlewareOptions)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `Function` | - | Handler function of middlware |
| `options` | `MiddlewareOptions ` | - | Configuration items of middlware |
| `options.only` | `string[]` | - | Only the specified actions are allowed |
| `options.except` | `string[]` | - | The specified actions are excluded |
| `options.handler` | `Function` | - | Handler function |

**Example**

Simple definition:

```ts
const middleware = new Middleware((ctx, next) => {
  await next();
});
```

Definition with relevant parameters:

```ts
const middleware = new Middleware({
  only: ['create', 'update'],
  async handler(ctx, next) {
    await next();
  },
});
```

## Instance Methods

### `getHandler()`

Get the orchestrated handler functions.

**Example**

The following middleware will output `1` and then `2` when requested.

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

Add a middleware function to the current middleware. Used to provide extension points for the middleware. See `getHandler()` for the examples.

**Signature**

* `use(middleware: Function)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `middleware` | `Function` | - | Handler function of the middleware |

### `disuse()`

Remove the middleware functions that have been added to the current middleware.

**Signature**

* `disuse(middleware: Function)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `middleware` | `Function` | - | Handler function of the middleware |

**Example**

The following example will only output `1` when requested, the output of `2` in fn1 will not be executed.

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

Check whether the current middleware is to be invoked for a specific action, it is usually handled by the resourcer internally.

**Signature**

* `canAccess(name: string): boolean`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the action |

## Other Exports

### `branch()`

Create a branch middleware for branching in the middleware.

**Signature**

* `branch(map: { [key: string]: Function }, reducer: Function, options): Function`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `map` | `{ [key: string]: Function }` | - | Mapping table of the branch handler function, key names are given by subsequent calculation functions when called |
| `reducer` | `(ctx) => string` | - | Calculation function, it is used to calculate the key name of the branch based on the context |
| `options?` | `Object` | - | Configuration items of the branch |
| `options.keyNotFound?` | `Function` | `ctx.throw(404)` | Handler function when key name is not found |
| `options.handlerNotSet?` | `Function` | `ctx.throw(404)` | The function when no handler function is defined |

**Example**

When authenticating user, determine what to do next according to the value of the `authenticator` parameter in the query section of the request URL.

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
