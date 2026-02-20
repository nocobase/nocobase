:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# CacheManager

## Tổng quan

CacheManager dựa trên <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>, cung cấp chức năng quản lý module Cache cho NocoBase. Các loại Cache tích hợp sẵn bao gồm:

- memory - lru-cache được cung cấp mặc định bởi node-cache-manager
- redis - được hỗ trợ bởi node-cache-manager-redis-yet

Bạn có thể đăng ký và mở rộng thêm các loại khác thông qua API.

### Khái niệm

- **Store**: Định nghĩa một phương thức lưu trữ cache, bao gồm phương thức factory để tạo cache và các cấu hình liên quan khác. Mỗi phương thức lưu trữ cache có một định danh duy nhất, được cung cấp khi đăng ký.
  Các định danh duy nhất cho hai phương thức lưu trữ cache tích hợp sẵn là `memory` và `redis`.

- **Phương thức Factory của Store**: Là phương thức được cung cấp bởi `node-cache-manager` và các gói mở rộng liên quan, dùng để tạo cache. Ví dụ, `'memory'` được cung cấp mặc định bởi `node-cache-manager`, và `redisStore` được cung cấp bởi `node-cache-manager-redis-yet`. Đây chính là tham số đầu tiên của phương thức `caching` trong `node-cache-manager`.

- **Cache**: Một lớp được NocoBase đóng gói, cung cấp các phương thức để sử dụng cache. Khi thực sự sử dụng cache, bạn sẽ thao tác trên một thể hiện (instance) của `Cache`. Mỗi thể hiện `Cache` có một định danh duy nhất, có thể dùng làm không gian tên (namespace) để phân biệt các module khác nhau.

## Phương thức lớp

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

#### Chi tiết

##### CacheManagerOptions

| Thuộc tính     | Kiểu                           | Mô tả                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Định danh duy nhất cho kiểu Cache mặc định.                                                                                                                                                                                   |
| `stores`       | `Record<string, StoreOptions>` | Đăng ký các kiểu Cache. Key là định danh duy nhất cho kiểu Cache, và giá trị là một đối tượng chứa phương thức đăng ký và cấu hình toàn cục cho kiểu Cache.<br />Trong `node-cache-manager`, phương thức để tạo cache là `await caching(store, config)`. Đối tượng cần cung cấp ở đây là [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Thuộc tính      | Kiểu                                   | Mô tả                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Phương thức factory của store, tương ứng với tham số đầu tiên của `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | Tùy chọn. Đối với các middleware như Redis yêu cầu thiết lập kết nối, cần cung cấp một phương thức callback để đóng kết nối. Tham số đầu vào là đối tượng được trả về bởi phương thức factory của store. |
| `[key: string]` | `any`                                  | Các cấu hình toàn cục khác của store, tương ứng với tham số thứ hai của `caching`.                                                                                                               |

#### `options` mặc định

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // cấu hình toàn cục
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

Tham số `options` sẽ được hợp nhất với các `options` mặc định. Các thuộc tính đã có trong `options` mặc định có thể bỏ qua. Ví dụ:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore đã được cung cấp trong options mặc định, vì vậy bạn chỉ cần cung cấp cấu hình cho redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Đăng ký một phương thức lưu trữ cache mới. Ví dụ:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // định danh duy nhất cho store
  name: 'redis',
  // phương thức factory để tạo store
  store: redisStore,
  // đóng kết nối store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // cấu hình toàn cục
  url: 'xxx',
});
```

#### Chữ ký

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Tạo cache. Ví dụ:

```ts
await cacheManager.createCache({
  name: 'default', // định danh duy nhất cho cache
  store: 'memory', // định danh duy nhất cho store
  prefix: 'mycache', // tự động thêm tiền tố 'mycache:' vào khóa cache, tùy chọn
  // các cấu hình store khác, cấu hình tùy chỉnh sẽ được hợp nhất với cấu hình toàn cục của store
  max: 2000,
});
```

#### Chữ ký

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Chi tiết

##### options

| Thuộc tính      | Kiểu     | Mô tả                                           |
| --------------- | -------- | ----------------------------------------------- |
| `name`          | `string` | Định danh duy nhất cho cache.                      |
| `store`         | `string` | Định danh duy nhất cho store.                      |
| `prefix`        | `string` | Tùy chọn, tiền tố cho khóa cache.                           |
| `[key: string]` | `any`    | Các mục cấu hình tùy chỉnh khác liên quan đến store. |

Nếu `store` bị bỏ qua, `defaultStore` sẽ được sử dụng. Khi đó, phương thức lưu trữ cache sẽ thay đổi theo phương thức lưu trữ cache mặc định của hệ thống.

Khi không có cấu hình tùy chỉnh, nó sẽ trả về không gian cache mặc định được tạo bởi cấu hình toàn cục và được chia sẻ bởi phương thức lưu trữ cache hiện tại. Nên thêm `prefix` để tránh xung đột khóa.

```ts
// Sử dụng cache mặc định với cấu hình toàn cục
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Xem thêm [Cache](./cache.md)

### `getCache()`

Lấy cache tương ứng.

```ts
cacheManager.getCache('default');
```

#### Chữ ký

- `getCache(name: string): Cache`

### `flushAll()`

Đặt lại tất cả các cache.

```ts
await cacheManager.flushAll();
```

### `close()`

Đóng tất cả các kết nối middleware cache.

```ts
await cacheManager.close();
```