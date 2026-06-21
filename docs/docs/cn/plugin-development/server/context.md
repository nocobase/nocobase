---
title: "Context 请求上下文"
description: "NocoBase 服务端 ctx：Koa Context 扩展、ctx.action、ctx.db、ctx.cache、Middleware 与 Action 中使用。"
keywords: "Context,ctx,ctx.action,Koa,请求上下文,Middleware,Action,NocoBase"
---

# Context 上下文

在 NocoBase 中，每一个请求都会生成一个 `ctx` 对象，它是 Context 的实例。Context 封装了请求和响应信息，同时提供了 NocoBase 特有的功能——比如数据库访问、缓存操作、权限管理、国际化和日志记录等。

NocoBase 的 `Application` 基于 Koa 实现，因此 `ctx` 本质上是 Koa Context，不过 NocoBase 在其基础上扩展了更多 API，让你可以在 Middleware 和 Action 中便捷地处理业务逻辑。每个请求都有独立的 `ctx`，保证请求之间的数据隔离。

## ctx.action

`ctx.action` 提供当前请求执行的 Action 信息，其中包括：

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // 当前 Action 名称
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

国际化（i18n）支持。

- `ctx.i18n` 提供语言环境信息
- `ctx.t()` 用于根据语言翻译字符串

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // 根据当前语言返回翻译
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` 提供数据库访问接口，可以直接操作模型和执行查询。

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` 提供缓存操作，支持读取和写入缓存，常用于加速数据访问或保存临时状态。

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', { ttl: 60 }); // 缓存 60 秒
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` 是 NocoBase 应用实例，可以访问全局配置、插件和服务。

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` 获取当前已认证的用户信息，适合在权限校验或业务逻辑中使用。

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` 用于在中间件链中共享数据。

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` 提供日志记录能力，支持多级别日志输出。

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` 用于权限管理，`ctx.can()` 用于判断当前用户是否有执行某个操作的权限。

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## 小结

- 每个请求对应一个独立 `ctx` 对象
- `ctx` 是 Koa Context 的扩展，整合了 NocoBase 的各项能力
- 常用属性包括：`ctx.db`、`ctx.cache`、`ctx.auth`、`ctx.state`、`ctx.logger`、`ctx.can()`、`ctx.t()` 等
- 在 Middleware 和 Action 中使用 `ctx` 可以方便地操作请求、响应、权限、日志和数据库

## 相关链接

- [Middleware 中间件](./middleware.md) — 中间件中使用 `ctx` 处理请求的完整流程
- [ResourceManager 资源管理](./resource-manager.md) — 资源 Action 中 `ctx.action` 的来源与定义
- [ACL 权限控制](./acl.md) — `ctx.permission` 和 `ctx.can()` 的权限校验机制
- [Cache 缓存](./cache.md) — `ctx.cache` 的缓存操作详细用法
- [Logger 日志](./logger.md) — `ctx.logger` 的日志记录与输出配置
- [i18n 国际化](./i18n.md) — `ctx.t()` 和 `ctx.i18n` 的国际化支持
