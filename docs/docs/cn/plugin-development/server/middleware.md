# Middleware 中间件

NocoBase Server 的中间件（Middleware）本质上是 **Koa 中间件**，你可以像在 Koa 一样操作 `ctx` 对象处理请求和响应。但由于 NocoBase 需要管理不同业务层的逻辑，如果所有中间件都放在一起，会非常难以维护和管理。  

为此，NocoBase 将中间件分为 **四个层级**：

1. **数据源级中间件**：`app.dataSourceManager.use()`  
   只作用于 **某个数据源** 的请求，常用于该数据源的数据库连接、字段验证或事务处理等逻辑。

2. **资源级中间件**：`app.resourceManager.use()`  
   只对已定义的资源（Resource）生效，适合处理资源级逻辑，如数据权限、格式化等。

3. **权限级中间件**：`app.acl.use()`  
   在权限判断前执行，用于校验用户权限或角色。

4. **应用级中间件**：`app.use()`  
   对每一次请求都会执行，适合日志记录、通用错误处理、响应处理等。

## 中间件注册

中间件通常在插件的 `load` 方法中注册，例如：

```ts
export class MyPlugin extends Plugin {
  load() {
    // 应用级中间件
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // 数据源中间件
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // 权限中间件
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // 资源中间件
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### 执行顺序

中间件执行顺序如下：

1. 先执行 `acl.use()` 添加的权限中间件
2. 再执行 `resourceManager.use()` 添加的资源中间件  
3. 再执行 `dataSourceManager.use()` 添加的数据源中间件  
4. 最后执行 `app.use()` 添加的应用中间件  

## before / after / tag 插入机制

为了更灵活地控制中间件顺序，NocoBase 提供 `before`、`after` 和 `tag` 参数：

- **tag**：为中间件打一个标记，用于被后续中间件引用  
- **before**：在指定 tag 的中间件之前插入  
- **after**：在指定 tag 的中间件之后插入  

示例：

```ts
// 普通中间件
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });

// m4 将排在 m1 前面
app.use(m4, { before: 'restApi' });

// m5 会插入到 m2 和 m3 之间
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

如果未指定位置，新增的中间件默认执行顺序为：  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## 洋葱圈模型示例

中间件执行顺序遵循 Koa 的 **洋葱圈模型**，即先进入中间件栈，最后出栈。  

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

访问不同接口，输出顺序示例：

- **普通请求**：`/api/hello`  
  输出：`[1,2]` （未定义资源，不执行 `resourceManager` 和 `acl` 中间件）  

- **资源请求**：`/api/test:list`  
  输出：`[5,3,7,1,2,8,4,6]`  
  中间件按层级和洋葱圈模型执行



## 小结

- NocoBase Middleware 是 Koa Middleware 的扩展  
- 四个层级：应用 -> 数据源 -> 资源 -> 权限
- 可以使用 `before` / `after` / `tag` 灵活控制执行顺序  
- 遵循 Koa 洋葱圈模型，保证中间件可组合、可嵌套  
- 数据源级中间件只作用于指定数据源请求，资源级中间件只作用于已定义资源请求
