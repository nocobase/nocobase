# 服务器中间件示例

本文档将详细介绍如何在 NocoBase 插件中创建和使用服务器中间件。

## 中间件基础概念

中间件是处理 HTTP 请求和响应的函数，它们按照特定顺序执行，形成一个处理链。NocoBase 基于 Koa 构建，使用洋葱圈模型处理中间件。

### 中间件结构

```typescript
// 基本中间件结构
async function middleware(ctx, next) {
  // 请求前处理
  console.log('处理请求前');
  
  // 调用下一个中间件
  await next();
  
  // 响应后处理
  console.log('处理响应后');
}
```

## 创建基本中间件

### 简单日志中间件

```typescript
// src/server/middlewares/logger.ts
export default async function loggerMiddleware(ctx, next) {
  const start = Date.now();
  
  // 请求信息
  console.log(`--> ${ctx.method} ${ctx.path}`);
  
  try {
    // 执行后续中间件
    await next();
    
    // 响应信息
    const ms = Date.now() - start;
    console.log(`<-- ${ctx.method} ${ctx.path} ${ctx.status} ${ms}ms`);
  } catch (error) {
    // 错误信息
    const ms = Date.now() - start;
    console.log(`<-- ${ctx.method} ${ctx.path} ${error.status || 500} ${ms}ms`);
    throw error;
  }
}
```

### 在插件中注册中间件

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import loggerMiddleware from './middlewares/logger';

export class MiddlewarePlugin extends Plugin {
  async load() {
    // 注册全局中间件
    this.app.middleware.register(loggerMiddleware);
  }
}
```

## 认证中间件

### JWT认证中间件

```typescript
// src/server/middlewares/auth.ts
import { verify } from 'jsonwebtoken';

export default async function authMiddleware(ctx, next) {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    ctx.status = 401;
    ctx.body = { error: '未提供认证令牌' };
    return;
  }
  
  try {
    // 验证JWT令牌
    const decoded = verify(token, process.env.JWT_SECRET || 'secret');
    ctx.state.user = decoded;
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: '无效的认证令牌' };
    return;
  }
  
  await next();
}
```

### 权限检查中间件

```typescript
// src/server/middlewares/permission.ts
export default async function permissionMiddleware(ctx, next) {
  const user = ctx.state.user;
  const resource = ctx.params.resource;
  const action = ctx.params.action;
  
  // 检查用户权限
  const hasPermission = await checkUserPermission(user, resource, action);
  
  if (!hasPermission) {
    ctx.status = 403;
    ctx.body = { error: '权限不足' };
    return;
  }
  
  await next();
}

async function checkUserPermission(user, resource, action) {
  // 实现权限检查逻辑
  // 这里可以查询数据库或使用ACL系统
  return true;
}
```

## 请求处理中间件

### 请求验证中间件

```typescript
// src/server/middlewares/validation.ts
export default async function validationMiddleware(ctx, next) {
  // 验证请求数据
  if (ctx.method === 'POST' || ctx.method === 'PUT') {
    const { body } = ctx.request;
    
    // 验证必填字段
    if (ctx.path === '/api/users') {
      if (!body.email || !body.password) {
        ctx.status = 400;
        ctx.body = { error: '邮箱和密码为必填字段' };
        return;
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        ctx.status = 400;
        ctx.body = { error: '邮箱格式不正确' };
        return;
      }
    }
  }
  
  await next();
}
```

### 数据转换中间件

```typescript
// src/server/middlewares/transform.ts
export default async function transformMiddleware(ctx, next) {
  // 在请求处理前转换数据
  if (ctx.method === 'POST' && ctx.path.startsWith('/api/')) {
    const { body } = ctx.request;
    
    // 转换字段名
    if (body.created_at) {
      body.createdAt = body.created_at;
      delete body.created_at;
    }
    
    // 设置默认值
    if (ctx.path === '/api/posts' && !body.status) {
      body.status = 'draft';
    }
  }
  
  await next();
  
  // 在响应返回前转换数据
  if (ctx.body && typeof ctx.body === 'object') {
    // 转换字段名
    if (ctx.body.createdAt) {
      ctx.body.created_at = ctx.body.createdAt;
      delete ctx.body.createdAt;
    }
  }
}
```

## 错误处理中间件

### 全局错误处理

```typescript
// src/server/middlewares/error-handler.ts
export default async function errorHandlerMiddleware(ctx, next) {
  try {
    await next();
  } catch (error) {
    // 记录错误日志
    console.error('请求处理错误:', error);
    
    // 设置错误响应
    ctx.status = error.status || 500;
    ctx.body = {
      error: error.message || '内部服务器错误',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
    
    // 发送错误通知
    await sendErrorNotification(error, ctx);
  }
}

async function sendErrorNotification(error, ctx) {
  // 实现错误通知逻辑
  // 可以发送邮件、Slack通知等
}
```

### 自定义错误类型

```typescript
// src/server/errors/CustomError.ts
export class CustomError extends Error {
  constructor(message, public status = 500, public code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'CustomError';
  }
}

// 在中间件中使用
export default async function customErrorMiddleware(ctx, next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof CustomError) {
      ctx.status = error.status;
      ctx.body = {
        error: error.message,
        code: error.code,
      };
    } else {
      throw error;
    }
  }
}
```

## 资源特定中间件

### 为特定资源添加中间件

```typescript
class ResourceMiddlewarePlugin extends Plugin {
  async load() {
    // 为特定资源添加中间件
    this.app.resourceManager.use('posts', async (ctx, next) => {
      console.log(`访问文章资源: ${ctx.action.actionName}`);
      
      // 验证文章访问权限
      if (ctx.action.actionName === 'update' || ctx.action.actionName === 'destroy') {
        await this.validatePostOwnership(ctx);
      }
      
      await next();
    });
    
    // 为多个资源添加中间件
    ['posts', 'comments'].forEach(resourceName => {
      this.app.resourceManager.use(resourceName, async (ctx, next) => {
        // 记录资源访问日志
        await this.logResourceAccess(ctx, resourceName);
        await next();
      });
    });
  }
  
