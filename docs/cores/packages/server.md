---
title: '@nocobase/server'
order: 5
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

### initializeActionParams

初始化 action.params

### appDistServe

为 app dist 提供静态文件代理服务

### dbResourceRouter

resource 动态初始化，如果 resource 不存在，从 database 里同步。

<Alert title="注意" type="warning">
与 resourcer.koaRestApiMiddleware 方法存在大量重复，需要把 database 与 resource 的同步逻辑提炼出来
</Alert>

### demoBlacklistedActions

actions 黑名单

```ts
app.use(demoBlacklistedActions({
  blacklist: [],
}));
```

## API

### Server

Server 继承 Koa，更多用法可查阅 Koa API

#### server.constructor

初始化 server 实例

#### server.database

当前 server 实例的 database

#### server.resourcer

当前 server 实例的 resourcer

#### server.pluginManager <Badge>未实现</Badge>

当前 server 实例的 pluginManager

### PluginManager <Badge>未实现</Badge>

插件管理器

<Alert title="注意" type="warning">
不同 server 实例也可能需要 PluginManager，后续 CLI 和后台可管理也都需要，插件管理器独立出来处理比较合适。
</Alert>

#### pluginManager.register(name, options)

注册插件

#### pluginManager.has(name)

判断插件是否存在

#### pluginManager.get(name)

获取当前插件实例

#### pluginManager.load()

加载插件

#### pluginManager.reload()

重载插件

