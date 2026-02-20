# Context

In NocoBase, each request generates a `ctx` object, which is an instance of Context. Context encapsulates request and response information while providing NocoBase-specific functionality, such as database access, cache operations, permission management, internationalization, and logging.

NocoBase's `Application` is based on Koa, so `ctx` is essentially a Koa Context, but NocoBase extends it with rich APIs, allowing developers to conveniently handle business logic in Middleware and Actions. Each request has an independent `ctx`, ensuring data isolation and security between requests.

## ctx.action

`ctx.action` provides access to the Action being executed for the current request. Includes:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Output current Action name
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Internationalization (i18n) support.  

- `ctx.i18n` provides locale information  
- `ctx.t()` is used to translate strings based on language  

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Returns translation based on request language
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` provides an interface for database access, allowing you to directly operate on models and execute queries.  

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` provides cache operations, supporting reading from and writing to the cache, commonly used to accelerate data access or save temporary state.  

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Cache for 60 seconds
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` is the NocoBase application instance, allowing access to global configuration, plugins, and services.  

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` retrieves the currently authenticated user's information, suitable for use in permission checks or business logic.  

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` is used to share data in the middleware chain.  

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` provides logging capabilities, supporting multi-level log output.  

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` is used for permission management, `ctx.can()` is used to check whether the current user has permission to execute a certain operation.  

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Summary

- Each request corresponds to an independent `ctx` object  
- `ctx` is an extension of Koa Context, integrating NocoBase functionality  
- Common properties include: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, etc.  
- Using `ctx` in Middleware and Actions allows for convenient handling of requests, responses, permissions, logs, and the database  

