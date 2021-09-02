---
title: '@nocobase/sdk'
order: 5
# toc: menu
---

# @nocobase/sdk <Badge>待完善</Badge>

## 介绍

## 安装

```bash
yarn add @nocobase/sdk
```

## Usage

SDK：


```ts
import API from '@nocobase/sdk';

const api = new API({
  baseUrl: 'http://localhost:3000/api'
});

// 细节待补充
await api.resource('demos').list();
await api.resource('demos').create();
await api.resource('demos').get();
await api.resource('demos').update();
await api.resource('demos').destroy();
```

HTTP API：

```bash
GET http://localhost:3000/api/demos
POST http://localhost:3000/api/demos
GET http://localhost:3000/api/demos/1
PUT http://localhost:3000/api/demos/1
DELETE http://localhost:3000/api/demos/1
```

## API

```bash
# 独立资源
<requestMethod> /api/<resourceName>:<actionName>?<queryString>
<requestMethod> /api/<resourceName>:<actionName>/<resourceKey>?<queryString>

# 关系资源
<requestMethod> /api/<associatedName>/<associatedKey>/<resourceName>:<actionName>?<queryString>
<requestMethod> /api/<associatedName>/<associatedKey>/<resourceName>:<actionName>/<resourceKey>?<queryString>

<body> # 非 GET 请求时，可以提供 body 数据，一般为 JSON 格式
```

## SDK

与 context.action.params 参数大体一致：

```ts
api.resource('<resourceName>').<actionName>({
  resourceKey,
  filter,
  fields,
  sort,
  page,
  perPage,
  values,
});

// 关系资源
api.resource('<associatedName>.<resourceName>').<actionName>({
  associatedKey,
  resourceKey,
  filter,
  fields,
  sort,
  page,
  perPage,
  values,
});
```
