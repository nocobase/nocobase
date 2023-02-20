# Resource

Resource is used to define resource instance. Resource instances managed by resourcer can be accessed through HTTP requests.

## Constructor

To create resource instance. Normally it is not used directly, but replaced by the call of the `define()` interface of resourcer.

**Signature**

* `constructor(options: ResourceOptions, resourcer: Resourcer)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.name` | `string` | - | Name of the resource, corresponding to the resource address in the route of the URL |
| `options.type` | `string` | `'single'` | Type of the resource, options are `'single'`, `'hasOne'`, `'hasMany'`, `'belongsTo'`, `'belongsToMany'` |
| `options.actions` | `Object` | - | List of actions that can be taken on the resource, see the example for details |
| `options.middlewares` | `MiddlewareType \| MiddlewareType[]` | - | List of middlewares for any operational access to the resource that is defining，see the example for details |
| `options.only` | `ActionName[]` | `[]` | Whitelist for global actions, only actions contained in the array (if `length > 0`) can be accessed |
| `options.except` | `ActionName[]` | `[]` | Blacklist for global actions, all actions except those contained in the array (if `length > 0`) can be accessed  |
| `resourcer` | `Resourcer` | - | The resourcer instance |

**Example**

```ts
app.resourcer.define({
  name: 'books',
  actions: {
    // Extended action
    publish(ctx, next) {
      ctx.body = 'ok';
    }
  },
  middleware: [
    // Extended middleware
    async (ctx, next) => {
      await next();
    }
  ]
});
```

## Instance Members

### `options`

Configuration items for the current resource.

### `resourcer`

The resourcer instance to which the resource belongs.

### `middlewares`

The registered middlewares.

### `actions`

The registered mapping table of actions.

### `except`

Actions that are excluded.

## Instance Methods

### `getName()`

Get the name of the current resource.

**Signature**

* `getName(): string`

**Example**

```ts
const resource = app.resourcer.define({
  name: 'books'
});

resource.getName(); // 'books'
```

### `getAction()`

Get action with the corresponding name.

**Signature**

* `getAction(name: string): Action`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the action |

**Example**

```ts
const resource = app.resourcer.define({
  name: 'books',
  actions: {
    publish(ctx, next) {
      ctx.body = 'ok';
    }
  }
});

resource.getAction('publish'); // [Function: publish]
```
