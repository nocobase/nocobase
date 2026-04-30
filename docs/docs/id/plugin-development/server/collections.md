---
title: "Definisi Tabel Data Collections"
description: "Mendefinisikan Collection dalam plugin NocoBase: defineCollection, extendCollection, fields, konvensi direktori src/server/collections."
keywords: "Collections,defineCollection,extendCollection,tabel data,definisi Collection,NocoBase"
---

# Collections Tabel Data

Dalam pengembangan plugin NocoBase, **Collection (Tabel Data)** adalah salah satu konsep paling inti. Anda dapat menambah atau memodifikasi struktur tabel data dalam plugin dengan mendefinisikan atau memperluas Collection. Berbeda dengan tabel data yang dibuat melalui antarmuka "Manajemen Data Source", **Collection yang didefinisikan dengan kode biasanya merupakan tabel metadata level sistem**, tidak akan muncul di daftar manajemen data source.

## Mendefinisikan Tabel Data

Sesuai dengan struktur direktori konvensi, file Collection harus diletakkan di direktori `./src/server/collections`. Membuat tabel baru menggunakan `defineCollection()`, memperluas tabel yang ada menggunakan `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Contoh Artikel',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Judul', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Konten' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Penulis' },
    },
  ],
});
```

Pada contoh di atas:

- `name`: Nama tabel (akan otomatis menghasilkan tabel dengan nama yang sama di database).
- `title`: Nama tampilan tabel di antarmuka.
- `fields`: Kumpulan field, setiap field berisi property `type`, `name`, dan lainnya.

Saat perlu menambahkan field atau memodifikasi konfigurasi untuk Collection plugin lain, dapat menggunakan `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Setelah plugin diaktifkan, sistem akan secara otomatis menambahkan field `isPublished` ke tabel `articles` yang sudah ada.

:::tip Tips

Direktori konvensi akan selesai dimuat sebelum method `load()` semua plugin dieksekusi, sehingga menghindari masalah dependensi yang disebabkan oleh sebagian tabel data yang belum dimuat.

:::

## Cheatsheet Tipe Field

Pada `fields` `defineCollection`, `type` menentukan tipe kolom field di database. Berikut adalah semua tipe field bawaan:

### Teks

| type | Tipe Database | Penjelasan | Parameter Khusus |
|------|-----------|------|----------|
| `string` | VARCHAR(255) | Teks pendek | `length?: number` (custom length), `trim?: boolean` |
| `text` | TEXT | Teks panjang | `length?: 'tiny' \| 'medium' \| 'long'` (hanya MySQL) |

### Angka

| type | Tipe Database | Penjelasan | Parameter Khusus |
|------|-----------|------|----------|
| `integer` | INTEGER | Bilangan bulat | — |
| `bigInt` | BIGINT | Bilangan bulat besar | — |
| `float` | FLOAT | Bilangan floating point | — |
| `double` | DOUBLE | Floating point presisi ganda | — |
| `decimal` | DECIMAL(p,s) | Bilangan fixed point | `precision: number`, `scale: number` |

### Boolean

| type | Tipe Database | Penjelasan |
|------|-----------|------|
| `boolean` | BOOLEAN | Nilai boolean |

### Tanggal Waktu

| type | Tipe Database | Penjelasan | Parameter Khusus |
|------|-----------|------|----------|
| `date` | DATE(3) | Tanggal waktu (dengan milidetik) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Hanya tanggal, tanpa waktu | — |
| `time` | TIME | Hanya waktu | — |
| `unixTimestamp` | BIGINT | Unix timestamp | `accuracy?: 'second' \| 'millisecond'` |

:::tip Tips

`date` adalah tipe tanggal yang paling sering digunakan. Jika perlu membedakan cara penanganan zona waktu, juga tersedia `datetimeTz` (dengan zona waktu) dan `datetimeNoTz` (tanpa zona waktu).

:::

### Data Terstruktur

| type | Tipe Database | Penjelasan | Parameter Khusus |
|------|-----------|------|----------|
| `json` | JSON / JSONB | Data JSON | `jsonb?: boolean` (Gunakan JSONB di PostgreSQL) |
| `jsonb` | JSONB / JSON | Prioritaskan menggunakan JSONB | — |
| `array` | ARRAY / JSON | Array | Di PostgreSQL dapat menggunakan tipe ARRAY native |

### Generasi ID

| type | Tipe Database | Penjelasan | Parameter Khusus |
|------|-----------|------|----------|
| `uid` | VARCHAR(255) | Otomatis menghasilkan ID pendek | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (default true) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (default 12), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake ID | `autoFill?: boolean` (default true) |

### Tipe Khusus

| type | Tipe Database | Penjelasan |
|------|-----------|------|
| `password` | VARCHAR(255) | Penyimpanan hash dengan salt otomatis |
| `virtual` | Tanpa kolom aktual | Field virtual, tidak membuat kolom di database |
| `context` | Dapat dikonfigurasi | Otomatis terisi dari konteks request (misalnya `currentUser.id`) |

### Tipe Asosiasi

Field asosiasi tidak membuat kolom database, tetapi membangun relasi antar tabel di layer ORM:

| type | Penjelasan | Parameter Kunci |
|------|------|----------|
| `belongsTo` | Many-to-one | `target` (tabel target), `foreignKey` (field foreign key) |
| `hasOne` | One-to-one | `target`, `foreignKey` |
| `hasMany` | One-to-many | `target`, `foreignKey` |
| `belongsToMany` | Many-to-many | `target`, `through` (tabel perantara), `foreignKey`, `otherKey` |

Contoh penggunaan field asosiasi:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Many-to-one: Artikel milik satu penulis
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // One-to-many: Artikel memiliki banyak komentar
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Many-to-many: Artikel memiliki banyak tag
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // Nama tabel perantara
    },
  ],
});
```

