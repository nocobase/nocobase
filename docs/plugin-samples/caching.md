# 缓存示例

本文档将详细介绍如何在 NocoBase 插件中使用缓存提高性能。

## 缓存基础

### 缓存配置

NocoBase 支持多种缓存后端，包括内存、Redis 等。

```typescript
// 配置缓存
export default {
  cache: {
    store: 'redis', // 或 'memory'
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'password',
      db: 0,
    },
  },
};
```

### 缓存基本操作

```typescript
class CachingPlugin extends Plugin {
  async load() {
    // 获取缓存实例
    const cache = this.app.cache;
    
    // 设置缓存
    await cache.set('key', 'value', 3600); // 1小时过期
    
    // 获取缓存
    const value = await cache.get('key');
    
    // 删除缓存
    await cache.del('key');
    
    // 检查缓存是否存在
    const exists = await cache.has('key');
    
    // 清空所有缓存
    await cache.reset();
  }
}
```

## 服务端缓存

### API响应缓存

```typescript
class APICachePlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async list(ctx, next) {
          const cacheKey = `posts:list:${JSON.stringify(ctx.action.params)}`;
          const cache = this.app.cache;
          
          // 尝试从缓存获取
          let posts = await cache.get(cacheKey);
          
          if (!posts) {
            // 缓存未命中，执行查询
            posts = await ctx.db.getRepository('posts').find(ctx.action.params);
            
            // 存入缓存，5分钟过期
            await cache.set(cacheKey, posts, 300);
          }
          
          ctx.body = posts;
          await next();
        },
      },
    });
  }
}
```

### 数据库查询缓存

```typescript
class DatabaseCachePlugin extends Plugin {
  async load() {
    // 为特定模型添加缓存
    this.app.db.on('users.beforeFind', async (options) => {
      const cacheKey = `users:find:${JSON.stringify(options)}`;
      const cache = this.app.cache;
      
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        // 如果有缓存，直接返回
        options['$cacheHit'] = true;
        options['$cachedResult'] = cachedResult;
      }
    });
    
    this.app.db.on('users.afterFind', async (result, options) => {
      // 如果没有使用缓存，则存储结果
      if (!options['$cacheHit']) {
        const cacheKey = `users:find:${JSON.stringify(options)}`;
        await this.app.cache.set(cacheKey, result, 600); // 10分钟过期
      }
    });
  }
}
```

### 计算结果缓存

```typescript
class ComputationCachePlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'analytics',
      actions: {
        async getStats(ctx, next) {
          const cacheKey = 'analytics:stats';
          const cache = this.app.cache;
          
          // 尝试从缓存获取统计结果
          let stats = await cache.get(cacheKey);
          
          if (!stats) {
            // 缓存未命中，执行复杂计算
            stats = await this.calculateStats();
            
            // 存入缓存，30分钟过期
            await cache.set(cacheKey, stats, 1800);
          }
          
          ctx.body = stats;
          await next();
        },
      },
    });
  }
  
  private async calculateStats() {
    // 复杂的统计计算
    const userCount = await this.app.db.getRepository('users').count();
    const postCount = await this.app.db.getRepository('posts').count();
    
    // 更多复杂计算...
    
    return {
      userCount,
      postCount,
      // 其他统计信息
    };
  }
}
```

## 缓存失效策略

### 基于事件的缓存失效

```typescript
class EventBasedCachePlugin extends Plugin {
  async load() {
    // 当数据发生变化时清除相关缓存
    this.app.db.on('posts.afterCreate', async (post) => {
      // 清除文章列表缓存
      await this.clearPostsCache();
    });
    
    this.app.db.on('posts.afterUpdate', async (post) => {
      // 清除特定文章缓存
      await this.app.cache.del(`posts:${post.id}`);
      // 清除文章列表缓存
      await this.clearPostsCache();
    });
    
    this.app.db.on('posts.afterDestroy', async (post) => {
      // 清除相关缓存
      await this.app.cache.del(`posts:${post.id}`);
      await this.clearPostsCache();
    });
  }
  
  private async clearPostsCache() {
    // 清除所有文章相关缓存
    const cacheKeys = await this.app.cache.keys();
    for (const key of cacheKeys) {
      if (key.startsWith('posts:')) {
        await this.app.cache.del(key);
      }
    }
  }
}
```

### 定时缓存失效

