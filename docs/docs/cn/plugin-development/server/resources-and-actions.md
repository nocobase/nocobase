# 资源和操作

资源（Resource）是服务器端公开的业务入口，操作（Action）是资源上执行的具体行为。NocoBase 基于 `@nocobase/resourcer` 在 Koa 中构建统一的路由与权限层，开发者只需要关注资源定义与处理逻辑即可。

## 自动生成的 Collection 资源

当你通过 [数据表配置](/learn/server/collections-and-fields) 定义 Collection 或其关联关系时，框架会自动生成对应的 REST 资源。

例如：

```ts
defineCollection({
  name: 'posts',
  fields: [
    {
      type: 'hasMany',
      name: 'comments',
    },
  ],
});
defineCollection({
  name: 'comments',
  fields: [],
});
```

以下示例会得到 `posts`、`comments` 和 `posts.comments` 三个个资源：

| 请求方式 | 路径 | 操作 |
| -------- | ---- | ---- |
| `GET`    | `/api/posts:list` | `list`（查询列表） |
| `GET`    | `/api/posts:get/1` | `get`（查询单条） |
| `POST`   | `/api/posts:create` | `create`（新增） |
| `POST`   | `/api/posts:update/1` | `update`（更新） |
| `POST`   | `/api/posts:destroy/1` | `destroy`（删除） |

| 请求方式 | 路径 | 操作 |
| -------- | ---- | ---- |
| `GET`    | `/api/comments:list` | `list`（查询列表） |
| `GET`    | `/api/comments:get/1` | `get`（查询单条） |
| `POST`   | `/api/comments:create` | `create`（新增） |
| `POST`   | `/api/comments:update/1` | `update`（更新） |
| `POST`   | `/api/comments:destroy/1` | `destroy`（删除） |

## 内置操作类型

NocoBase 提供了丰富的内置操作类型，满足各种业务需求：

### 基础 CRUD 操作

| 操作名 | 说明 | 适用资源类型 | 请求方式 | 示例路径 |
|--------|------|-------------|----------|----------|
| `list` | 查询列表数据 | 所有 | GET/POST | `/api/posts:list` |
| `get` | 查询单条数据 | 所有 | GET/POST | `/api/posts:get/1` |
| `create` | 创建新记录 | 所有 | POST | `/api/posts:create` |
| `update` | 更新记录 | 所有 | POST | `/api/posts:update/1` |
| `destroy` | 删除记录 | 所有 | POST | `/api/posts:destroy/1` |

### 关系操作

| 操作名 | 说明 | 适用关系类型 | 示例路径 |
|--------|------|-------------|----------|
| `add` | 向关系中追加关联记录 | hasMany, belongsToMany, ArrayField | `/api/posts/1/comments:add` |
| `remove` | 从关系中移除关联记录 | hasMany, belongsToMany, ArrayField | `/api/posts/1/comments:remove` |
| `set` | 替换当前关联集合 | hasMany, belongsToMany, ArrayField | `/api/posts/1/comments:set` |
| `toggle` | 根据是否已关联执行添加或移除 | belongsToMany | `/api/posts/1/tags:toggle` |

### 高级操作

| 操作名 | 说明 | 适用场景 | 示例路径 |
|--------|------|----------|----------|
| `firstOrCreate` | 查找第一条记录，不存在则创建 | 数据去重 | `/api/users:firstOrCreate` |
| `updateOrCreate` | 更新记录，不存在则创建 | 数据同步 | `/api/users:updateOrCreate` |
| `move` | 移动记录位置 | 树形结构 | `/api/categories:move` |

### 操作参数说明

不同操作支持不同的参数，常用参数包括：

- `filter`：查询条件
- `values`：要设置的值
- `fields`：指定返回字段
- `appends`：包含关联数据
- `except`：排除字段
- `sort`：排序规则
- `page`、`pageSize`：分页参数
- `paginate`：是否启用分页
- `tree`：是否返回树形结构
- `whitelist`、`blacklist`：字段白名单/黑名单
- `updateAssociationValues`：是否更新关联值

## 注册自定义操作

插件可以为所有资源或某个特定资源注册额外操作。推荐使用 `registerActionHandlers` API：

