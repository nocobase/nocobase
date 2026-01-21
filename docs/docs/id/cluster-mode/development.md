:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pengembangan Plugin

## Latar Belakang Masalah

Dalam lingkungan *single-node*, *plugin* biasanya dapat memenuhi kebutuhan melalui status dalam proses, *event*, atau tugas. Namun, dalam mode *cluster*, *plugin* yang sama mungkin berjalan secara bersamaan di beberapa *instance*, menghadapi masalah-masalah umum berikut:

- **Konsistensi Status**: Jika konfigurasi atau data *runtime* hanya disimpan dalam memori, akan sulit untuk menyinkronkannya antar *instance*, sehingga mudah terjadi *dirty read* atau eksekusi berulang.
- **Penjadwalan Tugas**: Tugas yang memakan waktu lama, jika tidak memiliki mekanisme antrean dan konfirmasi yang jelas, dapat menyebabkan beberapa *instance* mengeksekusi tugas yang sama secara bersamaan.
- **Kondisi Persaingan (*Race Conditions*)**: Ketika melibatkan perubahan *schema* atau alokasi sumber daya, diperlukan operasi serialisasi untuk menghindari konflik yang disebabkan oleh penulisan bersamaan.

Inti NocoBase menyediakan berbagai antarmuka *middleware* pada lapisan aplikasi untuk membantu *plugin* menggunakan kembali kemampuan terpadu di lingkungan *cluster*. Bagian selanjutnya akan menjelaskan penggunaan dan praktik terbaik untuk *caching*, pesan sinkron, antrean pesan, dan *distributed lock*, disertai referensi kode sumber.

## Solusi

### Komponen Cache

Untuk data yang perlu disimpan dalam memori, disarankan untuk menggunakan komponen *cache* bawaan sistem untuk pengelolaannya.

- Dapatkan *instance cache* default melalui `app.cache`.
- `Cache` menyediakan operasi dasar seperti `set/get/del/reset`, dan juga mendukung `wrap` serta `wrapWithCondition` untuk membungkus logika *caching*, serta metode *batch* seperti `mset/mget/mdel`.
- Saat melakukan *deployment* dalam *cluster*, disarankan untuk menempatkan data bersama dalam penyimpanan yang memiliki kemampuan persistensi (seperti Redis), dan mengatur `ttl` secara wajar untuk mencegah hilangnya *cache* saat *instance* di-*restart*.

