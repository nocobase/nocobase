# CacheManager

## Overview

CacheManager is based on <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> and provides cache module management for NocoBase. The built-in cache types are

- memory - lru-cache provided by default by node-cache-manager
- redis - supported by node-cache-manager-redis-yet

More types can be registered and extended via the API.

### Concepts

- **Store**: Defines a caching method, including a factory method for creating caches and other related configurations. Each caching method has a unique identifier provided during registration.
  The unique identifiers for the two built-in caching methods are `memory` and `redis`.

- **Store Factory Method**: A method provided by `node-cache-manager` and related extension packages for creating caches. For example, `'memory'` provided by default by `node-cache-manager`, and `redisStore` provided by `node-cache-manager-redis-yet`. This corresponds to the first parameter of the `caching` method in `node-cache-manager`.

- **Cache**: A class encapsulated by NocoBase that provides methods for using the cache. When actually using the cache, you operate on an instance of `Cache`. Each `Cache` instance has a unique identifier, which can be used as a namespace to distinguish different modules.

## Class Methods

### `constructor()`

#### Signature

- `constructor(options?: CacheManagerOptions)`

#### Types

```ts
export type CacheManagerOptions = Partial<{
  defaultStore: string;
  stores: {
    [storeType: string]: StoreOptions;
  };
}>;

type StoreOptions = {
  store?: 'memory' | FactoryStore<Store, any>;
  close?: (store: Store) => Promise<void>;
  // global config
  [key: string]: any;
};
```

#### Details

##### CacheManagerOptions

| Property       | Type                           | Description                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | The unique identifier for the default cache type.                                                                                                                                                                                   |
| `stores`       | `Record<string, StoreOptions>` | Registers cache types. The key is the unique identifier for the cache type, and the value is an object containing the registration method and global configuration for the cache type.<br />In `node-cache-manager`, the method to create a cache is `await caching(store, config)`. The object to be provided here is [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Property        | Type                                   | Description                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | The store factory method, corresponding to the first parameter of `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | Optional. For middleware like Redis that requires a connection, a callback method to close the connection must be provided. The input parameter is the object returned by the store factory method. |
| `[key: string]` | `any`                                  | Other global store configurations, corresponding to the second parameter of `caching`.                                                                                                               |

#### Default `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // global config
      max: 2000,
    },
    redis: {
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
    },
  },
};
```

The `options` parameter will be merged with the default options. Properties already present in the default options can be omitted. For example:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore is already provided in the default options, so you only need to provide the redisStore configuration.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registers a new caching method. For example:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // unique identifier for the store
  name: 'redis',
  // factory method to create the store
  store: redisStore,
  // close the store connection
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // global config
  url: 'xxx',
});
```

#### Signature

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Creates a cache. For example:

```ts
await cacheManager.createCache({
  name: 'default', // unique identifier for the cache
  store: 'memory', // unique identifier for the store
  prefix: 'mycache', // automatically adds 'mycache:' prefix to cache keys, optional
  // other store configurations, custom configs will be merged with the global store config
  max: 2000,
});
```

#### Signature

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Details

##### options

| Property        | Type     | Description                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | Unique identifier for the cache.                      |
| `store`         | `string` | Unique identifier for the store.                      |
| `prefix`        | `string` | Optional, cache key prefix.                           |
| `[key: string]` | `any`    | Other custom configuration items related to the store. |

If `store` is omitted, `defaultStore` will be used. In this case, the caching method will change according to the system's default caching method.

When there are no custom configurations, it returns the default cache space created by the global configuration and shared by the current caching method. It is recommended to add a `prefix` to avoid key conflicts.

```ts
// Use the default cache with global configuration
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

See [Cache](./cache.md)

### `getCache()`

Gets the corresponding cache.

```ts
cacheManager.getCache('default');
```

#### Signature

- `getCache(name: string): Cache`

### `flushAll()`

Resets all caches.

```ts
await cacheManager.flushAll();
```

### `close()`

Closes all cache middleware connections.

```ts
await cacheManager.close();
```