```ts
// 全局操作：所有资源都可调用 customAction
app.resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});

// 针对 posts 与 posts.comments 注册专属操作
app.resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

对应请求示例：

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

命名规则遵循 `resourceName:actionName`，当包含关联时使用点语法（`posts.comments`）。

### 中间件与操作过滤

在定义资源时，可以通过配置定制操作行为：

```ts
app.resourceManager.define({
  name: 'posts',
  only: ['list', 'get', 'create'], // 仅暴露指定操作
  actions: {
    review: {
      middlewares: [requireAuth],
      handler: async (ctx) => reviewPost(ctx),
    },
  },
});
```

`middlewares` 支持单个或数组写法，并自动继承资源级中间件。

## 资源配置选项

资源定义支持丰富的配置选项，满足不同业务场景的需求：

### 基础配置

```ts
app.resourceManager.define({
  name: 'posts',                    // 资源名称（必需）
  type: 'single',                   // 资源类型：single | hasOne | hasMany | belongsTo | belongsToMany
  only: ['list', 'get'],           // 仅暴露指定操作
  except: ['destroy'],             // 排除指定操作
  middleware: authMiddleware,       // 资源级中间件
  middlewares: [authMiddleware],    // 资源级中间件（数组形式）
  actions: {                       // 自定义操作
    // 操作配置
  },
});
```

### 操作配置选项

每个操作都可以独立配置：

```ts
app.resourceManager.define({
  name: 'posts',
  actions: {
    customAction: {
      // 操作处理函数
      handler: async (ctx, next) => {
        // 处理逻辑
        await next();
      },
      
      // 中间件（会继承资源级中间件）
      middlewares: [requireAuth, validateInput],
      
      // 操作参数验证
      params: {
        // 参数配置
      },
      
      // 其他配置选项
      [key: string]: any,
    },
  },
});
```

### 操作过滤

通过 `only` 和 `except` 控制暴露的操作：

```ts
// 仅暴露指定操作
app.resourceManager.define({
  name: 'publicPosts',
  only: ['list', 'get'], // 只允许查询，不允许修改
});

// 排除指定操作
app.resourceManager.define({
  name: 'readOnlyPosts',
  except: ['create', 'update', 'destroy'], // 排除所有修改操作
});
```

### 资源类型

不同资源类型适用于不同场景：

- `single`：单一资源，如应用配置
- `hasOne`：一对一关系资源
- `hasMany`：一对多关系资源
- `belongsTo`：多对一关系资源
- `belongsToMany`：多对多关系资源

## 中间件系统

NocoBase 的中间件系统基于 Koa，支持在资源和操作级别应用中间件，实现认证、授权、参数验证等功能。

### 中间件类型

中间件可以是函数、字符串（插件名）或配置对象：

```ts
// 函数形式
const authMiddleware = async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.throw(401, 'Unauthorized');
  }
  await next();
};

// 字符串形式（插件名）
const pluginMiddleware = 'auth';

// 配置对象形式
const configMiddleware = {
  name: 'auth',
  options: { required: true },
};
```

### 资源级中间件

资源级中间件会应用到该资源的所有操作：

```ts
app.resourceManager.define({
  name: 'posts',
  middlewares: [
    // 认证中间件
    async (ctx, next) => {
      if (!ctx.state.user) {
        ctx.throw(401, 'Unauthorized');
      }
      await next();
    },
    
    // 日志中间件
    async (ctx, next) => {
      console.log(`Accessing ${ctx.action.resourceName}:${ctx.action.actionName}`);
      await next();
    },
  ],
  actions: {
    // 所有操作都会先执行上述中间件
    list: async (ctx) => {
      // 处理逻辑
    },
  },
});
```

### 操作级中间件

操作级中间件只应用到特定操作，会继承资源级中间件：

```ts
app.resourceManager.define({
  name: 'posts',
  middlewares: [authMiddleware], // 资源级中间件
  actions: {
    list: async (ctx) => {
      // 继承 authMiddleware
    },
    
    create: {
      middlewares: [
        // 额外的权限检查
        async (ctx, next) => {
          if (!ctx.state.user.isAdmin) {
            ctx.throw(403, 'Admin required');
          }
          await next();
        },
      ],
      handler: async (ctx) => {
        // 先执行 authMiddleware，再执行权限检查
      },
    },
  },
});
```

### 全局中间件

使用 `resourceManager.use()` 注册全局中间件：

```ts
// 全局日志中间件
app.resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});

// 全局错误处理中间件
app.resourceManager.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Resource error:', error);
    ctx.status = error.status || 500;
    ctx.body = { error: error.message };
  }
});
```

### 中间件执行顺序

中间件按以下顺序执行：

1. 全局中间件（按注册顺序）
2. 资源级中间件（按定义顺序）
3. 操作级中间件（按定义顺序）
4. 操作处理函数

```ts
app.resourceManager.use(globalMiddleware1); // 1
app.resourceManager.use(globalMiddleware2); // 2

