# ResourceManager 资源管理

NocoBase 的资源管理功能可以自动将现有的数据表（collection）和关联（association）转换为资源，并内置多种操作类型，帮助开发者快速构建 REST API 资源操作。与传统的 REST API 略有不同，NocoBase 的资源操作并不依赖 HTTP 请求方法，而是通过显式定义 `:action` 来确定执行的具体操作。

## 自动生成资源

NocoBase 会自动将数据库中定义的 `collection` 和 `association` 转化为资源。例如，定义了 `posts` 和 `comments` 两个集合：

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

这将会自动生成以下资源：

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

NocoBase 的资源操作不直接依赖于请求方法，而是通过显式的定义 `:action` 来决定执行的操作。

:::

## 资源操作

NocoBase 提供了丰富的内置操作类型，以满足各种业务需求。

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

NocoBase 允许为已有资源注册额外操作。可以使用 `registerActionHandlers` 为所有或特定资源自定义操作。

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

如果你需要提供与数据表无关的资源时，可以使用 `resourceManager.define` 方法来定义：

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

使用 `resourceManager.use()` 方法注册全局中间件。例如：

全局日志中间件

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## 特有的 Context 属性

能够进入 `resourceManager` 层的 middleware 或 action 中，意味着该资源必定存在。

### ctx.action

- `ctx.action.actionName`：操作名称
- `ctx.action.resourceName`：可能是 collection 或 association
- `ctx.action.params`：操作参数

### ctx.dataSource

当前的数据源对象

### ctx.getCurrentRepository()

当前的 repository 对象

## 如何获取不同数据源的 resourceManager 对象

`resourceManager` 归属于数据源，可以为不同的数据源分别注册操作。

### 主数据源

对于主数据源，可以直接使用 `app.resourceManager` 进行操作：

```ts
app.resourceManager.registerActionHandlers();
```

### 其他数据源

对于其他数据源，可以通过 `dataSourceManager` 获取特定的数据源实例，并使用该实例的 `resourceManager` 进行操作：

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### 遍历所有数据源

如果需要对所有已添加的数据源执行相同的操作，可以使用 `dataSourceManager.afterAddDataSource` 方法进行遍历，确保每个数据源的 `resourceManager` 都能注册相应的操作：

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```
