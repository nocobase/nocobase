---
title: "Kiểm thử Plugin Server"
description: "Kiểm thử đơn vị, kiểm thử tích hợp, Mock và công cụ kiểm thử cho Plugin NocoBase phía server."
keywords: "Kiểm thử Plugin,Kiểm thử đơn vị,Kiểm thử tích hợp,Kiểm thử server,NocoBase"
---

# Test - Kiểm thử

NocoBase cung cấp một bộ công cụ kiểm thử đầy đủ, giúp bạn nhanh chóng xác minh logic database, interface API và tính đúng đắn của các chức năng trong quá trình phát triển Plugin.

## Tại sao cần viết kiểm thử

Lợi ích của việc viết kiểm thử tự động trong phát triển Plugin:

- Nhanh chóng xác minh model database, API, logic nghiệp vụ có đúng không  
- Tránh lỗi hồi quy (sau khi nâng cấp core tự động kiểm tra tính tương thích của Plugin)  
- Hỗ trợ chạy kiểm thử tự động trong môi trường tích hợp liên tục (CI)  
- Hỗ trợ kiểm thử chức năng Plugin mà không cần khởi động dịch vụ đầy đủ  

## Cơ bản về môi trường kiểm thử

NocoBase cung cấp hai công cụ kiểm thử cốt lõi:

| Công cụ | Mô tả | Mục đích |
|------|------|------|
| `createMockDatabase` | Tạo instance database trong bộ nhớ | Kiểm thử model database và logic |
| `createMockServer` | Tạo instance ứng dụng đầy đủ (bao gồm database, plugin, API, v.v.) | Kiểm thử quy trình nghiệp vụ và hành vi interface |

## Sử dụng `createMockDatabase` để kiểm thử database

`createMockDatabase` phù hợp để kiểm thử các chức năng liên quan trực tiếp đến database, ví dụ định nghĩa model, kiểu Field, mối quan hệ, thao tác CRUD, v.v.

### Ví dụ cơ bản

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

### Kiểm thử thao tác CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Tạo
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Cập nhật
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### Kiểm thử mối quan hệ model

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

## Sử dụng `createMockServer` để kiểm thử API

`createMockServer` sẽ tự động tạo một instance ứng dụng đầy đủ bao gồm database, plugin, route API, phù hợp để kiểm thử interface Plugin.

### Ví dụ cơ bản

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

### Kiểm thử truy vấn và cập nhật của interface

```ts
// Truy vấn danh sách user
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Cập nhật user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Mô phỏng trạng thái đăng nhập hoặc kiểm thử quyền

Bạn có thể bật plugin `auth` khi tạo `MockServer`, sau đó dùng interface đăng nhập để lấy token hoặc session:

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

Cũng có thể dùng phương thức `login()` đơn giản hơn:

```ts
await app.agent().login(userOrId);
```

## Tổ chức tệp kiểm thử trong Plugin

Khuyến nghị lưu các tệp kiểm thử liên quan đến logic server trong thư mục `./src/server/__tests__` của Plugin.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Thư mục mã nguồn
│   └── server/              # Code server
│       ├── __tests__/       # Thư mục tệp kiểm thử
│       │   ├── db.test.ts   # Kiểm thử liên quan đến database (dùng createMockDatabase)
│       │   └── api.test.ts  # Kiểm thử liên quan đến API
```

## Chạy kiểm thử

```bash
# Chỉ định thư mục
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Chỉ định tệp
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```

## Liên kết liên quan

- [Plugin](./plugin.md) — Vòng đời Plugin và API cốt lõi
- [Collections](./collections.md) — Định nghĩa và cấu hình bảng dữ liệu
- [Database](./database.md) — Thao tác database và Repository API
- [Tổng quan phát triển server](./index.md) — Tổng quan các module server
- [Tổng quan phát triển Plugin](../index.md) — Giới thiệu tổng thể về phát triển Plugin
