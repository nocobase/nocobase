# Middleware

## How to register middleware?

The registration method for middleware is usually written in the load method

```ts
export class MyPlugin extends Plugin {
  load() {
    this.app.acl.use();
    this.app.resourcer.use();
    this.app.use();
  }
}
```

Notes.

1. `app.acl.use()` Add a resource-permission-level middleware to be executed before permission determination
2. `app.resourcer.use()` Adds a resource-level middleware that is executed only when a defined resource is requested
3. `app.use()` Add an application-level middleware to be executed on every request

## Onion Circle Model

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

Visit http://localhost:13000/api/hello to see that the browser responds with the following data

```js
{"data": [1,3,4,2]}
```

## Built-in middlewares and execution order

1. `cors`
2. `bodyParser`
3. `i18n`
4. `dataWrapping`
5. `db2resource` 6.
6. `restApi` 1.
   1. `parseToken` 2.
   2. `checkRole`
   3. `acl` 1.
      1. `acl.use()` Additional middleware added
   4. `resourcer.use()` Additional middleware added
   5. `action handler`
7. `app.use()` Additional middleware added

You can also use `before` or `after` to insert the middleware into the location of one of the preceding `tag`, e.g.

```ts
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });
// m4 will come before m1
app.use(m4, { before: 'restApi' });
// m5 will be inserted between m2 and m3
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

If no location is specifically specified, the order of execution of the added middlewares is

1. middlewares added by `acl.use` will be executed first
2. then the ones added by `resourcer.use`, including the middleware handler and action handler
3. and finally the ones added by `app.use`

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

Visit http://localhost:13000/api/hello to see that the browser responds with the data

```js
{"data": [1,2]}
```

Visiting http://localhost:13000/api/test:list to see, the browser responds with the following data

```js
{"data": [5,3,7,1,2,8,4,6]}
```

### Resource undefined, middlewares added by resourcer.use() will not be executed

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

Visit http://localhost:13000/api/hello to see that the browser responds with the following data

```js
{"data": [1,2]}
```

In the above example, the hello resource is not defined and will not enter the resourcer, so the middleware in the resourcer will not be executed

## Middleware Usage

TODO

## Example

- [samples/ratelimit](https://github.com/nocobase/nocobase/blob/main/packages/samples/ratelimit/) IP rate-limiting
