:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Cache

Modul Cache NocoBase dibangun di atas <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> dan menyediakan fungsionalitas *caching* untuk pengembangan *plugin*. Sistem ini memiliki dua jenis *cache* bawaan:

*   **memory** - *Cache* memori berbasis `lru-cache`, disediakan secara *default* oleh `node-cache-manager`.
*   **redis** - *Cache* Redis berbasis `node-cache-manager-redis-yet`.

Jenis *cache* lainnya dapat diperluas dan didaftarkan melalui API.

## Penggunaan Dasar

### app.cache

`app.cache` adalah instans *cache* *default* tingkat aplikasi yang dapat langsung Anda gunakan.

```ts
// Mengatur cache
await app.cache.set('key', 'value', { ttl: 3600 }); // Satuan TTL: detik

// Mengambil cache
const value = await app.cache.get('key');

// Menghapus cache
await this.app.cache.del('key');
```

### ctx.cache

Dalam *middleware* atau operasi sumber daya, Anda dapat mengakses *cache* melalui `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss, ambil dari database
    data = await this.getDataFromDatabase();
    // Simpan ke cache, berlaku selama 1 jam
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Membuat Cache Kustom

Jika Anda perlu membuat instans *cache* independen (misalnya, *namespace* atau konfigurasi yang berbeda), Anda dapat menggunakan metode `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Membuat instans cache dengan prefix
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Semua key akan otomatis ditambahkan prefix ini
      store: 'memory', // Menggunakan cache memori, opsional, defaultnya menggunakan defaultStore
      max: 1000, // Jumlah item cache maksimum
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Deskripsi Parameter `createCache`

| Parameter | Tipe | Deskripsi |
| ---- | ---- | ---- |
| `name` | `string` | Pengidentifikasi unik untuk *cache*, wajib diisi |
| `prefix` | `string` | Opsional, *prefix* untuk *key cache*, digunakan untuk menghindari konflik *key* |
| `store` | `string` | Opsional, pengidentifikasi tipe *store* (seperti `'memory'`, `'redis'`), *default*-nya menggunakan `defaultStore` |
| `[key: string]` | `any` | Item konfigurasi kustom lain yang terkait dengan *store* |

### Mengambil Cache yang Sudah Dibuat

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Metode Dasar Cache

Instans *Cache* menyediakan berbagai metode operasi *cache* yang kaya, sebagian besar diwarisi dari `node-cache-manager`.

### get / set

```ts
// Mengatur cache, dengan waktu kedaluwarsa (satuan: detik)
await cache.set('key', 'value', { ttl: 3600 });

// Mengambil cache
const value = await cache.get('key');
```

### del / reset

```ts
// Menghapus satu key
await cache.del('key');

// Mengosongkan semua cache
await cache.reset();
```

### wrap

Metode `wrap()` adalah alat yang sangat berguna. Metode ini akan mencoba mengambil data dari *cache* terlebih dahulu, dan jika *cache miss*, ia akan mengeksekusi fungsi dan menyimpan hasilnya ke dalam *cache*.

```ts
const data = await cache.wrap('user:1', async () => {
  // Fungsi ini hanya dieksekusi saat cache miss
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Operasi Batch

```ts
// Mengatur secara batch
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Mengambil secara batch
const values = await cache.mget(['key1', 'key2', 'key3']);

// Menghapus secara batch
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Mengambil semua key (catatan: beberapa store mungkin tidak mendukung ini)
const allKeys = await cache.keys();

// Mengambil sisa waktu kedaluwarsa key (satuan: detik)
const remainingTTL = await cache.ttl('key');
```

## Penggunaan Lanjut

### wrapWithCondition

`wrapWithCondition()` mirip dengan `wrap()`, tetapi dapat memutuskan apakah akan menggunakan *cache* melalui kondisi.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Parameter eksternal mengontrol apakah akan menggunakan hasil cache
    useCache: true, // Jika diatur ke false, fungsi akan dieksekusi ulang meskipun ada cache

    // Memutuskan apakah akan melakukan cache berdasarkan hasil data
    isCacheable: (value) => {
      // Contoh: hanya hasil yang berhasil yang akan di-cache
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Operasi Cache Objek

Ketika konten yang di-*cache* adalah objek, Anda dapat menggunakan metode berikut untuk langsung mengoperasikan properti objek tanpa perlu mengambil seluruh objek.

```ts
// Mengatur properti tertentu dari sebuah objek
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Mengambil properti tertentu dari sebuah objek
const name = await cache.getValueInObject('user:1', 'name');

// Menghapus properti tertentu dari sebuah objek
await cache.delValueInObject('user:1', 'age');
```

## Mendaftarkan Store Kustom

Jika Anda perlu menggunakan jenis *cache* lain (seperti Memcached, MongoDB, dll.), Anda dapat mendaftarkannya melalui `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Mendaftarkan store Redis (jika sistem belum mendaftarkannya)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Konfigurasi koneksi Redis
      url: 'redis://localhost:6379',
    });

    // Membuat cache menggunakan store yang baru didaftarkan
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Catatan Penting

1.  **Batasan Cache Memori**: Saat menggunakan *memory store*, perhatikan untuk mengatur parameter `max` yang wajar untuk menghindari *memory overflow*.
2.  **Strategi Pembatalan Cache**: Saat memperbarui data, ingatlah untuk menghapus *cache* terkait untuk menghindari data kotor (*dirty data*).
3.  **Konvensi Penamaan Key**: Disarankan untuk menggunakan *namespace* dan *prefix* yang bermakna, seperti `module:resource:id`.
4.  **Pengaturan TTL**: Atur `TTL` secara wajar berdasarkan frekuensi pembaruan data untuk menyeimbangkan kinerja dan konsistensi.
5.  **Koneksi Redis**: Saat menggunakan Redis, pastikan parameter koneksi dan kata sandi dikonfigurasi dengan benar di lingkungan produksi.