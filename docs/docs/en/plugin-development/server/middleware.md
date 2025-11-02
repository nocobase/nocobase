# Middleware

NocoBase Server's Middleware is essentially **Koa middleware**. You can manipulate the `ctx` object to handle requests and responses just like in Koa. However, since NocoBase needs to manage logic at different business layers, it would be very difficult to maintain and manage if all middleware were placed together.

For this reason, NocoBase divides middleware into **four levels**:

1.  **Data source-level middleware**: `app.dataSourceManager.use()`
    Only acts on requests for a **specific data source**. It is often used for logic such as database connections, field validation, or transaction processing for that data source.

2.  **Resource-level middleware**: `app.resourceManager.use()`
    Only takes effect on defined resources (Resource). It is suitable for handling resource-level logic, such as data permissions, formatting, etc.

3.  **ACL-level middleware**: `app.acl.use()`
    Executes before permission checks to validate user permissions or roles.

4.  **Application-level middleware**: `app.use()`
    Executes for every request. It is suitable for logging, general error handling, response processing, etc.

## Middleware Registration

Middleware is usually registered in a plugin's `load` method, for example:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Application-level middleware
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Data source middleware
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // ACL middleware
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Resource middleware
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Execution Order

The middleware execution order is as follows:

1.  First, the ACL middleware added by `acl.use()` is executed.
2.  Then, the resource middleware added by `resourceManager.use()` is executed.
3.  Then, the data source middleware added by `dataSourceManager.use()` is executed.
4.  Finally, the application middleware added by `app.use()` is executed.

## `before` / `after` / `tag` Insertion Mechanism

To control the middleware order more flexibly, NocoBase provides `before`, `after`, and `tag` parameters:

-   **tag**: Assigns a tag to a middleware, which can be referenced by subsequent middleware.
-   **before**: Inserts the middleware before the one with the specified tag.
-   **after**: Inserts the middleware after the one with the specified tag.

Example:

```ts
// Normal middleware
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });

// m4 will be placed before m1
app.use(m4, { before: 'restApi' });

// m5 will be inserted between m2 and m3
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

If no position is specified, the default execution order for new middleware is:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## Onion Model Example

The middleware execution order follows Koa's **onion model**, meaning it first enters the middleware stack and is the last to exit.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourcer.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourcer.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Example output order when accessing different APIs:

-   **Normal request**: `/api/hello`
    Output: `[1,2]` (Resource is not defined, so `resourceManager` and `acl` middleware are not executed)

-   **Resource request**: `/api/test:list`
    Output: `[5,3,7,1,2,8,4,6]`
    Middleware executes according to its level and the onion model.

## Summary

-   NocoBase Middleware is an extension of Koa Middleware.
-   Four levels: Application -> Data Source -> Resource -> ACL
-   You can use `before` / `after` / `tag` to flexibly control the execution order.
-   Follows the Koa onion model, ensuring middleware is composable and nestable.
-   Data source-level middleware only acts on requests for a specified data source, and resource-level middleware only acts on requests for defined resources.