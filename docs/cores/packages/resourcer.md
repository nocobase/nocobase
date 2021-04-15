---
title: '@nocobase/resourcer'
order: 2
# toc: menu
---

# @nocobase/resourcer

## 介绍

提供数据资源操作方法，可单独使用。

基于资源（resource）和操作方法（action）设计，将 REST 和 RPC 思想融合起来，为资源提供操作方法，执行方法时提供相关参数（params）。

特点：

- 可注册的 Middlewares 和 Actions
- 提供灵活的多来源 Action Params 合并方案
- 不局限于 Koa 框架
- 不局限于 HTTP

<Alert title="何为多来源 Action Params？" type="info">

以 filter 为例，某数据表的过滤条件可能来自：

- 客户端请求参数
- 视图限定了筛选范围
- 权限也可能限定了筛选范围
- 通过中间件注入定制化的过滤条件

resourcer 提供了非常方便的接口用于处理参数的合并（包括自定义合并或替换规则）

</Alert>

资源有五种类型：

- single 独立资源
- hasOne 一对一的关系资源
- hasMany 一对多的关系资源
- belongsTo 一对一的关系资源
- belongsToMany 多对多的关系资源
  
举例说明：

- users：独立资源；
- posts：独立资源；
- users.profile：关系资源，一对一关系 User.hasOne(Profile)，资源为 profile，属于 users；
- posts.user：关系资源，多对一关系 Post.belongsTo(User)，资源为 user，属于 posts；
- users.posts：关系资源，一对多关系 User.hasMany(Post)，资源为 posts，属于 users；
- posts.tags：关系资源，多对多关系 Post.belongsToMany(Tag)，资源为 tags，属于 posts。

资源名称的格式：

- resourceName：独立资源
- associatedName.resourceName：关系资源

操作名称的格式：

- create：全局操作
- resourceName:create：隶属某个资源的操作
- associatedName.resourceName:create：隶属某个关系资源的操作

这种资源和操作的格式，在 SDK 的协助下，看起来会更加直观，如：

```ts
api.resource('users').login({
  // 省略具体参数
});
```

<Alert title="为什么不是 REST 或 GraphQL？" type="warning">

