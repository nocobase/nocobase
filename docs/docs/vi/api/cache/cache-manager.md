---
title: "CacheManager"
description: "Trình quản lý cache của NocoBase: CacheManager tạo và quản lý các instance Cache."
keywords: "CacheManager,trình quản lý cache,instance Cache,NocoBase"
---

# CacheManager

## Tổng quan

CacheManager dựa trên <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>, cung cấp chức năng quản lý module Cache cho NocoBase. Các kiểu Cache có sẵn là:

- memory - lru-cache do node-cache-manager cung cấp mặc định
- redis - được hỗ trợ bởi node-cache-manager-redis-yet

Có thể đăng ký mở rộng thêm các kiểu khác qua API.

### Giải thích khái niệm

- **Store**: Định nghĩa một phương thức cache, gồm phương thức factory tạo cache và các cấu hình liên quan. Mỗi phương thức cache có một định danh duy nhất, được cung cấp khi đăng ký.
  Định danh duy nhất tương ứng với hai phương thức cache có sẵn là `memory` và `redis`.

- **Phương thức factory Store**: Do `node-cache-manager` và các package mở rộng cung cấp, dùng để tạo cache. Ví dụ `'memory'` mà `node-cache-manager` cung cấp mặc định, `redisStore` mà `node-cache-manager-redis-yet` cung cấp, v.v. Tức là tham số đầu tiên của phương thức `caching` của `node-cache-manager`.

- **Cache**: Lớp được NocoBase đóng gói, cung cấp các phương thức liên quan đến sử dụng cache. Khi sử dụng cache thực tế thì thao tác với instance của `Cache`. Mỗi instance `Cache` có một định danh duy nhất, có thể đóng vai trò namespace để phân biệt các module khác nhau.

## Phương thức của lớp

### `constructor()`

#### Chữ ký

- `constructor(options?: CacheManagerOptions)`

#### Kiểu

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

#### Thông tin chi tiết

##### CacheManagerOptions

| Thuộc tính     | Kiểu                           | Mô tả                                                                                                                                                                                                                                  |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Định danh duy nhất của kiểu Cache mặc định                                                                                                                                                                                            |
| `stores`       | `Record<string, StoreOptions>` | Đăng ký kiểu Cache, key là định danh duy nhất của kiểu Cache, value là đối tượng chứa phương thức đăng ký kiểu Cache và cấu hình toàn cục.<br />Trong `node-cache-manager`, phương thức tạo cache là `await caching(store, config)`. Đối tượng cần cung cấp ở đây là [`StoreOptions`](#storeoptions) |

##### StoreOptions

| Thuộc tính      | Kiểu                                   | Mô tả                                                                                                |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Phương thức factory store, tương ứng với tham số đầu tiên của caching                                 |
| `close`         | `(store: Store) => Promise<void>`      | Tùy chọn. Nếu là middleware như Redis cần thiết lập kết nối, cần cung cấp callback đóng kết nối, tham số là đối tượng do phương thức factory store trả về |
| `[key: string]` | `any`                                  | Cấu hình toàn cục khác của store, tương ứng với tham số thứ hai của caching                          |

#### `options` mặc định

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // Cấu hình toàn cục
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

Tham số `options` sẽ được merge với options mặc định, các nội dung đã có trong options mặc định có thể bỏ qua, ví dụ:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore đã được cung cấp trong options mặc định, chỉ cần cung cấp cấu hình redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Đăng ký phương thức cache mới, tham khảo

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // Định danh duy nhất của store
  name: 'redis',
  // Phương thức factory tạo store
  store: redisStore,
  // Đóng kết nối store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // Cấu hình toàn cục
  url: 'xxx',
});
```

#### Chữ ký

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Tạo cache, tham khảo

```ts
await cacheManager.createCache({
  name: 'default', // Định danh duy nhất của cache
  store: 'memory', // Định danh duy nhất của store
  prefix: 'mycache', // Tự động thêm tiền tố 'mycache:' vào key cache, tùy chọn
  // Cấu hình store khác, cấu hình tùy chỉnh, sẽ được merge với cấu hình toàn cục của store
  max: 2000,
});
```

#### Chữ ký

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Thông tin chi tiết

##### options

| Thuộc tính      | Kiểu     | Mô tả                            |
| --------------- | -------- | -------------------------------- |
| `name`          | `string` | Định danh duy nhất của cache     |
| `store`         | `string` | Định danh duy nhất của store     |
| `prefix`        | `string` | Tùy chọn, tiền tố của key cache  |
| `[key: string]` | `any`    | Các cấu hình tùy chỉnh khác liên quan đến store |

Khi `store` được bỏ qua, sẽ dùng `defaultStore`, lúc này phương thức cache sẽ thay đổi theo phương thức cache mặc định của hệ thống.

Khi không có cấu hình tùy chỉnh, sẽ trả về không gian cache mặc định được tạo bởi cấu hình toàn cục, được chia sẻ cho phương thức cache hiện tại. Khuyến nghị thêm prefix để tránh xung đột key.

```ts
// Dùng cache mặc định, dùng cấu hình toàn cục
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Tham khảo [Cache](./cache.md)

### `getCache()`

Lấy cache tương ứng.

```ts
cacheManager.getCache('default');
```

#### Chữ ký

- `getCache(name: string): Cache`

### `flushAll()`

Reset toàn bộ cache.

```ts
await cacheManager.flushAll();
```

### `close()`

Đóng tất cả kết nối middleware cache.

```ts
await cacheManager.close();
```