  private async validatePostOwnership(ctx) {
    const { filterByTk } = ctx.action.params;
    const userId = ctx.state.user.id;
    
    const post = await ctx.db.getRepository('posts').findById(filterByTk);
    if (post.authorId !== userId) {
      ctx.throw(403, '无权修改此文章');
    }
  }
  
  private async logResourceAccess(ctx, resourceName) {
    // 记录资源访问日志
    console.log(`用户 ${ctx.state.user?.id} 访问 ${resourceName} 资源`);
  }
}
```

## 条件中间件

### 基于路径的条件中间件

```typescript
class ConditionalMiddlewarePlugin extends Plugin {
  async load() {
    this.app.middleware.register(async (ctx, next) => {
      // 只对API请求应用中间件
      if (ctx.path.startsWith('/api/')) {
        // 认证检查
        await this.authenticate(ctx);
      }
      
      await next();
      
      // 只对管理后台请求应用后处理
      if (ctx.path.startsWith('/admin/')) {
        await this.logAdminAccess(ctx);
      }
    });
  }
  
  private async authenticate(ctx) {
    // 实现认证逻辑
  }
  
  private async logAdminAccess(ctx) {
    // 记录管理后台访问日志
  }
}
```

### 基于方法的条件中间件

```typescript
class MethodMiddlewarePlugin extends Plugin {
  async load() {
    this.app.middleware.register(async (ctx, next) => {
      // 对写操作应用额外的安全检查
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) {
        // 检查CSRF令牌
        await this.validateCSRFToken(ctx);
        
        // 检查速率限制
        await this.checkRateLimit(ctx);
      }
      
      await next();
      
      // 对成功响应应用缓存
      if (ctx.status === 200 && ctx.method === 'GET') {
        await this.setCacheHeaders(ctx);
      }
    });
  }
  
  private async validateCSRFToken(ctx) {
    // 实现CSRF令牌验证
  }
  
  private async checkRateLimit(ctx) {
    // 实现速率限制检查
  }
  
  private async setCacheHeaders(ctx) {
    // 设置缓存头
    ctx.set('Cache-Control', 'public, max-age=300');
  }
}
```

## 中间件组合

### 中间件链

```typescript
class MiddlewareChainPlugin extends Plugin {
  async load() {
    // 创建中间件链
    const middlewareChain = [
      this.loggingMiddleware,
      this.authenticationMiddleware,
      this.permissionMiddleware,
      this.validationMiddleware,
    ];
    
    // 注册中间件链
    middlewareChain.forEach(middleware => {
      this.app.middleware.register(middleware.bind(this));
    });
  }
  
  private async loggingMiddleware(ctx, next) {
    // 日志中间件实现
    await next();
  }
  
  private async authenticationMiddleware(ctx, next) {
    // 认证中间件实现
    await next();
  }
  
  private async permissionMiddleware(ctx, next) {
    // 权限中间件实现
    await next();
  }
  
