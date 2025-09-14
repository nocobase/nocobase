# 资源和操作示例

本文档将详细介绍如何在 NocoBase 插件中创建自定义资源和操作。

## 资源基础概念

资源是 NocoBase 中的核心概念，代表一组相关的数据和操作。每个资源都有一组预定义的操作（actions），如 list、get、create、update、destroy 等。

## 创建基本资源

### 简单资源定义

```typescript
class SimpleResourcePlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        // 扩展现有操作
        async list(ctx, next) {
          // 添加自定义逻辑
          console.log('Listing posts');
          await next();
        },
      },
    });
  }
}
```

### 自定义资源

```typescript
class CustomResourcePlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'analytics',
      actions: {
        async getStats(ctx, next) {
          // 自定义统计逻辑
          const stats = await this.calculateStats();
          ctx.body = stats;
          await next();
        },
        
        async exportData(ctx, next) {
          // 自定义导出逻辑
          const data = await this.exportData();
          ctx.body = data;
          ctx.type = 'application/json';
          ctx.attachment('analytics.json');
          await next();
        },
      },
    });
    
    // 设置访问权限
    this.app.acl.allow('analytics', 'getStats', 'loggedIn');
    this.app.acl.allow('analytics', 'exportData', 'admin');
  }
  
  private async calculateStats() {
    // 实现统计逻辑
    return { users: 100, posts: 500 };
  }
  
  private async exportData() {
    // 实现导出逻辑
    return { data: [] };
  }
}
```

## 标准操作扩展

### list 操作扩展

```typescript
class ExtendedListPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async list(ctx, next) {
          // 添加搜索功能
          const { search } = ctx.action.params;
          if (search) {
            ctx.action.mergeParams({
              filter: {
                $or: [
                  { title: { $includes: search } },
                  { content: { $includes: search } },
                ],
              },
            });
          }
          
          // 添加排序
          ctx.action.mergeParams({
            sort: ['-createdAt'],
          });
          
          await next();
        },
      },
    });
  }
}
```

### create 操作扩展

```typescript
class ExtendedCreatePlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          // 设置默认值
          const { values } = ctx.action.params;
          ctx.action.mergeParams({
            values: {
              ...values,
              authorId: ctx.state.currentUser.id,
              status: 'draft',
            },
          });
          
          await next();
          
          // 创建后处理
          const post = ctx.body;
          await this.sendNotification(post);
        },
      },
    });
  }
  
  private async sendNotification(post) {
    // 发送通知逻辑
  }
}
```

### update 操作扩展

```typescript
class ExtendedUpdatePlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async update(ctx, next) {
          // 记录变更历史
          const { filterByTk, values } = ctx.action.params;
          const oldPost = await ctx.db.getRepository('posts').findById(filterByTk);
          
          await next();
          
          // 记录变更
          const newPost = ctx.body;
          await this.logChanges(oldPost, newPost);
        },
      },
    });
  }
  
  private async logChanges(oldPost, newPost) {
    // 记录变更逻辑
  }
}
```

## 自定义操作

### 简单自定义操作

```typescript
class CustomActionsPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async publish(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const post = await ctx.db.getRepository('posts').findById(filterByTk);
          
          await post.update({ status: 'published' });
          
          ctx.body = post;
          await next();
        },
        
        async unpublish(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const post = await ctx.db.getRepository('posts').findById(filterByTk);
          
          await post.update({ status: 'draft' });
          
          ctx.body = post;
          await next();
        },
      },
    });
    
    // 设置权限
    this.app.acl.allow('posts', 'publish', 'loggedIn');
    this.app.acl.allow('posts', 'unpublish', 'loggedIn');
  }
}
```

### 批量操作

```typescript
class BatchActionsPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async batchPublish(ctx, next) {
          const { filter } = ctx.action.params;
          const posts = await ctx.db.getRepository('posts').find({ filter });
          
          await Promise.all(
            posts.map(post => post.update({ status: 'published' }))
          );
          
          ctx.body = { count: posts.length };
          await next();
        },
        
        async batchDelete(ctx, next) {
          const { filter } = ctx.action.params;
          const count = await ctx.db.getRepository('posts').destroy({ filter });
          
          ctx.body = { count };
          await next();
        },
      },
    });
  }
}
```

### 带参数的自定义操作

```typescript
class ParameterizedActionsPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async move(ctx, next) {
          const { filterByTk, targetCategoryId } = ctx.action.params;
          
          const post = await ctx.db.getRepository('posts').findById(filterByTk);
          await post.update({ categoryId: targetCategoryId });
          
          ctx.body = post;
          await next();
        },
        
        async duplicate(ctx, next) {
          const { filterByTk, withAttachments = false } = ctx.action.params;
          
          const originalPost = await ctx.db.getRepository('posts').findById(filterByTk);
          const newPost = await ctx.db.getRepository('posts').create({
            values: {
              ...originalPost.toJSON(),
              title: `${originalPost.title} (副本)`,
              // 处理附件逻辑
            },
          });
          
          ctx.body = newPost;
          await next();
        },
      },
    });
  }
}
```

## 资源中间件

### 资源级中间件

```typescript
class ResourceMiddlewarePlugin extends Plugin {
  async load() {
    // 为特定资源添加中间件
    this.app.resourceManager.use('posts', async (ctx, next) => {
      console.log(`Accessing posts resource: ${ctx.action.actionName}`);
      await next();
      console.log(`Finished accessing posts resource`);
    });
    
    // 为所有资源添加中间件
    this.app.middleware.register(async (ctx, next) => {
      if (ctx.resourceName) {
        console.log(`Accessing resource: ${ctx.resourceName}`);
      }
      await next();
    });
  }
}
```

