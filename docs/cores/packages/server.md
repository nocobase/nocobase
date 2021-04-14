---
title: '@nocobase/server'
order: 4
# toc: menu
---

# @nocobase/server

## 介绍

提供最小核心的 NocoBase 服务

## 安装

```bash
yarn add @nocobase/server
```

## Usage

```ts
import { Application } from '@nocobase/server';

const api = new Application({
  database: {},
  resourcer: {},
});

// 配置数据表
api.database.table({
  name: 'demos',
  fields: [
    { type: 'string', name: 'name' },
  ],
});

await api.database.sync();

app.listen(3000);
```

HTTP API：

```bash
GET http://localhost:3000/api/demos
POST http://localhost:3000/api/demos
GET http://localhost:3000/api/demos/1
PUT http://localhost:3000/api/demos/1
DELETE http://localhost:3000/api/demos/1
```

SDK：

```ts
import API from '@nocobase/sdk';

const api = new API({
  baseUrl: 'http://localhost:3000/api'
});

// 细节待定
api.resource('demos').list();
api.resource('demos').create();
api.resource('demos').get();
api.resource('demos').update();
api.resource('demos').destroy();
```

## Middlewares

### actionParams
### appDistServe
### dbResourceRouter
### demoBlacklistedActions

## API

<Alert title="注意" type="warning">
这部分 API 还不稳定，并存在较大设计缺陷
</Alert>

### application.constructor
### application.database
### application.resourcer
### application.registerPlugin
### application.getPluginInstance
### application.loadPlugins
### application.loadPlugin
