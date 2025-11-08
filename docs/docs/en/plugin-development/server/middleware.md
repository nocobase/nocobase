# Middleware

NocoBase Server middleware is essentially **Koa middleware**. You can operate the `ctx` object to handle requests and responses just like in Koa. However, since NocoBase needs to manage logic at different business layers, if all middleware is placed together, it becomes very difficult to maintain and manage.

For this reason, NocoBase divides middleware into **four layers**:

1. **Data Source Level Middleware**: `app.dataSourceManager.use()`  
   Only affects requests for **a specific data source**, commonly used for database connections, field validation, or transaction processing logic for that data source.

2. **Resource Level Middleware**: `app.resourceManager.use()`  
   Only effective for defined resources (Resource), suitable for handling resource-level logic, such as data permissions, formatting, etc.

3. **Permission Level Middleware**: `app.acl.use()`  
   Executes before permission checks, used to verify user permissions or roles.

4. **Application Level Middleware**: `app.use()`  
   Executes for every request, suitable for logging, general error handling, response processing, etc.

## Middleware Registration

Middleware is usually registered in the plugin's `load` method, for example:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Application level middleware
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Data source middleware
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Permission middleware
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

1. First execute permission middleware added by `acl.use()`
2. Then execute resource middleware added by `resourceManager.use()`  
3. Then execute data source middleware added by `dataSourceManager.use()`  
4. Finally execute application middleware added by `app.use()`  

## before / after / tag Insertion Mechanism

For more flexible control of middleware order, NocoBase provides `before`, `after`, and `tag` parameters:

- **tag**: Mark the middleware for reference by subsequent middleware  
- **before**: Insert before the middleware with the specified tag  
- **after**: Insert after the middleware with the specified tag  

Example:

```ts
// Regular middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 will be placed before m1
app.use(m4, { before: 'restApi' });

// m5 will be inserted between m2 and m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

If no position is specified, the default execution order for newly added middleware is:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Onion Model Example

Middleware execution order follows Koa's **onion model**, entering the middleware stack first and exiting last.  

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
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

app.resourceManager.define({
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

Output examples for different interfaces:

- **Regular request**: `/api/hello`  
  Output: `[1,2]` (resource not defined, doesn't execute `resourceManager` and `acl` middleware)  

- **Resource request**: `/api/test:list`  
  Output: `[5,3,7,1,2,8,4,6]`  
  Middleware executes according to the layer order and the onion model.

## Summary

- NocoBase Middleware is an extension of Koa Middleware  
- Four layers: Application -> Data Source -> Resource -> Permission
- Can use `before` / `after` / `tag` to flexibly control execution order  
- Follows Koa onion model, ensuring middleware is composable and nestable  
- Data source level middleware only affects specified data source requests, resource level middleware only affects defined resource requests

