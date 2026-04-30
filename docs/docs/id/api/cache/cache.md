---
title: "Cache"
description: "API cache NocoBase: method dasar instance Cache seperti get/set/del."
keywords: "Cache API,cache,get,set,del,instance cache,NocoBase"
---

# Cache

## Method Dasar

Lihat dokumentasi <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Method Lainnya

### `wrapWithCondition()`

Fungsinya mirip dengan wrap(), tetapi dapat menentukan apakah menggunakan cache berdasarkan kondisi.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Parameter eksternal yang mengontrol apakah menggunakan hasil cache
    useCache?: boolean;
    // Menentukan apakah meng-cache berdasarkan hasil data
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Saat konten cache adalah objek, mengubah value dari key tertentu.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Saat konten cache adalah objek, mengambil value dari key tertentu.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Saat konten cache adalah objek, menghapus key tertentu.

```ts
async delValueInObject(key: string, objectKey: string)
```