  private async validationMiddleware(ctx, next) {
    // 验证中间件实现
    await next();
  }
}
```

### 中间件优先级

```typescript
class MiddlewarePriorityPlugin extends Plugin {
  async load() {
    // 注册高优先级中间件（先注册先执行）
    this.app.middleware.register(this.criticalSecurityMiddleware);
    
    // 注册普通中间件
    this.app.middleware.register(this.loggingMiddleware);
    
    // 注册低优先级中间件
    this.app.middleware.register(this.cacheMiddleware);
  }
  
  private async criticalSecurityMiddleware(ctx, next) {
    // 关键安全检查，需要最先执行
    await next();
  }
  
  private async loggingMiddleware(ctx, next) {
    // 日志记录
    await next();
  }
  
  private async cacheMiddleware(ctx, next) {
    // 缓存处理，可以最后执行
    await next();
  }
}
```

## 第三方中间件集成

### 集成Koa中间件

```typescript
import cors from '@koa/cors';
import helmet from 'koa-helmet';
import bodyParser from 'koa-bodyparser';

class ThirdPartyMiddlewarePlugin extends Plugin {
  async load() {
    // 集成第三方Koa中间件
    this.app.middleware.register(cors());
    this.app.middleware.register(helmet());
    this.app.middleware.register(bodyParser());
  }
}
```

### 自定义Koa中间件

```typescript
import compress from 'koa-compress';

class CompressionMiddlewarePlugin extends Plugin {
  async load() {
    // 使用koa-compress中间件
    this.app.middleware.register(compress({
      threshold: 2048,
      gzip: {
        flush: require('zlib').constants.Z_SYNC_FLUSH,
      },
      deflate: {
        flush: require('zlib').constants.Z_SYNC_FLUSH,
      },
      br: {
        flush: require('zlib').constants.Z_SYNC_FLUSH,
      },
    }));
  }
}
```

## 中间件测试

### 编写中间件测试

```typescript
// src/server/__tests__/middlewares/auth.test.ts
import { createMockContext } from '@nocobase/test';
import authMiddleware from '../../middlewares/auth';

describe('authMiddleware', () => {
  it('should allow requests with valid token', async () => {
    const ctx = createMockContext({
      headers: {
        authorization: 'Bearer valid-token',
      },
    });
    
    // Mock JWT verify
    jest.mock('jsonwebtoken', () => ({
      verify: jest.fn().mockReturnValue({ id: 1, name: 'Test User' }),
    }));
    
    await authMiddleware(ctx, async () => {});
    
    expect(ctx.status).not.toBe(401);
    expect(ctx.state.user).toEqual({ id: 1, name: 'Test User' });
  });
  
  it('should reject requests without token', async () => {
    const ctx = createMockContext({
      headers: {},
    });
    
    await authMiddleware(ctx, async () => {});
    
    expect(ctx.status).toBe(401);
    expect(ctx.body).toEqual({ error: '未提供认证令牌' });
  });
});
```

## 中间件最佳实践

### 1. 错误处理

```typescript
// 始终正确处理错误
async function robustMiddleware(ctx, next) {
  try {
    await next();
  } catch (error) {
    // 记录错误但不要吞掉错误
    console.error('中间件错误:', error);
    throw error; // 或者适当处理后重新抛出
  }
}
```

### 2. 性能考虑

```typescript
// 避免在中间件中执行耗时操作
async function performantMiddleware(ctx, next) {
  // 不要在中间件中执行数据库查询等耗时操作
  // 除非确实必要
  
  // 可以将耗时操作移到后台执行
  if (shouldLogRequest(ctx)) {
    setImmediate(() => {
      logRequestToDatabase(ctx);
    });
  }
  
  await next();
}
```

### 3. 中间件顺序

```typescript
class MiddlewareOrderPlugin extends Plugin {
  async load() {
    // 正确的中间件顺序
    this.app.middleware.register([
      // 1. 安全中间件
      helmet(),
      
      // 2. CORS中间件
      cors(),
      
      // 3. 请求解析中间件
      bodyParser(),
      
      // 4. 认证中间件
      authMiddleware,
      
      // 5. 权限中间件
      permissionMiddleware,
      
      // 6. 业务逻辑中间件
      businessLogicMiddleware,
      
      // 7. 响应处理中间件
      responseMiddleware,
    ]);
  }
}
```

## 下一步

- 学习 [UI 组件](./ui-components.md) 示例
- 掌握 [工作流节点](./workflow-nodes.md) 示例