app.resourceManager.define({
  name: 'posts',
  middlewares: [resourceMiddleware1, resourceMiddleware2], // 3, 4
  actions: {
    create: {
      middlewares: [actionMiddleware1, actionMiddleware2], // 5, 6
      handler: async (ctx) => { /* 7 */ },
    },
  },
});
```

### 常用中间件示例

#### 认证中间件

```ts
const requireAuth = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    ctx.throw(401, 'Token required');
  }
  
  try {
    const user = await verifyToken(token);
    ctx.state.user = user;
  } catch (error) {
    ctx.throw(401, 'Invalid token');
  }
  
  await next();
};
```

#### 参数验证中间件

```ts
const validateCreateParams = async (ctx, next) => {
  const { title, content } = ctx.action.params.values;
  
  if (!title || title.length < 3) {
    ctx.throw(400, 'Title must be at least 3 characters');
  }
  
  if (!content || content.length < 10) {
    ctx.throw(400, 'Content must be at least 10 characters');
  }
  
  await next();
};
```

#### 权限检查中间件

```ts
const requirePermission = (permission) => {
  return async (ctx, next) => {
    if (!ctx.state.user?.permissions?.includes(permission)) {
      ctx.throw(403, `Permission ${permission} required`);
    }
    await next();
  };
};

// 使用
app.resourceManager.define({
  name: 'posts',
  actions: {
    create: {
      middlewares: [requirePermission('posts.create')],
      handler: async (ctx) => { /* ... */ },
    },
  },
});
```

## 自定义非 Collection 资源

如果需要公开与数据表无关的能力，可以显式定义资源：

```ts
app.resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = {
        version: app.getVersion(),
        plugins: app.pm.getEnabledPlugins(),
      };
    },
  },
});
```

请求方式与自动资源一致：`GET /api/app:getInfo` 或 `POST /api/app:getInfo`（默认同时支持 GET/POST）。

## Handler 上下文

操作处理函数遵循 Koa 风格 `(ctx, next)`，提供了丰富的上下文信息和工具方法。

### 核心上下文属性

#### Action 信息

```ts
// 资源名称
ctx.action.resourceName; // 'posts' 或 'posts.comments'

// 操作名称
ctx.action.actionName; // 'list', 'create', 'customAction' 等

// 操作参数（合并了查询参数、请求体等）
ctx.action.params; // { filter: {...}, values: {...}, page: 1, ... }
```

#### 数据库访问

```ts
// 获取当前资源对应的 Repository
const repo = ctx.getCurrentRepository();

// 直接访问数据库实例
const db = ctx.db;

// 访问缓存
const cache = ctx.cache;

// 访问应用实例
const app = ctx.app;
```

#### 请求响应

```ts
// 设置响应体
ctx.body = { message: 'Success', data: result };

// 设置状态码
ctx.status = 201;

// 抛出错误
ctx.throw(400, 'Invalid parameters');
ctx.throw(404, 'Resource not found');
```

### 操作参数详解

`ctx.action.params` 包含了所有操作参数，不同操作类型支持不同的参数：

#### 查询参数（list, get）

```ts
{
  // 查询条件
  filter: {
    title: { $like: '%keyword%' },
    status: 'published',
    createdAt: { $gte: '2024-01-01' },
  },
  
  // 字段选择
  fields: ['id', 'title', 'createdAt'],
  appends: ['author', 'comments'], // 包含关联数据
  except: ['password', 'secret'],  // 排除字段
  
  // 排序
  sort: ['-createdAt', 'title'], // 按创建时间倒序，标题正序
  
  // 分页
  page: 1,
  pageSize: 20,
  paginate: true, // 是否启用分页
  
  // 树形结构
  tree: true, // 返回树形结构数据
}
```

#### 创建参数（create）

```ts
{
  // 要创建的数据
  values: {
    title: 'New Post',
    content: 'Post content',
    authorId: 1,
  },
  
  // 字段过滤
  whitelist: ['title', 'content'], // 只允许这些字段
  blacklist: ['id', 'createdAt'],  // 禁止这些字段
  
  // 关联数据处理
  updateAssociationValues: true, // 是否更新关联值
}
```

#### 更新参数（update）

```ts
{
  // 更新条件
  filterByTk: 1, // 主键值
  filter: { id: 1 }, // 或使用 filter 对象
  
  // 要更新的数据
  values: {
    title: 'Updated Title',
    status: 'published',
  },
  
  // 字段过滤
  whitelist: ['title', 'status'],
  blacklist: ['id', 'createdAt'],
  
  // 强制更新
  forceUpdate: true, // 即使没有变化也更新
  
  // 关联数据处理
  updateAssociationValues: true,
}
```

#### 关系操作参数

```ts
// add 操作
{
  values: [1, 2, 3], // 要添加的关联记录 ID
  filterByTk: 1,     // 主记录 ID
}

