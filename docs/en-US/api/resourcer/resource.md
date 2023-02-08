# Resource

Resource is used to define resource instance. Resource instances managed by Resourcer can be accessed through HTTP requests.

## Constructor

To create Resource instance. Normally it is not used directly, but replaced by the call of the `define()` interface of Resourcer manager.

**签名**

* `constructor(options: ResourceOptions, resourcer: Resourcer)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.name` | `string` | - | 资源名称，对应 URL 路由中的资源地址部分。 |
| `options.type` | `string` | `'single'` | 资源类型，可选项为 `'single'`、`'hasOne'`、`'hasMany'`、`'belongsTo'`、`'belongsToMany'`。 |
| `options.actions` | `Object` | - | 对资源可进行的操作列表，详见示例部分。 |
| `options.middlewares` | `MiddlewareType \| MiddlewareType[]` | - | 对当前定义资源进行任意操作访问时的中间件列表，详见示例部分。 |
| `options.only` | `ActionName[]` | `[]` | 针对全局操作的白名单列表，当数组中有值时（`length > 0`），只有数组中的操作可被访问。 |
| `options.except` | `ActionName[]` | `[]` | 针对全局操作的黑名单列表，当数组中有值时（`length > 0`），除数组中的操作外，其他操作可被访问。 |
| `resourcer` | `Resourcer` | - | 所属资源管理器实例。 |

**示例**

```ts
app.resourcer.define({
  name: 'books',
  actions: {
    // 扩展的 action
    publish(ctx, next) {
      ctx.body = 'ok';
    }
  },
  middleware: [
    // 扩展的中间件
    async (ctx, next) => {
      await next();
    }
  ]
});
```

## 实例成员

### `options`

当前资源的配置项。

### `resourcer`

所属的资源管理器实例。

### `middlewares`

已注册的中间件列表。

### `actions`

已注册的操作映射表。

### `except`

操作排除的名单列表。

## 实例方法

### `getName()`

获取当前资源的名称。

**签名**

* `getName(): string`

**示例**

```ts
const resource = app.resourcer.define({
  name: 'books'
});

resource.getName(); // 'books'
```

### `getAction()`

根据名称获取当前资源的操作。

**签名**

* `getAction(name: string): Action`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 操作名称。 |

**示例**

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
