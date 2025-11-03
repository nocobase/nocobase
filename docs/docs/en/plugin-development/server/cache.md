# Cache

NocoBase's Cache module is based on <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> and provides caching functionality for plugin development. The system has two built-in cache types:

- **memory** - Memory cache based on lru-cache, provided by node-cache-manager by default
- **redis** - Redis cache based on node-cache-manager-redis-yet

More cache types can be extended and registered through the API.

## Basic Usage

### app.cache

`app.cache` is the application-level default cache instance and can be used directly.

```ts
// Set cache
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL unit: seconds

// Get cache
const value = await app.cache.get('key');

// Delete cache
await this.app.cache.del('key');
```

### ctx.cache

In middleware or resource operations, you can access the cache through `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss, get from database
    data = await this.getDataFromDatabase();
    // Store in cache, valid for 1 hour
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Create Custom Cache

If you need to create an independent cache instance (for example, different namespaces or configurations), you can use the `app.cacheManager.createCache()` method.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Create a cache instance with prefix
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // All keys will automatically add this prefix
      store: 'memory', // Use memory cache, optional, defaults to defaultStore
      max: 1000, // Maximum number of cache items
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache Parameter Description

| Parameter | Type | Description |
| -------- | ---- | ---------- |
| `name` | `string` | Unique identifier for the cache, required |
| `prefix` | `string` | Optional, prefix for cache keys, used to avoid key conflicts |
| `store` | `string` | Optional, store type identifier (such as `'memory'`, `'redis'`), defaults to `defaultStore` |
| `[key: string]` | `any` | Other store-related custom configuration items |

### Get Created Cache

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Basic Cache Methods

Cache instances provide rich cache operation methods, most of which are inherited from node-cache-manager.

### get / set

```ts
// Set cache with expiration time (unit: seconds)
await cache.set('key', 'value', { ttl: 3600 });

// Get cache
const value = await cache.get('key');
```

### del / reset

```ts
// Delete single key
await cache.del('key');

// Clear all cache
await cache.reset();
```

### wrap

The `wrap()` method is a very useful tool that first attempts to get data from cache, and if there's a cache miss, executes the function and stores the result in cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // This function only executes on cache miss
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Batch Operations

```ts
// Batch set
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Batch get
const values = await cache.mget(['key1', 'key2', 'key3']);

// Batch delete
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Get all keys (note: some stores may not support this)
const allKeys = await cache.keys();

// Get remaining expiration time for key (unit: seconds)
const remainingTTL = await cache.ttl('key');
```

## Advanced Usage

### wrapWithCondition

`wrapWithCondition()` is similar to `wrap()`, but can decide whether to use cache through conditions.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // External parameters control whether to use cache result
    useCache: true, // If set to false, function will re-execute even if cache exists

    // Decide whether to cache based on data result
    isCacheable: (value) => {
      // For example: only cache successful results
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Object Cache Operations

When the cached content is an object, you can use the following methods to directly operate object properties without getting the entire object.

```ts
// Set a property of an object
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Get a property of an object
const name = await cache.getValueInObject('user:1', 'name');

// Delete a property of an object
await cache.delValueInObject('user:1', 'age');
```

## Register Custom Store

If you need to use other cache types (such as Memcached, MongoDB, etc.), you can register them through `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Register Redis store (if system hasn't registered it)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis connection configuration
      url: 'redis://localhost:6379',
    });

    // Create cache using newly registered store
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Notes

1. **Memory Cache Limits**: When using memory store, pay attention to setting reasonable `max` parameter to avoid memory overflow.
2. **Cache Invalidation Strategy**: Remember to clear related cache when updating data to avoid dirty data.
3. **Key Naming Conventions**: It's recommended to use meaningful namespaces and prefixes, such as `module:resource:id`.
4. **TTL Settings**: Set TTL reasonably based on data update frequency to balance performance and consistency.
5. **Redis Connection**: When using Redis, ensure connection parameters and passwords are correctly configured in production environment.