```typescript
class TimedCachePlugin extends Plugin {
  private cacheInvalidationTimer: NodeJS.Timeout;
  
  async load() {
    // 每小时清理一次缓存
    this.cacheInvalidationTimer = setInterval(async () => {
      await this.invalidateStaleCache();
    }, 60 * 60 * 1000); // 1小时
    
    // 应用关闭时清理定时器
    this.app.on('beforeStop', () => {
      if (this.cacheInvalidationTimer) {
        clearInterval(this.cacheInvalidationTimer);
      }
    });
  }
  
  private async invalidateStaleCache() {
    // 清理过期的缓存项
    const cacheKeys = await this.app.cache.keys();
    for (const key of cacheKeys) {
      // 根据键名规则清理特定缓存
      if (key.startsWith('temp:')) {
        await this.app.cache.del(key);
      }
    }
  }
}
```

## 分布式缓存

### Redis缓存使用

```typescript
class RedisCachePlugin extends Plugin {
  async load() {
    // 使用Redis特定功能
    const redis = this.app.cache.store;
    
    if (redis && redis instanceof require('ioredis')) {
      // Redis特定操作
      await redis.hset('user:profiles', 'user1', JSON.stringify({ name: 'John' }));
      const profile = await redis.hget('user:profiles', 'user1');
      
      // 发布订阅
      await redis.publish('cache:invalidation', 'posts');
    }
  }
}
```

### 缓存分片

```typescript
class ShardedCachePlugin extends Plugin {
  async load() {
    // 根据数据类型使用不同的缓存实例
    this.app.cacheManager = {
      userCache: this.app.cache.createStore({ namespace: 'users' }),
      postCache: this.app.cache.createStore({ namespace: 'posts' }),
      sessionCache: this.app.cache.createStore({ namespace: 'sessions' }),
    };
  }
  
  // 使用特定缓存
  private async getUserProfile(userId) {
    const cacheKey = `profile:${userId}`;
    let profile = await this.app.cacheManager.userCache.get(cacheKey);
    
    if (!profile) {
      profile = await this.fetchUserProfile(userId);
      await this.app.cacheManager.userCache.set(cacheKey, profile, 3600);
    }
    
    return profile;
  }
}
```

## 缓存中间件

### 请求级缓存中间件

```typescript
class CacheMiddlewarePlugin extends Plugin {
  async load() {
    // 添加缓存中间件
    this.app.middleware.register(async (ctx, next) => {
      // 为GET请求添加缓存
      if (ctx.method === 'GET' && ctx.path.startsWith('/api/')) {
        const cacheKey = `api:${ctx.path}:${JSON.stringify(ctx.query)}`;
        
        // 尝试从缓存获取响应
        const cachedResponse = await this.app.cache.get(cacheKey);
        if (cachedResponse) {
          ctx.body = cachedResponse.body;
          ctx.status = cachedResponse.status;
          return;
        }
        
        // 执行后续中间件
        await next();
        
        // 缓存响应
        if (ctx.status === 200) {
          await this.app.cache.set(cacheKey, {
            body: ctx.body,
            status: ctx.status,
          }, 300); // 5分钟过期
        }
      } else {
        await next();
      }
    });
  }
}
```

### 条件缓存中间件

```typescript
class ConditionalCachePlugin extends Plugin {
  async load() {
    this.app.middleware.register(async (ctx, next) => {
      // 只对特定资源启用缓存
      if (ctx.path.startsWith('/api/posts')) {
        const cacheKey = `posts:${ctx.path}:${JSON.stringify(ctx.query)}`;
        const cache = this.app.cache;
        
        // 检查If-None-Match头部
        const etag = ctx.get('If-None-Match');
        const cachedEtag = await cache.get(`${cacheKey}:etag`);
        
        if (etag && etag === cachedEtag) {
          ctx.status = 304; // Not Modified
          return;
        }
        
        // 尝试从缓存获取
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
          ctx.body = cachedData;
          ctx.set('ETag', cachedEtag);
          return;
        }
        
        await next();
        
        // 缓存响应
        if (ctx.status === 200) {
          const newEtag = this.generateEtag(ctx.body);
          await cache.set(cacheKey, ctx.body, 600);
          await cache.set(`${cacheKey}:etag`, newEtag, 600);
          ctx.set('ETag', newEtag);
        }
      } else {
        await next();
      }
    });
  }
  
  private generateEtag(data) {
    // 生成ETag
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
```

## 缓存策略模式

### 多级缓存

