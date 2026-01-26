:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Event

Server NocoBase akan memicu event (peristiwa) yang sesuai selama siklus hidup aplikasi, siklus hidup plugin, dan operasi basis data. Pengembang plugin dapat mendengarkan event ini untuk mengimplementasikan logika ekstensi, operasi otomatis, atau perilaku kustom.

Sistem event NocoBase dibagi menjadi dua tingkatan utama:

- **`app.on()` - Event Tingkat Aplikasi**: Mendengarkan event siklus hidup aplikasi, seperti saat memulai, menginstal, mengaktifkan plugin, dll.
- **`db.on()` - Event Tingkat Basis Data**: Mendengarkan event operasi pada tingkat model data, seperti membuat, memperbarui, menghapus catatan, dll.

Keduanya mewarisi dari `EventEmitter` Node.js, mendukung penggunaan antarmuka standar `.on()`, `.off()`, `.emit()`. NocoBase juga memperluas dukungan untuk `emitAsync`, yang digunakan untuk memicu event secara asinkron dan menunggu semua pendengar selesai dieksekusi.

## Tempat Mendaftarkan Pendengar Event

Pendengar event umumnya harus didaftarkan dalam metode `beforeLoad()` plugin. Hal ini memastikan bahwa event sudah siap selama fase pemuatan plugin, dan logika selanjutnya dapat merespons dengan benar.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Mendengarkan event aplikasi
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase telah dimulai');
    });

    // Mendengarkan event basis data
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Postingan baru: ${model.get('title')}`);
      }
    });
  }
}
```

## Mendengarkan Event Aplikasi `app.on()`

Event aplikasi digunakan untuk menangkap perubahan siklus hidup aplikasi NocoBase dan plugin, cocok untuk logika inisialisasi, pendaftaran sumber daya, atau deteksi dependensi plugin.

### Jenis Event Umum

| Nama Event | Waktu Pemicuan | Kegunaan Umum |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | Sebelum / setelah pemuatan aplikasi | Mendaftarkan sumber daya, menginisialisasi konfigurasi |
| `beforeStart` / `afterStart` | Sebelum / setelah layanan dimulai | Memulai tugas, mencetak log startup |
| `beforeInstall` / `afterInstall` | Sebelum / setelah instalasi aplikasi | Menginisialisasi data, mengimpor template |
| `beforeStop` / `afterStop` | Sebelum / setelah layanan berhenti | Membersihkan sumber daya, menyimpan status |
| `beforeDestroy` / `afterDestroy` | Sebelum / setelah penghancuran aplikasi | Menghapus cache, memutuskan koneksi |
| `beforeLoadPlugin` / `afterLoadPlugin` | Sebelum / setelah pemuatan plugin | Mengubah konfigurasi plugin atau memperluas fungsionalitas |
| `beforeEnablePlugin` / `afterEnablePlugin` | Sebelum / setelah pengaktifan plugin | Memeriksa dependensi, menginisialisasi logika plugin |
| `beforeDisablePlugin` / `afterDisablePlugin` | Sebelum / setelah penonaktifan plugin | Membersihkan sumber daya plugin |
| `afterUpgrade` | Setelah pembaruan aplikasi selesai | Melakukan migrasi data atau perbaikan kompatibilitas |

Contoh: Mendengarkan event startup aplikasi

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 Layanan NocoBase telah dimulai!');
});
```

Contoh: Mendengarkan event pemuatan plugin

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} telah dimuat`);
});
```

## Mendengarkan Event Basis Data `db.on()`

Event basis data dapat menangkap berbagai perubahan data pada tingkat model, cocok untuk audit, sinkronisasi, pengisian otomatis, dan operasi lainnya.

### Jenis Event Umum

| Nama Event | Waktu Pemicuan |
|-----------|------------|
| `beforeSync` / `afterSync` | Sebelum / setelah sinkronisasi struktur basis data |
| `beforeValidate` / `afterValidate` | Sebelum / setelah validasi data |
| `beforeCreate` / `afterCreate` | Sebelum / setelah membuat catatan |
| `beforeUpdate` / `afterUpdate` | Sebelum / setelah memperbarui catatan |
| `beforeSave` / `afterSave` | Sebelum / setelah menyimpan (termasuk membuat dan memperbarui) |
| `beforeDestroy` / `afterDestroy` | Sebelum / setelah menghapus catatan |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Setelah operasi yang mencakup data asosiasi |
| `beforeDefineCollection` / `afterDefineCollection` | Sebelum / setelah mendefinisikan koleksi |
| `beforeRemoveCollection` / `afterRemoveCollection` | Sebelum / setelah menghapus koleksi |

Contoh: Mendengarkan event setelah pembuatan data

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Data telah dibuat!');
});
```

Contoh: Mendengarkan event sebelum pembaruan data

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Data akan diperbarui!');
});
```