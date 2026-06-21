---
title: "Cache - Bộ nhớ đệm"
description: "Bộ nhớ đệm phía server của NocoBase: app.cacheManager, get/set/del, instance cache, truy cập cache trong Plugin."
keywords: "Cache,Bộ nhớ đệm,cacheManager,get,set,del,Cache server,NocoBase"
---

# Cache - Bộ nhớ đệm

Module Cache của NocoBase được đóng gói dựa trên <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>, cung cấp chức năng cache cho phát triển Plugin. Tích hợp sẵn hai loại cache:

- **memory** — Cache trong bộ nhớ dựa trên lru-cache, được node-cache-manager cung cấp mặc định
- **redis** — Cache Redis dựa trên node-cache-manager-redis-yet

Có thể đăng ký mở rộng thêm các loại cache khác thông qua API.

## Cách dùng cơ bản

### app.cache

`app.cache` là instance cache mặc định cấp ứng dụng, có thể dùng trực tiếp.

```ts
// Đặt cache
await app.cache.set('key', 'value', { ttl: 3600 }); // Đơn vị TTL: giây

// Lấy cache
const value = await app.cache.get('key');

// Xóa cache
await this.app.cache.del('key');
```

### ctx.cache

Trong middleware hoặc thao tác resource, có thể truy cập cache thông qua `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss, lấy từ database
    data = await this.getDataFromDatabase();
    // Lưu vào cache, thời hạn 1 giờ
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Tạo cache tùy chỉnh

Nếu cần tạo instance cache độc lập (ví dụ namespace hoặc cấu hình khác nhau), có thể dùng phương thức `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Tạo một instance cache có tiền tố
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Tất cả key sẽ tự động thêm tiền tố này
      store: 'memory', // Dùng cache memory, tùy chọn, mặc định dùng defaultStore
      max: 1000, // Số lượng mục cache tối đa
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Mô tả tham số createCache

| Tham số | Kiểu | Mô tả |
| ---- | ---- | ---- |
| `name` | `string` | Định danh duy nhất của cache, bắt buộc |
| `prefix` | `string` | Tùy chọn, tiền tố của key cache, dùng để tránh xung đột key |
| `store` | `string` | Tùy chọn, định danh loại store (như `'memory'`, `'redis'`), mặc định dùng `defaultStore` |
| `[key: string]` | `any` | Các mục cấu hình tùy chỉnh khác liên quan đến store |

### Lấy cache đã tạo

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Các phương thức cơ bản của cache

Instance Cache cung cấp các phương thức thao tác cache phổ biến, phần lớn kế thừa từ node-cache-manager.

### get / set

```ts
// Đặt cache, có thời hạn (đơn vị: giây)
await cache.set('key', 'value', { ttl: 3600 });

// Lấy cache
const value = await cache.get('key');
```

### del / reset

```ts
// Xóa một key
await cache.del('key');

// Xóa toàn bộ cache
await cache.reset();
```

### wrap

`wrap()` sẽ thử lấy dữ liệu từ cache trước, nếu cache miss thì thực thi hàm callback và lưu kết quả vào cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // Hàm này chỉ được thực thi khi cache miss
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Thao tác hàng loạt

```ts
// Đặt hàng loạt
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Lấy hàng loạt
const values = await cache.mget(['key1', 'key2', 'key3']);

// Xóa hàng loạt
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Lấy tất cả key (lưu ý: một số store có thể không hỗ trợ)
const allKeys = await cache.keys();

// Lấy thời gian còn lại của key (đơn vị: giây)
const remainingTTL = await cache.ttl('key');
```

## Cách dùng nâng cao

### wrapWithCondition

`wrapWithCondition()` tương tự `wrap()`, tuy nhiên có thể quyết định có dùng cache hay không qua điều kiện.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Tham số bên ngoài kiểm soát có dùng kết quả cache hay không
    useCache: true, // Khi đặt là false, dù có cache cũng sẽ thực thi lại hàm

    // Quyết định có cache hay không qua kết quả dữ liệu
    isCacheable: (value) => {
      // Ví dụ: chỉ cache kết quả thành công
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Thao tác cache đối tượng

Khi nội dung cache là đối tượng, có thể dùng các phương thức sau để thao tác trực tiếp lên thuộc tính của đối tượng, không cần lấy toàn bộ đối tượng.

```ts
// Đặt một thuộc tính của đối tượng
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Lấy một thuộc tính của đối tượng
const name = await cache.getValueInObject('user:1', 'name');

// Xóa một thuộc tính của đối tượng
await cache.delValueInObject('user:1', 'age');
```

## Đăng ký Store tùy chỉnh

Nếu cần dùng các loại cache khác (như Memcached, MongoDB, v.v.), có thể đăng ký thông qua `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Đăng ký Redis store (nếu chưa được đăng ký)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Cấu hình kết nối Redis
      url: 'redis://localhost:6379',
    });

    // Tạo cache bằng store mới đăng ký
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Lưu ý

1. **Giới hạn cache memory**: Khi dùng memory store, lưu ý đặt tham số `max` hợp lý, tránh tràn bộ nhớ.
2. **Chiến lược vô hiệu hóa cache**: Khi cập nhật dữ liệu nhớ xóa cache liên quan, tránh dữ liệu bẩn.
3. **Quy ước đặt tên Key**: Khuyến nghị dùng namespace và tiền tố có ý nghĩa, như `module:resource:id`.
4. **Đặt TTL**: Đặt TTL hợp lý theo tần suất cập nhật dữ liệu, cân bằng giữa hiệu năng và tính nhất quán.
5. **Kết nối Redis**: Khi dùng Redis, đảm bảo cấu hình tham số kết nối và mật khẩu chính xác trong môi trường sản xuất.

## Liên kết liên quan

- [Context Request](./context.md) — Truy cập cache thông qua `ctx.cache` trong middleware và Action
- [Plugin](./plugin.md) — Tạo và quản lý instance cache tùy chỉnh trong Plugin
- [Tổng quan phát triển server](./index.md) — Kiến trúc tổng thể server và vị trí của module cache
- [Middleware](./middleware.md) — Kết hợp cache để xử lý logic request trong middleware
- [Database](./database.md) — Cache thường được kết hợp với truy vấn database để nâng cao hiệu năng
