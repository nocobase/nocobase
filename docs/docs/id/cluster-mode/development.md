---
pkg: "@nocobase/preset-cluster"
title: "Pengembangan Plugin Cluster Mode"
description: "Pengembangan plugin dalam cluster mode: Cache, SyncMessageManager sync signal, PubSubManager message broadcast, Queue, distributed lock, untuk menyelesaikan konsistensi state, scheduling task, dan race condition."
keywords: "pengembangan plugin cluster,Cache,SyncMessageManager,PubSubManager,message queue,distributed lock,sinkronisasi state,WORKER_MODE,NocoBase"
---

# Pengembangan Plugin

## Latar Belakang

Dalam environment single-node, plugin biasanya dapat memenuhi kebutuhan melalui state, event, atau task dalam proses; sedangkan dalam cluster mode, plugin yang sama mungkin berjalan di multiple instance bersamaan, menghadapi masalah tipikal berikut:

- **Konsistensi state**: Jika data konfigurasi atau runtime hanya disimpan di memory, sulit untuk disinkronkan antar instance, mudah terjadi dirty read atau eksekusi duplikat.
- **Scheduling task**: Task yang memakan waktu lama tanpa mekanisme antrian dan konfirmasi yang jelas, akan menyebabkan multiple instance mengeksekusi task yang sama secara bersamaan.
- **Race condition**: Saat melibatkan perubahan schema atau alokasi resource, perlu serialisasi operasi untuk menghindari conflict akibat concurrent write.

Inti NocoBase telah menyediakan berbagai interface middleware di lapisan aplikasi, membantu plugin menggunakan kemampuan terpadu dalam environment cluster. Berikut akan memperkenalkan penggunaan dan best practice cache, sync message, message queue, dan distributed lock dengan kode sumber.

## Solusi

### Komponen Cache

Untuk data yang akan disimpan di memory, disarankan menggunakan komponen cache built-in sistem untuk pengelolaan.

- Dapatkan instance cache default melalui `app.cache`.
- `Cache` menyediakan operasi dasar seperti `set/get/del/reset`, juga mendukung `wrap` dan `wrapWithCondition` untuk membungkus logika cache, serta metode batch `mset/mget/mdel`.
- Pada deployment cluster, disarankan meletakkan shared data di storage yang memiliki kemampuan persistensi (seperti Redis), dan mengatur `ttl` dengan bijak untuk menghindari kehilangan cache akibat restart instance.

Contoh: [Inisialisasi dan penggunaan cache di `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Membuat dan menggunakan cache di plugin"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### SyncMessageManager

Jika state di memory tidak dapat menggunakan distributed cache (misalnya tidak dapat di-serialize), maka saat state berubah karena operasi user, perubahan tersebut perlu diberi tahu ke instance lain melalui sync signal untuk menjaga konsistensi state.

- Plugin base class telah mengimplementasikan `sendSyncMessage`, secara internal memanggil `app.syncMessageManager.publish` dan secara otomatis menambahkan prefix tingkat aplikasi pada channel, untuk menghindari channel conflict.
- `publish` dapat menentukan `transaction`, message akan dikirim setelah database transaction di-commit, untuk menjamin sinkronisasi state dan message.
- Tangani message dari instance lain melalui `handleSyncMessage`, dapat di-subscribe pada tahap `beforeLoad`, sangat cocok untuk skenario seperti perubahan konfigurasi, sinkronisasi Schema, dll.

Contoh: [`plugin-data-source-main` menjaga konsistensi schema multi-node melalui sync message](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Sinkronisasi update Schema dalam plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Otomatis memanggil app.syncMessageManager.publish
  }
}
```

### PubSubManager

Message broadcast adalah komponen dasar dari sync signal, dan juga mendukung penggunaan langsung. Saat perlu broadcast message antar instance, dapat diimplementasikan melalui komponen ini.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` dapat melakukan subscribe channel antar instance; opsi `debounce` digunakan untuk debouncing, untuk menghindari callback berulang akibat broadcast duplikat.
- `publish` mendukung `skipSelf` (default true) dan `onlySelf`, untuk mengontrol apakah message dikirim balik ke instance ini.
- Adapter perlu dikonfigurasi sebelum aplikasi dimulai (seperti Redis, RabbitMQ, dll), jika tidak default tidak akan terhubung ke sistem messaging eksternal.

Contoh: [`plugin-async-task-manager` menggunakan PubSub untuk broadcast event task cancellation](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Broadcast sinyal task cancellation"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Komponen Message Queue (EventQueue)

Message queue digunakan untuk menjadwalkan async task, cocok untuk menangani operasi yang memakan waktu lama atau yang dapat di-retry.

- Deklarasikan consumer melalui `app.eventQueue.subscribe(channel, { idle, process, concurrency })`, `process` mengembalikan `Promise`, dapat menggunakan `AbortSignal.timeout` untuk mengontrol timeout.
- `publish` akan secara otomatis melengkapi prefix nama aplikasi, dan mendukung opsi seperti `timeout`, `maxRetries`. Default mengadaptasi memory queue, dapat dialihkan ke extension adapter seperti RabbitMQ sesuai kebutuhan.
- Dalam cluster, pastikan semua node menggunakan adapter yang sama, untuk menghindari pemisahan task antar node.

Contoh: [`plugin-async-task-manager` menggunakan EventQueue untuk scheduling task](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Mendistribusikan async task dalam queue"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### LockManager

Saat perlu menghindari operasi race, dapat menggunakan distributed lock untuk men-serialize akses ke resource.

- Default menyediakan adapter `local` berbasis proses, dapat mendaftarkan implementasi distributed seperti Redis; kontrol concurrency melalui `app.lockManager.runExclusive(key, fn, ttl)` atau `acquire`/`tryAcquire`.
- `ttl` digunakan untuk fallback release lock, mencegah lock dipegang selamanya pada situasi anomali.
- Skenario umum meliputi: perubahan Schema, mencegah task duplikat, rate limiting, dll.

Contoh: [`plugin-data-source-main` menggunakan distributed lock untuk melindungi proses delete field](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serialisasi operasi delete field"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Saran Pengembangan

- **Konsistensi state memory**: Hindari menggunakan state memory dalam pengembangan sebanyak mungkin, gunakan cache atau sync message untuk menjaga konsistensi state.
- **Prioritaskan reuse interface built-in**: Gunakan kemampuan seperti `app.cache`, `app.syncMessageManager` secara terpadu, hindari mengimplementasikan logika komunikasi cross-node berulang dalam plugin.
- **Perhatikan transaction boundary**: Operasi dengan transaction harus menggunakan `transaction.afterCommit` (`syncMessageManager.publish` sudah built-in) untuk menjamin konsistensi data dan message.
- **Tetapkan strategi backoff**: Untuk task queue dan broadcast, atur `timeout`, `maxRetries`, `debounce` dengan bijak, untuk mencegah lonjakan traffic baru pada situasi anomali.
- **Monitoring dan logging pendukung**: Manfaatkan log aplikasi dengan baik untuk mencatat informasi seperti nama channel, payload message, lock key, untuk memudahkan investigasi masalah occasional di cluster.

Melalui kemampuan di atas, plugin dapat berbagi state secara aman antar instance, sinkronisasi konfigurasi, scheduling task, memenuhi requirement stabilitas dan konsistensi pada skenario deployment cluster.
