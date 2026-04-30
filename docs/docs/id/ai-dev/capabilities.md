---
title: "Kemampuan yang Didukung"
description: "Semua kemampuan yang didukung Pengembangan AI: scaffold, tabel data, Block, Field, Action, halaman setting, API, Permission, internasionalisasi, script upgrade."
keywords: "Pengembangan AI,Kemampuan,Pengembangan Plugin,Scaffold,Tabel Data,Block,Field,Action,Permission,Internasionalisasi"
---

# Kemampuan yang Didukung

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah menyelesaikan persiapan lingkungan sesuai [Mulai Cepat Pengembangan Plugin AI](./index.md).

:::

Kemampuan Pengembangan Plugin AI berbasis pada Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Jika Anda sudah menginisialisasi melalui [NocoBase CLI](../ai/quick-start.md) (`nb init`), Skill ini akan otomatis terinstal.

Berikut tercantum semua hal yang dapat dilakukan AI saat ini untuk Anda. Setiap kemampuan dilengkapi contoh prompt, Anda dapat langsung menyalin, mengubah deskripsi kebutuhan, dan menggunakannya.

:::warning Perhatian

- NocoBase sedang bermigrasi dari `client` (v1) ke `client-v2`, saat ini `client-v2` masih dalam pengembangan. Kode klien yang dihasilkan oleh Pengembangan AI berbasis pada `client-v2`, hanya dapat digunakan di path `/v2/`, untuk pengalaman mencoba, tidak disarankan langsung digunakan di lingkungan production.
- Kode yang dihasilkan AI tidak selalu 100% benar, disarankan melakukan review terlebih dahulu sebelum diaktifkan. Jika menemui masalah saat runtime, Anda dapat mengirim informasi error ke AI, biarkan ia melanjutkan troubleshooting dan perbaikan — biasanya beberapa putaran dialog dapat menyelesaikannya.
- Disarankan menggunakan model besar seri GPT atau Claude untuk pengembangan, hasilnya terbaik. Model besar lainnya juga dapat digunakan, namun kualitas pembuatan mungkin berbeda.

:::

## Praktik Terbaik

- **Beri tahu AI dengan jelas untuk membuat atau memodifikasi Plugin NocoBase, dan berikan nama Plugin** — misalnya "Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-rating". Tanpa memberikan nama Plugin, AI mungkin tidak tahu di mana harus menghasilkan kode.
- **Tentukan dengan jelas penggunaan nocobase-plugin-development skill di prompt** — misalnya "Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase…". Dengan ini AI Agent dapat langsung membaca kemampuan Skills, menghindari masuk ke mode plan dan mengabaikan Skills.
- **Jalankan AI Agent di direktori root repository kode sumber NocoBase** — dengan ini AI dapat secara otomatis menemukan struktur proyek, dependensi, dan Plugin yang sudah ada. Jika Anda tidak berada di direktori root kode sumber, perlu memberi tahu AI Agent path repository kode sumber.

## Indeks Cepat

| Saya ingin… | AI Dapat Membantu Anda |
| ----------- | ---------------------- |
| Membuat Plugin baru | Menghasilkan scaffold lengkap, termasuk struktur direktori frontend dan backend |
| Mendefinisikan tabel data | Menghasilkan definisi Collection, mendukung semua tipe Field dan relasi |
| Membuat Block kustom | Menghasilkan BlockModel + panel konfigurasi + register ke menu "Tambah Block" |
| Membuat Field kustom | Menghasilkan FieldModel + binding ke field interface |
| Menambahkan tombol Action kustom | Menghasilkan ActionModel + popup/drawer/confirm box |
| Membuat halaman setting Plugin | Menghasilkan formulir frontend + API backend + storage |
| Menulis API kustom | Menghasilkan Resource Action + register route + konfigurasi ACL |
| Mengonfigurasi Permission | Menghasilkan aturan ACL, mengontrol akses berdasarkan role |
| Dukungan multi-bahasa | Otomatis menghasilkan paket bahasa Mandarin dan Inggris |
| Menulis script upgrade | Menghasilkan Migration, mendukung DDL dan migrasi data |

