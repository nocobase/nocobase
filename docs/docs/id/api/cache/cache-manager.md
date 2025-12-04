:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# CacheManager

## Gambaran Umum

CacheManager didasarkan pada <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> dan menyediakan fungsionalitas manajemen modul Cache untuk NocoBase. Tipe Cache bawaan adalah:

- memory - lru-cache yang disediakan secara default oleh node-cache-manager
- redis - didukung oleh node-cache-manager-redis-yet untuk fungsionalitas terkait

Tipe lainnya dapat didaftarkan dan diperluas melalui API.

### Konsep

- **Store**: Mendefinisikan metode caching, termasuk metode pabrik (factory method) untuk membuat cache dan konfigurasi terkait lainnya. Setiap metode caching memiliki pengenal unik yang disediakan saat pendaftaran.
  Pengenal unik untuk dua metode caching bawaan adalah `memory` dan `redis`.

- **Metode Pabrik Store**: Metode yang disediakan oleh `node-cache-manager` dan paket ekstensi terkait untuk membuat cache. Contohnya, `'memory'` yang disediakan secara default oleh `node-cache-manager`, dan `redisStore` yang disediakan oleh `node-cache-manager-redis-yet`. Ini sesuai dengan parameter pertama dari metode `caching` di `node-cache-manager`.

- **Cache**: Sebuah kelas yang dienkapsulasi oleh NocoBase, menyediakan metode terkait untuk menggunakan cache. Saat benar-benar menggunakan cache, Anda beroperasi pada sebuah instance `Cache`. Setiap instance `Cache` memiliki pengenal unik, yang dapat digunakan sebagai namespace untuk membedakan modul yang berbeda.

## Metode Kelas

### `constructor()`

#### Tanda Tangan (Signature)

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

| Properti       | Tipe                           | Deskripsi                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Pengenal unik untuk tipe Cache default.                                                                                                                                                                                             |
| `stores`       | `Record<string, StoreOptions>` | Mendaftarkan tipe Cache. Kunci adalah pengenal unik untuk tipe Cache, dan nilainya adalah objek yang berisi metode pendaftaran tipe Cache dan konfigurasi global.<br />Di `node-cache-manager`, metode untuk membuat cache adalah `await caching(store, config)`. Objek yang akan disediakan di sini adalah [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Properti        | Tipe                                   | Deskripsi                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Metode pabrik store, sesuai dengan parameter pertama `caching`.                                                                                                                                        |
| `close`         | `(store: Store) => Promise<void>`      | Opsional. Untuk middleware seperti Redis yang memerlukan koneksi, metode callback untuk menutup koneksi harus disediakan. Parameter input adalah objek yang dikembalikan oleh metode pabrik store. |
| `[key: string]` | `any`                                  | Konfigurasi global store lainnya, sesuai dengan parameter kedua `caching`.                                                                                                                           |

#### Opsi Default `options`

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

Parameter `options` akan digabungkan dengan opsi default. Properti yang sudah ada dalam opsi default dapat dihilangkan, contohnya:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore sudah disediakan dalam opsi default, jadi Anda hanya perlu menyediakan konfigurasi redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Mendaftarkan metode caching baru. Contoh:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // pengenal unik untuk store
  name: 'redis',
  // metode pabrik untuk membuat store
  store: redisStore,
  // menutup koneksi store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // konfigurasi global
  url: 'xxx',
});
```

#### Tanda Tangan (Signature)

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Membuat cache. Contoh:

```ts
await cacheManager.createCache({
  name: 'default', // pengenal unik untuk cache
  store: 'memory', // pengenal unik untuk store
  prefix: 'mycache', // secara otomatis menambahkan prefiks 'mycache:' ke kunci cache, opsional
  // konfigurasi store lainnya, konfigurasi kustom akan digabungkan dengan konfigurasi global store
  max: 2000,
});
```

#### Tanda Tangan (Signature)

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Detail

##### options

| Properti        | Tipe     | Deskripsi                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | Pengenal unik untuk cache.                      |
| `store`         | `string` | Pengenal unik untuk store.                      |
| `prefix`        | `string` | Opsional, prefiks kunci cache.                           |
| `[key: string]` | `any`    | Item konfigurasi kustom lainnya yang terkait dengan store. |

Jika `store` dihilangkan, `defaultStore` akan digunakan. Dalam kasus ini, metode caching akan berubah sesuai dengan metode caching default sistem.

Ketika tidak ada konfigurasi kustom, akan dikembalikan ruang cache default yang dibuat oleh konfigurasi global dan dibagikan oleh metode caching saat ini. Disarankan untuk menambahkan `prefix` untuk menghindari konflik kunci.

```ts
// Menggunakan cache default, dengan konfigurasi global
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Lihat [Cache](./cache.md)

### `getCache()`

Mendapatkan cache yang sesuai.

```ts
cacheManager.getCache('default');
```

#### Tanda Tangan (Signature)

- `getCache(name: string): Cache`

### `flushAll()`

Mengatur ulang semua cache.

```ts
await cacheManager.flushAll();
```

### `close()`

Menutup semua koneksi middleware cache.

```ts
await cacheManager.close();
```