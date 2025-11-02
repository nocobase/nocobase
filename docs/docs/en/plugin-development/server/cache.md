# Cache

NocoBase's Cache module is based on <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>, providing caching functionality for plugin development. The system has two built-in cache types:

- **memory** - An in-memory cache based on lru-cache, provided by default by node-cache-manager.
- **redis** - A Redis cache based on node-cache-manager-redis-yet.

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

In middleware or resource actions, you can access the cache via `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss, fetch from the database
    data = await this.getDataFromDatabase();
    // Store in cache, expires in 1 hour
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Creating a Custom Cache

If you need to create a separate cache instance (e.g., with a different namespace or configuration), you can use the `app.cacheManager.createCache()` method.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Create a cache instance with a prefix
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // All keys will be automatically prefixed with this value
      store: 'memory', // Use memory cache, optional, uses `defaultStore` by default
      max: 1000, // Maximum number of cache items
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### `createCache` Parameter Description

| Parameter | Type | Description |
| ---- | ---- | ---- |
| `name` | `string` | The unique identifier for the cache, required |
| `prefix` | `string` | Optional, a prefix for cache keys to avoid key conflicts |
| `store` | `string` | Optional, the store type identifier (e.g., `'memory'`, `'redis'`), uses `defaultStore` by default |
| `[key: string]` | `any` | Other custom configuration options related to the store |

### Getting an Existing Cache

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Basic Cache Methods

The Cache instance provides a rich set of cache operation methods, most of which are inherited from node-cache-manager.

### get / set

```ts
// Set cache with an expiration time (unit: seconds)
await cache.set('key', 'value', { ttl: 3600 });

// Get cache
const value = await cache.get('key');
```

### del / reset

```ts
// Delete a single key
await cache.del('key');

// Clear all caches
await cache.reset();
```

### wrap

The `wrap()` method is a very useful tool. It first tries to get data from the cache. If there's a cache miss, it executes the function and stores the result in the cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // This function is executed only on a cache miss
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
// Get all keys (Note: Some stores may not support this)
const allKeys = await cache.keys();

// Get the remaining TTL of a key (unit: seconds)
const remainingTTL = await cache.ttl('key');
```

## Advanced Usage

### wrapWithCondition

`wrapWithCondition()` is similar to `wrap()`, but allows you to decide whether to use the cache based on a condition.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // External parameter controls whether to use the cached result
    useCache: true, // If set to false, the function will be re-executed even if a cache exists

    // Decide whether to cache based on the data result
    isCacheable: (value) => {
      // For example: only cache successful results
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Object Cache Operations

When the cached content is an object, you can use the following methods to directly manipulate the object's properties without fetching the entire object.

```ts
// Set a property of an object
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Get a property of an object
const name = await cache.getValueInObject('user:1', 'name');

// Delete a property of an object
await cache.delValueInObject('user:1', 'age');
```

## Registering a Custom Store

If you need to use other cache types (such as Memcached, MongoDB, etc.), you can register them via `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Register Redis store (if not already registered by the system)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis connection configuration
      url: 'redis://localhost:6379',
    });

    // Create a cache using the newly registered store
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Notes

1.  **Memory Cache Limits**: When using the memory store, be sure to set a reasonable `max` parameter to avoid memory overflow.
2.  **Cache Invalidation Strategy**: Remember to clear relevant caches when updating data to avoid stale data.
3.  **Key Naming Conventions**: It is recommended to use meaningful namespaces and prefixes, such as `module:resource:id`.
4.  **TTL Settings**: Set TTL reasonably based on the data update frequency to balance performance and consistency.
5.  **Redis Connection**: When using Redis, ensure that connection parameters and passwords are correctly configured in a production environment.