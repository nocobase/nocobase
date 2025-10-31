# Context

在 NocoBase 中，每一个请求都会生成一个 `ctx` 对象，它是 Context 的实例。Context 封装了请求和响应信息，同时提供了 NocoBase 特有的功能，例如数据库访问、缓存操作、权限管理、国际化和日志记录等。  

NocoBase 的 `Application` 基于 Koa 实现，因此 `ctx` 本质上是 Koa Context，但 NocoBase 在其基础上扩展了丰富的 API，使开发者可以在 Middleware 和 Action 中便捷地处理业务逻辑。每个请求都有独立的 `ctx`，保证请求之间的数据隔离和安全。

## ctx.action

`ctx.action` 提供对当前请求执行的 Action 信息访问。可以用来获取当前的模块、服务或操作名称。  

```javascript
resourceManager.use(async (ctx) => {
  console.log(ctx.action.name); // 输出当前 Action 名称
  ctx.body = `Action: ${ctx.action.name}`;
});
```

## ctx.i18n & ctx.t()

NocoBase 支持国际化（i18n）。  

- `ctx.i18n` 提供语言环境信息  
- `ctx.t()` 用于根据语言翻译字符串  

```javascript
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // 根据请求语言返回翻译
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` 提供数据库访问接口，可以直接操作模型和执行查询。  

```javascript
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` 提供缓存操作，支持读取和写入缓存，常用于加速数据访问或保存临时状态。  

```javascript
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // 缓存 60 秒
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` 是 NocoBase 应用实例，可以访问全局配置、插件和服务。  

```javascript
resourceManager.use(async (ctx) => {
  console.log(ctx.resourceManager.config);
  ctx.body = 'Check console for app config';
});
```

## ctx.auth.user

`ctx.auth.user` 获取当前已认证的用户信息，适合在权限校验或业务逻辑中使用。  

```javascript
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state

`ctx.state` 用于在中间件链中共享数据。  

```javascript
// 中间件1
resourceManager.use(async (ctx, next) => {
  ctx.state.currentUser = ctx.auth.user;
  await next();
});

// 中间件2
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentUser?.username}`;
});
```

## ctx.logger

`ctx.logger` 提供日志记录能力，支持多级别日志输出。  

```javascript
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.url);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` 用于权限管理，`ctx.can()` 用于判断当前用户是否有执行某个操作的权限。  

```javascript
ResourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## 小结

- 每个请求对应一个独立 `ctx` 对象  
- `ctx` 是 Koa Context 的扩展，整合了 NocoBase 功能  
- 常用属性包括：`ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.permission`, `ctx.t()` 等  
- 在 Middleware 和 Action 中使用 `ctx` 可以方便地操作请求、响应、权限、日志和数据库  
