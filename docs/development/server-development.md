# NocoBase 服务端开发

NocoBase 服务端基于 Node.js 和 Koa，提供了强大的插件系统和数据库抽象层。

## 1. 服务端架构

NocoBase 服务端采用模块化设计，主要包括以下核心概念：

- **插件系统**：通过插件扩展功能
- **数据库抽象层**：统一的数据访问接口
- **资源管理器**：RESTful API 自动生成
- **访问控制**：基于角色的权限控制
- **工作流引擎**：自动化业务流程

## 2. 插件服务端入口

每个插件的服务端入口文件通常如下：

```typescript
import { InstallOptions, Plugin } from '@nocobase/server';

export class MyPlugin extends Plugin {
  beforeLoad() {
    // 在插件加载前执行
  }

  async load() {
    // 插件加载逻辑
  }

  async install(options: InstallOptions) {
    // 插件安装逻辑
  }

  async disable() {
    // 插件禁用逻辑
  }
}

export default MyPlugin;
```

## 3. 数据库操作

### 3.1 数据表定义

定义数据表结构：

```typescript
import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'posts',
  title: '文章',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题',
      required: true,
    },
    {
      type: 'text',
      name: 'content',
      title: '内容',
    },
    {
      type: 'string',
      name: 'status',
      title: '状态',
      defaultValue: 'draft',
    },
    {
      type: 'hasMany',
      name: 'comments',
      title: '评论',
      target: 'comments',
    },
  ],
} as CollectionOptions;
```

### 3.2 模型扩展

扩展数据模型功能：

```typescript
import { MagicAttributeModel } from '@nocobase/database';

export class PostModel extends MagicAttributeModel {
  async publish() {
    await this.update({ status: 'published' });
  }

  async draft() {
    await this.update({ status: 'draft' });
  }

  get isPublished() {
    return this.get('status') === 'published';
  }
}
```

### 3.3 数据仓库

自定义数据仓库操作：

```typescript
import { Repository } from '@nocobase/database';

export class PostRepository extends Repository {
  async findPublished(filter?: any) {
    return this.find({
      filter: {
        ...filter,
        status: 'published',
      },
    });
  }

  async publishById(id: number) {
    const post = await this.findById(id);
    return post.publish();
  }
}
```

### 3.4 注册数据库组件

在插件中注册数据库组件：

```typescript
class MyPlugin extends Plugin {
  async load() {
    // 注册数据表
    this.app.db.collection({
      name: 'posts',
      title: '文章',
      fields: [
        // 字段定义
      ],
    });

    // 注册模型
    this.app.db.registerModels({
      PostModel,
    });

    // 注册仓库
    this.app.db.registerRepositories({
      PostRepository,
    });
  }
}
```

## 4. API 资源

### 4.1 自定义资源

创建自定义 API 资源：

```typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        // 扩展现有操作
        async publish(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const repository = ctx.db.getRepository('posts');
          const post = await repository.findById(filterByTk);
          
          await post.publish();
          
          ctx.body = post;
          await next();
        },
        
        // 添加新操作
        async batchPublish(ctx, next) {
          const { filter } = ctx.action.params;
          const repository = ctx.db.getRepository('posts');
          const posts = await repository.find({ filter });
          
          await Promise.all(posts.map(post => post.publish()));
          
          ctx.body = posts;
          await next();
        },
      },
    });
  }
}
```

### 4.2 资源中间件

为资源添加中间件：

```typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.resourceManager.use(
      'posts',
      async (ctx, next) => {
        // 在操作执行前
        console.log('Before action:', ctx.action);
        
        await next();
        
        // 在操作执行后
        console.log('After action:', ctx.body);
      }
    );
  }
}
```

## 5. 中间件开发

### 5.1 应用中间件

创建应用级中间件：

```typescript
import { Context, Next } from '@nocobase/server';

export async function loggingMiddleware(ctx: Context, next: Next) {
  const start = Date.now();
  
  try {
    await next();
  } finally {
    const ms = Date.now() - start;
    ctx.app.logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.app.middleware.register(loggingMiddleware);
  }
}
```

### 5.2 路由中间件

为特定路由添加中间件：

```typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.middleware.register(
      async (ctx, next) => {
        if (ctx.path.startsWith('/api/custom')) {
          // 自定义逻辑
          ctx.customProperty = 'value';
        }
        await next();
      }
    );
  }
}
```

## 6. 访问控制

### 6.1 权限策略

定义访问控制策略：

```typescript
class MyPlugin extends Plugin {
  async load() {
    // 允许所有人访问
    this.app.acl.allow('posts', 'list');
    this.app.acl.allow('posts', 'get');
    
    // 允许认证用户创建
    this.app.acl.allow('posts', 'create', 'loggedIn');
    
    // 允许作者更新自己的文章
    this.app.acl.allow('posts', 'update', (ctx) => {
      return ctx.state.currentUser.id === ctx.action.params.filterByTk;
    });
  }
}
```

### 6.2 自定义策略

创建自定义策略：

```typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.acl.define('postAuthor', (ctx) => {
      // 检查当前用户是否为文章作者
      const postId = ctx.action.params.filterByTk;
      // 实现检查逻辑
      return true; // 或 false
    });
    
    // 使用自定义策略
    this.app.acl.allow('posts', 'update', 'postAuthor');
  }
}
```

## 7. 工作流节点

### 7.1 自定义节点

创建自定义工作流节点：

```typescript
import { Processor, Instruction } from '@nocobase/plugin-workflow';

export default class CustomInstruction extends Instruction {
  async run(node, input, processor: Processor) {
    const { config } = node;
    
    try {
      // 执行自定义逻辑
      const result = await this.executeCustomLogic(config, input);
      
      return {
        result,
        status: 1, // 成功
      };
    } catch (error) {
      return {
        result: error.message,
        status: -1, // 失败
      };
    }
  }
  
  private async executeCustomLogic(config, input) {
    // 实现自定义逻辑
    return 'success';
  }
}
```