// remove 操作
{
  values: [1, 2], // 要移除的关联记录 ID
  filterByTk: 1,  // 主记录 ID
}

// set 操作
{
  values: [1, 2, 3], // 要设置的关联记录 ID（替换现有关联）
  filterByTk: 1,     // 主记录 ID
}

// toggle 操作
{
  values: 1, // 要切换的关联记录 ID
  filterByTk: 1, // 主记录 ID
}
```

### 常用工具方法

#### Repository 操作

```ts
app.resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => {
    const repo = ctx.getCurrentRepository();
    
    // 更新记录
    const post = await repo.update({
      filterByTk: ctx.action.params.filterByTk,
      values: { status: 'published', publishedAt: new Date() },
    });
    
    // 查询记录
    const publishedPost = await repo.findOne({
      filterByTk: ctx.action.params.filterByTk,
      appends: ['author', 'comments'],
    });
    
    ctx.body = publishedPost;
  },
});
```

#### 数据库查询

```ts
app.resourceManager.registerActionHandlers({
  'posts:statistics': async (ctx) => {
    const db = ctx.db;
    
    // 复杂查询
    const stats = await db.sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft
      FROM posts
      WHERE authorId = :authorId
    `, {
      replacements: { authorId: ctx.action.params.authorId },
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    ctx.body = stats[0];
  },
});
```

#### 缓存操作

```ts
app.resourceManager.registerActionHandlers({
  'posts:cache': async (ctx) => {
    const cache = ctx.cache;
    const cacheKey = `post:${ctx.action.params.id}`;
    
    // 尝试从缓存获取
    let post = await cache.get(cacheKey);
    
    if (!post) {
      // 缓存未命中，从数据库查询
      const repo = ctx.getCurrentRepository();
      post = await repo.findOne({
        filterByTk: ctx.action.params.id,
      });
      
      // 存入缓存（5分钟过期）
      await cache.set(cacheKey, post, 300);
    }
    
    ctx.body = post;
  },
});
```

### 错误处理

```ts
app.resourceManager.registerActionHandlers({
  'posts:customAction': async (ctx) => {
    try {
      // 业务逻辑
      const result = await processData(ctx.action.params);
      ctx.body = result;
    } catch (error) {
      // 记录错误日志
      ctx.app.logger.error('Custom action error:', error);
      
      // 根据错误类型返回不同状态码
      if (error.name === 'ValidationError') {
        ctx.throw(400, error.message);
      } else if (error.name === 'NotFoundError') {
        ctx.throw(404, 'Resource not found');
      } else {
        ctx.throw(500, 'Internal server error');
      }
    }
  },
});
```

### 响应格式

操作处理函数可以返回各种格式的响应：

```ts
// 简单数据
ctx.body = { message: 'Success' };

// 分页数据
ctx.body = {
  data: [...],
  meta: {
    count: 100,
    page: 1,
    pageSize: 20,
    totalPage: 5,
  },
};

// 错误响应
ctx.status = 400;
ctx.body = {
  error: 'Validation failed',
  details: ['Title is required', 'Content is too short'],
};
```

## 实际使用示例

### 博客系统示例

以下是一个完整的博客系统资源定义示例：

```ts
// 文章资源
app.resourceManager.define({
  name: 'posts',
  middlewares: [requireAuth], // 所有操作都需要认证
  actions: {
    // 发布文章（自定义操作）
    publish: {
      middlewares: [requirePermission('posts.publish')],
      handler: async (ctx) => {
        const repo = ctx.getCurrentRepository();
        const post = await repo.update({
          filterByTk: ctx.action.params.filterByTk,
          values: { 
            status: 'published',
            publishedAt: new Date(),
          },
        });
        ctx.body = post;
      },
    },
    
    // 获取热门文章
    popular: {
      handler: async (ctx) => {
        const repo = ctx.getCurrentRepository();
        const posts = await repo.find({
          filter: { status: 'published' },
          sort: ['-viewCount', '-createdAt'],
          limit: 10,
          appends: ['author', 'tags'],
        });
        ctx.body = posts;
      },
    },
    
    // 搜索文章
    search: {
      handler: async (ctx) => {
        const { keyword, category, tags } = ctx.action.params;
        const repo = ctx.getCurrentRepository();
        
        const filter: any = { status: 'published' };
        
        if (keyword) {
          filter.$or = [
            { title: { $like: `%${keyword}%` } },
            { content: { $like: `%${keyword}%` } },
          ];
        }
        
        if (category) {
          filter.categoryId = category;
        }
        
        if (tags && tags.length > 0) {
          filter.tags = { $in: tags };
        }
        
        const posts = await repo.find({
          filter,
          sort: ['-createdAt'],
          appends: ['author', 'category', 'tags'],
        });
        
        ctx.body = posts;
      },
    },
  },
});

// 评论资源
app.resourceManager.define({
  name: 'comments',
  middlewares: [requireAuth],
  actions: {
    // 审核评论
    moderate: {
      middlewares: [requirePermission('comments.moderate')],
      handler: async (ctx) => {
        const repo = ctx.getCurrentRepository();
        const { action, commentIds } = ctx.action.params;
        
        const values = action === 'approve' 
          ? { status: 'approved' }
          : { status: 'rejected' };
        
        await repo.update({
          filter: { id: { $in: commentIds } },
          values,
        });
        
        ctx.body = { message: 'Comments moderated successfully' };
      },
    },
  },
});

// 标签资源
app.resourceManager.define({
  name: 'tags',
  actions: {
    // 获取标签云数据
    cloud: {
      handler: async (ctx) => {
        const db = ctx.db;
        const tags = await db.sequelize.query(`
          SELECT 
            t.id,
            t.name,
            t.color,
            COUNT(pt.postId) as postCount
          FROM tags t
          LEFT JOIN postTags pt ON t.id = pt.tagId
          GROUP BY t.id, t.name, t.color
          ORDER BY postCount DESC
          LIMIT 50
        `, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        
        ctx.body = tags;
      },
    },
  },
});
```

### 文件管理示例

```ts
// 文件上传资源
app.resourceManager.define({
  name: 'uploads',
  middlewares: [requireAuth],
  actions: {
    // 上传文件
    upload: {
      middlewares: [validateFileSize, validateFileType],
      handler: async (ctx) => {
        const { file } = ctx.request.files;
        const { category, description } = ctx.action.params;
        
        // 保存文件到存储
        const fileInfo = await saveFile(file, {
          category,
          description,
          userId: ctx.state.user.id,
        });
        
        // 保存文件记录到数据库
        const repo = ctx.getCurrentRepository();
        const upload = await repo.create({
          values: {
            filename: fileInfo.filename,
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            path: fileInfo.path,
            category,
            description,
            userId: ctx.state.user.id,
          },
        });
        
        ctx.body = upload;
      },
    },
    
    // 批量上传
    batchUpload: {
      middlewares: [validateFileSize, validateFileType],
      handler: async (ctx) => {
        const { files } = ctx.request.files;
        const { category } = ctx.action.params;
        
        const results = [];
        const repo = ctx.getCurrentRepository();
        
        for (const file of files) {
          try {
            const fileInfo = await saveFile(file, { category });
            const upload = await repo.create({
              values: {
                filename: fileInfo.filename,
                originalName: file.name,
                size: file.size,
                mimeType: file.type,
                path: fileInfo.path,
                category,
                userId: ctx.state.user.id,
              },
            });
            results.push(upload);
          } catch (error) {
            results.push({ error: error.message, filename: file.name });
          }
        }
        
        ctx.body = { results };
      },
    },
  },
});
```

### 用户管理示例

```ts
// 用户资源
app.resourceManager.define({
  name: 'users',
  middlewares: [requireAuth],
  actions: {
    // 用户注册
    register: {
      middlewares: [validateRegistrationData],
      handler: async (ctx) => {
        const { username, email, password } = ctx.action.params;
        
        // 检查用户名和邮箱是否已存在
        const existingUser = await ctx.db.getRepository('users').findOne({
          filter: {
            $or: [{ username }, { email }],
          },
        });
        
        if (existingUser) {
          ctx.throw(400, 'Username or email already exists');
        }
        
        // 创建用户
        const hashedPassword = await hashPassword(password);
        const user = await ctx.db.getRepository('users').create({
          values: {
            username,
            email,
            password: hashedPassword,
            status: 'active',
          },
        });
        
        // 发送欢迎邮件
        await sendWelcomeEmail(email, username);
        
        ctx.body = { message: 'User registered successfully', userId: user.id };
      },
    },
    
    // 重置密码
    resetPassword: {
      middlewares: [validateEmail],
      handler: async (ctx) => {
        const { email } = ctx.action.params;
        
        const user = await ctx.db.getRepository('users').findOne({
          filter: { email },
        });
        
        if (!user) {
          ctx.throw(404, 'User not found');
        }
        
        // 生成重置令牌
        const resetToken = generateResetToken();
        await ctx.cache.set(`reset:${resetToken}`, user.id, 3600); // 1小时过期
        
        // 发送重置邮件
        await sendPasswordResetEmail(email, resetToken);
        
        ctx.body = { message: 'Password reset email sent' };
      },
    },
    
    // 更新用户资料
    updateProfile: {
      middlewares: [validateProfileData],
      handler: async (ctx) => {
        const userId = ctx.state.user.id;
        const { nickname, bio, avatar } = ctx.action.params;
        
        const repo = ctx.getCurrentRepository();
        const user = await repo.update({
          filterByTk: userId,
          values: {
            nickname,
            bio,
            avatar,
            updatedAt: new Date(),
          },
        });
        
        ctx.body = user;
      },
    },
  },
});
```

## 最佳实践

### 1. 资源设计原则

- **单一职责**：每个资源应该只负责一个业务领域
- **RESTful 设计**：遵循 REST 原则，使用合适的 HTTP 方法
- **资源命名**：使用复数形式，如 `posts`、`users`、`comments`
- **操作命名**：使用动词形式，如 `publish`、`approve`、`search`

### 2. 中间件使用建议

```ts
// 好的做法：中间件职责单一
const validateInput = async (ctx, next) => {
  // 只负责参数验证
  await next();
};

const checkPermission = async (ctx, next) => {
  // 只负责权限检查
  await next();
};

// 不好的做法：中间件职责过多
const validateAndCheckPermission = async (ctx, next) => {
  // 既验证参数又检查权限，职责不清晰
  await next();
};
```

### 3. 错误处理策略

```ts
// 统一的错误处理中间件
app.resourceManager.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // 记录错误日志
    ctx.app.logger.error('Resource error:', {
      resource: ctx.action?.resourceName,
      action: ctx.action?.actionName,
      error: error.message,
      stack: error.stack,
    });
    
    // 根据错误类型返回适当的响应
    if (error.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: error.details };
    } else if (error.name === 'NotFoundError') {
      ctx.status = 404;
      ctx.body = { error: 'Resource not found' };
    } else if (error.status) {
      ctx.status = error.status;
      ctx.body = { error: error.message };
    } else {
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }
});
```

### 4. 性能优化

```ts
// 使用缓存减少数据库查询
app.resourceManager.registerActionHandlers({
  'posts:popular': async (ctx) => {
    const cacheKey = 'popular-posts';
    let posts = await ctx.cache.get(cacheKey);
    
    if (!posts) {
      const repo = ctx.getCurrentRepository();
      posts = await repo.find({
        filter: { status: 'published' },
        sort: ['-viewCount'],
        limit: 10,
        appends: ['author'],
      });
      
      // 缓存5分钟
      await ctx.cache.set(cacheKey, posts, 300);
    }
    
    ctx.body = posts;
  },
});

// 使用分页避免大量数据查询
app.resourceManager.registerActionHandlers({
  'posts:list': async (ctx) => {
    const { page = 1, pageSize = 20 } = ctx.action.params;
    
    const repo = ctx.getCurrentRepository();
    const [posts, count] = await repo.findAndCount({
      filter: ctx.action.params.filter,
      sort: ['-createdAt'],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    
    ctx.body = {
      data: posts,
      meta: {
        count,
        page,
        pageSize,
        totalPage: Math.ceil(count / pageSize),
      },
    };
  },
});
```

### 5. 安全性考虑

```ts
// 输入验证
const validatePostData = async (ctx, next) => {
  const { title, content } = ctx.action.params.values;
  
  if (!title || title.trim().length < 3) {
    ctx.throw(400, 'Title must be at least 3 characters');
  }
  
  if (!content || content.trim().length < 10) {
    ctx.throw(400, 'Content must be at least 10 characters');
  }
  
  // 防止 XSS 攻击
  ctx.action.params.values.title = escapeHtml(title);
  ctx.action.params.values.content = escapeHtml(content);
  
  await next();
};

// 权限检查
const requireOwnership = async (ctx, next) => {
  const userId = ctx.state.user.id;
  const resourceId = ctx.action.params.filterByTk;
  
  const repo = ctx.getCurrentRepository();
  const resource = await repo.findOne({
    filterByTk: resourceId,
    fields: ['userId'],
  });
  
  if (!resource || resource.userId !== userId) {
    ctx.throw(403, 'Access denied');
  }
  
  await next();
};
```

## 错误处理和异常情况

### 常见错误类型

NocoBase 资源操作中可能遇到的各种错误类型：

#### 1. 参数验证错误

```ts
// 缺少必需参数
ctx.throw(400, 'Missing required parameter: title');

// 参数格式错误
ctx.throw(400, 'Invalid parameter format: page must be a number');

// 参数值超出范围
ctx.throw(400, 'Parameter out of range: pageSize must be between 1 and 100');
```

#### 2. 认证和授权错误

```ts
// 未认证
ctx.throw(401, 'Authentication required');

// 认证失败
ctx.throw(401, 'Invalid token');

// 权限不足
ctx.throw(403, 'Insufficient permissions');

// 资源访问被拒绝
ctx.throw(403, 'Access denied to this resource');
```

#### 3. 资源不存在错误

```ts
// 资源未找到
ctx.throw(404, 'Resource not found');

// 关联资源不存在
ctx.throw(404, 'Related resource not found: user with id 123');

// 操作不存在
ctx.throw(404, 'Action not found: customAction');
```

#### 4. 业务逻辑错误

```ts
// 业务规则违反
ctx.throw(422, 'Business rule violation: cannot delete published post');

// 状态冲突
ctx.throw(409, 'Status conflict: post is already published');

// 依赖关系错误
ctx.throw(409, 'Cannot delete category with existing posts');
```

#### 5. 服务器错误

```ts
// 数据库连接错误
ctx.throw(500, 'Database connection failed');

// 外部服务错误
ctx.throw(502, 'External service unavailable');

// 内部处理错误
ctx.throw(500, 'Internal processing error');
```

### 错误处理最佳实践

#### 1. 统一错误处理中间件

```ts
// 全局错误处理中间件
app.resourceManager.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // 记录错误日志
    const errorInfo = {
      resource: ctx.action?.resourceName,
      action: ctx.action?.actionName,
      method: ctx.method,
      url: ctx.url,
      userAgent: ctx.headers['user-agent'],
      ip: ctx.ip,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    };
    
    ctx.app.logger.error('Resource operation error:', errorInfo);
    
    // 根据错误类型返回适当的响应
    if (error.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = {
        error: 'Validation failed',
        message: error.message,
        details: error.details || [],
      };
    } else if (error.name === 'SequelizeValidationError') {
      ctx.status = 400;
      ctx.body = {
        error: 'Database validation failed',
        message: 'Invalid data provided',
        details: error.errors?.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value,
        })) || [],
      };
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      ctx.status = 409;
      ctx.body = {
        error: 'Duplicate entry',
        message: 'Resource already exists',
        field: error.errors?.[0]?.path,
      };
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      ctx.status = 400;
      ctx.body = {
        error: 'Foreign key constraint failed',
        message: 'Referenced resource does not exist',
      };
    } else if (error.status) {
      // 自定义错误状态码
      ctx.status = error.status;
      ctx.body = {
        error: error.name || 'Error',
        message: error.message,
      };
    } else {
      // 未知错误
      ctx.status = 500;
      ctx.body = {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred',
      };
    }
  }
});
```

#### 2. 操作级错误处理

```ts
app.resourceManager.registerActionHandlers({
  'posts:create': async (ctx) => {
    try {
      const { title, content, authorId } = ctx.action.params.values;
      
      // 验证必需字段
      if (!title || !content) {
        ctx.throw(400, 'Title and content are required');
      }
      
      // 验证作者是否存在
      const author = await ctx.db.getRepository('users').findOne({
        filterByTk: authorId,
      });
      
      if (!author) {
        ctx.throw(400, 'Author not found');
      }
      
      // 创建文章
      const repo = ctx.getCurrentRepository();
      const post = await repo.create({
        values: { title, content, authorId },
      });
      
      ctx.body = post;
      
    } catch (error) {
      // 记录操作特定错误
      ctx.app.logger.error('Post creation failed:', {
        params: ctx.action.params,
        error: error.message,
      });
      
      // 重新抛出错误，让全局错误处理中间件处理
      throw error;
    }
  },
});
```

#### 3. 参数验证中间件

```ts
// 通用参数验证中间件
const validateParams = (schema) => {
  return async (ctx, next) => {
    try {
      // 使用 Joi 或其他验证库验证参数
      const { error, value } = schema.validate(ctx.action.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));
        
        ctx.throw(400, 'Validation failed', { details });
      }
      
      // 更新参数为验证后的值
      ctx.action.params = value;
      await next();
      
    } catch (err) {
      if (err.status === 400) {
        throw err;
      }
      throw new Error(`Parameter validation error: ${err.message}`);
    }
  };
};

// 使用示例
const postCreateSchema = Joi.object({
  values: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().min(10).required(),
    authorId: Joi.number().integer().positive().required(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).required(),
});

app.resourceManager.define({
  name: 'posts',
  actions: {
    create: {
      middlewares: [validateParams(postCreateSchema)],
      handler: async (ctx) => {
        // 参数已经验证，可以直接使用
        const { values } = ctx.action.params;
        // ...
      },
    },
  },
});
```

#### 4. 业务逻辑错误处理

```ts
// 业务规则验证中间件
const validateBusinessRules = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  if (resourceName === 'posts' && actionName === 'destroy') {
    const postId = ctx.action.params.filterByTk;
    const repo = ctx.getCurrentRepository();
    
    // 检查文章是否有评论
    const commentCount = await ctx.db.getRepository('comments').count({
      filter: { postId },
    });
    
    if (commentCount > 0) {
      ctx.throw(409, 'Cannot delete post with existing comments');
    }
    
    // 检查文章是否已发布
    const post = await repo.findOne({
      filterByTk: postId,
      fields: ['status'],
    });
    
    if (post?.status === 'published') {
      ctx.throw(409, 'Cannot delete published post');
    }
  }
  
  await next();
};
```

#### 5. 重试机制

```ts
// 重试中间件
const withRetry = (maxRetries = 3, delay = 1000) => {
  return async (ctx, next) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await next();
        return; // 成功，退出重试循环
      } catch (error) {
        lastError = error;
        
        // 只对特定错误进行重试
        if (error.name === 'SequelizeConnectionError' || 
            error.name === 'TimeoutError') {
          
          if (attempt < maxRetries) {
            ctx.app.logger.warn(`Retry attempt ${attempt}/${maxRetries} for ${ctx.action.resourceName}:${ctx.action.actionName}`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
            continue;
          }
        }
        
        // 不重试或已达到最大重试次数
        throw error;
      }
    }
    
    throw lastError;
  };
};

// 使用重试中间件
app.resourceManager.define({
  name: 'externalData',
  actions: {
    sync: {
      middlewares: [withRetry(3, 2000)], // 最多重试3次，每次间隔2秒
      handler: async (ctx) => {
        // 可能失败的外部 API 调用
        await syncExternalData();
      },
    },
  },
});
```

#### 6. 错误监控和告警

```ts
// 错误监控中间件
const errorMonitoring = async (ctx, next) => {
  const startTime = Date.now();
  
  try {
    await next();
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 发送错误到监控系统
    await sendErrorToMonitoring({
      resource: ctx.action?.resourceName,
      action: ctx.action?.actionName,
      error: error.message,
      stack: error.stack,
      duration,
      userId: ctx.state.user?.id,
      requestId: ctx.state.requestId,
    });
    
    // 严重错误发送告警
    if (error.status >= 500) {
      await sendAlert({
        level: 'error',
        message: `Server error in ${ctx.action?.resourceName}:${ctx.action?.actionName}`,
        details: {
          error: error.message,
          stack: error.stack,
          duration,
        },
      });
    }
    
    throw error;
  }
};
```

### 错误响应格式

所有错误响应都应该遵循统一的格式：

```ts
// 成功响应
{
  "data": { ... },
  "meta": { ... }
}

// 错误响应
{
  "error": "Error type",
  "message": "Human readable error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Field specific error message",
      "value": "invalidValue"
    }
  ],
  "requestId": "unique-request-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 调试技巧

#### 1. 启用详细日志

```ts
// 开发环境启用详细错误信息
if (process.env.NODE_ENV === 'development') {
  app.resourceManager.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Detailed error information:', {
        resource: ctx.action?.resourceName,
        action: ctx.action?.actionName,
        params: ctx.action?.params,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  });
}
```

#### 2. 请求追踪

```ts
// 请求追踪中间件
const requestTracing = async (ctx, next) => {
  const requestId = generateRequestId();
  ctx.state.requestId = requestId;
  
  ctx.app.logger.info('Request started:', {
    requestId,
    resource: ctx.action?.resourceName,
    action: ctx.action?.actionName,
    method: ctx.method,
    url: ctx.url,
  });
  
  try {
    await next();
    
    ctx.app.logger.info('Request completed:', {
      requestId,
      status: ctx.status,
      duration: Date.now() - ctx.state.startTime,
    });
  } catch (error) {
    ctx.app.logger.error('Request failed:', {
      requestId,
      error: error.message,
      duration: Date.now() - ctx.state.startTime,
    });
    throw error;
  }
};
```
