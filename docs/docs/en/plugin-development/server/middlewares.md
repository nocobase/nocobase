# Middleware

## How to register middleware?

The method for registering middleware is usually written in the load method.

```ts
export class MyPlugin extends Plugin {
  load() {
    this.app.dataSourceManager.use();
    this.app.resourceManager.use();
    this.app.acl.use();
    this.app.use();
  }
}
```

Description:

1. `app.dataSourceManager.use()` adds data source level middleware, which takes effect in all data sources.
2. `app.acl.use()` adds resource permission level middleware, which is executed before permission checks.
3. `app.resourceManager.use()` adds resource-level middleware, which is executed only when a defined resource is requested.
4. `app.use()` adds application-level middleware, which is executed for every request.

## Onion Model

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});
```

Visit http://localhost:13000/api/hello, the data responded by the browser is:

```js
{"data": [1,3,4,2]}
```

## Built-in Middleware and Execution Order

1. `cors`
2. `bodyParser`
3. `i18n`
4. `dataWrapping`
5. `db2resource`
6. `restApi`
   1. `parseToken`
   2. `checkRole`
   3. `acl`
      1. Other middleware added by `acl.use()`
   4. Other middleware added by `resourcer.use()`
   5. `action handler`
7. Other middleware added by `app.use()`

You can also use `before` or `after` to insert middleware at a position marked by a `tag`, for example:

```ts
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });
// m4 will be placed before m1
app.use(m4, { before: 'restApi' });
// m5 will be inserted between m2 and m3
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

If no specific position is specified, the execution order of the new middleware is:

1. Middleware added by acl.use is executed first,
2. then middleware added by resourcer.use, including middleware handlers and action handlers,
3. and finally middleware added by app.use.

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

Visit http://localhost:13000/api/hello, the data responded by the browser is:

```js
{"data": [1,2]}
```

Visit http://localhost:13000/api/test:list, the data responded by the browser is:

```js
{"data": [5,3,7,1,2,8,4,6]}
```

### If a resource is not defined, middleware added by resourcer.use() will not be executed

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
```

Visit http://localhost:13000/api/hello, the data responded by the browser is:

```js
{"data": [1,2]}
```

In the example above, the hello resource is not defined, so it will not enter the resourcer, and therefore the middleware in the resourcer will not be executed.