# Server-side Testing

NocoBase provides a complete testing toolchain based on `createMockDatabase` and `createMockServer` to build a testing environment. These tools allow you to easily test database operations, APIs, plugin features, and more.

## Basic Testing Tools

### createMockDatabase

`createMockDatabase` is used to create an in-memory database instance, suitable for testing database-related features.

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database Test', () => {
  let db: Database;

  beforeEach(async () => {
    // Create an in-memory database
    db = await createMockDatabase();
    
    // Clean the database
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should be able to create and query data', async () => {
    // Define a collection
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'string', name: 'email' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    // Create data
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

    // Query data
    const foundUser = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(foundUser).toBeTruthy();
    expect(foundUser.get('email')).toBe('test@example.com');
  });
});
```

### createMockServer

`createMockServer` is used to create a complete application instance, including the database, plugins, APIs, etc., suitable for testing complete business logic.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Application Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be able to create a user', async () => {
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

## Database Testing

### Basic CRUD Operation Tests

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('CRUD Operation Test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    // Define a test collection
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

  describe('Create Operation', () => {
    it('should be able to create a post', async () => {
      const post = await db.getRepository('posts').create({
        values: {
          title: 'Test Post',
          content: 'This is test content',
          published: true,
          publishedAt: new Date(),
        },
      });

      expect(post.get('title')).toBe('Test Post');
      expect(post.get('published')).toBe(true);
    });

    it('should be able to create posts in bulk', async () => {
      const posts = await db.getRepository('posts').create({
        values: [
          { title: 'Post 1', content: 'Content 1' },
          { title: 'Post 2', content: 'Content 2' },
          { title: 'Post 3', content: 'Content 3' },
        ],
      });

      expect(posts).toHaveLength(3);
    });
  });

  describe('Query Operation', () => {
    beforeEach(async () => {
      // Prepare test data
      await db.getRepository('posts').create({
        values: [
          { title: 'Post 1', content: 'Content 1', published: true },
          { title: 'Post 2', content: 'Content 2', published: false },
          { title: 'Post 3', content: 'Content 3', published: true },
        ],
      });
    });

    it('should be able to query all posts', async () => {
      const posts = await db.getRepository('posts').find();
      expect(posts).toHaveLength(3);
    });

    it('should be able to query by condition', async () => {
      const publishedPosts = await db.getRepository('posts').find({
        filter: { published: true },
      });
      expect(publishedPosts).toHaveLength(2);
    });

    it('should be able to query with pagination', async () => {
      const posts = await db.getRepository('posts').find({
        page: 1,
        pageSize: 2,
      });
      expect(posts).toHaveLength(2);
    });

    it('should be able to query with sorting', async () => {
      const posts = await db.getRepository('posts').find({
        sort: ['-id'],
      });
      expect(posts[0].get('title')).toBe('Post 3');
    });
  });

  describe('Update Operation', () => {
    let post;

    beforeEach(async () => {
      post = await db.getRepository('posts').create({
        values: {
          title: 'Original Title',
          content: 'Original Content',
          published: false,
        },
      });
    });

    it('should be able to update a post', async () => {
      const updatedPost = await db.getRepository('posts').update({
        filterByTk: post.get('id'),
        values: {
          title: 'Updated Title',
          published: true,
        },
      });

      expect(updatedPost.get('title')).toBe('Updated Title');
      expect(updatedPost.get('published')).toBe(true);
    });

    it('should be able to update in bulk', async () => {
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

  describe('Delete Operation', () => {
    beforeEach(async () => {
      await db.getRepository('posts').create({
        values: [
          { title: 'Post 1', content: 'Content 1' },
          { title: 'Post 2', content: 'Content 2' },
        ],
      });
    });

    it('should be able to delete a single record', async () => {
      const posts = await db.getRepository('posts').find();
      const postId = posts[0].get('id');

      await db.getRepository('posts').destroy({
        filterByTk: postId,
      });

      const remainingPosts = await db.getRepository('posts').find();
      expect(remainingPosts).toHaveLength(1);
    });

    it('should be able to delete in bulk', async () => {
      await db.getRepository('posts').destroy({
        filter: { title: 'Post 1' },
      });

      const remainingPosts = await db.getRepository('posts').find();
      expect(remainingPosts).toHaveLength(1);
    });
  });
});
```

### Association Relationship Tests

```ts
describe('Association Relationship Test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    // Define users collection
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    // Define posts collection
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'text', name: 'content' },
        { type: 'belongsTo', name: 'author' },
        { type: 'hasMany', name: 'comments' },
      ],
    });

    // Define comments collection
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

  it('should be able to create associated data', async () => {
    // Create a user
    const user = await db.getRepository('users').create({
      values: {
        username: 'testuser',
      },
    });

    // Create a post and associate it with the user
    const post = await db.getRepository('posts').create({
      values: {
        title: 'Test Post',
        content: 'Test Content',
        authorId: user.get('id'),
      },
    });

    expect(post.get('authorId')).toBe(user.get('id'));
  });

  it('should be able to query associated data', async () => {
    // Prepare data
    const user = await db.getRepository('users').create({
      values: { username: 'testuser' },
    });

    await db.getRepository('posts').create({
      values: [
        { title: 'Post 1', content: 'Content 1', authorId: user.get('id') },
        { title: 'Post 2', content: 'Content 2', authorId: user.get('id') },
      ],
    });

    // Query the user and their posts
    const userWithPosts = await db.getRepository('users').findOne({
      filterByTk: user.get('id'),
      appends: ['posts'],
    });

    expect(userWithPosts.get('posts')).toHaveLength(2);
  });

  it('should be able to query through association', async () => {
    // Prepare data
    const user = await db.getRepository('users').create({
      values: { username: 'testuser' },
    });

    await db.getRepository('posts').create({
      values: {
        title: 'Test Post',
        content: 'Test Content',
        authorId: user.get('id'),
      },
    });

    // Query posts by author
    const posts = await db.getRepository('posts').find({
      filter: {
        'author.username': 'testuser',
      },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].get('title')).toBe('Test Post');
  });
});
```

