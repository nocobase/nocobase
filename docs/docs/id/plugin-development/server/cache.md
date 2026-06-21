---
title: "Cache"
description: "Cache server NocoBase: app.cacheManager, get/set/del, instance cache, akses cache di plugin."
keywords: "Cache,cache,cacheManager,get,set,del,cache server,NocoBase"
---

# Cache

Modul Cache NocoBase berbasis pada <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>, menyediakan fungsionalitas cache untuk pengembangan plugin. Tersedia dua jenis cache bawaan:

- **memory** — Cache memori berbasis lru-cache, disediakan secara default oleh node-cache-manager
- **redis** — Cache Redis berbasis node-cache-manager-redis-yet

Lebih banyak jenis cache dapat didaftarkan melalui ekstensi API.

## Penggunaan Dasar

### app.cache

`app.cache` adalah instance cache default level aplikasi, dapat langsung digunakan.

```ts
// Set cache
await app.cache.set('key', 'value', { ttl: 3600 }); // Satuan TTL: detik

// Get cache
const value = await app.cache.get('key');

// Delete cache
await this.app.cache.del('key');
```

### ctx.cache

Pada middleware atau operasi resource, dapat mengakses cache melalui `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss, ambil dari database
    data = await this.getDataFromDatabase();
    // Simpan ke cache, masa berlaku 1 jam
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Membuat Cache Kustom

Jika perlu membuat instance cache independen (misalnya namespace atau konfigurasi yang berbeda), dapat menggunakan method `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Membuat instance cache dengan prefix
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Semua key akan otomatis ditambahkan prefix ini
      store: 'memory', // Menggunakan cache memori, opsional, default menggunakan defaultStore
      max: 1000, // Jumlah maksimum item cache
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Penjelasan Parameter createCache

| Parameter | Tipe | Penjelasan |
| ---- | ---- | ---- |
| `name` | `string` | Identifier unik cache, wajib |
| `prefix` | `string` | Opsional, prefix key cache, untuk menghindari konflik key |
| `store` | `string` | Opsional, identifier tipe store (seperti `'memory'`, `'redis'`), default menggunakan `defaultStore` |
| `[key: string]` | `any` | Item konfigurasi kustom lainnya yang terkait store |

### Mendapatkan Cache yang Sudah Dibuat

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Method Dasar Cache

Instance Cache menyediakan method operasi cache umum, sebagian besar diwarisi dari node-cache-manager.

### get / set

```ts
// Set cache, dengan waktu kadaluarsa (satuan: detik)
await cache.set('key', 'value', { ttl: 3600 });

// Get cache
const value = await cache.get('key');
```

### del / reset

```ts
// Delete satu key
await cache.del('key');

// Bersihkan semua cache
await cache.reset();
```

### wrap

`wrap()` akan terlebih dahulu mencoba mengambil data dari cache, jika cache miss, akan mengeksekusi callback function dan menyimpan hasilnya ke cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // Function ini hanya dieksekusi saat cache miss
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Operasi Batch

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
// Mendapatkan semua key (perhatian: sebagian store mungkin tidak mendukung)
const allKeys = await cache.keys();

// Mendapatkan sisa waktu kadaluarsa key (satuan: detik)
const remainingTTL = await cache.ttl('key');
```

## Penggunaan Lanjutan

### wrapWithCondition

`wrapWithCondition()` mirip dengan `wrap()`, tetapi dapat menentukan apakah menggunakan cache melalui kondisi.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Parameter eksternal mengontrol apakah menggunakan hasil cache
    useCache: true, // Saat diset false, function akan dieksekusi ulang meskipun ada cache

    // Tentukan apakah cache berdasarkan hasil data
    isCacheable: (value) => {
      // Misalnya: hanya hasil yang berhasil yang di-cache
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Operasi Cache Objek

Ketika konten yang di-cache adalah objek, dapat menggunakan method berikut untuk langsung mengoperasikan property objek, tanpa perlu mengambil seluruh objek.

```ts
// Set property objek
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Get property objek
const name = await cache.getValueInObject('user:1', 'name');

// Delete property objek
await cache.delValueInObject('user:1', 'age');
```

## Mendaftarkan Store Kustom

Jika perlu menggunakan jenis cache lain (seperti Memcached, MongoDB, dll.), dapat mendaftarkan melalui `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Mendaftarkan Redis store (jika belum terdaftar)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Konfigurasi koneksi Redis
      url: 'redis://localhost:6379',
    });

    // Membuat cache menggunakan store yang baru terdaftar
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Perhatian

1. **Batasan Cache Memori**: Saat menggunakan memory store, perhatikan untuk mengatur parameter `max` yang wajar, untuk menghindari memory overflow.
2. **Strategi Pengosongan Cache**: Saat memperbarui data ingatlah untuk membersihkan cache terkait, untuk menghindari data kotor.
3. **Konvensi Penamaan Key**: Disarankan menggunakan namespace dan prefix yang bermakna, seperti `module:resource:id`.
4. **Pengaturan TTL**: Atur TTL secara wajar berdasarkan frekuensi update data, untuk menyeimbangkan performa dan konsistensi.
5. **Koneksi Redis**: Saat menggunakan Redis, pastikan parameter koneksi dan password dikonfigurasi dengan benar di environment production.

## Tautan Terkait

- [Context](./context.md) — Mengakses cache melalui `ctx.cache` di middleware dan Action
- [Plugin](./plugin.md) — Membuat dan mengelola instance cache kustom dalam plugin
- [Ikhtisar Pengembangan Server](./index.md) — Arsitektur server menyeluruh dan posisi modul cache
- [Middleware](./middleware.md) — Menggabungkan cache dengan middleware untuk menangani logika request
- [Database Operasi Database](./database.md) — Cache sering digunakan bersama dengan query database untuk meningkatkan performa
