---
title: "Cache"
description: "API cache của NocoBase: các phương thức cơ bản get/set/del của instance Cache."
keywords: "Cache API,cache,get,set,del,instance cache,NocoBase"
---

# Cache

## Phương thức cơ bản

Có thể tham khảo tài liệu <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## Phương thức khác

### `wrapWithCondition()`

Chức năng tương tự wrap() nhưng có thể quyết định có dùng cache hay không qua điều kiện.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Tham số bên ngoài kiểm soát có dùng kết quả cache không
    useCache?: boolean;
    // Quyết định có cache hay không dựa trên kết quả dữ liệu
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Khi nội dung cache là đối tượng, thay đổi value của một key.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Khi nội dung cache là đối tượng, lấy value của một key.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Khi nội dung cache là đối tượng, xóa một key.

```ts
async delValueInObject(key: string, objectKey: string)
```
