---
title: "Struktur Direktori Proyek Plugin"
description: "Struktur proyek plugin NocoBase: Yarn Workspace, packages/plugins, storage, direktori client/server, konfigurasi lerna.json."
keywords: "struktur proyek,Yarn Workspace,packages/plugins,direktori plugin,create-nocobase-app,NocoBase"
---

# Struktur Direktori Proyek

Apakah Anda meng-clone source code melalui Git, atau menginisialisasi proyek dengan `create-nocobase-app`, proyek NocoBase yang dihasilkan pada dasarnya adalah repository multi-paket berbasis **Yarn Workspace**.

## Ikhtisar Direktori Tingkat Atas

Berikut menggunakan `my-nocobase-app/` sebagai direktori proyek. Mungkin ada sedikit perbedaan di environment yang berbeda:

```bash
my-nocobase-app/
├── packages/              # Source code proyek
│   ├── plugins/           # Source code plugin yang sedang dikembangkan (belum dicompile)
├── storage/               # Data runtime dan konten yang digenerate dinamis
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugin yang sudah dicompile (termasuk yang diupload melalui antarmuka)
│   └── tar/               # File hasil packaging plugin (.tar)
├── scripts/               # Script utilitas dan perintah tools
├── .env*                  # Konfigurasi variabel untuk environment yang berbeda
├── lerna.json             # Konfigurasi workspace Lerna
├── package.json           # Konfigurasi paket root, mendeklarasikan workspace dan script
├── tsconfig*.json         # Konfigurasi TypeScript (front-end, back-end, path mapping)
├── vitest.config.mts      # Konfigurasi unit test Vitest
└── playwright.config.ts   # Konfigurasi E2E test Playwright
```

## Penjelasan Subdirektori packages/

Direktori `packages/` berisi modul inti dan paket yang dapat diperluas dari NocoBase, konten spesifik bergantung pada sumber proyek:

- **Proyek yang dibuat melalui `create-nocobase-app`**: Secara default hanya memiliki `packages/plugins/`, digunakan untuk menyimpan source code plugin kustom. Setiap subdirektori adalah paket npm independen.
- **Clone repository source code resmi**: Akan terlihat lebih banyak subdirektori, seperti `core/`, `plugins/`, `pro-plugins/`, `presets/`, dll., masing-masing sesuai dengan core framework, plugin bawaan, dan solusi preset resmi.

Apapun kasusnya, `packages/plugins` adalah lokasi utama Anda untuk mengembangkan dan men-debug plugin kustom.

## Direktori Runtime storage/

`storage/` menyimpan data yang digenerate saat runtime dan output build. Penjelasan subdirektori umum sebagai berikut:

- `apps/`: Konfigurasi dan cache untuk skenario multi-aplikasi.
- `logs/`: Log runtime dan output debug.
- `uploads/`: File dan resource media yang diupload pengguna.
- `plugins/`: Plugin yang di-package, diupload melalui antarmuka atau diimpor melalui CLI.
- `tar/`: Paket terkompresi plugin yang dihasilkan setelah menjalankan `yarn build <plugin> --tar`.

:::tip Tips

Umumnya disarankan untuk menambahkan direktori `storage` ke `.gitignore`, dan menanganinya secara terpisah saat deployment atau backup.

:::

## Konfigurasi Environment dan Script Proyek

- `.env`, `.env.test`, `.env.e2e`: Masing-masing untuk runtime lokal, test unit/integrasi, dan test end-to-end.
- `scripts/`: Menyimpan script operasional umum, seperti inisialisasi database, tools bantuan rilis, dll.

## Path dan Prioritas Loading Plugin

Plugin dapat berada di beberapa lokasi, NocoBase memuatnya saat startup berdasarkan prioritas berikut:

1. Versi source code di `packages/plugins` (untuk pengembangan dan debugging lokal).
2. Versi yang di-package di `storage/plugins` (diupload melalui antarmuka atau diimpor melalui CLI).
3. Paket dependensi di `node_modules` (diinstal melalui npm/yarn atau bawaan framework).

Jika plugin dengan nama sama berada di direktori source code dan direktori package secara bersamaan, NocoBase akan memuat versi source code terlebih dahulu, untuk memudahkan override dan debugging lokal.

## Template Direktori Plugin

Membuat plugin dengan CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Struktur direktori yang dihasilkan adalah sebagai berikut:

```bash
packages/plugins/@my-project/plugin-hello/
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

Setelah build selesai, file `dist/` serta `client-v2.js` dan `server.js` akan dimuat saat plugin diaktifkan. Selama tahap pengembangan Anda hanya perlu memodifikasi direktori `src/`, sebelum rilis jalankan `yarn build <plugin>` atau `yarn build <plugin> --tar`.

:::

## Tautan Terkait

- [Menulis Plugin Pertama](./write-your-first-plugin.md) — Membuat plugin dari nol dan merasakan alur pengembangan lengkap
- [Ikhtisar Pengembangan Server](./server/index.md) — Pengantar menyeluruh dan konsep inti plugin server
- [Ikhtisar Pengembangan Client](./client/index.md) — Pengantar menyeluruh dan konsep inti plugin client
- [Build & Packaging](./build.md) — Alur build, packaging, dan distribusi plugin
- [Manajemen Dependensi](./dependency-management.md) — Cara deklarasi dan manajemen dependensi plugin