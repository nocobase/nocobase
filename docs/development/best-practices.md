# NocoBase 插件开发最佳实践

本文档总结了 NocoBase 插件开发的最佳实践，帮助开发者创建高质量、可维护的插件。

## 1. 项目结构最佳实践

### 1.1 目录组织

遵循标准的插件目录结构：

```
plugin-name/
├── package.json
├── README.md
├── src/
│   ├── client/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── locales/
│   │   ├── schemas/
│   │   └── index.tsx
│   └── server/
│       ├── actions/
│       ├── collections/
│       ├── models/
│       ├── repositories/
│       ├── services/
│       ├── middleware/
│       ├── migrations/
│       ├── locales/
│       └── index.ts
├── dist/
└── __tests__/
```

### 1.2 命名规范

- 插件名使用 `plugin-` 前缀：`plugin-user-dashboard`
- 使用 kebab-case 命名法：`user-dashboard` 而不是 `userDashboard`
- 目录名与文件名保持一致

## 2. 代码质量最佳实践

### 2.1 TypeScript 类型安全

充分利用 TypeScript 提供的类型安全：

```typescript
// 正确：使用接口定义数据结构
interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

// 正确：为函数参数和返回值添加类型
async function createPost(data: Partial<Post>): Promise<Post> {
  // 实现
  return {} as Post;
}
```

### 2.2 错误处理

正确处理和传递错误：

```typescript
import { CustomError } from '@nocobase/errors';

class MyPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          try {
            // 业务逻辑
            await next();
          } catch (error) {
            // 记录错误日志
            this.app.logger.error('创建文章失败', {
              error: error.message,
              stack: error.stack,
              params: ctx.action.params
            });
            
            // 抛出自定义错误
            if (error.name === 'SequelizeUniqueConstraintError') {
              throw new CustomError(
                'POST_TITLE_EXISTS',
                '文章标题已存在',
                400
              );
            }
            
            throw error;
          }
        }
      }
    });
  }
}
```

### 2.3 异步操作处理

正确处理异步操作：

```typescript
// 正确：使用 async/await
async function processData() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    // 处理错误
    throw error;
  }
}

// 正确：并行处理多个异步操作
async function processMultiple() {
  const [result1, result2] = await Promise.all([
    operation1(),
    operation2()
  ]);
  return { result1, result2 };
}
```

## 3. 性能优化最佳实践

### 3.1 数据库查询优化

```typescript
// 正确：使用分页避免大量数据加载
async function listPosts(ctx, next) {
  const { page = 1, pageSize = 20 } = ctx.action.params;
  
  const posts = await ctx.db.getRepository('posts').find({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    // 预加载关联数据，避免 N+1 查询
    appends: ['author', 'comments']
  });
  
  ctx.body = posts;
  await next();
}

// 正确：使用索引字段进行筛选
async function searchPosts(ctx, next) {
  const { filter } = ctx.action.params;
  
  // 确保 filter 中的字段有数据库索引
  const posts = await ctx.db.getRepository('posts').find({
    filter
  });
  
  ctx.body = posts;
  await next();
}
```

### 3.2 缓存策略

```typescript
import { Cache } from '@nocobase/cache';

class MyPlugin extends Plugin {
  async load() {
    // 使用缓存减少数据库查询
    this.app.resource({
      name: 'posts',
      actions: {
        async get(ctx, next) {
          const { filterByTk } = ctx.action.params;
          
          // 尝试从缓存获取
          const cacheKey = `post:${filterByTk}`;
          let post = await this.app.cache.get(cacheKey);
          
          if (!post) {
            // 缓存未命中，从数据库获取
            post = await ctx.db.getRepository('posts').findById(filterByTk);
            // 存入缓存
            await this.app.cache.set(cacheKey, post, 300); // 5分钟过期
          }
          
          ctx.body = post;
          await next();
        }
      }
    });
  }
}
```

## 4. 安全最佳实践

### 4.1 输入验证