### 条件中间件

```typescript
class ConditionalMiddlewarePlugin extends Plugin {
  async load() {
    this.app.resourceManager.use('posts', async (ctx, next) => {
      // 只对特定操作应用中间件
      if (['create', 'update'].includes(ctx.action.actionName)) {
        // 验证用户权限
        await this.validateUserPermissions(ctx);
      }
      
      await next();
      
      // 只对特定操作应用后处理
      if (ctx.action.actionName === 'create') {
        // 发送通知
        await this.sendCreationNotification(ctx.body);
      }
    });
  }
  
  private async validateUserPermissions(ctx) {
    // 权限验证逻辑
  }
  
  private async sendCreationNotification(post) {
    // 发送通知逻辑
  }
}
```

## ACL 权限控制

### 基础权限设置

```typescript
class ACLPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          // 业务逻辑
          await next();
        },
        async update(ctx, next) {
          // 业务逻辑
          await next();
        },
        async destroy(ctx, next) {
          // 业务逻辑
          await next();
        },
      },
    });
    
    // 公开读取权限
    this.app.acl.allow('posts', 'list');
    this.app.acl.allow('posts', 'get');
    
    // 登录用户可以创建
    this.app.acl.allow('posts', 'create', 'loggedIn');
    
    // 仅作者可以更新自己的文章
    this.app.acl.allow('posts', 'update', (ctx) => {
      return this.checkPostAuthor(ctx);
    });
    
    // 仅管理员可以删除
    this.app.acl.allow('posts', 'destroy', 'admin');
  }
  
  private checkPostAuthor(ctx) {
    const postId = ctx.action.params.filterByTk;
    const userId = ctx.state.currentUser.id;
    // 实现检查逻辑
    return true;
  }
}
```

### 自定义策略

```typescript
class CustomPolicyPlugin extends Plugin {
  async load() {
    // 定义自定义策略
    this.app.acl.define('postAuthor', (ctx) => {
      const postId = ctx.action.params.filterByTk;
      const userId = ctx.state.currentUser.id;
      // 检查文章作者是否为当前用户
      return this.checkPostAuthor(postId, userId);
    });
    
    this.app.acl.define('postEditor', (ctx) => {
      // 检查用户是否为编辑
      return ctx.state.currentUser.role === 'editor';
    });
    
    // 使用自定义策略
    this.app.acl.allow('posts', 'update', 'postAuthor');
    this.app.acl.allow('posts', 'update', 'postEditor');
  }
  
  private async checkPostAuthor(postId, userId) {
    // 实现检查逻辑
    return true;
  }
}
```

## 完整示例

### 文章管理资源

```typescript
class PostsResourcePlugin extends Plugin {
  async load() {
    // 定义文章资源
    this.app.resource({
      name: 'posts',
      actions: {
        // 扩展列表操作
        async list(ctx, next) {
          // 添加默认排序
          ctx.action.mergeParams({
            sort: ['-createdAt'],
          });
          
          // 添加搜索功能
          const { search } = ctx.action.params;
          if (search) {
            ctx.action.mergeParams({
              filter: {
                $or: [
                  { title: { $includes: search } },
                  { content: { $includes: search } },
                ],
              },
            });
          }
          
          await next();
        },
        
        // 扩展创建操作
        async create(ctx, next) {
          // 设置作者
          ctx.action.mergeParams({
            values: {
              ...ctx.action.params.values,
              authorId: ctx.state.currentUser.id,
            },
          });
          
          await next();
          
          // 发送通知
          await this.sendNewPostNotification(ctx.body);
        },
        
        // 自定义发布操作
        async publish(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const post = await ctx.db.getRepository('posts').findById(filterByTk);
          
          if (!post) {
            ctx.throw(404, '文章不存在');
          }
          
          await post.update({ status: 'published' });
          
          ctx.body = post;
          await next();
          
          // 记录日志
          this.app.logger.info(`Post ${post.id} published by user ${ctx.state.currentUser.id}`);
        },
        
        // 自定义批量操作
        async batchPublish(ctx, next) {
          const { filter } = ctx.action.params;
          const posts = await ctx.db.getRepository('posts').find({ filter });
          
          const publishedPosts = await Promise.all(
            posts.map(post => post.update({ status: 'published' }))
          );
          
          ctx.body = { count: publishedPosts.length };
          await next();
        },
      },
    });
    
    // 设置权限
    this.app.acl.allow('posts', 'list');
    this.app.acl.allow('posts', 'get');
    this.app.acl.allow('posts', 'create', 'loggedIn');
    this.app.acl.allow('posts', 'publish', 'loggedIn');
    this.app.acl.allow('posts', 'batchPublish', 'editor');
  }
  
  private async sendNewPostNotification(post) {
    // 发送通知逻辑
  }
}
```

## 最佳实践

1. **命名规范**：使用清晰的操作名称
2. **权限控制**：合理设置访问权限
3. **错误处理**：正确处理和返回错误
4. **日志记录**：记录重要操作
5. **性能优化**：避免不必要的数据库查询
6. **代码复用**：提取公共逻辑到独立方法

## 下一步

- 学习 [数据库使用](./database-usage.md) 示例
- 掌握 [UI 组件](./ui-components.md) 示例
