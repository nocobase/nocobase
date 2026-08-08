---
title: "Struktur Direktori Proyek Plugin"
description: "Struktur proyek plugin NocoBase: nb init, layout aplikasi, plugins, direktori plugin, source, direktori runtime storage."
keywords: "struktur proyek,nb init,plugins,direktori plugin,NocoBase"
---

# Struktur Direktori Proyek

Aplikasi yang diinisialisasi melalui NocoBase CLI (`nb init`) akan menghasilkan direktori aplikasi standar. CLI mendukung dua sumber yaitu npm (`create-nocobase-app`) dan Git, struktur tingkat atas aplikasi tetap konsisten.

## Ikhtisar Direktori Tingkat Atas

```bash
<app-path>/
├── .nb/                   # Metadata yang disimpan CLI untuk env saat ini
├── source/                # Source code engineering aplikasi (NocoBase core + plugin bawaan)
├── storage/               # Direktori data runtime
│   ├── plugins/           # Plugin yang sudah dicompile (diupload atau diimpor)
│   └── tar/               # File hasil packaging plugin (.tgz)
├── plugins/               # Source code plugin Anda (nb scaffold plugin digenerate di sini)
├── .env                   # File environment variable aplikasi
```

## plugins/ Direktori Pengembangan Plugin

`plugins/` adalah lokasi utama Anda untuk mengembangkan plugin kustom. Plugin yang dibuat melalui `nb scaffold plugin` akan ditempatkan di sini.

`nb` akan secara otomatis menyinkronkan plugin di bawah `plugins/` ke `source/packages/plugins/` dalam bentuk symbolic link, untuk digunakan dalam alur pengembangan dan build. Anda tidak perlu mengoperasikan konten di bawah direktori `source/` secara manual.

## source/ Direktori Source Code Engineering

Direktori `source/` berisi source code engineering lengkap NocoBase, konten spesifik bergantung pada sumber proyek:

- **Sumber npm** (`create-nocobase-app`): Secara default hanya memiliki direktori dasar seperti `packages/plugins/`.
- **Sumber Git** (disarankan): Berisi source code core framework lengkap (`packages/core/`), plugin bawaan, dll., saat pengembangan dengan AI dapat langsung merujuk.

## storage/ Direktori Runtime

`storage/` menyimpan data yang digenerate saat runtime dan output build:

- `plugins/`: Plugin yang di-package, diupload melalui antarmuka atau diimpor melalui CLI.
- `tar/`: Paket terkompresi plugin yang dihasilkan setelah menjalankan `nb source build <plugin> --tar`.

## Path dan Prioritas Loading Plugin

Plugin dapat berada di beberapa lokasi, NocoBase memuatnya saat startup berdasarkan prioritas berikut:

1. Versi source code di `source/packages/plugins` (untuk pengembangan dan debugging lokal, disinkronkan secara otomatis oleh `nb` dari `plugins/`).
2. Versi yang di-package di `storage/plugins` (diupload melalui antarmuka atau diimpor melalui CLI).
3. Paket dependensi di `node_modules` (diinstal melalui npm/yarn atau bawaan framework).

Jika plugin dengan nama sama berada di direktori source code dan direktori package secara bersamaan, NocoBase akan memuat versi source code terlebih dahulu, untuk memudahkan override dan debugging lokal.

## Template Direktori Plugin

Membuat plugin dengan CLI:

```bash
nb scaffold plugin @my-project/plugin-hello
```

Struktur direktori yang dihasilkan adalah sebagai berikut:

```bash
plugins/@my-project/plugin-hello/
├── dist/                    # Output build (digenerate sesuai kebutuhan)
├── src/                     # Direktori source code
│   ├── client-v2/           # Kode front-end (Block, halaman, model, dll.)
│   │   ├── plugin.ts        # Class utama plugin client
│   │   └── index.ts         # Entry client
│   ├── locale/              # Resource multi-bahasa (digunakan bersama oleh front-back end)
│   ├── swagger/             # Dokumentasi OpenAPI/Swagger
│   └── server/              # Kode server
│       ├── collections/     # Definisi tabel data / collection
│       ├── commands/        # Command kustom
│       ├── migrations/      # Script migrasi database
│       ├── plugin.ts        # Class utama plugin server
│       └── index.ts         # Entry server
├── index.ts                 # Bridge ekspor front-back end
├── client-v2.d.ts           # Deklarasi tipe front-end
├── client-v2.js             # Hasil build front-end
├── server.d.ts              # Deklarasi tipe server
├── server.js                # Hasil build server
├── .npmignore               # Konfigurasi pengabaian publikasi
└── package.json
```

:::tip Tips

Setelah build selesai, file `dist/` serta `client-v2.js` dan `server.js` akan dimuat saat plugin diaktifkan. Selama tahap pengembangan Anda hanya perlu memodifikasi direktori `src/`, sebelum rilis jalankan `nb source build <plugin>` atau `nb source build <plugin> --tar`.

:::

## Tautan Terkait

- [Menulis Plugin Pertama](./write-your-first-plugin.md) — Membuat plugin dari nol dan merasakan alur pengembangan lengkap
- [Ikhtisar Pengembangan Server](./server/index.md) — Pengantar menyeluruh dan konsep inti plugin server
- [Ikhtisar Pengembangan Client](./client/index.md) — Pengantar menyeluruh dan konsep inti plugin client
- [Build & Packaging](./build.md) — Alur build, packaging, dan distribusi plugin
- [Manajemen Dependensi](./dependency-management.md) — Cara deklarasi dan manajemen dependensi plugin