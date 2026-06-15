---
title: "Ikhtisar Pengembangan Server Plugin"
description: "Pengembangan plugin server NocoBase: Class Plugin, app, db, resource, ACL, database, migration, middleware, event, command line."
keywords: "plugin server,Server Plugin,Class Plugin,app,db,ACL,migration,NocoBase"
---

# Ikhtisar

Plugin server NocoBase dapat melakukan banyak hal: mendefinisikan tabel data, menulis API kustom, mengelola hak akses, mendengarkan event, mendaftarkan tugas terjadwal, bahkan memperluas perintah CLI. Semua kapabilitas ini diorganisir melalui satu Class Plugin terpadu.

| Saya ingin... | Lihat di mana |
|----------|---------|
| Memahami siklus hidup class plugin dan member `app` | [Plugin](./plugin.md) |
| Melakukan CRUD dan manajemen transaksi pada database | [Database](./database.md) |
| Mendefinisikan atau memperluas tabel data dengan kode | [Collections Tabel Data](./collections.md) |
| Migrasi data saat upgrade plugin | [Migration Migrasi Data](./migration.md) |
| Mengelola beberapa data source | [DataSourceManager Manajemen Data Source](./data-source-manager.md) |
| Mendaftarkan API kustom dan operasi resource | [ResourceManager Manajemen Resource](./resource-manager.md) |
| Mengkonfigurasi hak akses API | [ACL Kontrol Hak Akses](./acl.md) |
| Menambahkan interceptor request/response atau middleware | [Context](./context.md) dan [Middleware](./middleware.md) |
| Mendengarkan event aplikasi atau database | [Event](./event.md) |
| Menggunakan cache untuk meningkatkan performa | [Cache](./cache.md) |
| Mendaftarkan tugas terjadwal | [CronJobManager Tugas Terjadwal](./cron-job-manager.md) |
| Mendukung multi-bahasa | [I18n Internasionalisasi](./i18n.md) |
| Output log kustom | [Logger Log](./logger.md) |
| Memperluas perintah CLI | [Command Command Line](./command.md) |
| Menulis test case | [Test Pengujian](./test.md) |

## Tautan Terkait

- [Plugin](./plugin.md) — Siklus hidup class plugin, member method, dan objek `app`
- [Collections Tabel Data](./collections.md) — Mendefinisikan atau memperluas struktur tabel data dengan kode
- [Database](./database.md) — CRUD, Repository, transaksi, dan event database
- [ResourceManager Manajemen Resource](./resource-manager.md) — Mendaftarkan API kustom dan operasi resource
- [ACL Kontrol Hak Akses](./acl.md) — Hak akses role, snippet hak akses, dan kontrol akses
- [Ikhtisar Plugin Development](../index.md) — Pengantar menyeluruh tentang plugin development
- [Menulis Plugin Pertama](../write-your-first-plugin.md) — Membuat plugin lengkap dari nol