### 7.2 注册节点

```
class MyPlugin extends Plugin {
  async load() {
    this.app.workflow.registerInstruction(
      'custom-instruction',
      CustomInstruction
    );
  }
}
```

## 8. 数据库迁移

### 8.1 创建迁移文件

```
export default {
  up: async (db) => {
    // 升级操作
    await db.sequelize.getRepository('collections').create({
      name: 'posts',
      title: '文章',
    });
  },
  
  down: async (db) => {
    // 降级操作
    await db.sequelize.getRepository('collections').destroy({
      filter: {
        name: 'posts',
      },
    });
  },
};
```

### 8.2 注册迁移

```
class MyPlugin extends Plugin {
  async load() {
    this.app.db.import({
      directory: path.resolve(__dirname, 'migrations'),
    });
  }
}
```

## 9. 服务和工具

### 9.1 自定义服务

创建业务服务：

```
export class PostService {
  constructor(protected app) {}
  
  async createPost(data) {
    const repository = this.app.db.getRepository('posts');
    const post = await repository.create({ values: data });
    
    // 发送通知等后续操作
    await this.sendNotification(post);
    
    return post;
  }
  
  private async sendNotification(post) {
    // 实现通知逻辑
  }
}
```

### 9.2 注册服务

```
class MyPlugin extends Plugin {
  async load() {
    this.app.registerServices({
      post: new PostService(this.app),
    });
  }
}
```

## 10. 事件系统

### 10.1 触发事件

```
class MyPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          await next();
          
          // 触发自定义事件
          this.app.emit('post.created', {
            post: ctx.body,
            user: ctx.state.currentUser,
          });
        },
      },
    });
  }
}
```

### 10.2 监听事件

```
class MyPlugin extends Plugin {
  async load() {
    this.app.on('post.created', async (data) => {
      // 处理事件
      console.log('New post created:', data.post);
    });
  }
}
```

## 11. 定时任务

### 11.1 创建定时任务

```
class MyPlugin extends Plugin {
  async load() {
    // 每天凌晨执行
    this.app.schedule.register('daily-task', '0 0 * * *', async () => {
      // 执行定时任务
      await this.performDailyTask();
    });
  }
  
  private async performDailyTask() {
    // 实现定时任务逻辑
  }
}
```

## 12. 最佳实践

### 12.1 错误处理

```
import { CustomError } from '@nocobase/errors';

class MyPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          try {
            await next();
          } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
              throw new CustomError(
                'TITLE_EXISTS',
                '标题已存在',
                400
              );
            }
            throw error;
          }
        },
      },
    });
  }
}
```

### 12.2 性能优化

```
class MyPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async list(ctx, next) {
          // 使用分页
          const { page = 1, pageSize = 20 } = ctx.action.params;
          
          // 使用索引字段进行筛选
          const { filter } = ctx.action.params;
          
          // 避免 N+1 查询
          const posts = await ctx.db.getRepository('posts').find({
            filter,
            limit: pageSize,
            offset: (page - 1) * pageSize,
            appends: ['comments'], // 预加载关联数据
          });
          
          ctx.body = posts;
          await next();
        },
      },
    });
  }
}
```

### 12.3 日志记录

```
class MyPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async update(ctx, next) {
          const startTime = Date.now();
          
          await next();
          
          const duration = Date.now() - startTime;
          this.app.logger.info(
            `Post updated: ${ctx.action.params.filterByTk}`, 
            { duration }
          );
        },
      },
    });
  }
}
```

## 13. 常用 API

### 13.1 数据库 API

- `this.app.db.collection()` - 定义数据表
- `this.app.db.getRepository()` - 获取数据仓库
- `this.app.db.registerModels()` - 注册模型
- `this.app.db.registerRepositories()` - 注册仓库

### 13.2 资源 API

- `this.app.resource()` - 创建资源
- `this.app.acl.allow()` - 设置权限
- `this.app.middleware.register()` - 注册中间件

### 13.3 应用 API

- `this.app.emit()` - 触发事件
- `this.app.on()` - 监听事件
- `this.app.logger.info()` - 记录日志
- `this.app.schedule.register()` - 注册定时任务

### 13.4 SDK 集成

虽然 `@nocobase/sdk` 主要用于客户端开发，但在某些场景下，服务端也可能需要使用 SDK 进行内部调用或测试。

#### 服务端使用 SDK

```
import { APIClient } from '@nocobase/sdk';

class MyPlugin extends Plugin {
  async load() {
    // 创建内部 API 客户端用于服务端调用
    const internalClient = new APIClient({
      baseURL: this.app.url + '/api',
    });
    
    // 使用内部客户端调用 API
    this.app.command('sync-data').action(async () => {
      try {
        const response = await internalClient.resource('posts').list();
        // 处理同步逻辑
      } catch (error) {
        this.app.logger.error('Data sync failed:', error);
      }
    });
  }
}
```

#### 测试中使用 SDK

```
// __tests__/api.test.ts
import { APIClient } from '@nocobase/sdk';
import { MockServer } from '@nocobase/test';

describe('API Tests', () => {
  let app: MockServer;
  let api: APIClient;
  
  beforeEach(async () => {
    app = await mockServer();
    api = new APIClient({
      baseURL: `${await app.listenHttp()}api/`
    });
  });
  
  afterEach(async () => {
    await app.destroy();
  });
  
  test('should create post', async () => {
    const response = await api.resource('posts').create({
      values: {
        title: 'Test Post',
        content: 'Test Content'
      }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.data.title).toBe('Test Post');
  });
}
```

