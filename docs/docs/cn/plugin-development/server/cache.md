# Cache 缓存

NocoBase 的 Cache 模块基于 <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> 封装，为插件开发提供缓存功能。系统内置了两种缓存类型：

- **memory** - 基于 lru-cache 的内存缓存，由 node-cache-manager 默认提供
- **redis** - 基于 node-cache-manager-redis-yet 的 Redis 缓存

更多缓存类型可以通过 API 进行扩展注册。

## 基本用法

### app.cache

`app.cache` 是应用级别的默认缓存实例，可以直接使用。

```ts
// 设置缓存
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL 单位：秒

// 获取缓存
const value = await app.cache.get('key');

// 删除缓存
await this.app.cache.del('key');
```

### ctx.cache

在中间件或资源操作中，可以通过 `ctx.cache` 访问缓存。

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // 缓存未命中，从数据库获取
    data = await this.getDataFromDatabase();
    // 存入缓存，有效期 1 小时
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## 创建自定义缓存

如果需要创建独立的缓存实例（例如不同的命名空间或配置），可以使用 `app.cacheManager.createCache()` 方法。

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // 创建一个带前缀的缓存实例
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // 所有 key 会自动添加此前缀
      store: 'memory', // 使用内存缓存，可选，默认使用 defaultStore
      max: 1000, // 最大缓存项数量
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache 参数说明

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `name` | `string` | 缓存的唯一标识，必填 |
| `prefix` | `string` | 可选，缓存 key 的前缀，用于避免 key 冲突 |
| `store` | `string` | 可选，store 类型标识（如 `'memory'`、`'redis'`），默认使用 `defaultStore` |
| `[key: string]` | `any` | 其他 store 相关的自定义配置项 |

### 获取已创建的缓存

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## 缓存的基本方法

Cache 实例提供了丰富的缓存操作方法，大部分方法继承自 node-cache-manager。

### get / set

```ts
// 设置缓存，带过期时间（单位：秒）
await cache.set('key', 'value', { ttl: 3600 });

// 获取缓存
const value = await cache.get('key');
```

### del / reset

```ts
// 删除单个 key
await cache.del('key');

// 清空所有缓存
await cache.reset();
```

### wrap

`wrap()` 方法是一个非常有用的工具，它会先尝试从缓存获取数据，如果缓存未命中，则执行函数并将结果存入缓存。

```ts
const data = await cache.wrap('user:1', async () => {
  // 这个函数只在缓存未命中时执行
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### 批量操作

```ts
// 批量设置
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// 批量获取
const values = await cache.mget(['key1', 'key2', 'key3']);

// 批量删除
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// 获取所有 key（注意：某些 store 可能不支持）
const allKeys = await cache.keys();

// 获取 key 的剩余过期时间（单位：秒）
const remainingTTL = await cache.ttl('key');
```

## 高级用法

### wrapWithCondition

`wrapWithCondition()` 类似 `wrap()`，但可以通过条件决定是否使用缓存。

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // 外部参数控制是否使用缓存结果
    useCache: true, // 如果设为 false，即使有缓存也会重新执行函数

    // 通过数据结果决定是否缓存
    isCacheable: (value) => {
      // 例如：只有成功的结果才缓存
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### 对象缓存操作

当缓存的内容是对象时，可以使用以下方法直接操作对象的属性，而无需获取整个对象。

```ts
// 设置对象的某个属性
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// 获取对象的某个属性
const name = await cache.getValueInObject('user:1', 'name');

// 删除对象的某个属性
await cache.delValueInObject('user:1', 'age');
```

## 注册自定义 Store

如果需要使用其他缓存类型（如 Memcached、MongoDB 等），可以通过 `app.cacheManager.registerStore()` 注册。

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // 注册 Redis store（如果系统未注册）
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis 连接配置
      url: 'redis://localhost:6379',
    });

    // 使用新注册的 store 创建缓存
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## 注意事项

1. **内存缓存限制**：使用 memory store 时，注意设置合理的 `max` 参数，避免内存溢出。
2. **缓存失效策略**：更新数据时记得清除相关缓存，避免脏数据。
3. **Key 命名规范**：建议使用有意义的命名空间和前缀，如 `module:resource:id`。
4. **TTL 设置**：根据数据更新频率合理设置 TTL，平衡性能和一致性。
5. **Redis 连接**：使用 Redis 时，确保在生产环境中正确配置连接参数和密码。
