:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Database

`Database` adalah komponen penting dari `sumber data` bertipe database (`DataSource`). Setiap `sumber data` bertipe database memiliki instance `Database` yang sesuai, yang dapat diakses melalui `dataSource.db`. Instance database dari `sumber data` utama juga menyediakan alias `app.db` yang mudah digunakan. Memahami metode umum `db` adalah dasar untuk menulis `plugin` sisi server.

## Komponen Database

`Database` yang umum terdiri dari bagian-bagian berikut:

- **Collection**: Mendefinisikan struktur tabel data.
- **Model**: Sesuai dengan model ORM (umumnya dikelola oleh Sequelize).
- **Repository**: Lapisan repositori yang merangkum logika akses data, menyediakan metode operasi tingkat lebih tinggi.
- **FieldType**: Tipe `field`.
- **FilterOperator**: Operator yang digunakan untuk pemfilteran.
- **Event**: Event siklus hidup dan event database.

## Waktu Penggunaan dalam Plugin

### Hal-hal yang Cocok untuk Tahap `beforeLoad`

Pada tahap ini, operasi database tidak diizinkan. Cocok untuk pendaftaran kelas statis atau mendengarkan event.

- `db.registerFieldTypes()` — Tipe `field` kustom
- `db.registerModels()` — Mendaftarkan kelas model kustom
- `db.registerRepositories()` — Mendaftarkan kelas repositori kustom
- `db.registerOperators()` — Mendaftarkan operator filter kustom
- `db.on()` — Mendengarkan event terkait database

### Hal-hal yang Cocok untuk Tahap `load`

Pada tahap ini, semua definisi kelas dan event sebelumnya telah dimuat, sehingga pemuatan tabel data tidak akan mengalami kekurangan atau kelalaian.

- `db.defineCollection()` — Mendefinisikan tabel data baru
- `db.extendCollection()` — Memperluas konfigurasi tabel data yang sudah ada

Untuk mendefinisikan tabel bawaan `plugin`, lebih disarankan untuk menempatkannya di direktori `./src/server/collections`. Lihat [koleksi](./collections.md).

## Operasi Data

`Database` menyediakan dua cara utama untuk mengakses dan mengoperasikan data:

### Operasi melalui Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Lapisan Repository umumnya digunakan untuk merangkum logika bisnis, seperti paginasi, pemfilteran, pemeriksaan izin, dll.

### Operasi melalui Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Lapisan Model secara langsung sesuai dengan entitas ORM, cocok untuk menjalankan operasi database tingkat lebih rendah.

## Tahap Mana yang Mengizinkan Operasi Database?

### Siklus Hidup Plugin

| Tahap                | Operasi Database Diizinkan |
| -------------------- | -------------------------- |
| `staticImport`       | Tidak                      |
| `afterAdd`           | Tidak                      |
| `beforeLoad`         | Tidak                      |
| `load`               | Tidak                      |
| `install`            | Ya                         |
| `beforeEnable`       | Ya                         |
| `afterEnable`        | Ya                         |
| `beforeDisable`      | Ya                         |
| `afterDisable`       | Ya                         |
| `remove`             | Ya                         |
| `handleSyncMessage`  | Ya                         |

### Event Aplikasi

| Tahap                 | Operasi Database Diizinkan |
| --------------------- | -------------------------- |
| `beforeLoad`          | Tidak                      |
| `afterLoad`           | Tidak                      |
| `beforeStart`         | Ya                         |
| `afterStart`          | Ya                         |
| `beforeInstall`       | Tidak                      |
| `afterInstall`        | Ya                         |
| `beforeStop`          | Ya                         |
| `afterStop`           | Tidak                      |
| `beforeDestroy`       | Ya                         |
| `afterDestroy`        | Tidak                      |
| `beforeLoadPlugin`    | Tidak                      |
| `afterLoadPlugin`     | Tidak                      |
| `beforeEnablePlugin`  | Ya                         |
| `afterEnablePlugin`   | Ya                         |
| `beforeDisablePlugin` | Ya                         |
| `afterDisablePlugin`  | Ya                         |
| `afterUpgrade`        | Ya                         |

### Event/Hook Database

| Tahap                         | Operasi Database Diizinkan |
| ----------------------------- | -------------------------- |
| `beforeSync`                  | Tidak                      |
| `afterSync`                   | Ya                         |
| `beforeValidate`              | Ya                         |
| `afterValidate`               | Ya                         |
| `beforeCreate`                | Ya                         |
| `afterCreate`                 | Ya                         |
| `beforeUpdate`                | Ya                         |
| `afterUpdate`                 | Ya                         |
| `beforeSave`                  | Ya                         |
| `afterSave`                   | Ya                         |
| `beforeDestroy`               | Ya                         |
| `afterDestroy`                | Ya                         |
| `afterCreateWithAssociations` | Ya                         |
| `afterUpdateWithAssociations` | Ya                         |
| `afterSaveWithAssociations`   | Ya                         |
| `beforeDefineCollection`      | Tidak                      |
| `afterDefineCollection`       | Tidak                      |
| `beforeRemoveCollection`      | Tidak                      |
| `afterRemoveCollection`       | Tidak                      |