---
title: "Server Plugin"
description: "Plugin server NocoBase: extends Class Plugin, siklus hidup afterAdd, beforeLoad, load, install, registrasi resource dan event."
keywords: "Server Plugin,Class Plugin,afterAdd,beforeLoad,load,install,plugin server,NocoBase"
---

# Plugin

Di NocoBase, **Server Plugin** adalah cara utama untuk memperluas fungsi server. Anda dapat extends class dasar `Plugin` yang disediakan oleh `@nocobase/server` di `src/server/plugin.ts` direktori plugin Anda, kemudian mendaftarkan event, API, hak akses, dan logika kustom lainnya pada tahap siklus hidup yang berbeda.

## Class Plugin

Struktur class plugin dasar adalah sebagai berikut:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Siklus Hidup

Method siklus hidup plugin dieksekusi dalam urutan berikut, masing-masing memiliki waktu eksekusi dan tujuan tertentu:

| Method Siklus Hidup | Waktu Eksekusi | Penjelasan |
|--------------|----------|------|
| **staticImport()** | Sebelum plugin dimuat | Method statis class, dieksekusi pada tahap inisialisasi yang tidak terkait dengan status aplikasi atau plugin, digunakan untuk pekerjaan inisialisasi yang tidak bergantung pada instance plugin. |
| **afterAdd()** | Segera setelah plugin ditambahkan ke PluginManager | Pada saat ini instance plugin sudah dibuat, tetapi belum semua plugin selesai diinisialisasi, dapat melakukan beberapa inisialisasi dasar. |
| **beforeLoad()** | Dieksekusi sebelum `load()` semua plugin | Pada saat ini sudah dapat mengakses semua **instance plugin yang sudah aktif**. Cocok untuk pekerjaan persiapan seperti mendaftarkan model database, mendengarkan event database, mendaftarkan middleware, dll. |
| **load()** | Dieksekusi saat plugin dimuat | `load()` baru akan mulai dieksekusi setelah `beforeLoad()` semua plugin selesai. Cocok untuk logika bisnis inti seperti mendaftarkan resource, API, dll. — misalnya mendaftarkan [REST API kustom](./resource-manager.md) melalui `resourceManager`. **Perhatian:** Pada tahap `load()` database belum selesai sinkronisasi, tidak boleh mengeksekusi query atau operasi tulis database — operasi database harus diletakkan di `install()` atau dalam fungsi handler request. |
| **install()** | Dieksekusi saat plugin pertama kali diaktifkan | Hanya dieksekusi sekali saat plugin pertama kali diaktifkan, biasanya digunakan untuk logika instalasi seperti menginisialisasi struktur tabel database, menyisipkan data awal, dll. `install()` hanya dieksekusi saat aktivasi pertama — jika versi berikutnya perlu mengubah struktur tabel atau migrasi data, harus ditangani melalui [Migration Skrip Upgrade](./migration.md). |
| **afterEnable()** | Dieksekusi setelah plugin diaktifkan | Dieksekusi setiap kali plugin diaktifkan, dapat digunakan untuk memulai tugas terjadwal, membangun koneksi, dll. |
| **afterDisable()** | Dieksekusi setelah plugin dinonaktifkan | Dapat digunakan untuk membersihkan resource, menghentikan tugas, menutup koneksi, dll. |
| **remove()** | Dieksekusi saat plugin dihapus | Digunakan untuk menulis logika uninstall, seperti menghapus tabel database, membersihkan file, dll. |
| **handleSyncMessage(message)** | Sinkronisasi pesan saat deployment multi-node | Saat aplikasi berjalan dalam mode multi-node, digunakan untuk menangani pesan yang disinkronkan dari node lain. |

### Penjelasan Urutan Eksekusi

Alur eksekusi tipikal method siklus hidup:

