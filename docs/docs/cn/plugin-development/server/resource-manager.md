---
title: "ResourceManager 资源管理"
description: "NocoBase 服务端资源管理：app.resourceManager、registerActions、resource.use、Action 注册。"
keywords: "ResourceManager,资源管理,registerActions,resource.use,Action,NocoBase"
---

# ResourceManager 资源管理

NocoBase 的资源管理功能会自动将数据表（Collection）和关联（Association）转换为资源，并内置多种操作类型，让你可以快速构建 REST API。跟传统的 REST API 略有不同，NocoBase 的资源操作不直接依赖 HTTP 请求方法，而是通过显式定义 `:action` 来确定执行的具体操作。

## 自动生成资源

NocoBase 会自动将数据库中定义的 Collection 和 Association 转化为资源。比如定义了 `posts` 和 `tags` 两个集合：

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

系统会自动生成以下资源：

* `posts` 资源
* `tags` 资源
* `posts.tags` 关联资源

请求示例：

| 请求方式   | 路径                     | 操作   |
| -------- | ---------------------- | ---- |
| `GET`  | `/api/posts:list`      | 查询列表 |
| `GET`  | `/api/posts:get/1`     | 查询单条 |
| `POST` | `/api/posts:create`    | 新增   |
| `POST` | `/api/posts:update/1`  | 更新   |
| `POST` | `/api/posts:destroy/1` | 删除   |

| 请求方式   | 路径                        | 操作   |
| -------- | ------------------------- | ---- |
| `GET`  | `/api/tags:list`      | 查询列表 |
| `GET`  | `/api/tags:get/1`     | 查询单条 |
| `POST` | `/api/tags:create`    | 新增   |
| `POST` | `/api/tags:update/1`  | 更新   |
| `POST` | `/api/tags:destroy/1` | 删除   |

| 请求方式   | 路径                             | 操作                            |
| -------- | ------------------------------ | ----------------------------- |
| `GET`  | `/api/posts/1/tags:list`   | 查询某个 `post` 关联的所有 `tags`   |
| `GET`  | `/api/posts/1/tags:get/1`  | 查询某个 `post` 下的单条 `tags`    |
| `POST` | `/api/posts/1/tags:create`  | 新增某个 `post` 下的单条 `tags`    |
| `POST` | `/api/posts/1/tags:update/1`  | 更新某个 `post` 下的单条 `tags`    |
| `POST` | `/api/posts/1/tags:destroy/1`  | 删除某个 `post` 下的单条 `tags`    |
| `POST` | `/api/posts/1/tags:add`    | 向某个 `post` 下添加关联的 `tags`   |
| `POST` | `/api/posts/1/tags:remove` | 从某个 `post` 下移除关联的 `tags`   |
| `POST` | `/api/posts/1/tags:set`    | 设置某个 `post` 下的所有关联 `tags` |
| `POST` | `/api/posts/1/tags:toggle` | 切换某个 `post` 下的 `tags` 关联   |

:::tip 提示

NocoBase 的资源操作不直接依赖 HTTP 请求方法，而是通过显式定义 `:action` 来决定执行的操作。

:::

## 资源操作

NocoBase 内置了多种操作类型，覆盖常见的业务场景。

### 基础 CRUD 操作

| 操作名       | 说明     | 适用资源类型 | 请求方式     | 示例路径                   |
| --------- | ------ | ------ | -------- | ---------------------- |
| `list`    | 查询列表数据 | 所有     | GET/POST | `/api/posts:list`      |
| `get`     | 查询单条数据 | 所有     | GET/POST | `/api/posts:get/1`     |
| `create`  | 创建新记录  | 所有     | POST     | `/api/posts:create`    |
| `update`  | 更新记录   | 所有     | POST     | `/api/posts:update/1`  |
| `destroy` | 删除记录   | 所有     | POST     | `/api/posts:destroy/1` |
| `firstOrCreate`  | 查找第一条记录，不存在则创建 | 所有 | POST     |  `/api/users:firstOrCreate`  |
| `updateOrCreate` | 更新记录，不存在则创建    | 所有 | POST     |  `/api/users:updateOrCreate` |

### 关系操作

| 操作名      | 说明             | 适用关系类型                                   | 示例路径                           |
| -------- | -------------- | ---------------------------------------- | ------------------------------ |
| `add`    | 添加关联  | `hasMany`, `belongsToMany` | `/api/posts/1/tags:add`    |
| `remove` | 移除关联  | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`    | 重置关联  | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle` | 添加或移除关联 | `belongsToMany` | `/api/posts/1/tags:toggle`     |

### 操作参数

常见操作参数包括：

* `filter`：查询条件
* `values`：设置的值
* `fields`：指定返回字段
* `appends`：包含关联数据
* `except`：排除字段
* `sort`：排序规则
* `page`、`pageSize`：分页参数
* `paginate`：是否启用分页
* `tree`：是否返回树形结构
* `whitelist`、`blacklist`：字段白名单/黑名单
* `updateAssociationValues`：是否更新关联值

---

## 自定义资源操作

你可以用 `registerActionHandlers` 为已有资源注册额外的操作，支持全局操作和特定资源操作。

### 注册全局操作

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### 注册特定资源的操作

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

请求示例：

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

命名规则：`resourceName:actionName`，当包含关联时使用点语法（`posts.comments`）。

## 自定义资源

如果你需要提供跟数据表无关的资源，可以用 `resourceManager.define` 来定义：

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

请求方式与自动资源一致：

* `GET /api/app:getInfo`
* `POST /api/app:getInfo`（默认同时支持 GET/POST）

## 自定义中间件

用 `resourceManager.use()` 可以注册全局中间件。比如一个全局日志中间件：

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## 特有的 Context 属性

能够进入 `resourceManager` 层的 middleware 或 action，意味着该资源必定存在。此时你可以通过以下属性访问请求上下文：

### ctx.action

- `ctx.action.actionName`：操作名称
- `ctx.action.resourceName`：可能是 collection 或 association
- `ctx.action.params`：操作参数

### ctx.dataSource

当前的数据源对象

### ctx.getCurrentRepository()

当前的 repository 对象

## 如何获取不同数据源的 resourceManager 对象

`resourceManager` 归属于数据源，你可以为不同的数据源分别注册操作。

### 主数据源

主数据源可以直接用 `app.resourceManager`：

```ts
app.resourceManager.registerActionHandlers();
```

### 其他数据源

其他数据源可以通过 `dataSourceManager` 获取对应实例：

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### 遍历所有数据源

如果需要对所有数据源执行相同的操作，可以用 `dataSourceManager.afterAddDataSource` 遍历：

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```

## 相关链接

- [Resource API 速查表](../../api/flow-engine/resource.md) — 客户端 MultiRecordResource / SingleRecordResource 的完整方法签名和用法
- [ACL 权限控制](./acl.md) — 为资源操作配置角色权限和访问控制
- [Context 请求上下文](./context.md) — 在请求处理器中获取上下文信息
- [Middleware 中间件](./middleware.md) — 为请求添加拦截和处理逻辑
- [DataSourceManager 数据源管理](./data-source-manager.md) — 管理多个数据源及其资源管理器
- [Collections 数据表](./collections.md) — Collection 与 Resource 的自动映射关系
