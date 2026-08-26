---
title: "服务端插件测试"
description: "NocoBase 服务端插件单元测试、集成测试、Mock、测试工具。"
keywords: "插件测试,单元测试,集成测试,服务端测试,NocoBase"
---

# Test 测试

NocoBase 提供了一套完整的测试工具，帮助你在插件开发过程中快速验证数据库逻辑、API 接口和功能实现的正确性。

## 为什么要编写测试

在插件开发中编写自动化测试的好处：

- 快速验证数据库模型、API、业务逻辑是否正确  
- 避免回归错误（升级核心后自动检测插件兼容性）  
- 支持持续集成（CI）环境自动运行测试  
- 支持在不启动完整服务的情况下测试插件功能  

## 测试环境基础

NocoBase 提供两个核心测试工具：

| 工具 | 说明 | 用途 |
|------|------|------|
| `createMockDatabase` | 创建内存数据库实例 | 测试数据库模型和逻辑 |
| `createMockServer` | 创建完整的应用实例（含数据库、插件、API 等） | 测试业务流程和接口行为 |

## 使用 `createMockDatabase` 进行数据库测试

`createMockDatabase` 适合测试与数据库直接相关的功能，比如模型定义、字段类型、关系、CRUD 操作等。

### 基础示例

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### 测试 CRUD 操作

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// 创建
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// 更新
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### 测试模型关联

```ts
const Users = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## 使用 `createMockServer` 进行 API 测试

`createMockServer` 会自动创建一个包含数据库、插件、API 路由的完整应用实例，适合测试插件接口。

### 基础示例

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### 测试接口的查询与更新

```ts
// 查询用户列表
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// 更新用户
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### 模拟登录状态或权限测试

你可以在创建 `MockServer` 时启用 `auth` 插件，然后使用登录接口获得 token 或 session：

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

也可以用更简单的 `login()` 方法：

```ts
await app.agent().login(userOrId);
```

## 在插件中组织测试文件

建议在插件的 `./src/server/__tests__` 文件夹中存放与服务端逻辑相关的测试文件。

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # 源代码目录
│   └── server/              # 服务端代码
│       ├── __tests__/       # 测试文件目录
│       │   ├── db.test.ts   # 数据库相关测试（使用 createMockDatabase）
│       │   └── api.test.ts  # API 相关测试
```

## 运行测试

```bash
# 指定目录
yarn test packages/plugins/@my-project/plugin-hello/src/server
# 指定文件
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```

## 相关链接

- [Plugin 插件](./plugin.md) — 插件生命周期与核心 API
- [Collections 数据表](./collections.md) — 数据表的定义与配置
- [Database 数据库](./database.md) — 数据库操作与 Repository API
- [服务端开发概述](./index.md) — 服务端各模块一览
- [插件开发概述](../index.md) — 插件开发整体介绍