Contoh: [Inisialisasi dan penggunaan *cache* di `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

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

### Manajer Pesan Sinkron (SyncMessageManager)

Jika status dalam memori tidak dapat dikelola dengan *cache* terdistribusi (misalnya, tidak dapat di-*serialize*), maka ketika status berubah karena tindakan pengguna, perubahan tersebut perlu diberitahukan ke *instance* lain melalui sinyal sinkron untuk menjaga konsistensi status.

- Kelas dasar *plugin* telah mengimplementasikan `sendSyncMessage`, yang secara internal memanggil `app.syncMessageManager.publish` dan secara otomatis menambahkan *prefix* tingkat aplikasi ke *channel* untuk menghindari konflik *channel*.
- `publish` dapat menentukan `transaction`, dan pesan akan dikirim setelah transaksi basis data di-*commit*, memastikan sinkronisasi status dan pesan.
- Tangani pesan yang datang dari *instance* lain melalui `handleSyncMessage`. Berlangganan pada fase `beforeLoad` sangat cocok untuk skenario seperti perubahan konfigurasi dan sinkronisasi *schema*.

Contoh: [`plugin-data-source-main` menggunakan pesan sinkron untuk menjaga konsistensi *schema* di berbagai *node*](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Menyinkronkan pembaruan Schema dalam plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Secara otomatis memanggil app.syncMessageManager.publish
  }
}
```

### Manajer Pesan Siaran (PubSubManager)

Pesan siaran adalah komponen dasar dari sinyal sinkron dan juga dapat digunakan secara langsung. Ketika Anda perlu menyiarkan pesan antar *instance*, Anda dapat menggunakan komponen ini.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` dapat digunakan untuk berlangganan *channel* antar *instance*; opsi `debounce` digunakan untuk menghilangkan *debounce*, menghindari *callback* yang sering disebabkan oleh siaran berulang.
- `publish` mendukung `skipSelf` (defaultnya `true`) dan `onlySelf`, digunakan untuk mengontrol apakah pesan dikirim kembali ke *instance* ini.
- Adaptor (seperti Redis, RabbitMQ, dll.) harus dikonfigurasi sebelum aplikasi dimulai; jika tidak, secara default tidak akan terhubung ke sistem pesan eksternal.

Contoh: [`plugin-async-task-manager` menggunakan PubSub untuk menyiarkan *event* pembatalan tugas](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Menyiarkan sinyal pembatalan tugas"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Komponen Antrean Pesan (EventQueue)

Antrean pesan digunakan untuk menjadwalkan tugas asinkron, cocok untuk menangani operasi yang memakan waktu lama atau dapat dicoba ulang (*retryable*).

- Deklarasikan *consumer* dengan `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` mengembalikan `Promise`, dan Anda dapat menggunakan `AbortSignal.timeout` untuk mengontrol *timeout*.
- `publish` akan secara otomatis menambahkan *prefix* nama aplikasi dan mendukung opsi seperti `timeout`, `maxRetries`, dll. Secara default, ini mengadaptasi antrean dalam memori, tetapi dapat dialihkan ke adaptor yang diperluas seperti RabbitMQ sesuai kebutuhan.
- Dalam *cluster*, pastikan semua *node* menggunakan adaptor yang sama untuk menghindari fragmentasi tugas antar *node*.

Contoh: [`plugin-async-task-manager` menggunakan EventQueue untuk menjadwalkan tugas](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Mendistribusikan tugas asinkron dalam antrean"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Manajer Kunci Terdistribusi (LockManager)

Ketika Anda perlu menghindari operasi *race condition*, Anda dapat menggunakan kunci terdistribusi untuk men-*serialize* akses ke sumber daya.

- Secara default, ini menyediakan adaptor `local` berbasis proses. Anda dapat mendaftarkan implementasi terdistribusi seperti Redis; kontrol konkurensi melalui `app.lockManager.runExclusive(key, fn, ttl)` atau `acquire`/`tryAcquire`.
- `ttl` digunakan sebagai pengaman untuk melepaskan kunci, mencegah kunci ditahan selamanya dalam kasus pengecualian.
- Skenario umum meliputi: perubahan *schema*, mencegah tugas duplikat, pembatasan laju (*rate limiting*), dll.

Contoh: [`plugin-data-source-main` menggunakan kunci terdistribusi untuk melindungi proses penghapusan *field*](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Men-*serialize* operasi penghapusan field"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Rekomendasi Pengembangan

- **Konsistensi Status dalam Memori**: Sebisa mungkin hindari penggunaan status dalam memori selama pengembangan. Sebagai gantinya, gunakan *caching* atau pesan sinkron untuk menjaga konsistensi status.
- **Prioritaskan Penggunaan Kembali Antarmuka Bawaan**: Gunakan kemampuan terpadu seperti `app.cache`, `app.syncMessageManager`, dll., untuk menghindari implementasi ulang logika komunikasi antar-*node* dalam *plugin*.
- **Perhatikan Batasan Transaksi**: Operasi yang melibatkan transaksi harus menggunakan `transaction.afterCommit` (`syncMessageManager.publish` sudah terintegrasi) untuk menjamin konsistensi data dan pesan.
- **Susun Strategi *Backoff***: Untuk tugas antrean dan siaran, atur nilai `timeout`, `maxRetries`, dan `debounce` secara wajar untuk mencegah lonjakan lalu lintas baru dalam situasi pengecualian.
- **Sertakan Pemantauan dan Pencatatan (*Logging*)**: Manfaatkan log aplikasi dengan baik untuk mencatat nama *channel*, *payload* pesan, kunci *lock*, dan informasi lainnya, guna mempermudah pemecahan masalah insidental dalam *cluster*.

Dengan kemampuan di atas, *plugin* dapat dengan aman berbagi status, menyinkronkan konfigurasi, dan menjadwalkan tugas antar *instance* yang berbeda, memenuhi persyaratan stabilitas dan konsistensi dalam skenario *deployment* *cluster*.