1. **Tahap Inisialisasi Statis**: `staticImport()`
2. **Tahap Startup Aplikasi**: `afterAdd()` → `beforeLoad()` → `load()`
3. **Tahap Aktivasi Pertama Plugin**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Tahap Aktivasi Berikutnya Plugin**: `afterAdd()` → `beforeLoad()` → `load()`
5. **Tahap Deaktivasi Plugin**: Eksekusi `afterDisable()` saat menonaktifkan plugin
6. **Tahap Penghapusan Plugin**: Eksekusi `remove()` saat menghapus plugin

## Member app dan Terkait

Dalam pengembangan plugin, melalui `this.app` Anda dapat mengakses berbagai API yang disediakan oleh instance aplikasi — ini adalah entry point inti untuk plugin memperluas fungsionalitas. Objek `app` berisi berbagai modul fungsional sistem, Anda dapat menggunakannya dalam method siklus hidup plugin.

### Daftar Member app

| Nama Member | Tipe/Modul | Tujuan Utama |
|-----------|------------|-----------|
| **logger** | `Logger` | Mencatat log sistem, mendukung level info, warn, error, debug, dll. Lihat [Logger Log](./logger.md) |
| **db** | `Database` | Operasi layer ORM, registrasi model, listen event, kontrol transaksi, dll. Lihat [Database](./database.md) |
| **resourceManager** | `ResourceManager` | Mendaftarkan dan mengelola resource REST API dan handler operasi. Lihat [ResourceManager Manajemen Resource](./resource-manager.md) |
| **acl** | `ACL` | Mendefinisikan hak akses, role, dan kebijakan akses resource. Lihat [ACL Kontrol Hak Akses](./acl.md) |
| **cacheManager** | `CacheManager` | Mengelola cache level sistem, mendukung berbagai backend seperti Redis, cache memori. Lihat [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Mendaftarkan dan mengelola tugas terjadwal, mendukung ekspresi Cron. Lihat [CronJobManager Tugas Terjadwal](./cron-job-manager.md) |
| **i18n** | `I18n` | Terjemahan multi-bahasa dan lokalisasi. Lihat [I18n Internasionalisasi](./i18n.md) |
| **cli** | `CLI` | Mendaftarkan command kustom, memperluas NocoBase CLI. Lihat [Command Command Line](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Mengelola beberapa instance data source dan koneksinya. Lihat [DataSourceManager Manajemen Data Source](./data-source-manager.md) |
| **pm** | `PluginManager` | Memuat, mengaktifkan, menonaktifkan, menghapus plugin secara dinamis, mengelola hubungan dependensi antar plugin. |

:::tip Tips

Untuk penggunaan detail setiap modul, silakan merujuk ke bagian dokumentasi yang sesuai.

:::

## Tautan Terkait

- [Ikhtisar Pengembangan Server](./index.md) — Ringkasan dan navigasi setiap modul server
- [Collections Tabel Data](./collections.md) — Mendefinisikan atau memperluas struktur tabel data dengan kode
- [Database](./database.md) — CRUD, Repository, transaksi, dan event database
- [Migration Migrasi Data](./migration.md) — Skrip migrasi data saat upgrade plugin
- [Event](./event.md) — Listen dan handle event level aplikasi dan database
- [ResourceManager Manajemen Resource](./resource-manager.md) — Mendaftarkan REST API dan operasi kustom
- [Menulis Plugin Pertama](../write-your-first-plugin.md) — Membuat plugin lengkap dari nol
- [Logger Log](./logger.md) — Mencatat log sistem
- [ACL Kontrol Hak Akses](./acl.md) — Mendefinisikan hak akses dan kebijakan akses
- [Cache](./cache.md) — Mengelola cache level sistem
- [CronJobManager Tugas Terjadwal](./cron-job-manager.md) — Mendaftarkan dan mengelola tugas terjadwal
- [I18n Internasionalisasi](./i18n.md) — Terjemahan multi-bahasa
- [Command Command Line](./command.md) — Mendaftarkan command CLI kustom
- [DataSourceManager Manajemen Data Source](./data-source-manager.md) — Mengelola beberapa data source
