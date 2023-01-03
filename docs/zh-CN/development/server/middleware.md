# 中间件

## 如何注册中间件？

中间件的注册方法一般写在 load 方法里

```ts
export class MyPlugin extends Plugin {
  load() {
    this.app.acl.use();
    this.app.resourcer.use();
    this.app.use();
  }
}
```

说明：

1. `app.acl.use()` 添加资源权限级中间件，在权限判断之前执行
2. `app.resourcer.use()` 添加资源级中间件，只有请求已定义的 resource 时才执行
3. `app.use()` 添加应用级中间件，每次请求都执行

## 洋葱圈模型

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

## 内置中间件及执行顺序

1. `cors`
2. `bodyParser`
3. `i18n`
4. `dataWrapping`
5. `db2resource`
6. `restApi`
   1. `parseToken`
   2. `checkRole`
   3. `acl`
      1. `acl.use()` 添加的其他中间件
   4. `resourcer.use()` 添加的其他中间件
   5. `action handler`
7. `app.use()` 添加的其他中间件

也可以使用 `before` 或 `after` 将中间件插入到前面的某个 `tag` 标记的位置，如：

```ts
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });
// m4 将排在 m1 前面
app.use(m4, { before: 'restApi' });
// m5 会插入到 m2 和 m3 之间
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

如果未特殊指定位置，新增的中间件的执行顺序是：

1. 优先执行 acl.use 添加的，
2. 然后是 resourcer.use 添加的，包括 middleware handler 和 action handler，
3. 最后是 app.use 添加的。

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

## 中间件用途

待补充

## 示例

- [samples/ratelimit](https://github.com/nocobase/nocobase/blob/main/packages/samples/ratelimit/) IP rate-limiting