## Scaffold Plugin

AI dapat menghasilkan struktur direktori Plugin NocoBase yang lengkap berdasarkan deskripsi kebutuhan Anda — termasuk file entry frontend dan backend, definisi tipe, dan konfigurasi dasar.

Contoh prompt:

```
Bantu saya membuat Plugin NocoBase, nama Plugin @my-scope/plugin-todo
```

AI akan menjalankan `yarn pm create @my-scope/plugin-todo` dan menghasilkan direktori standar:

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## Definisi Tabel Data

AI mendukung pembuatan definisi Collection untuk semua tipe Field NocoBase, termasuk relasi (one-to-many, many-to-many, dll).

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-order,
kemudian definisikan tabel "order" di dalamnya, Field termasuk: nomor order (auto increment), nama pelanggan (string),
jumlah (decimal), status (single select: pending/processing/completed), waktu pembuatan.
Order dan pelanggan adalah relasi many-to-one.
```

AI akan menghasilkan definisi `defineCollection`, berisi tipe Field, nilai default, konfigurasi relasi, dll.

## Block Kustom

Block adalah cara ekstensi paling inti dari frontend NocoBase. AI dapat membantu Anda menghasilkan model Block, panel konfigurasi, dan register menu.

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-simple-block,
buat satu Block tampilan kustom (BlockModel), Pengguna dapat memasukkan konten HTML di panel konfigurasi,
Block merender HTML ini. Daftarkan Block ini ke menu "Tambah Block".
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

AI akan menghasilkan `BlockModel`, membuat panel konfigurasi melalui `registerFlow` + `uiSchema`, dan mendaftarkannya ke menu "Tambah Block".

Untuk contoh lengkap rujuk [Membuat Block Tampilan Kustom](../plugin-development/client/examples/custom-block).

## Komponen Field Kustom

Jika komponen rendering Field bawaan NocoBase tidak memenuhi kebutuhan, AI dapat membantu Anda membuat komponen tampilan kustom, mengganti cara rendering Field default.

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-rating,
buat satu komponen tampilan Field kustom (FieldModel), render Field tipe integer sebagai ikon bintang,
mendukung skor 1-5, klik bintang dapat langsung memodifikasi nilai rating dan menyimpannya ke database.
```

