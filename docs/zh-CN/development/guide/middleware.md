# Middleware

## 添加方法

1. `app.acl.use()` 添加资源权限级中间件，在权限判断之前执行
2. `app.resourcer.use()` 添加资源级中间件，只有请求已定义的 resource 时才执行
3. `app.use()` 添加应用级中间件，每次请求都执行

## 特性

### 洋葱圈模型

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

访问 http://localhost:13000/api/hello 查看，浏览器响应的数据是：

```js
{"data": [1,3,4,2]}
```

### 优先级

完整的链路从 acl 开始，再到 resourcer，最终执行 app 的

1. acl middleware
2. resource middleware & action
3. app middleware

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

访问 http://localhost:13000/api/hello 查看，浏览器响应的数据是：

```js
{"data": [1,2]}
```

访问 http://localhost:13000/api/test:list 查看，浏览器响应的数据是：

```js
{"data": [5,3,7,1,2,8,4,6]}
```

### resource 未定义，不执行 resourcer.use() 添加的中间件

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

访问 http://localhost:13000/api/hello 查看，浏览器响应的数据是：

```js
{"data": [1,2]}
```

以上示例，hello 资源未定义，不会进入 resourcer，所以就不会执行 resourcer 里的中间件

## 内置中间件

<img src="./m.svg" />

### 应用级中间件

通过 app.use() 添加

- bodyParser
- cors
- i18n
- dataWrapping
- db2resource
- restApi

### 资源级中间件

通过 app.resourcer.use() 添加

- parseToken
- checkRole
- acl

## 中间件用途

待补充

## 完整示例

待补充

- samples/xxx
- samples/yyy