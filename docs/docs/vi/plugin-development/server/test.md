:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Kiểm thử

NocoBase cung cấp một bộ công cụ kiểm thử toàn diện, giúp các nhà phát triển nhanh chóng xác minh tính đúng đắn của logic cơ sở dữ liệu, giao diện API và việc triển khai tính năng trong quá trình phát triển **plugin**. Bài viết này sẽ hướng dẫn cách viết, chạy và tổ chức các bài kiểm thử này.

## Tại sao cần viết kiểm thử?

Lợi ích của việc viết kiểm thử tự động trong quá trình phát triển **plugin**:

- Nhanh chóng xác minh tính đúng đắn của các mô hình cơ sở dữ liệu, API và logic nghiệp vụ.
- Tránh các lỗi hồi quy (tự động phát hiện khả năng tương thích của **plugin** sau khi nâng cấp lõi hệ thống).
- Hỗ trợ môi trường tích hợp liên tục (CI) để tự động chạy kiểm thử.
- Hỗ trợ kiểm thử chức năng của **plugin** mà không cần khởi động toàn bộ dịch vụ.

## Kiến thức cơ bản về môi trường kiểm thử

NocoBase cung cấp hai công cụ kiểm thử cốt lõi:

| Công cụ | Mô tả | Mục đích |
|---|---|---|
| `createMockDatabase` | Tạo một phiên bản cơ sở dữ liệu trong bộ nhớ | Kiểm thử các mô hình và logic cơ sở dữ liệu |
| `createMockServer` | Tạo một phiên bản ứng dụng hoàn chỉnh (bao gồm cơ sở dữ liệu, **plugin**, API, v.v.) | Kiểm thử các quy trình nghiệp vụ và hành vi giao diện |

## Sử dụng `createMockDatabase` để kiểm thử cơ sở dữ liệu

`createMockDatabase` phù hợp để kiểm thử các chức năng liên quan trực tiếp đến cơ sở dữ liệu, chẳng hạn như định nghĩa mô hình, kiểu trường, quan hệ, các thao tác CRUD, v.v.

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

### Kiểm thử các thao tác CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Create
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Update
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### Kiểm thử các liên kết mô hình

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

`createMockServer` tự động tạo một phiên bản ứng dụng hoàn chỉnh bao gồm cơ sở dữ liệu, **plugin** và các tuyến API, rất lý tưởng để kiểm thử giao diện của **plugin**.

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

### Kiểm thử truy vấn và cập nhật API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Mô phỏng trạng thái đăng nhập hoặc kiểm thử quyền hạn

Bạn có thể bật **plugin** `auth` khi tạo `MockServer`, sau đó sử dụng giao diện đăng nhập để lấy token hoặc session:

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

Bạn cũng có thể sử dụng phương thức `login()` đơn giản hơn:

```ts
await app.agent().login(userOrId);
```

## Tổ chức các tệp kiểm thử trong **plugin**

Bạn nên lưu trữ các tệp kiểm thử liên quan đến logic phía máy chủ trong thư mục `./src/server/__tests__` của **plugin**.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Thư mục mã nguồn
│   └── server/              # Mã phía máy chủ
│       ├── __tests__/       # Thư mục tệp kiểm thử
│       │   ├── db.test.ts   # Kiểm thử liên quan đến cơ sở dữ liệu (sử dụng createMockDatabase)
│       │   └── api.test.ts  # Kiểm thử liên quan đến API
```

## Chạy kiểm thử

```bash
# Chỉ định thư mục
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Chỉ định tệp
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```