```typescript
// 正确：验证用户输入
this.app.resource({
  name: 'posts',
  actions: {
    async create(ctx, next) {
      const { values } = ctx.action.params;
      
      // 验证必填字段
      if (!values.title) {
        throw new CustomError('TITLE_REQUIRED', '标题是必填项', 400);
      }
      
      // 验证字段长度
      if (values.title.length > 100) {
        throw new CustomError('TITLE_TOO_LONG', '标题不能超过100个字符', 400);
      }
      
      // 清理输入数据
      const cleanValues = {
        title: values.title.trim(),
        content: values.content?.trim() || '',
        // 过滤掉不允许的字段
      };
      
      ctx.action.params.values = cleanValues;
      
      await next();
    }
  }
});
```

### 4.2 访问控制

```typescript
class MyPlugin extends Plugin {
  async load() {
    // 正确：设置适当的访问权限
    this.app.acl.allow('posts', 'list'); // 公开列表
    this.app.acl.allow('posts', 'get'); // 公开详情
    
    // 登录用户可以创建
    this.app.acl.allow('posts', 'create', 'loggedIn');
    
    // 仅作者可以更新自己的文章
    this.app.acl.allow('posts', 'update', (ctx) => {
      const postId = ctx.action.params.filterByTk;
      const userId = ctx.state.currentUser.id;
      // 检查文章作者是否为当前用户
      return this.checkPostAuthor(postId, userId);
    });
    
    // 仅管理员可以删除
    this.app.acl.allow('posts', 'destroy', 'admin');
  }
  
  private async checkPostAuthor(postId: number, userId: number): Promise<boolean> {
    const post = await this.app.db.getRepository('posts').findById(postId);
    return post && post.userId === userId;
  }
}
```

## 5. 国际化最佳实践

### 5.1 提供多语言支持

```typescript
// src/client/locales/en-US.ts
export default {
  'my-plugin.title': 'My Plugin',
  'my-plugin.description': 'A custom plugin for NocoBase',
  'my-plugin.actions.create': 'Create',
  'my-plugin.actions.edit': 'Edit',
  'my-plugin.actions.delete': 'Delete',
};

// src/client/locales/zh-CN.ts
export default {
  'my-plugin.title': '我的插件',
  'my-plugin.description': '一个 NocoBase 的自定义插件',
  'my-plugin.actions.create': '创建',
  'my-plugin.actions.edit': '编辑',
  'my-plugin.actions.delete': '删除',
};

// 在插件中注册
class MyPlugin extends Plugin {
  async load() {
    this.app.i18n.addResources('en-US', 'my-plugin', enUS);
    this.app.i18n.addResources('zh-CN', 'my-plugin', zhCN);
  }
}
```

### 5.2 在组件中使用国际化

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation('my-plugin');
  
  return (
    <div>
      <h1>{t('my-plugin.title')}</h1>
      <p>{t('my-plugin.description')}</p>
      <button>{t('my-plugin.actions.create')}</button>
    </div>
  );
};
```

## 6. 测试最佳实践

### 6.1 单元测试

```typescript
// __tests__/server/actions/post-action.test.ts
import { createMockServer } from '@nocobase/test';
import { PostAction } from '../../src/server/actions/post-action';

describe('PostAction', () => {
  let app;
  
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'acl']
    });
    
    // 准备测试数据
    await app.db.getRepository('users').create({
      values: {
        id: 1,
        nickname: 'testuser'
      }
    });
  });
  
  afterEach(async () => {
    await app.destroy();
  });
  
  it('should create post successfully', async () => {
    const ctx = {
      db: app.db,
      action: {
        params: {
          values: {
            title: 'Test Post',
            content: 'Test Content'
          }
        }
      },
      state: {
        currentUser: { id: 1 }
      }
    };
    
    await PostAction.create(ctx, () => Promise.resolve());
    
    expect(ctx.body.title).toBe('Test Post');
  });
});
```

### 6.2 集成测试

```typescript
// __tests__/integration/api.test.ts
import { createMockServer } from '@nocobase/test';

