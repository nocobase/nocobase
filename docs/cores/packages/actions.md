---
title: '@nocobase/actions'
order: 3
# toc: menu
---

# @nocobase/actions

## 介绍

为资源提供了几种默认方法：

- list：查看列表
- get：查看详情
- create：创建数据
- update：更新数据
- destroy：删除数据
- set：建立关联
- add：附加关联
- remove：删除关联
- toggle：附加或删除关联
- sort：排序

## 安装

```bash
yarn add @nocobase/actions
```

<Alert title="注意" type="warning">
@nocobase/actions 不能单独使用，依赖于 @nocobase/database 和 @nocobase/resourcer
</Alert>

## Usage

```ts
import Koa from 'koa';
import Database from '@nocobase/database';
import { actions, middlewares } from '@nocobase/actions';

// 配置数据表

const db = new Database({
  // 省略
});

const table = db.table({
  name: 'posts',
  fields: [
    {type: 'string', name: 'title'},
  ],
});

await table.sync();

// 配置资源

const resourcer = new Resourcer();
resourcer.registerActionHandlers({ ...actions.common });
resourcer.define({
  name: 'posts',
});

// 使用 Koa

const app = new Koa();
app.use(async (ctx, next) => {
  ctx.db = database;
  await next();
});
app.use(resourcer.middleware({
  prefix: '/api',
}));
app.listen(3000);
```

创建一条 posts 数据

```bash
curl -d '{"title": "title 1"}' -H 'Content-Type: application/json' http://localhost:3000/api/posts
```

## Actions

### list

查询列表数据

API

```bash
# 常规
GET /api/<resourceName>?filter[col1]=val1&fields=col1,col2&sort=-created_at&page=2&perPage=10
# 关系资源
GET /api/<associatedName>/<associatedKey>/<resourceName>?filter[col1]=val1&fields=col1,col2&sort=-created_at&page=2&perPage=10
```

SDK

```ts
// 常规
api.resource('<resourceName>').list({
  filter,
  fields,
  sort,
  page,
  perPage,
});

// 关系资源
api.resource('<associatedName>.<resourceName>').list({
  associatedKey,
  filter,
  fields,
  sort,
  page,
  perPage,
});
```

### get

查询详情数据

API

```bash
# 常规
GET /api/<resourceName>/<resourceKey>?filter[col1]=val1&fields=col1,col2&sort=-created_at&page=2&perPage=10
# 关系资源
GET /api/<associatedName>/<associatedKey>/<resourceName>/<resourceKey>?filter[col1]=val1&fields=col1,col2&sort=-created_at&page=2&perPage=10
```

SDK

```ts
// 常规
api.resource('<resourceName>').get({
  resourceKey,
  filter,
  fields,
  sort,
  page,
  perPage,
});

// 关系资源
api.resource('<associatedName>.<resourceName>').get({
  associatedKey,
  resourceKey,
  filter,
  fields,
  sort,
  page,
  perPage,
});
```

### create

新增数据

API

```bash
# 常规
POST /api/<resourceName>?fields=col1,col2
# or 关系资源
POST /api/<associatedName>/<associatedKey>/<resourceName>?fields=col1,col2

values # JSON 格式
```

SDK

```ts
// 常规
api.resource('<resourceName>').create({
  fields,
  values
});

// 关系资源
api.resource('<associatedName>.<resourceName>').create({
  associatedKey,
  fields,
  values,
});
```

### update

更新数据

API

```bash
# 常规
PUT /api/<resourceName>/<resourceKey>?fields=col1,col2
# 关系资源
PUT /api/<associatedName>/<associatedKey>/<resourceName>/<resourceKey>?fields=col1,col2

values # JSON 格式
```

SDK

```ts
// 常规
api.resource('<resourceName>').update({
  resourceKey,
  fields,
  values,
});

// 关系资源
api.resource('<associatedName>.<resourceName>').update({
  associatedKey,
  resourceKey,
  fields,
  values,
});
```

### destroy

删除数据

API

```bash
# 常规
DELETE /api/<resourceName>/<resourceKey>
# 关系资源
DELETE /api/<associatedName>/<associatedKey>/<resourceName>/<resourceKey>

# 常规，通过 filter 参数
DELETE /api/<resourceName>?filter=
# 关系资源，通过 filter 参数
DELETE /api/<associatedName>/<associatedKey>/<resourceName>?filter=
```

SDK

```ts
// 常规
api.resource('<resourceName>').destroy({
  resourceKey,
  filter,
});

// 关系资源
api.resource('<associatedName>.<resourceName>').destroy({
  associatedKey,
  resourceKey,
  filter,
});
```

### set

建立关联，旧关联会解除。此操作需要显式声明 actionName。

API

```bash
POST /api/<associatedName>/<associatedKey>/<resourceName>:set/<resourceKey>

values
```

SDK

```ts
api.resource('<associatedName>.<resourceName>').set({
  associatedKey,
  resourceKey,
  values,
});
```

### add

关联的附加操作，此操作需要显式声明 actionName。

API

```bash
POST /api/<associatedName>/<associatedKey>/<resourceName>:add/<resourceKey>

values
```

SDK

```ts
api.resource('<associatedName>.<resourceName>').add({
  associatedKey,
  resourceKey,
  values,
});
```

### remove

移除关联，此操作需要显式声明 actionName。

API

```bash
POST /api/<associatedName>/<associatedKey>/<resourceName>:remove/<resourceKey>
```

SDK

```ts
// 常规
api.resource('<resourceName>').remove({
  resourceKey,
});

// 关系资源
api.resource('<associatedName>.<resourceName>').remove({
  associatedKey,
  resourceKey,
});
```

### toggle

API

```bash
POST /api/<associatedName>/<associatedKey>/<resourceName>:toggle/<resourceKey>
```

SDK

```ts
// 常规
api.resource('<resourceName>').list({
  resourceKey,
  fields,
});

// 关系资源
api.resource('<associatedName>.<resourceName>').list({
  associatedKey,
  resourceKey,
  fields,
});
```

### sort

API

```bash
# 常规
GET /api/<resourceName>:sort/<resourceKey>
# 关系资源
GET /api/<associatedName>/<associatedKey>/<resourceName>:sort/<resourceKey>
```

SDK

```ts
// 常规
api.resource('<resourceName>').sort({
  resourceKey,
  values: {
    field, // 默认为 sort 字段
    target: {
      id: 5,
    },
  },
});

// 关系资源
api.resource('<associatedName>.<resourceName>').list({
  associatedKey,
  resourceKey,
  values: {
    field, // 默认为 sort 字段
    target: {
      id: 5,
    },
  },
});
```

## Middlewares

### associated

注入 associated 实例，同时会提供 resourceField 字段。

<Alert title="resourceField 和 resourceName 的区别？" type="warning">

关系资源 `<associatedName>.<resourceName>` 时，resourceName 并不一定是真实的 tableName，而是 fieldName。resource 的 tableName 为 resourceField.target。

</Alert>

### dataWrapping

输出的 JSON 会用 data 包裹。

用法：

```ts
app.use(dataWrapping);
```

用例：

```ts
ctx.body = [];
```

最终输出的 response body 为：

```ts
{
  data: [],
}
```