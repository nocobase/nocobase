---
title: "Event"
description: "Event server NocoBase: app.on, app.emit, listen dan trigger event, komunikasi event antar plugin."
keywords: "Event,event,app.on,app.emit,event listening,event trigger,NocoBase"
---

# Event

Server NocoBase memicu event yang sesuai pada siklus hidup aplikasi, siklus hidup plugin, serta operasi database. Anda dapat mengimplementasikan logika ekstensi, operasi otomatisasi, atau perilaku kustom dengan mendengarkan event-event ini.

Sistem event NocoBase utamanya dibagi menjadi dua level:

- **`app.on()` — Event Level Aplikasi**: Mendengarkan event siklus hidup aplikasi, seperti startup, instalasi, aktivasi plugin, dll.
- **`db.on()` — Event Level Database**: Mendengarkan event operasi pada level model data, seperti membuat, memperbarui, menghapus record, dll.

Keduanya diwarisi dari `EventEmitter` Node.js, mendukung penggunaan interface standar `.on()`, `.off()`, `.emit()`. NocoBase juga memperluas `emitAsync`, untuk memicu event secara asinkron dan menunggu semua listener selesai dieksekusi.

## Lokasi Registrasi Event Listener

Event listener biasanya didaftarkan di method `beforeLoad()` plugin, sehingga dapat dipastikan event sudah siap pada tahap loading plugin, dan logika berikutnya dapat merespons dengan benar.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Listen event aplikasi
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase telah dimulai');
    });

    // Listen event database
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Post baru: ${model.get('title')}`);
      }
    });
  }
}
```

## Listen Event Aplikasi `app.on()`

Event aplikasi digunakan untuk menangkap perubahan siklus hidup aplikasi NocoBase dan plugin, cocok untuk logika inisialisasi, registrasi resource, atau deteksi dependensi, dll.

### Tipe Event Umum

| Nama Event | Waktu Trigger | Penggunaan Tipikal |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | Sebelum / setelah aplikasi dimuat | Mendaftarkan resource, menginisialisasi konfigurasi |
| `beforeStart` / `afterStart` | Sebelum / setelah service dimulai | Memulai task, mencetak log startup |
| `beforeInstall` / `afterInstall` | Sebelum / setelah aplikasi diinstal | Menginisialisasi data, mengimpor template |
| `beforeStop` / `afterStop` | Sebelum / setelah service dihentikan | Membersihkan resource, menyimpan status |
| `beforeDestroy` / `afterDestroy` | Sebelum / setelah aplikasi dihancurkan | Menghapus cache, memutuskan koneksi |
| `beforeLoadPlugin` / `afterLoadPlugin` | Sebelum / setelah plugin dimuat | Memodifikasi konfigurasi plugin atau memperluas fungsi |
| `beforeEnablePlugin` / `afterEnablePlugin` | Sebelum / setelah plugin diaktifkan | Memeriksa dependensi, menginisialisasi logika plugin |
| `beforeDisablePlugin` / `afterDisablePlugin` | Sebelum / setelah plugin dinonaktifkan | Membersihkan resource plugin |
| `afterUpgrade` | Setelah upgrade aplikasi selesai | Mengeksekusi migrasi data atau perbaikan kompatibilitas |

Misalnya listen event startup aplikasi:

```ts
app.on('afterStart', async () => {
  app.logger.info('Service NocoBase telah dimulai');
});
```

Misalnya listen event loading plugin:

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} telah dimuat`);
});
```

## Listen Event Database `db.on()`

Event database digunakan untuk menangkap berbagai perubahan data pada level model, cocok untuk audit, sinkronisasi, auto-fill, dan operasi lainnya.

### Tipe Event Umum

| Nama Event | Waktu Trigger |
|-----------|------------|
| `beforeSync` / `afterSync` | Sebelum / setelah sinkronisasi struktur database |
| `beforeValidate` / `afterValidate` | Sebelum / setelah validasi data |
| `beforeCreate` / `afterCreate` | Sebelum / setelah membuat record |
| `beforeUpdate` / `afterUpdate` | Sebelum / setelah update record |
| `beforeSave` / `afterSave` | Sebelum / setelah save (termasuk create dan update) |
| `beforeDestroy` / `afterDestroy` | Sebelum / setelah delete record |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Setelah operasi termasuk data asosiasi |
| `beforeDefineCollection` / `afterDefineCollection` | Sebelum / setelah mendefinisikan collection |
| `beforeRemoveCollection` / `afterRemoveCollection` | Sebelum / setelah menghapus collection |

Misalnya listen event setelah data dibuat:

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Data telah dibuat!');
});
```

Misalnya listen event sebelum data diperbarui:

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Data akan diperbarui');
});
```

## Tautan Terkait

- [Plugin](./plugin.md) — Mendaftarkan event listener dalam method siklus hidup plugin
- [Database Operasi Database](./database.md) — Source trigger event level database dan API operasi data
- [Collections Tabel Data](./collections.md) — Definisi tabel data dan hubungan model dalam event database
- [Middleware](./middleware.md) — Kolaborasi middleware dan event dalam pemrosesan request
- [Ikhtisar Pengembangan Server](./index.md) — Peran sistem event dalam arsitektur server