```typescript
class MultiLevelCachePlugin extends Plugin {
  async load() {
    this.app.multiLevelCache = {
      // L1: 内存缓存（快速）
      l1: new Map(),
      // L2: Redis缓存（持久）
      l2: this.app.cache,
      
      async get(key) {
        // 先查L1缓存
        if (this.l1.has(key)) {
          return this.l1.get(key);
        }
        
        // 再查L2缓存
        const value = await this.l2.get(key);
        if (value !== undefined) {
          // 放入L1缓存
          this.l1.set(key, value);
          return value;
        }
        
        return undefined;
      },
      
      async set(key, value, ttl) {
        // 同时设置到两级缓存
        this.l1.set(key, value);
        await this.l2.set(key, value, ttl);
        
        // L1缓存设置较短的过期时间
        setTimeout(() => {
          this.l1.delete(key);
        }, Math.min(ttl * 1000, 30000)); // 最多30秒
      },
    };
  }
}
```

### 缓存预热

```typescript
class CacheWarmupPlugin extends Plugin {
  async load() {
    // 应用启动时预热缓存
    this.app.on('afterLoad', async () => {
      await this.warmupCache();
    });
  }
  
  private async warmupCache() {
    try {
      // 预热热门数据
      const hotPosts = await this.app.db.getRepository('posts').find({
        limit: 100,
        order: [['viewCount', 'DESC']],
      });
      
      for (const post of hotPosts) {
        const cacheKey = `posts:${post.id}`;
        await this.app.cache.set(cacheKey, post, 3600);
      }
      
      // 预热统计信息
      const stats = await this.calculateStats();
      await this.app.cache.set('site:stats', stats, 1800);
      
      this.app.logger.info('缓存预热完成');
    } catch (error) {
      this.app.logger.error('缓存预热失败:', error);
    }
  }
  
  private async calculateStats() {
    // 计算站点统计信息
    return {
      userCount: await this.app.db.getRepository('users').count(),
      postCount: await this.app.db.getRepository('posts').count(),
    };
  }
}
```

## 缓存监控

### 缓存性能监控

```typescript
class CacheMonitoringPlugin extends Plugin {
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };
  
  async load() {
    // 包装缓存方法以收集统计信息
    const originalGet = this.app.cache.get;
    const originalSet = this.app.cache.set;
    const originalDel = this.app.cache.del;
    
    this.app.cache.get = async (key) => {
      const result = await originalGet.call(this.app.cache, key);
      if (result !== undefined) {
        this.cacheStats.hits++;
      } else {
        this.cacheStats.misses++;
      }
      return result;
    };
    
    this.app.cache.set = async (key, value, ttl) => {
      this.cacheStats.sets++;
      return await originalSet.call(this.app.cache, key, value, ttl);
    };
    
    this.app.cache.del = async (key) => {
      this.cacheStats.deletes++;
      return await originalDel.call(this.app.cache, key);
    };
    
    // 定期报告缓存统计
    setInterval(() => {
      this.reportCacheStats();
    }, 60000); // 每分钟报告一次
  }
  
  private reportCacheStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    this.app.logger.info('缓存统计:', {
      ...this.cacheStats,
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
    });
  }
}
```

## 缓存最佳实践

### 1. 合理设置过期时间

```typescript
class CacheTTLPlugin extends Plugin {
  private readonly TTL_CONFIG = {
    userProfiles: 3600,     // 1小时
    postLists: 300,         // 5分钟
    siteStats: 1800,        // 30分钟
    searchResults: 600,     // 10分钟
  };
  
  async load() {
    // 根据数据类型设置不同的过期时间
  }
}
```

### 2. 缓存键命名规范

```typescript
class CacheKeyPlugin extends Plugin {
  private generateCacheKey(resource, action, params) {
    // 使用一致的命名规范
    return `${resource}:${action}:${this.hashParams(params)}`;
  }
  
  private hashParams(params) {
    // 对参数进行哈希以生成固定长度的键
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
  }
}
```

### 3. 缓存大小控制

```typescript
class CacheSizePlugin extends Plugin {
  async load() {
    // 限制缓存大小
    const maxSize = 1000; // 最多1000个缓存项
    const cache = this.app.cache;
    
    // 定期清理过期的缓存项
    setInterval(async () => {
      const keys = await cache.keys();
      if (keys.length > maxSize) {
        // 删除较旧的缓存项
        const keysToDelete = keys.slice(0, keys.length - maxSize);
        for (const key of keysToDelete) {
          await cache.del(key);
        }
      }
    }, 300000); // 每5分钟检查一次
  }
}
```

## 下一步

- 学习 [服务器中间件](./middleware.md) 示例
- 掌握 [UI 组件](./ui-components.md) 示例
