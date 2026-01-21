:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cache

Mô-đun Cache của NocoBase được xây dựng dựa trên <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>, cung cấp chức năng bộ nhớ đệm cho việc phát triển plugin. Hệ thống tích hợp sẵn hai loại bộ nhớ đệm:

- **memory** - Bộ nhớ đệm trong bộ nhớ (memory cache) dựa trên lru-cache, được node-cache-manager cung cấp mặc định.
- **redis** - Bộ nhớ đệm Redis dựa trên node-cache-manager-redis-yet.

Các loại bộ nhớ đệm khác có thể được mở rộng và đăng ký thông qua API.

## Cách sử dụng cơ bản

### app.cache

`app.cache` là thể hiện bộ nhớ đệm mặc định cấp ứng dụng và bạn có thể sử dụng trực tiếp.

```ts
// Đặt bộ nhớ đệm
await app.cache.set('key', 'value', { ttl: 3600 }); // Đơn vị TTL: giây

// Lấy bộ nhớ đệm
const value = await app.cache.get('key');

// Xóa bộ nhớ đệm
await this.app.cache.del('key');
```

### ctx.cache

Trong middleware hoặc các thao tác tài nguyên, bạn có thể truy cập bộ nhớ đệm thông qua `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Bộ nhớ đệm không có, lấy từ cơ sở dữ liệu
    data = await this.getDataFromDatabase();
    // Lưu vào bộ nhớ đệm, có hiệu lực trong 1 giờ
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Tạo bộ nhớ đệm tùy chỉnh

Nếu bạn cần tạo một thể hiện bộ nhớ đệm độc lập (ví dụ: các không gian tên hoặc cấu hình khác nhau), bạn có thể sử dụng phương thức `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Tạo một thể hiện bộ nhớ đệm có tiền tố
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Tất cả các key sẽ tự động thêm tiền tố này
      store: 'memory', // Sử dụng bộ nhớ đệm trong bộ nhớ, tùy chọn, mặc định sử dụng defaultStore
      max: 1000, // Số lượng mục bộ nhớ đệm tối đa
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Mô tả tham số `createCache`

| Tham số | Kiểu | Mô tả |
| ---- | ---- | ---- |
| `name` | `string` | Định danh duy nhất cho bộ nhớ đệm, bắt buộc |
| `prefix` | `string` | Tùy chọn, tiền tố cho các key bộ nhớ đệm, dùng để tránh xung đột key |
| `store` | `string` | Tùy chọn, định danh kiểu store (ví dụ: `'memory'`, `'redis'`), mặc định sử dụng `defaultStore` |
| `[key: string]` | `any` | Các mục cấu hình tùy chỉnh khác liên quan đến store |

### Lấy bộ nhớ đệm đã tạo

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Các phương thức bộ nhớ đệm cơ bản

Các thể hiện Cache cung cấp các phương thức thao tác bộ nhớ đệm phong phú, hầu hết được kế thừa từ node-cache-manager.

### get / set

```ts
// Đặt bộ nhớ đệm, với thời gian hết hạn (đơn vị: giây)
await cache.set('key', 'value', { ttl: 3600 });

// Lấy bộ nhớ đệm
const value = await cache.get('key');
```

### del / reset

```ts
// Xóa một key đơn lẻ
await cache.del('key');

// Xóa tất cả bộ nhớ đệm
await cache.reset();
```

### wrap

Phương thức `wrap()` là một công cụ rất hữu ích, nó trước tiên sẽ cố gắng lấy dữ liệu từ bộ nhớ đệm. Nếu bộ nhớ đệm không có (cache miss), nó sẽ thực thi hàm và lưu kết quả vào bộ nhớ đệm.

```ts
const data = await cache.wrap('user:1', async () => {
  // Hàm này chỉ thực thi khi bộ nhớ đệm không có
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Các thao tác hàng loạt

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
// Lấy tất cả các key (lưu ý: một số store có thể không hỗ trợ)
const allKeys = await cache.keys();

// Lấy thời gian hết hạn còn lại của key (đơn vị: giây)
const remainingTTL = await cache.ttl('key');
```

## Cách sử dụng nâng cao

### wrapWithCondition

`wrapWithCondition()` tương tự như `wrap()`, nhưng có thể quyết định có sử dụng bộ nhớ đệm hay không thông qua các điều kiện.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Tham số bên ngoài kiểm soát việc có sử dụng kết quả từ bộ nhớ đệm hay không
    useCache: true, // Nếu đặt là false, hàm sẽ thực thi lại ngay cả khi có bộ nhớ đệm

    // Quyết định có lưu vào bộ nhớ đệm hay không dựa trên kết quả dữ liệu
    isCacheable: (value) => {
      // Ví dụ: chỉ lưu vào bộ nhớ đệm các kết quả thành công
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Các thao tác bộ nhớ đệm đối tượng

Khi nội dung được lưu trong bộ nhớ đệm là một đối tượng, bạn có thể sử dụng các phương thức sau để thao tác trực tiếp các thuộc tính của đối tượng mà không cần lấy toàn bộ đối tượng.

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

Nếu bạn cần sử dụng các loại bộ nhớ đệm khác (như Memcached, MongoDB, v.v.), bạn có thể đăng ký chúng thông qua `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Đăng ký Redis store (nếu hệ thống chưa đăng ký)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Cấu hình kết nối Redis
      url: 'redis://localhost:6379',
    });

    // Tạo bộ nhớ đệm sử dụng store mới đăng ký
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Lưu ý quan trọng

1.  **Giới hạn bộ nhớ đệm trong bộ nhớ**: Khi sử dụng memory store, hãy chú ý đặt tham số `max` hợp lý để tránh tràn bộ nhớ.
2.  **Chiến lược vô hiệu hóa bộ nhớ đệm**: Khi cập nhật dữ liệu, hãy nhớ xóa bộ nhớ đệm liên quan để tránh dữ liệu bẩn.
3.  **Quy ước đặt tên Key**: Nên sử dụng các không gian tên và tiền tố có ý nghĩa, ví dụ: `module:resource:id`.
4.  **Cài đặt TTL**: Đặt TTL hợp lý dựa trên tần suất cập nhật dữ liệu để cân bằng giữa hiệu suất và tính nhất quán.
5.  **Kết nối Redis**: Khi sử dụng Redis, hãy đảm bảo các tham số kết nối và mật khẩu được cấu hình chính xác trong môi trường sản xuất.