---
title: "Database"
description: "NocoBase Database: Collection, Model, Repository, FieldType, FilterOperator, dataSource.db, app.db."
keywords: "Database,Collection,Model,Repository,Sequelize,dataSource.db,NocoBase"
---

# Database

`Database` adalah komponen inti dari data source tipe database (`DataSource`). Setiap data source tipe database memiliki instance `Database` yang sesuai, dapat diakses melalui `dataSource.db`. Instance database data source utama juga memiliki alias yang lebih singkat `app.db`. Memahami method umum dari `db` adalah dasar untuk menulis plugin server.

## Komponen Database

Sebuah `Database` tipikal terdiri dari komponen berikut:

- **Collection**: Mendefinisikan struktur tabel data.
- **Model**: Sesuai dengan model ORM (biasanya dikelola oleh Sequelize).
- **Repository**: Layer repository yang mengenkapsulasi logika akses data, menyediakan method operasi tingkat lebih tinggi.
- **FieldType**: Tipe field.
- **FilterOperator**: Operator yang digunakan untuk filter.
- **Event**: Event siklus hidup dan event database.

## Waktu Penggunaan dalam Plugin

### Hal yang Cocok Dilakukan pada Tahap beforeLoad

Pada tahap ini operasi database belum dapat dilakukan, cocok untuk registrasi class statis atau listen event.

- `db.registerFieldTypes()` — Mendaftarkan tipe field kustom
- `db.registerModels()` — Mendaftarkan class model kustom
- `db.registerRepositories()` — Mendaftarkan class repository kustom
- `db.registerOperators()` — Mendaftarkan operator filter kustom
- `db.on()` — Mendengarkan event terkait database

### Hal yang Cocok Dilakukan pada Tahap load

Pada tahap ini semua definisi class dan event prasyarat sudah selesai dimuat, kemudian memuat tabel data tidak akan ada yang terlewat atau hilang.

- `db.defineCollection()` — Mendefinisikan tabel data baru
- `db.extendCollection()` — Memperluas konfigurasi tabel data yang ada

Namun jika untuk mendefinisikan tabel built-in plugin, lebih disarankan ditempatkan di direktori `./src/server/collections`, lihat [Collections Tabel Data](./collections.md).

## Operasi Data

`Database` menyediakan dua cara utama untuk mengakses dan mengoperasikan data:

### Operasi melalui Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Layer Repository biasanya digunakan untuk mengenkapsulasi logika bisnis, seperti pagination, filter, pemeriksaan hak akses, dll.

### Operasi melalui Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Layer Model langsung sesuai dengan entitas ORM, cocok untuk operasi database tingkat lebih rendah.

## Pada Tahap Apa Operasi Database Dapat Dilakukan?

### Siklus Hidup Plugin

| Tahap | Dapat Operasi Database |
|------|----------------|
| `staticImport` | No |
| `afterAdd` | No |
| `beforeLoad` | No |
| `load` | No |
| `install` | Yes |
| `beforeEnable` | Yes |
| `afterEnable` | Yes |
| `beforeDisable` | Yes |
| `afterDisable` | Yes |
| `remove` | Yes |
| `handleSyncMessage` | Yes |

### Event App

| Tahap | Dapat Operasi Database |
|------|----------------|
| `beforeLoad` | No |
| `afterLoad` | No |
| `beforeStart` | Yes |
| `afterStart` | Yes |
| `beforeInstall` | No |
| `afterInstall` | Yes |
| `beforeStop` | Yes |
| `afterStop` | No |
| `beforeDestroy` | Yes |
| `afterDestroy` | No |
| `beforeLoadPlugin` | No |
| `afterLoadPlugin` | No |
| `beforeEnablePlugin` | Yes |
| `afterEnablePlugin` | Yes |
| `beforeDisablePlugin` | Yes |
| `afterDisablePlugin` | Yes |
| `afterUpgrade` | Yes |

### Event/Hook Database

| Tahap | Dapat Operasi Database |
|------|----------------|
| `beforeSync` | No |
| `afterSync` | Yes |
| `beforeValidate` | Yes |
| `afterValidate` | Yes |
| `beforeCreate` | Yes |
| `afterCreate` | Yes |
| `beforeUpdate` | Yes |
| `afterUpdate` | Yes |
| `beforeSave` | Yes |
| `afterSave` | Yes |
| `beforeDestroy` | Yes |
| `afterDestroy` | Yes |
| `afterCreateWithAssociations` | Yes |
| `afterUpdateWithAssociations` | Yes |
| `afterSaveWithAssociations` | Yes |
| `beforeDefineCollection` | No |
| `afterDefineCollection` | No |
| `beforeRemoveCollection` | No |
| `afterRemoveCollection` | No |

## Tautan Terkait

- [Collections Tabel Data](./collections.md) — Mendefinisikan atau memperluas struktur tabel data dengan kode
- [DataSourceManager Manajemen Data Source](./data-source-manager.md) — Mengelola beberapa data source dan instance database-nya
- [Context Konteks Request](./context.md) — Mendapatkan instance `db` dalam request
- [Plugin](./plugin.md) — Siklus hidup class plugin, member method, dan objek `app`
- [Event](./event.md) — Listen dan handle event level aplikasi dan database