Resourcer 是基于资源设计的，可以看做是 REST 的扩展（兼容的同时，但有些许不同），提供了类 REST 的 Resource Action API（[点此查看细节](#resourcerkoarestapimiddleware)），非常灵活，同时弥补了 REST 的一些缺陷。不用 GraphQL 的原因是因为还不够完善，尤其为了追求 GraphQL 需要写很多代码，并不适合作为常规 API 开放给大众。后续如果反应强烈会考虑适配 GraphQL，其他感兴趣的开发也可以自由发挥，来完善 GraphQL API。

</Alert>

## 安装

```bash
yarn add @nocobase/resourcer
```

## Usage

```ts
import Resourcer from '@nocobase/resourcer';

const resourcer = new Resourcer();

resourcer.registerActions({
  async list(ctx, next) {
    ctx.arr.push(3);
    await next();
    ctx.arr.push(4);
  },
  async create(ctx, next) {
    ctx.arr.push(5);
    await next();
    ctx.arr.push(6);
  },
});

resourcer.define({
  name: 'users',
});

const context = {
  arr: [],
};

await resourcer.execute({
  resource: 'users',
  action: 'list',
}, context);

console.log(context.arr);
// [1,3,4,2]
```

## API

### context.action.params

action.params 分为三类：

- 用于定位资源和操作的参数（这些暂时也放在 action.params 里了）

  - actionName
  - resourceName
  - associatedName

- 定位资源 ID 相关参数

  - resourceKey
  - associatedKey

- request 的 query 和 body 相关参数

  - filter
  - fields
  - sort
  - page
  - perPage
  - values 对应为 request.body
  - 其他 query params

#### actionName

资源操作名称

#### resourceName

资源名称

#### associatedName

所属资源名称

#### resourceKey

资源 ID

#### associatedKey

所属资源 ID

#### filter

过滤条件

#### fields

字段

#### sort

排序

#### page

分页

#### perPage

每页显示条数

#### values

body 数据

#### 其他自定义参数

待补充...

### context.action.mergeParams

为 action.params 提供的多来源参数合并的方法

```ts
action.mergeParams({
  filter: {col1: 'val1'},
});
```

<Alert title="注意" type="warning">

后续可能会使用 [deepmerge](https://www.npmjs.com/package/deepmerge) 重构，以便处理更灵活的自定义合并规则。

</Alert>

### resourcer.define

配置资源

用例：

```ts
resourcer.define({
  name: 'posts',
  middlewares: [
    async (ctx, next) => {
      await next();
    },
    {
      only: [],
      except: [],
      handler: async (ctx, next) => {
        await next();
      },
    },
  ],
  actions: {
    async get(ctx, next) {
      await next();
    },
    list: {
      fields,
      filter,
      sort,
      page,
      perPage,
      middlewares: [],
      handler: async (ctx, next) => {
        await next();
      },
    },
  },
});
```

### resourcer.execute <Badge>实验性</Badge>

注入 context

### resourcer.import

批量导入已配置的资源

### resourcer.isDefined

判断资源是否已定义

### resourcer.koaRestApiMiddleware

原 resourcer.middleware

为 Koa 提供的类 REST API 中间件。提供了标准的 REST API 映射，Resource Action 与 Request Method 的对应关系如下：

| Resource Action | Request Method          |
| :-------------- | :---------------------- |
| list            | GET \<collection URL\>  |
| get             | GET \<resource URL\>    |
| create          | POST \<collection URL\> |
| update          | PUT \<resource URL\>    |
| destroy         | DELETE \<resource URL\> |

标准的 REST API 映射下，actionName 可以缺失，但也可以显式声明，当指定 actionName 时，将不受 Request Method 影响。相关 HTTP 格式如下：

```bash
# 独立资源
<requestMethod> /api/<resourceName>:<actionName>?<queryString>
<requestMethod> /api/<resourceName>:<actionName>/<resourceKey>?<queryString>

# 关系资源
<requestMethod> /api/<associatedName>/<associatedKey>/<resourceName>:<actionName>?<queryString>
<requestMethod> /api/<associatedName>/<associatedKey>/<resourceName>:<actionName>/<resourceKey>?<queryString>

<body> # 非 GET 请求时，可以提供 body 数据，一般为 JSON 格式
```

为了让大家更理解 Resource Action API 设计，我们接下来举几个具体的例子：

##### 查看文章列表

```bash
GET /api/posts?filter={"col1": "val1"}&fields=col1,col2&sort=-created_at
```

对应的 context.action.params 为：

```ts
{
  actionName: 'list',
  resourceName: 'posts',
  filter: {'col1': 'val1'},
  fields: ['col1', 'col2'],
  sort: ['-created_at'],
}
```

##### 新增文章

```bash
POST /api/posts

{"title": "title1"}
```

对应的 context.action.params 为：

```ts
{
  resourceName: 'posts',
  actionName: 'create',
  values: {
    title: 'title1',
  },
}
```

##### 查看文章详情

```bash
GET /api/posts/1?fields=col1,col2
```

对应的 context.action.params 为：

```ts
{
  resourceName: 'posts',
  resourceKey: 1,
  actionName: 'get',
  fields: ['col1', 'col2'],
}
```

##### 更新文章

```bash
PUT /api/posts/1

{"title": "title1"}
```

对应的 context.action.params 为：

```ts
{
  resourceName: 'posts',
  resourceKey: 1,
  actionName: 'update',
  values: {
    title: 'title1',
  },
}
```

##### 删除文章

```bash
DELETE /api/posts/1
```

对应的 context.action.params 为：

```ts
{
  resourceName: 'posts',
  resourceKey: 1,
  actionName: 'destroy',
}
```

##### 文章评论列表

```bash
GET /api/posts/1/comments?filter={"col1": "val1"}&fields=col1,col2&sort=-created_at
```

对应的 context.action.params 为：

```ts
{
  associatedName: 'posts',
  associatedKey: 1,
  resourceName: 'comments',
  actionName: 'list',
  filter: {'col1': 'val1'},
  fields: ['col1', 'col2'],
  sort: ['-created_at'],
}
```

##### 文章评论详情

```bash
GET /api/posts/1/comments/2
```

对应的 context.action.params 为：

```ts
{
  associatedName: 'posts',
  associatedKey: 1,
  resourceName: 'comments',
  resourceKey: 2,
  actionName: 'get',
}
```

##### 显式声明 actionName 的例子

```bash
POST /api/users:login

{"username": "admin", "password": "password"}
```

对应的 context.action.params 为：

```ts
{
  resourceName: 'users',
  actionName: 'login',
  values: {
    username: 'admin',
    password: 'password',
  },
}
```

当不指定 actionName 时，默认为 create，对应的是「新建用户」操作，但是指定 actionName=login 时，就变为了「用户登录」操作了。

<Alert title="注意" type="warning">

在 Resource Action API 的设计理念里，即使类似 login、register、logout 等非标准的 REST API 也可以非常方便的扩展。大家可以更专注于 action 本身，而不必纠结于 request method 和 route 应该如何设计，也不需要考虑 routes 优先级等问题。

</Alert>


### resourcer.registerAction(name: ActionName, options: ActionOptions)

原 resourcer.registerActionHandler

- name：操作名称
- options：操作配置

可用于注册全局的或某资源特有的 action。

<Alert title="注意" type="warning">

与 resourcer.define 不同，registerAction 的 actionName 支持三种格式：

- `<actionName>` 全局操作
- `<resourceName>:<actionName>` 某资源特有操作
- `<associatedName>.<resourceName>:<actionName>` 某关系资源特有操作

更复杂判断条件，需要结合 `resourcer.use` 方法一起处理

</Alert>

示例

```ts
resourcer.registerAction('actionName', async (ctx, next) => {
  await next();
});

// 带配置
resourcer.registerAction('actionName', {
  filter,
  fields,
  middlewares: [],
  handler: async (ctx, next) => {
    await next();
  },
});

resourcer.registerAction('resourceName:actionName', async (ctx, next) => {
  await next();
});

resourcer.registerAction('associatedName.resourceName:actionName', async (ctx, next) => {
  await next();
});
```

<Alert title="注意" type="warning">

resourcer 使用 koa-compress 来处理中间件，是一种洋葱圈模型，因此在 action handler 里也不要忘了 `next()`，不然会影响后置逻辑的处理。

</Alert>


更复杂的情况：

```ts
resourcer.use(async (ctx, next) => {
  const { actionName, resourceName } = ctx.action.params;
  if (actionName === 'foo') {
    // 其他判断条件
    // 不符合条件的 404 处理
    ctx.throw(404);
  }
  await next();
});
```

### resourcer.registerActions(actions) 

原 resourcer.registerActionHandlers

批量注册 actions，用法同 [resourcer.registerAction](#resourcerregisterActionname-actionname-handler-handlertype)

示例：

```ts
resourcer.registerActions({
  async foo(ctx, next) {
    await next();
  },
  async bar(ctx, next) {
    await next();
  },
});
```

### resourcer.registerActionMiddleware(actionName, handler) <Badge>未实现</Badge>

为某操作（action）注册特有的 middleware

### resourcer.registerResourceMiddleware(resourceName, options) <Badge>未实现</Badge>

为某资源（resource）注册特有的 middleware

### resourcer.use

注册 resourcer 全局 middleware

<Alert title="为什么要提供不同的中间件注册方法？" type="warning">

虽然大部分框架都提供了中间件，但是中间件的执行顺序（优先级）依赖于编码顺序，这种方式非常不利于插件化管理。因此，在 Resourcer 设计思想里，将中间件做了分层，不同层级的 middlewares 不依赖于编码顺序，而是如下顺序：

1. 首先，koa 层：`koa.use`
2. 其次，resourcer 层：`resourcer.use`
3. 再次，resource 层（每个资源独立）：`resourcer.registerActionMiddleware`
4. 最后，action 层：`resourcer.registerResourceMiddleware`

不过，每个层次的中间件执行顺序还依赖于编码顺序，如有需要再进行更细微的改进。

</Alert>