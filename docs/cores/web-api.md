---
title: WEB API 设计
order: 2
toc: menu
nav:
  title: 核心
  order: 2
---

# WEB API 设计

<Alert title="注意" type="warning">
以下各代码片段，仅供阅读参考，可能与实际代码略有偏差。
</Alert>

和常规的 MVC 思路不同，NocoBase 的 Server 非常简单，先来一段简单例子代码感受一下：

```ts
import { Application } from '@nocobase/server';

const api = new Application({
  database: {},
  resourcer: {},
});

// 配置数据表
api.database.table({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'password', name: 'password' },
  ],
});

api.listen(3000);
```

相对应的 HTTP API：

```bash
GET http://localhost:3000/api/users
POST http://localhost:3000/api/users
GET http://localhost:3000/api/users/1
PUT http://localhost:3000/api/users/1
DELETE http://localhost:3000/api/users/1
```

内置了基础的 REST API，除此之外还可以自行扩展，如：

```ts
api.resourcer.registerAction('users:login', async (ctx, next) => {
  // 代码省略
});
```

HTTP API 新增了扩展

```bash
POST http://localhost:3000/api/users:login
```

配合 SDK 就是这样的了

```ts
// 常用的 REST API

// GET http://localhost:3000/api/users
api.resource('users').list();
// POST http://localhost:3000/api/users
api.resource('users').create();
// GET http://localhost:3000/api/users/1
api.resource('users').get();
// PUT http://localhost:3000/api/users/1
api.resource('users').update();
// DELETE http://localhost:3000/api/users/1
api.resource('users').destroy();

// 扩展的非 REST 风格的 API

// POST http://localhost:3000/api/users:login
api.resource('users').login();
// POST http://localhost:3000/api/users:register
api.resource('users').register();
// POST http://localhost:3000/api/users:logout
api.resource('users').logout();
// POST http://localhost:3000/api/users:export
api.resource('users').export();
```