## API Testing

### Basic API Tests

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('API Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('User Management API', () => {
    it('should be able to create a user', async () => {
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

    it('should be able to query the user list', async () => {
      const agent = app.agent();

      // First, create some test users
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

      // Query the user list
      const response = await agent.get('/api/users:list');

      expect(response.status).toBe(200);
      expect(response.body.rows).toHaveLength(2);
    });

    it('should be able to update user information', async () => {
      const agent = app.agent();

      // Create a user
      const createResponse = await agent
        .post('/api/users:create')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const userId = createResponse.body.id;

      // Update the user
      const updateResponse = await agent
        .post(`/api/users:update/${userId}`)
        .send({
          username: 'updateduser',
          email: 'updated@example.com',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.username).toBe('updateduser');
    });

    it('should be able to delete a user', async () => {
      const agent = app.agent();

      // Create a user
      const createResponse = await agent
        .post('/api/users:create')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const userId = createResponse.body.id;

      // Delete the user
      const deleteResponse = await agent
        .post(`/api/users:destroy/${userId}`);

      expect(deleteResponse.status).toBe(200);

      // Verify the user has been deleted
      const getResponse = await agent.get(`/api/users:get/${userId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
```

### Custom Resource Tests

```ts
describe('Custom Resource Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer();

    // Define a custom resource
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

    // Define a collection
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

  it('should be able to create a post', async () => {
    const agent = app.agent();

    const response = await agent
      .post('/api/posts:create')
      .send({
        title: 'Test Post',
        content: 'This is test content',
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Test Post');
    expect(response.body.published).toBe(false);
  });

  it('should be able to publish a post', async () => {
    const agent = app.agent();

    // First, create a post
    const createResponse = await agent
      .post('/api/posts:create')
      .send({
        title: 'Test Post',
        content: 'This is test content',
      });

    const postId = createResponse.body.id;

    // Publish the post
    const publishResponse = await agent
      .post(`/api/posts:publish/${postId}`);

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.published).toBe(true);
    expect(publishResponse.body.publishedAt).toBeTruthy();
  });
});
```

## Testing Best Practices

### 1. Test Data Isolation

```ts
describe('Test Data Isolation', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
    
    // Clean the database to ensure test data isolation
    await app.db.clean({ drop: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('each test should have independent data', async () => {
    const agent = app.agent();
    
    // The data in this test will not affect other tests
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

### 2. Test Helper Functions

```ts
// Test helper functions
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
      title: 'Test Post',
      content: 'Test Content',
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

describe('Using Test Helper Functions', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth', 'posts'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be able to use helper functions to create test data', async () => {
    const user = await TestHelper.createUser(app, {
      username: 'testuser',
      email: 'test@example.com',
    });

    expect(user.username).toBe('testuser');

    const post = await TestHelper.createPost(app, {
      title: 'Test Post',
      content: 'Test Content',
    });

    expect(post.title).toBe('Test Post');
  });
});
```

### 3. Error Handling Tests

```ts
describe('Error Handling Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should handle database errors correctly', async () => {
    const agent = app.agent();

    // Try to create a duplicate username
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
        username: 'testuser', // Duplicate username
        email: 'test2@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should handle validation errors correctly', async () => {
    const agent = app.agent();

    const response = await agent
      .post('/api/users:create')
      .send({
        username: 'ab', // Username is too short
        email: 'invalid-email',
        password: '123', // Password is too short
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
```

## Performance Testing

### Database Performance Testing

```ts
describe('Database Performance Test', () => {
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

  it('should be able to bulk insert data quickly', async () => {
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

    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    const count = await db.getRepository('users').count();
    expect(count).toBe(1000);
  });

  it('should be able to query large amounts of data quickly', async () => {
    // Prepare test data
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

    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    expect(result).toHaveLength(100);
  });
});
```

### API Performance Testing

```ts
describe('API Performance Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be able to handle concurrent requests quickly', async () => {
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

    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    expect(responses).toHaveLength(concurrentRequests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

## Testing Tools and Techniques

### 1. Using Mocks and Stubs

```ts
import { vi } from 'vitest';

describe('Using Mocks and Stubs', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be able to mock external services', async () => {
    // Mock the email service
    const mockEmailService = {
      send: vi.fn().mockResolvedValue(true),
    };

    // Replace the email service in the application
    app.set('emailService', mockEmailService);

    // Test the functionality that uses the email service
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

### 2. Test Coverage

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

### 3. Parallel Testing

```ts
// Use describe.concurrent for parallel testing
describe.concurrent('Parallel Test', () => {
  it.concurrent('Test 1', async () => {
    const app = await createMockServer();
    // Test logic
    await app.destroy();
  });

  it.concurrent('Test 2', async () => {
    const app = await createMockServer();
    // Test logic
    await app.destroy();
  });
});
```

## Summary

NocoBase's testing toolchain provides a complete testing solution:

- **createMockDatabase**: For testing database-related features
- **createMockServer**: For testing complete application features
- **Rich testing tools**: Supports unit testing, integration testing, performance testing, etc.
- **Best practices**: Data isolation, helper functions, configuration management, etc.

By using these tools effectively, you can build stable and reliable test suites to ensure code quality and functional correctness.