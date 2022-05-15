# HTTP API 设计

NocoBase 的 HTTP API 基于 Resource 和 Action 设计，是 REST API 的超集，请求方法不局限于增删改查，在 NocoBase 里，Resource Action 可以任意的扩展。

## 资源 Resource

在 NocoBase 里，资源（resource）有两种表达方式：

- `<collection>`
- `<collection>.<association>`

<Alert>

- collection 是所有抽象数据的集合
- association 为 collection 数据的关联数据
- resource 包括 collection 和 collection.association 两类

</Alert>

示例

- `posts` 文章
- `posts.user` 文章用户
- `posts.tags` 文章标签

## 操作 Action

以 `:<action>` 的方式表示资源操作

- `<collection>:<action>`
- `<collection>.<association>:<action>`

内置的全局操作，可用于 collection 或 association

- `create`
- `get`
- `list`
- `update`
- `destroy`
- `move`

内置的关联操作，仅用于 association

- `set`
- `add`
- `remove`
- `toggle`

示例

- `posts:create` 创建文章
- `posts.user:get` 查看文章用户
- `posts.tags:add` 附加文章标签（将现有的标签与文章关联）

## HTTP 请求

```bash
<GET|POST>   /api/<collection>:<action>
<GET|POST>   /api/<collection>/<collectionId>/<association>:<action>
```

示例

posts 资源

```bash
POST  /api/posts:create
GET   /api/posts:get
GET   /api/posts:list
POST  /api/posts:update
POST  /api/posts:destroy
```

posts.comments 资源

```bash
POST  /api/posts/1/comments:create
GET   /api/posts/1/comments:get
GET   /api/posts/1/comments:list
POST  /api/posts/1/comments:update
POST  /api/posts/1/comments:destroy
```

posts.tags 资源

```bash
POST  /api/posts/1/tags:create
GET   /api/posts/1/tags:get
GET   /api/posts/1/tags:list
POST  /api/posts/1/tags:update
POST  /api/posts/1/tags:destroy
POST  /api/posts/1/tags:add
GET   /api/posts/1/tags:remove
```

## REST API

NocoBase 的 HTTP API 是 REST API 的超集，标准的增删改查也支持 RESTful 风格。

| 操作      | HTTP API | REST API |
| ----------- | ----------- | ----------- |
| 创建数据      | `POST  /api/posts:create`       | POST  /api/posts       |
| 查看数据列表   | `GET /api/posts:list`       | GET  /api/posts       |
| 查看数据详情  | `GET   /api/posts:get?filterByTk=1` | POST  /api/posts/1       |
| 更新数据      | POST  /api/posts:update?filterByTk=1 | PUT  /api/posts/1       |
| 删除数据      | POST  /api/posts:destroy?filterByTk=1 | DELETE  /api/posts/1       |