![Tampilan Komponen Rating](https://static-docs.nocobase.com/20260422170712.png)

AI akan menghasilkan `FieldModel` kustom, mengganti komponen rendering default Field integer.

## Action Kustom

Tombol Action dapat muncul di bagian atas Block (level collection), kolom action setiap baris tabel (level record), atau muncul di kedua posisi sekaligus. Setelah diklik dapat memunculkan tooltip, membuka popup formulir, memanggil API, dan lainnya.

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-simple-action,
buat tiga tombol Action kustom (ActionModel):
1. Satu tombol level collection, muncul di bagian atas Block, klik akan menampilkan tooltip sukses
2. Satu tombol level record, muncul di kolom action setiap baris tabel, klik akan menampilkan ID record saat ini
3. Satu tombol level both, muncul di kedua posisi sekaligus, klik akan menampilkan tooltip informasi
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

AI akan menghasilkan `ActionModel`, mengontrol posisi munculnya tombol melalui `ActionSceneEnum`, menangani event klik melalui `registerFlow({ on: 'click' })`.

Untuk contoh lengkap rujuk [Membuat Tombol Action Kustom](../plugin-development/client/examples/custom-action).

## Halaman Setting Plugin

Banyak Plugin memerlukan halaman setting untuk Pengguna mengonfigurasi parameter — misalnya API Key layanan pihak ketiga, alamat Webhook, dll.

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-settings-page,
buat satu halaman setting Plugin, daftarkan entry "Konfigurasi Layanan Eksternal" di bawah menu "Konfigurasi Plugin", berisi dua Tab:
1. Tab "Konfigurasi API": formulir berisi API Key (string, wajib), API Secret (password, wajib), Endpoint (string, opsional), simpan ke database melalui API backend
2. Tab "Tentang": menampilkan nama Plugin dan informasi versi
Frontend menggunakan komponen formulir Ant Design, backend mendefinisikan dua antarmuka externalApi:get dan externalApi:set.
```

![Tampilan Halaman Setting Plugin](https://static-docs.nocobase.com/20260415160006.png)

AI akan menghasilkan komponen halaman setting frontend, Resource Action backend, definisi tabel data, dan konfigurasi ACL.

Untuk contoh lengkap rujuk [Membuat Halaman Setting Plugin](../plugin-development/client/examples/settings-page).

## API Kustom

Jika antarmuka CRUD bawaan tidak cukup, AI dapat membantu Anda menulis REST API kustom. Berikut adalah contoh lengkap interaksi frontend dan backend — backend mendefinisikan tabel data dan API, frontend membuat Block kustom untuk menampilkan data.

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-todo,
buat Plugin manajemen data Todo dengan interaksi frontend dan backend:
1. Backend mendefinisikan tabel todoItems, Field termasuk title (string), completed (boolean), priority (string, default medium)
2. Frontend membuat TableBlock kustom, hanya menampilkan data todoItems
3. Field priority ditampilkan dengan Tag berwarna (high merah, medium oranye, low hijau)
4. Tambahkan tombol "Buat Todo Baru", klik akan memunculkan formulir untuk membuat record
5. Pengguna yang sudah login dapat melakukan semua operasi CRUD
```

![Tampilan Plugin Manajemen Data Todo](https://static-docs.nocobase.com/20260408164204.png)

AI akan menghasilkan definisi Collection sisi server, Resource Action, konfigurasi ACL, serta `TableBlockModel`, `FieldModel`, dan `ActionModel` kustom sisi klien.

Untuk contoh lengkap rujuk [Membuat Plugin Manajemen Data dengan Interaksi Frontend dan Backend](../plugin-development/client/examples/fullstack-plugin).

## Konfigurasi Permission

AI akan secara otomatis mengonfigurasi aturan ACL yang masuk akal untuk API dan resource yang dihasilkan. Anda juga dapat secara eksplisit menentukan kebutuhan Permission di prompt:

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-todo,
definisikan satu tabel data todoItems (Field title, completed, priority),
persyaratan Permission: Pengguna login dapat melihat, membuat, dan mengedit, hanya role admin yang dapat menghapus.
```

AI akan mengonfigurasi aturan akses yang sesuai melalui `this.app.acl.allow()` di sisi server.

## Internasionalisasi

AI secara default akan menghasilkan dua paket bahasa Mandarin dan Inggris (`zh-CN.json` dan `en-US.json`), Anda tidak perlu menyebutkannya secara terpisah.

Jika ada kebutuhan bahasa lain:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-order,
perlu mendukung tiga paket bahasa: Mandarin, Inggris, dan Jepang
```

## Script Upgrade

Saat Plugin perlu memperbarui struktur database atau memigrasi data, AI dapat membantu Anda menghasilkan script Migration.

Contoh prompt:

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya menulis script upgrade untuk Plugin NocoBase @my-scope/plugin-order,
tambahkan Field "catatan" (long text, opsional) ke tabel "order", dan isi default Field catatan untuk order yang sudah ada dengan "tidak ada".
```

AI akan menghasilkan file Migration dengan nomor versi, berisi operasi DDL dan logika migrasi data.

## Tautan Terkait

- [Mulai Cepat Pengembangan Plugin AI](./index.md) — Mulai cepat dan ikhtisar kemampuan
- [Praktik: Pengembangan Plugin Watermark](./watermark-plugin) — Studi kasus praktik pengembangan Plugin AI yang lengkap
- [Pengembangan Plugin](../plugin-development/index.md) — Panduan lengkap pengembangan Plugin NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
