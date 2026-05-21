---
title: "Ikhtisar Plugin Development NocoBase"
description: "Arsitektur microkernel NocoBase, siklus hidup plugin, struktur direktori, plug-and-play, integrasi front-back end, source code client/server, metadata package.json."
keywords: "plugin development,plugin NocoBase,microkernel,siklus hidup plugin,front-back end,ekstensi NocoBase"
---

# Ikhtisar Plugin Development

NocoBase menggunakan **arsitektur microkernel** — kernel hanya bertanggung jawab atas penjadwalan siklus hidup plugin, manajemen dependensi, dan enkapsulasi kapabilitas dasar, semua fungsi bisnis disediakan dalam bentuk plugin. Memahami struktur organisasi, siklus hidup, dan cara manajemen plugin adalah langkah pertama untuk memulai pengembangan kustom NocoBase.

## Konsep Inti

- **Plug-and-Play**: Anda dapat menginstal, mengaktifkan, atau menonaktifkan plugin sesuai kebutuhan, tanpa perlu mengubah kode untuk menggabungkan fungsi bisnis secara fleksibel.
- **Front-Back End Terintegrasi**: Plugin biasanya mencakup implementasi server dan client sekaligus, sehingga logika data dan interaksi antarmuka dikelola bersama.

## Struktur Dasar Plugin

Setiap plugin adalah package npm independen, biasanya berisi struktur direktori sebagai berikut:

```bash
plugin-hello/
├─ package.json          # Nama plugin, dependensi, dan metadata plugin NocoBase
├─ client-v2.js          # Hasil compile front-end, dimuat saat runtime
├─ server.js             # Hasil compile server, dimuat saat runtime
├─ src/
│  ├─ client-v2/         # Source code client, dapat mendaftarkan Block, Action, Field, dll.
│  └─ server/            # Source code server, dapat mendaftarkan resource, event, command line, dll.
```

## Konvensi Direktori dan Urutan Loading

Saat NocoBase dijalankan, sistem akan memindai direktori berikut untuk memuat plugin:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugin yang sedang dikembangkan dari source code (prioritas tertinggi)
└── storage/
    └── plugins/          # Plugin yang sudah dicompile, misalnya plugin yang diupload atau dirilis
```

- `packages/plugins`: Direktori plugin yang dikembangkan secara lokal, mendukung kompilasi dan debug real-time.
- `storage/plugins`: Menyimpan plugin yang sudah dicompile, seperti versi commercial atau plugin pihak ketiga.

## Siklus Hidup dan Status Plugin

Sebuah plugin biasanya melewati tahapan berikut:

1. **Create**: Membuat template plugin melalui CLI.
2. **Pull**: Mengunduh paket plugin ke lokal, tetapi belum ditulis ke database.
3. **Enable**: Saat pertama kali diaktifkan akan menjalankan "registrasi + inisialisasi"; aktivasi berikutnya hanya memuat logikanya saja.
4. **Disable**: Menghentikan plugin yang sedang berjalan.
5. **Remove**: Menghapus plugin sepenuhnya dari NocoBase.

:::tip Tips

- `pull` hanya bertanggung jawab mengunduh paket plugin, proses instalasi sebenarnya dipicu oleh `enable` pertama kali.
- Jika plugin hanya di-`pull` tetapi tidak diaktifkan, plugin tidak akan dimuat.

:::

### Contoh Perintah CLI

```bash
# 1. Membuat skeleton plugin
yarn pm create @my-project/plugin-hello

# 2. Mengambil paket plugin (download atau link)
yarn pm pull @my-project/plugin-hello

# 3. Mengaktifkan plugin (aktivasi pertama akan otomatis menginstal)
yarn pm enable @my-project/plugin-hello

# 4. Menonaktifkan plugin
yarn pm disable @my-project/plugin-hello

# 5. Menghapus plugin
yarn pm remove @my-project/plugin-hello
```

## Antarmuka Manajemen Plugin

Akses "Plugin Manager" melalui browser untuk melihat dan mengelola plugin secara intuitif:

**Alamat default:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Plugin Manager](https://static-docs.nocobase.com/20251030195350.png)

## Tautan Terkait

- [Menulis Plugin Pertama](./write-your-first-plugin.md) — Membuat Block plugin dari nol untuk memulai alur pengembangan dengan cepat
- [Struktur Direktori Proyek](./project-structure.md) — Memahami konvensi direktori NocoBase dan urutan loading plugin
- [Ikhtisar Pengembangan Server](./server/index.md) — Pengantar menyeluruh dan konsep inti plugin server
- [Ikhtisar Pengembangan Client](./client/index.md) — Pengantar menyeluruh dan konsep inti plugin client
- [Build & Packaging](./build.md) — Alur build dan packaging plugin
- [Manajemen Dependensi](./dependency-management.md) — Cara deklarasi dan manajemen dependensi plugin
