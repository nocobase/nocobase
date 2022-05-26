# 概述

NocoBase 的 HTTP API 基于 Resource & Action 设计，是 REST API 的超集，操作不局限于增删改查，在 NocoBase 里，Resource Action 可以任意的扩展。

## 资源 Resource

在 NocoBase 里，资源（resource）有两种表达方式：

- `<collection>`
- `<collection>.<association>`

<Alert>

- collection 是所有抽象数据的集合
- association 为 collection 的关联数据
- resource 包括 collection 和 collection.association 两类

</Alert>

### 示例

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

### 示例

- `posts:create` 创建文章
- `posts.user:get` 查看文章用户
- `posts.tags:add` 附加文章标签（将现有的标签与文章关联）

## 请求 URL

```bash
<GET|POST>   /api/<collection>:<action>
<GET|POST>   /api/<collection>:<action>/<collectionIndex>
<GET|POST>   /api/<collection>/<collectionIndex>/<association>:<action>
<GET|POST>   /api/<collection>/<collectionIndex>/<association>:<action>/<associationIndex>
```

### 示例

posts 资源

```bash
POST  /api/posts:create
GET   /api/posts:list
GET   /api/posts:get/1
POST  /api/posts:update/1
POST  /api/posts:destroy/1
```

posts.comments 资源

```bash
POST  /api/posts/1/comments:create
GET   /api/posts/1/comments:list
GET   /api/posts/1/comments:get/1
POST  /api/posts/1/comments:update/1
POST  /api/posts/1/comments:destroy/1
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

## 资源定位

- collection 资源，通过 `collectionIndex` 定位到待处理的数据，`collectionIndex` 必须唯一
- association 资源，通过 `collectionIndex` 和 `associationIndex` 联合定位待处理的数据，`associationIndex` 可能不是唯一的，但是 `collectionIndex` 和 `associationIndex` 的联合索引必须唯一

查看 association 资源详情时，请求的 URL 需要同时提供 `<collectionIndex>` 和 `<associationIndex>`，`<collectionIndex>` 并不多余，因为 `<associationIndex>` 可能不是唯一的。

例如 `tables.fields` 表示数据表的字段

```bash
GET   /api/tables/table1/fields/title
GET   /api/tables/table2/fields/title
```

table1 和 table2 都有 title 字段，title 在 table1 里是唯一的，但是其他表也可能有 title 字段

## 请求参数

请求的参数可以放在 Request 的 headers、parameters（query string）、body（GET 请求没有 body） 里。

几个特殊的 Parameters 请求参数

- `filter` 数据过滤，用于查询相关操作里；
- `filterByTk` 根据 tk 字段字过滤，用于指定详情数据的操作里；
- `sort` 排序，用于查询相关操作里。
- `fields` 输出哪些数据，用于查询相关操作里；
- `appends` 附加关系字段，用于查询相关操作里；
- `except` 排除哪些字段（不输出），用于查询相关操作里；
- `whitelist` 字段白名单，用于数据的创建和更新相关操作里；
- `blacklist` 字段黑名单，用于数据的创建和更新相关操作里；

### filter

数据过滤

```bash
# simple
GET /api/posts?filter[status]=publish
# 推荐使用 json string 的格式，需要 encodeURIComponent 编码
GET /api/posts?filter={"status":"published"}

# filter operators
GET /api/posts?filter[status.$eq]=publish
GET /api/posts?filter={"status.$eq":"published"}

# $and 
GET /api/posts?filter={"$and": [{"status.$eq":"published"}, {"title.$includes":"a"}]}
# $or
GET /api/posts?filter={"$or": [{"status.$eq":"pending"}, {"status.$eq":"draft"}]}

# association field
GET /api/posts?filter[user.email.$includes]=gmail
GET /api/posts?filter={"user.email.$includes":"gmail"}
```

[点此查看更多关于 filter operators 的内容](http-api/filter-operators) 

### filterByTk

根据 tk 字段过滤，默认情况：

- collection 资源，tk 为数据表的主键；
- association 资源，tk 为 association 的 targetKey 字段。

```bash
GET   /api/posts:get?filterByTk=1&fields=name,title&appends=tags
```

### sort

排序。降序时，字段前面加上减号 `-`。

```bash
# createAt 字段升序
GET   /api/posts:get?sort=createdAt
# createAt 字段降序
GET   /api/posts:get?sort=-createdAt
# 多个字段联合排序，createAt 字段降序、title A-Z 升序
GET   /api/posts:get?sort=-createdAt,title
```

### fields

输出哪些数据

```bash
GET   /api/posts:list?fields=name,title

Response 200 (application/json)
{
  "data": [
    {
      "name": "",
      "title": ""
    }
  ],
  "meta": {}
}
```

### appends

附加关系字段

### except

排除哪些字段（不输出），用于查询相关操作里；

### whitelist

白名单

```bash
POST  /api/posts:create?whitelist=title

{
  "title": "My first post",
  "date": "2022-05-19"      # date 字段会被过滤掉，不会写入数据库
}
```

### blacklist

黑名单

```bash
POST  /api/posts:create?blacklist=date

{
  "title": "My first post",
  "date": "2022-05-19"      # date 字段会被过滤掉，不会写入数据库
}
```

## 请求响应

响应的格式

```ts
type ResponseResult = {
  data?: any;               // 主体数据
  meta?: any;               // 附加数据
  errors?: ResponseError[]; // 报错
};

type ResponseError = {
  code?: string;
  message: string;
};
```

### 示例

查看列表

```bash
GET /api/posts:list

Response 200 (application/json)

{
  data: [
    {
      id: 1
    }
  ],
  meta: {
    count: 1
    page: 1,
    pageSize: 1,
    totalPage: 1
  },
}
```

查看详情

```bash
GET /api/posts:get/1

Response 200 (application/json)

{
  data: {
    id: 1
  },
}
```

报错

```bash
POST /api/posts:create

Response 400 (application/json)

{
  errors: [
    {
      message: 'name must be required',
    },
  ],
}
```