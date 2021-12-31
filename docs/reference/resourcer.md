# Resource & Action

## Resource - 资源

资源分类

- 独立资源，如 `posts`
- 关系资源，如 `posts.tags` `posts.user` `posts.comments`

服务端如何定义资源

```ts
// 独立资源
server.resource({
  name: 'posts',
  actions: {},
});

// 关系资源
server.resource({
  name: 'posts.comments',
  actions: {},
});
```

资源 URI

```bash
# 独立资源，文章
/api/posts
# 关系资源，文章 ID=1 的评论
/api/posts/1/comments
```

客户端如何获取资源

```ts
const api = new APIClient();

api.resource('posts');
api.resource('posts.comments', 1);
```

## Action - 操作

服务端定义

```ts
// 独立资源
server.resource({
  name: 'posts',
  actions: {
    create(ctx, next) {},
  },
});

// 关系资源
server.resource({
  name: 'posts.comments',
  actions: {
    create(ctx, next) {},
  },
});
```

HTTP API

```bash
# 独立资源，添加文章
POST  /api/posts:create
# 关系资源，添加文章 ID=1 的评论
POST  /api/posts/1/comments:create
```

Client SDK

```ts
api.resource('posts').create();
api.resource('posts.comments', 1).create();
```

常用的 CRUD 操作

- create  新增资源
- get     查看资源详情
- list    查看资源列表
- update  更新资源
- destroy 删除资源

## Action API

服务端 ctx.action 对象

```ts
class Action {
  // 资源名称
  resourceName: string;
  // 资源参数
  resourceArgs: any[]; // api.resource() 的参数
  // 操作方法的名称
  name: string;
  // 操作方法的参数
  args: any[];
  // 大多数方法可能只有一个参数，所以加了个便捷的 firstArg
  get firstArg() {
    return this.args[0] || {};
  }
}

api.resource('posts').customMethod(1, {a: 'a'}, 2);
// ctx.action 主要参数的情况
{
  // 资源名称
  resourceName: 'posts',
  resourceArgs: ['posts'],
  name: 'customMethod',
  args: [1, {a: 'a'}, 2],
  // 额外的适配 db.collections 使用的参数
  collectionName: 'posts',
}

api.resource('posts.comments', 1).customMethod(1, {a: 'a'}, 2);
// ctx.action 主要参数的情况
{
  // 资源名称
  resourceName: 'posts.comments',
  resourceArgs: ['posts.comments', 1],
  name: 'customMethod',
  args: [1, {a: 'a'}, 2],
  // 额外的适配 db.collections 使用的参数
  collectionName: 'posts',
  associationName: 'comments',
}
```

## 对应关系

不同 action 的参数在客户端请求中的对应关系

常规情况

```bash
POST  /api/posts:create?query
body
```

SDK

```ts
api.resource('posts').create({...query, values: body});
```

如果需要处理多个参数时，使用 `__args__` 来处理：

```bash
# GET 请求的 __args__ 会 JSON.parse 解析
GET   /api/posts:add?__args__=[1,2,3]
# 或者
# POST 请求时，body 里直接传 JSON
POST  /api/posts:add
{
  __args__: [1,2,3],
}
```

SDK

```ts
api.resource('posts').add([1,2,3]);
```


### create

Client SDK

```ts
api.resource('posts').create({ values, whitelist, blacklist });
```

HTTP API

```bash
POST  /api/posts:create?whitelist=a,b&blacklist=c,d
values
```

ctx.action

```ts
const [{ values, whitelist, blacklist }] = ctx.action.args;
// 因为只有一个参数，所以也可以用 action.firstArg
const { values, whitelist, blacklist } = ctx.action.firstArg;
```

### get

Client SDK

```ts
api.resource('posts').get(1);
api.resource('posts').get({
  filterByPk: 1,
  filter,
  fields,
  appends,
  expect,
});
```

HTTP API

```bash
GET   /api/posts:get/<filterByPk>?filter=&fields=c,d
```

ctx.action

```ts
const [{ filterByPk, filter, fields, appends, expect }] = ctx.action.args;
// 因为只有一个参数，所以也可以用 action.firstArg
const { filterByPk, filter, fields, appends, expect } = ctx.action.firstArg;
```

## 示例

### 例子一

服务端

```ts
server.resource({
  name: 'posts',
  actions: {
    get(ctx, next) {
      ctx.action;
    },
  },
});
```

客户端

```ts
apiClient.resource('posts').get();
```

HTTP API

```bash
GET   /api/posts:get
```

### 例子二

只需要定义 collection，不需要定义 resource，会自动处理。

```ts
server.db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' }
  ],
});
// 自动定义相关 resource
server.resource({
  name: 'posts',
});
```

客户端

```ts
apiClient.resource('posts').create();
apiClient.resource('posts').get();
apiClient.resource('posts').list();
apiClient.resource('posts').update();
apiClient.resource('posts').destroy();
```

HTTP API

```bash
POST  /api/posts:create
GET   /api/posts:get
GET   /api/posts:list
POST  /api/posts:update
POST  /api/posts:destroy
```

### 示例三

关系资源

```ts
server.db.collection({
  name: 'posts',
  fields: [
    { type: 'hasMany', name: 'comments' }
  ],
});
// 自动定义相关 resource
server.resource({
  name: 'posts.comments',
});
```

客户端

```ts
apiClient.resource('posts.comments', 1).create();
apiClient.resource('posts.comments', 1).get();
apiClient.resource('posts.comments', 1).list();
apiClient.resource('posts.comments', 1).update();
apiClient.resource('posts.comments', 1).destroy();
```

HTTP API

```bash
POST  /api/posts/1/comments:create
GET   /api/posts/1/comments:get
GET   /api/posts/1/comments:list
POST  /api/posts/1/comments:update
POST  /api/posts/1/comments:destroy
```
