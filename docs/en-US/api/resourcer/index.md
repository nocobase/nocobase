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

Define and register a resource object with the resource manager. Usually used instead of the constructor of the `Resource` class.

**Signature**

* `define(options: ResourceOptions): Resource`

**Parameter**

Refer to [Resource Constructor](/api/server/resourcer/resource#constructor) for details.

**Example**

```ts
app.resourcer.define({
  name: 'books',
  actions: {
    // Extended action
    publish(ctx, next) {
      ctx.body = 'ok';
    }
  }
});
```

### `isDefined()`

Check whether the resource with the corresponding name has been registered.

**Signature**

* `isDefined(name: string): boolean`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the resource |

**Example**

```ts
app.resourcer.isDefined('books'); // true
```

### `registerAction()`

Register an action with the resource manager. The action is accessible to a specified resource, or all resources if no resource name is specified.

**Signature**

* `registerAction(name: string, handler: HandlerType): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the action |
| `handler` | `HandlerType` | - | Handler of the action |

A value of `name` starting with `<resourceName>:` means that the action is only accessible to `<resourceName>` rescource, otherwise it is considered as a global action.

**Example**

```ts
// All resources can take the upload action after registration
app.resourcer.registerAction('upload', async (ctx, next) => {
  ctx.body = 'ok';
});

// Register the upload action only for attachments resource
app.resourcer.registerAction('attachments:upload', async (ctx, next) => {
  ctx.body = 'ok';
});
```

### `registerActions()`

Register a set of actions with the resource manager. 

**Signature**

* `registerActions(actions: { [name: string]: HandlerType }): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | `{ [name: string]: HandlerType }` | - | Set of actions |

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

Get the resource object with the corresponding name.

**Signature**

* `getResource(name: string): Resource`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the resource |

**Example**

```ts
app.resourcer.getResource('books');
```

### `getAction()`

Get the action handler function with the corresponding name.

**Signature**

* `getAction(name: string): HandlerType`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the action |

A value of `name` starting with `<resourceName>:` means that the action is only accessible to `<resourceName>` rescource, otherwise it is considered as a global action.

**Example**

```ts
app.resourcer.getAction('upload');
app.resourcer.getAction('attachments:upload');
```

### `use()`

Register a middleware in the form of Koa; the middleware forms a queue which is executed before the action handlers of all resources.

**Signature**

* `use(middleware: Middleware | Middleware[]): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `middleware` | `Middleware \| Middleware[]` | - | Middleware |

**Example**

```ts
app.resourcer.use(async (ctx, next) => {
  console.log(ctx.req.url);
  await next();
});
```

### `middleware()`

Generate a Koa-compatible middleware for injecting routing processing of resources into the application.

**Signature**

* `middleware(options: KoaMiddlewareOptions): KoaMiddleware`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.prefix?` | `string` | `''` | Route prefix |
| `options.accessors?` | `Object` | `{}` | Name mapping for common methods, with the same parameter structure as `accessors` of the constructor |

**Example**

```ts
const koa = new Koa();

const resourcer = new Resourcer();

//Generate Koa-compatible middleware
koa.use(resourcer.middleware());
```