describe('Post API', () => {
  let app;
  let agent;
  
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'posts']
    });
    agent = app.agent();
  });
  
  afterEach(async () => {
    await app.destroy();
  });
  
  it('should create post via API', async () => {
    // 创建用户并登录
    await agent.post('/api/users:create').send({
      nickname: 'testuser',
      password: '123456'
    });
    
    // 登录
    await agent.post('/api/users:login').send({
      nickname: 'testuser',
      password: '123456'
    });
    
    // 创建文章
    const response = await agent.post('/api/posts:create').send({
      title: 'Test Post',
      content: 'Test Content'
    });
    
    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Test Post');
  });
});
```

## 7. 文档最佳实践

### 7.1 README 文档

```markdown
# My Plugin

一个 NocoBase 插件示例。

## 功能特性

- 功能1：描述功能1
- 功能2：描述功能2
- 功能3：描述功能3

## 安装

```bash
yarn nocobase install my-plugin
```

## 使用方法

1. 步骤1
2. 步骤2
3. 步骤3

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| option1 | string | 'default' | 选项1说明 |
| option2 | boolean | false | 选项2说明 |

## API 参考

### 资源: posts

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/posts | 获取文章列表 |
| POST | /api/posts:create | 创建文章 |
```

### 7.2 TypeScript 声明文件

```typescript
// src/types/index.ts
export interface Post {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export interface PostOptions {
  autoPublish?: boolean;
  enableComments?: boolean;
}

// src/index.ts
export * from './types';
```

## 8. 发布最佳实践

### 8.1 package.json 配置

```json
{
  "name": "@my-org/plugin-custom",
  "version": "1.0.0",
  "description": "A custom NocoBase plugin",
  "keywords": ["nocobase", "plugin", "custom"],
  "author": "My Organization",
  "license": "MIT",
  "main": "./dist/server/index.js",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "nocobase-build",
    "test": "jest",
    "prepublishOnly": "yarn build"
  },
  "peerDependencies": {
    "@nocobase/client": "1.x",
    "@nocobase/server": "1.x"
  },
  "devDependencies": {
    "@nocobase/build": "1.x",
    "@nocobase/test": "1.x"
  }
}
```

### 8.2 构建和发布

```bash
# 构建插件
yarn build

# 测试插件
yarn test

# 发布插件
npm publish
```

## 9. 调试最佳实践

### 9.1 日志记录

```typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.logger.info('MyPlugin loaded', {
      version: this.options.version,
      config: this.options.config
    });
    
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          const startTime = Date.now();
          
          this.app.logger.debug('Creating post', {
            userId: ctx.state.currentUser?.id,
            values: ctx.action.params.values
          });
          
          await next();
          
          const duration = Date.now() - startTime;
          this.app.logger.info('Post created', {
            postId: ctx.body.id,
            duration
          });
        }
      }
    });
  }
}
```

### 9.2 开发环境调试

```typescript
// 启用调试模式
process.env.DEBUG = 'nocobase:*';

// 或者只调试特定插件
process.env.DEBUG = 'nocobase:my-plugin:*';
```

## 10. 版本管理最佳实践

### 10.1 语义化版本控制

遵循 [Semantic Versioning](https://semver.org/) 规范：

- MAJOR 版本：不兼容的 API 修改
- MINOR 版本：向后兼容的功能新增
- PATCH 版本：向后兼容的问题修复

### 10.2 变更日志

维护 CHANGELOG.md 文件：

```markdown
# Changelog

## [1.2.0] - 2023-12-01

### 新增
- 添加了文章分类功能
- 支持批量操作

### 修复
- 修复了文章搜索的 bug
- 优化了性能

## [1.1.0] - 2023-11-15

### 新增
- 初始版本发布
```

通过遵循这些最佳实践，您可以创建出高质量、可维护、安全且性能优良的 NocoBase 插件。