### Parameter Umum

Semua field kolom mendukung parameter berikut:

| Parameter | Tipe | Penjelasan |
|------|------|------|
| `name` | `string` | Nama field (wajib) |
| `defaultValue` | `any` | Nilai default |
| `allowNull` | `boolean` | Apakah mengizinkan null |
| `unique` | `boolean` | Apakah unik |
| `primaryKey` | `boolean` | Apakah primary key |
| `autoIncrement` | `boolean` | Apakah auto increment |
| `index` | `boolean` | Apakah membuat index |
| `comment` | `string` | Komentar field |

## Sinkronisasi Struktur Database

Saat plugin pertama kali diaktifkan, sistem akan secara otomatis menyinkronkan konfigurasi Collection dengan struktur database. Jika plugin sudah terinstal dan sedang berjalan, setelah menambah atau memodifikasi Collection perlu menjalankan command upgrade secara manual:

```bash
yarn nocobase upgrade
```

Jika terjadi exception atau data kotor selama proses sinkronisasi, dapat membangun ulang struktur tabel dengan menginstal ulang aplikasi:

```bash
yarn nocobase install -f
```

Jika upgrade plugin perlu melakukan migrasi pada data yang ada — seperti rename field, split tabel, mengisi nilai default, dll. — harus ditangani melalui [Migration Skrip Upgrade](./migration.md), bukan dengan mengubah database secara manual.

## Membuat Collection Muncul di Daftar Tabel Data UI

Tabel yang didefinisikan melalui `defineCollection` adalah tabel internal server, secara default **tidak akan muncul** di daftar "Manajemen Data Source", juga tidak akan muncul di daftar pemilihan tabel data saat "Menambahkan Block".

**Cara yang Direkomendasikan**: Tambahkan tabel data yang sesuai di "[Manajemen Data Source](../../data-sources/data-source-main/index.md)" di antarmuka NocoBase, setelah konfigurasi field dan tipe interface, tabel akan otomatis muncul di daftar pemilihan tabel data Block.

![Memilih sendiri saat menambahkan Block](https://static-docs.nocobase.com/20260409143839.png)

Jika memang perlu didaftarkan dalam kode plugin (seperti skenario demo dalam plugin contoh), dapat mendaftarkan secara manual melalui `addCollection` dalam plugin client. Perhatikan harus didaftarkan melalui mode `eventBus`, tidak boleh dipanggil langsung di `load()` — `ensureLoaded()` akan membersihkan dan mengatur ulang semua collection setelah `load()`. Untuk contoh lengkap lihat [Membuat Plugin Manajemen Data Front-Back End](../client/examples/fullstack-plugin.md).

## Resource yang Dihasilkan Otomatis

Setelah mendefinisikan Collection, NocoBase akan otomatis menghasilkan resource REST API yang sesuai untuknya, API CRUD yang siap pakai (`list`, `get`, `create`, `update`, `destroy`) tidak perlu ditulis tambahan. Jika operasi CRUD bawaan tidak cukup — misalnya Anda memerlukan API "import batch" atau "ringkasan statistik" — dapat mendaftarkan action kustom melalui `resourceManager`. Lihat [ResourceManager Manajemen Resource](./resource-manager.md).

## Tautan Terkait

- [Database](./database.md) — CRUD, Repository, transaksi, dan event database
- [DataSourceManager Manajemen Data Source](./data-source-manager.md) — Mengelola beberapa data source dan collection-nya
- [Migration Migrasi Data](./migration.md) — Skrip migrasi data saat upgrade plugin
- [Plugin](./plugin.md) — Siklus hidup class plugin, member method, dan objek `app`
- [ResourceManager Manajemen Resource](./resource-manager.md) — REST API kustom dan handler operasi
- [Membuat Plugin Manajemen Data Front-Back End](../client/examples/fullstack-plugin.md) — Contoh lengkap defineCollection + addCollection
- [Struktur Direktori Proyek](../project-structure.md) — Penjelasan konvensi direktori `src/server/collections`
