---
title: "CacheManager"
description: "Manajer cache NocoBase: CacheManager untuk membuat dan mengelola instance Cache."
keywords: "CacheManager,manajer cache,instance Cache,NocoBase"
---

# CacheManager

## Ikhtisar

CacheManager dibangun berdasarkan <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>, menyediakan fungsi manajemen modul Cache untuk NocoBase. Tipe Cache bawaan:

- memory - lru-cache yang disediakan secara default oleh node-cache-manager
- redis - fungsionalitas didukung oleh node-cache-manager-redis-yet

Tipe lainnya dapat diperluas melalui registrasi API.

### Penjelasan Konsep

- **Store**: Mendefinisikan satu metode cache, mencakup factory method untuk membuat cache, dan konfigurasi terkait lainnya. Setiap metode cache memiliki identifier unik, disediakan saat registrasi.
  Identifier unik untuk dua metode cache bawaan adalah `memory` dan `redis`.

- **Factory Method Store**: Disediakan oleh `node-cache-manager` dan paket ekstensi terkait, digunakan untuk membuat cache. Contoh `'memory'` yang disediakan default oleh `node-cache-manager`, `redisStore` yang disediakan oleh `node-cache-manager-redis-yet`, dll. Yaitu parameter pertama dari method `caching` di `node-cache-manager`.

- **Cache**: Class yang di-wrap NocoBase, menyediakan method terkait penggunaan cache. Saat menggunakan cache yang sebenarnya dioperasikan adalah instance `Cache`, setiap instance `Cache` memiliki identifier unik, dapat digunakan sebagai namespace untuk membedakan modul yang berbeda.

## Method Class

### `constructor()`

#### Signature

- `constructor(options?: CacheManagerOptions)`

#### Tipe

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

#### Detail

##### CacheManagerOptions

| Properti | Tipe | Deskripsi |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string` | Identifier unik tipe Cache default |
| `stores` | `Record<string, StoreOptions>` | Mendaftarkan tipe Cache, key adalah identifier unik tipe Cache, value adalah objek yang berisi method registrasi tipe Cache dan konfigurasi global.<br />Di `node-cache-manager`, method untuk membuat cache adalah `await caching(store, config)`. Sedangkan objek yang harus disediakan di sini adalah [`StoreOptions`](#storeoptions) |

##### StoreOptions

| Properti | Tipe | Deskripsi |
| --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `store` | `memory` \| `FactoryStore<Store, any>` | factory method store, sesuai dengan parameter pertama caching |
| `close` | `(store: Store) => Promise<void>` | Opsional. Jika menggunakan middleware seperti Redis yang perlu membuat koneksi, perlu menyediakan method callback untuk menutup koneksi, parameter input adalah objek yang dikembalikan oleh factory method store |
| `[key: string]` | `any` | Konfigurasi global store lainnya, sesuai dengan parameter kedua caching |

#### `options` Default

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // Konfigurasi global
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

Parameter `options` akan di-merge dengan default options, isi parameter default options yang sudah ada dapat dikosongkan, contoh:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore sudah disediakan di default options, hanya perlu menyediakan konfigurasi redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Mendaftarkan metode cache baru, lihat

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // Identifier unik store
  name: 'redis',
  // Factory method untuk membuat store
  store: redisStore,
  // Menutup koneksi store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // Konfigurasi global
  url: 'xxx',
});
```

#### Signature

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Membuat cache, lihat

```ts
await cacheManager.createCache({
  name: 'default', // identifier unik cache
  store: 'memory', // identifier unik store
  prefix: 'mycache', // Otomatis menambahkan prefix 'mycache:' ke key cache, opsional
  // Konfigurasi store lainnya, konfigurasi kustom, akan di-merge dengan konfigurasi global store
  max: 2000,
});
```

#### Signature

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Detail

##### options

| Properti | Tipe | Deskripsi |
| --------------- | -------- | ----------------------------- |
| `name` | `string` | Identifier unik cache |
| `store` | `string` | Identifier unik store |
| `prefix` | `string` | Opsional, prefix key cache |
| `[key: string]` | `any` | Item konfigurasi kustom terkait store lainnya |

Saat `store` dilewati, akan menggunakan `defaultStore`, dalam hal ini metode cache akan berubah mengikuti perubahan metode cache default sistem.

Saat tidak ada konfigurasi kustom, akan mengembalikan ruang cache default yang dibuat oleh konfigurasi global, dibagikan oleh metode cache saat ini, disarankan menambahkan prefix untuk menghindari konflik key.

```ts
// Menggunakan cache default, menggunakan konfigurasi global
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Lihat [Cache](./cache.md)

### `getCache()`

Mendapatkan cache yang sesuai

```ts
cacheManager.getCache('default');
```

#### Signature

- `getCache(name: string): Cache`

### `flushAll()`

Mereset semua cache

```ts
await cacheManager.flushAll();
```

### `close()`

Menutup koneksi semua middleware cache

```ts
await cacheManager.close();
```
