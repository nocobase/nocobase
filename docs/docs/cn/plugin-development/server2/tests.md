# 服务端测试

NocoBase 提供了完整的测试工具链，基于 `createMockDatabase` 和 `createMockServer` 来构建测试环境。这些工具让您可以轻松地测试数据库操作、API 接口、插件功能等。

## 基础测试工具

### createMockDatabase

`createMockDatabase` 用于创建内存数据库实例，适合测试数据库相关功能。

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('数据库测试', () => {
  let db: Database;

  beforeEach(async () => {
    // 创建内存数据库
    db = await createMockDatabase();
    
    // 清理数据库
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('应该能够创建和查询数据', async () => {
    // 定义数据表
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'string', name: 'email' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    // 创建数据
    const user = await db.getRepository('users').create({
      values: {
        username: 'testuser',
        email: 'test@example.com',
        age: 25,
      },
    });

    expect(user.get('username')).toBe('testuser');
    expect(user.get('email')).toBe('test@example.com');
    expect(user.get('age')).toBe(25);

    // 查询数据
    const foundUser = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(foundUser).toBeTruthy();
    expect(foundUser.get('email')).toBe('test@example.com');
  });
});
```

### createMockServer

`createMockServer` 用于创建完整的应用实例，包括数据库、插件、API 等，适合测试完整的业务逻辑。

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('应用测试', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('应该能够创建用户', async () => {
    const agent = app.agent();
    
    const response = await agent
      .post('/api/users:create')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
  });
});
```

## 数据库测试

### 基础 CRUD 操作测试

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('CRUD 操作测试', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    // 定义测试数据表
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'text', name: 'content' },
        { type: 'boolean', name: 'published', defaultValue: false },
        { type: 'date', name: 'publishedAt' },
        { type: 'hasMany', name: 'comments' },
      ],
    });

    const Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('创建操作', () => {
    it('应该能够创建文章', async () => {
      const post = await db.getRepository('posts').create({
        values: {
          title: '测试文章',
          content: '这是测试内容',
          published: true,
          publishedAt: new Date(),
        },
      });

      expect(post.get('title')).toBe('测试文章');
      expect(post.get('published')).toBe(true);
    });

    it('应该能够批量创建文章', async () => {
      const posts = await db.getRepository('posts').create({
        values: [
          { title: '文章1', content: '内容1' },
          { title: '文章2', content: '内容2' },
          { title: '文章3', content: '内容3' },
        ],
      });

      expect(posts).toHaveLength(3);
    });
  });

  describe('查询操作', () => {
    beforeEach(async () => {
      // 准备测试数据
      await db.getRepository('posts').create({
        values: [
          { title: '文章1', content: '内容1', published: true },
          { title: '文章2', content: '内容2', published: false },
          { title: '文章3', content: '内容3', published: true },
        ],
      });
    });

    it('应该能够查询所有文章', async () => {
      const posts = await db.getRepository('posts').find();
      expect(posts).toHaveLength(3);
    });

    it('应该能够根据条件查询', async () => {
      const publishedPosts = await db.getRepository('posts').find({
        filter: { published: true },
      });
      expect(publishedPosts).toHaveLength(2);
    });

    it('应该能够分页查询', async () => {
      const posts = await db.getRepository('posts').find({
        page: 1,
        pageSize: 2,
      });
      expect(posts).toHaveLength(2);
    });

    it('应该能够排序查询', async () => {
      const posts = await db.getRepository('posts').find({
        sort: ['-id'],
      });
      expect(posts[0].get('title')).toBe('文章3');
    });
  });

  describe('更新操作', () => {
    let post;

    beforeEach(async () => {
      post = await db.getRepository('posts').create({
        values: {
          title: '原始标题',
          content: '原始内容',
          published: false,
        },
      });
    });

    it('应该能够更新文章', async () => {
      const updatedPost = await db.getRepository('posts').update({
        filterByTk: post.get('id'),
        values: {
          title: '更新后的标题',
          published: true,
        },
      });

      expect(updatedPost.get('title')).toBe('更新后的标题');
      expect(updatedPost.get('published')).toBe(true);
    });

    it('应该能够批量更新', async () => {
      await db.getRepository('posts').update({
        filter: { published: false },
        values: { published: true },
      });

      const publishedPosts = await db.getRepository('posts').find({
        filter: { published: true },
      });
      expect(publishedPosts).toHaveLength(1);
    });
  });

  describe('删除操作', () => {
    beforeEach(async () => {
      await db.getRepository('posts').create({
        values: [
          { title: '文章1', content: '内容1' },
          { title: '文章2', content: '内容2' },
        ],
      });
    });

    it('应该能够删除单条记录', async () => {
      const posts = await db.getRepository('posts').find();
      const postId = posts[0].get('id');

      await db.getRepository('posts').destroy({
        filterByTk: postId,
      });

      const remainingPosts = await db.getRepository('posts').find();
      expect(remainingPosts).toHaveLength(1);
    });

    it('应该能够批量删除', async () => {
      await db.getRepository('posts').destroy({
        filter: { title: '文章1' },
      });

      const remainingPosts = await db.getRepository('posts').find();
      expect(remainingPosts).toHaveLength(1);
    });
  });
});
```

### 关联关系测试

```ts
describe('关联关系测试', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    // 定义用户表
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    // 定义文章表
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'text', name: 'content' },
        { type: 'belongsTo', name: 'author' },
        { type: 'hasMany', name: 'comments' },
      ],
    });

    // 定义评论表
    const Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('应该能够创建关联数据', async () => {
    // 创建用户
    const user = await db.getRepository('users').create({
      values: {
        username: 'testuser',
      },
    });

    // 创建文章并关联用户
    const post = await db.getRepository('posts').create({
      values: {
        title: '测试文章',
        content: '测试内容',
        authorId: user.get('id'),
      },
    });

    expect(post.get('authorId')).toBe(user.get('id'));
  });

  it('应该能够查询关联数据', async () => {
    // 准备数据
    const user = await db.getRepository('users').create({
      values: { username: 'testuser' },
    });

    await db.getRepository('posts').create({
      values: [
        { title: '文章1', content: '内容1', authorId: user.get('id') },
        { title: '文章2', content: '内容2', authorId: user.get('id') },
      ],
    });

    // 查询用户及其文章
    const userWithPosts = await db.getRepository('users').findOne({
      filterByTk: user.get('id'),
      appends: ['posts'],
    });

    expect(userWithPosts.get('posts')).toHaveLength(2);
  });

  it('应该能够通过关联查询', async () => {
    // 准备数据
    const user = await db.getRepository('users').create({
      values: { username: 'testuser' },
    });

    await db.getRepository('posts').create({
      values: {
        title: '测试文章',
        content: '测试内容',
        authorId: user.get('id'),
      },
    });

    // 通过作者查询文章
    const posts = await db.getRepository('posts').find({
      filter: {
        'author.username': 'testuser',
      },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].get('title')).toBe('测试文章');
  });
});
```

## API 接口测试

### 基础 API 测试

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('API 接口测试', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('用户管理 API', () => {
    it('应该能够创建用户', async () => {
      const agent = app.agent();

      const response = await agent
        .post('/api/users:create')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
    });

    it('应该能够查询用户列表', async () => {
      const agent = app.agent();

      // 先创建一些测试用户
      await agent.post('/api/users:create').send({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
      });

      await agent.post('/api/users:create').send({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
      });

      // 查询用户列表
      const response = await agent.get('/api/users:list');

      expect(response.status).toBe(200);
      expect(response.body.rows).toHaveLength(2);
    });

    it('应该能够更新用户信息', async () => {
      const agent = app.agent();

      // 创建用户
      const createResponse = await agent
        .post('/api/users:create')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const userId = createResponse.body.id;

      // 更新用户
      const updateResponse = await agent
        .post(`/api/users:update/${userId}`)
        .send({
          username: 'updateduser',
          email: 'updated@example.com',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.username).toBe('updateduser');
    });

    it('应该能够删除用户', async () => {
      const agent = app.agent();

      // 创建用户
      const createResponse = await agent
        .post('/api/users:create')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const userId = createResponse.body.id;

      // 删除用户
      const deleteResponse = await agent
        .post(`/api/users:destroy/${userId}`);

      expect(deleteResponse.status).toBe(200);

      // 验证用户已被删除
      const getResponse = await agent.get(`/api/users:get/${userId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
```

### 自定义资源测试

```ts
describe('自定义资源测试', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer();

    // 定义自定义资源
    app.resourceManager.define({
      name: 'posts',
      actions: {
        create: async (ctx) => {
          const { title, content } = ctx.action.params.values;
          const post = await ctx.db.getRepository('posts').create({
            values: { title, content, published: false },
          });
          ctx.body = post;
        },
        publish: async (ctx) => {
          const { id } = ctx.action.params;
          const post = await ctx.db.getRepository('posts').update({
            filterByTk: id,
            values: { published: true, publishedAt: new Date() },
          });
          ctx.body = post;
        },
      },
    });

    // 定义数据表
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'text', name: 'content' },
        { type: 'boolean', name: 'published', defaultValue: false },
        { type: 'date', name: 'publishedAt' },
      ],
    });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('应该能够创建文章', async () => {
    const agent = app.agent();

    const response = await agent
      .post('/api/posts:create')
      .send({
        title: '测试文章',
        content: '这是测试内容',
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('测试文章');
    expect(response.body.published).toBe(false);
  });

  it('应该能够发布文章', async () => {
    const agent = app.agent();

    // 先创建文章
    const createResponse = await agent
      .post('/api/posts:create')
      .send({
        title: '测试文章',
        content: '这是测试内容',
      });

    const postId = createResponse.body.id;

    // 发布文章
    const publishResponse = await agent
      .post(`/api/posts:publish/${postId}`);

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.published).toBe(true);
    expect(publishResponse.body.publishedAt).toBeTruthy();
  });
});
```

## 测试最佳实践

### 1. 测试数据隔离

```ts
describe('测试数据隔离', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
    
    // 清理数据库，确保测试数据隔离
    await app.db.clean({ drop: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('每个测试都应该有独立的数据', async () => {
    const agent = app.agent();
    
    // 这个测试的数据不会影响其他测试
    const response = await agent
      .post('/api/users:create')
      .send({
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
  });
});
```

### 2. 测试辅助函数

```ts
// 测试辅助函数
class TestHelper {
  static async createUser(app: MockServer, userData = {}) {
    const agent = app.agent();
    const defaultData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await agent
      .post('/api/users:create')
      .send({ ...defaultData, ...userData });

    return response.body;
  }

  static async createPost(app: MockServer, postData = {}) {
    const agent = app.agent();
    const defaultData = {
      title: '测试文章',
      content: '测试内容',
    };

    const response = await agent
      .post('/api/posts:create')
      .send({ ...defaultData, ...postData });

    return response.body;
  }

  static async login(app: MockServer, username = 'testuser', password = 'password123') {
    const agent = app.agent();
    const response = await agent
      .post('/api/auth:signin')
      .send({ username, password });

    return response.body.token;
  }
}

describe('使用测试辅助函数', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth', 'posts'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('应该能够使用辅助函数创建测试数据', async () => {
    const user = await TestHelper.createUser(app, {
      username: 'testuser',
      email: 'test@example.com',
    });

    expect(user.username).toBe('testuser');

    const post = await TestHelper.createPost(app, {
      title: '测试文章',
      content: '测试内容',
    });

    expect(post.title).toBe('测试文章');
  });
});
```

### 3. 错误处理测试

```ts
describe('错误处理测试', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('应该正确处理数据库错误', async () => {
    const agent = app.agent();

    // 尝试创建重复的用户名
    await agent
      .post('/api/users:create')
      .send({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
      });

    const response = await agent
      .post('/api/users:create')
      .send({
        username: 'testuser', // 重复的用户名
        email: 'test2@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('应该正确处理验证错误', async () => {
    const agent = app.agent();

    const response = await agent
      .post('/api/users:create')
      .send({
        username: 'ab', // 太短的用户名
        email: 'invalid-email',
        password: '123', // 太短的密码
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
```

## 性能测试

### 数据库性能测试

```ts
describe('数据库性能测试', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'string', name: 'email' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('应该能够快速批量插入数据', async () => {
    const startTime = Date.now();
    
    const users = Array.from({ length: 1000 }, (_, i) => ({
      username: `user${i}`,
      email: `user${i}@example.com`,
      age: 20 + (i % 50),
    }));

    await db.getRepository('users').create({
      values: users,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // 应该在5秒内完成

    const count = await db.getRepository('users').count();
    expect(count).toBe(1000);
  });

  it('应该能够快速查询大量数据', async () => {
    // 准备测试数据
    const users = Array.from({ length: 1000 }, (_, i) => ({
      username: `user${i}`,
      email: `user${i}@example.com`,
      age: 20 + (i % 50),
    }));

    await db.getRepository('users').create({
      values: users,
    });

    const startTime = Date.now();
    
    const result = await db.getRepository('users').find({
      filter: { age: { $gte: 30 } },
      sort: ['-age'],
      limit: 100,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    expect(result).toHaveLength(100);
  });
});
```

### API 性能测试

```ts
describe('API 性能测试', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('应该能够快速处理并发请求', async () => {
    const agent = app.agent();
    const concurrentRequests = 10;

    const startTime = Date.now();

    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      agent
        .post('/api/users:create')
        .send({
          username: `user${i}`,
          email: `user${i}@example.com`,
          password: 'password123',
        })
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    expect(responses).toHaveLength(concurrentRequests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

## 测试工具和技巧

### 1. 使用 Mock 和 Stub

```ts
import { vi } from 'vitest';

describe('使用 Mock 和 Stub', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('应该能够 Mock 外部服务', async () => {
    // Mock 邮件服务
    const mockEmailService = {
      send: vi.fn().mockResolvedValue(true),
    };

    // 替换应用中的邮件服务
    app.set('emailService', mockEmailService);

    // 测试使用邮件服务的功能
    const agent = app.agent();
    const response = await agent
      .post('/api/users:create')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(mockEmailService.send).toHaveBeenCalled();
  });
});
```

### 2. 测试覆盖率

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### 3. 并行测试

```ts
// 使用 describe.concurrent 进行并行测试
describe.concurrent('并行测试', () => {
  it.concurrent('测试1', async () => {
    const app = await createMockServer();
    // 测试逻辑
    await app.destroy();
  });

  it.concurrent('测试2', async () => {
    const app = await createMockServer();
    // 测试逻辑
    await app.destroy();
  });
});
```

## 总结

NocoBase 的测试工具链提供了完整的测试解决方案：

- **createMockDatabase**: 用于测试数据库相关功能
- **createMockServer**: 用于测试完整的应用功能
- **丰富的测试工具**: 支持单元测试、集成测试、性能测试等
- **最佳实践**: 数据隔离、辅助函数、配置管理等

通过合理使用这些工具，您可以构建稳定、可靠的测试套件，确保代码质量和功能正确性。

