:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Struktur Direktori Proyek

Baik Anda mengkloning kode sumber dari Git atau menginisialisasi proyek menggunakan `create-nocobase-app`, proyek NocoBase yang dihasilkan pada dasarnya adalah sebuah monorepo berbasis **Yarn Workspace**.

## Ikhtisar Direktori Tingkat Atas

Contoh berikut menggunakan `my-nocobase-app/` sebagai direktori proyek. Mungkin ada sedikit perbedaan di lingkungan yang berbeda:

```bash
my-nocobase-app/
├── packages/              # Kode sumber proyek
│   ├── plugins/           # Plugin yang sedang dikembangkan (belum terkompilasi)
├── storage/               # Data saat runtime dan konten yang dihasilkan secara dinamis
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugin yang sudah terkompilasi (termasuk yang diunggah melalui antarmuka pengguna)
│   └── tar/               # File paket plugin (.tar)
├── scripts/               # Skrip utilitas dan perintah alat
├── .env*                  # Konfigurasi variabel lingkungan untuk berbagai lingkungan
├── lerna.json             # Konfigurasi workspace Lerna
├── package.json           # Konfigurasi paket root, mendeklarasikan workspace dan skrip
├── tsconfig*.json         # Konfigurasi TypeScript (frontend, backend, pemetaan jalur)
├── vitest.config.mts      # Konfigurasi pengujian unit Vitest
└── playwright.config.ts   # Konfigurasi pengujian E2E Playwright
```

## Penjelasan Subdirektori packages/

Direktori `packages/` berisi modul inti NocoBase dan paket yang dapat diperluas. Kontennya bergantung pada sumber proyek:

-   **Proyek yang dibuat melalui `create-nocobase-app`**: Secara default, hanya menyertakan `packages/plugins/`, yang digunakan untuk menyimpan kode sumber **plugin** kustom. Setiap subdirektori adalah paket npm independen.
-   **Repositori kode sumber resmi yang dikloning**: Anda dapat melihat lebih banyak subdirektori, seperti `core/`, `plugins/`, `pro-plugins/`, `presets/`, dll., yang masing-masing sesuai dengan inti framework, **plugin** bawaan, dan solusi preset resmi.

Dalam kedua kasus, `packages/plugins` adalah lokasi utama untuk mengembangkan dan melakukan debug **plugin** kustom.

## Direktori Runtime storage/

`storage/` menyimpan data yang dihasilkan saat runtime dan output build. Penjelasan subdirektori umum adalah sebagai berikut:

-   `apps/`: Konfigurasi dan cache untuk skenario multi-aplikasi.
-   `logs/`: Log runtime dan output debug.
-   `uploads/`: File dan sumber daya media yang diunggah pengguna.
-   `plugins/`: **Plugin** terpaket yang diunggah melalui antarmuka pengguna atau diimpor melalui CLI.
-   `tar/`: Paket terkompresi **plugin** yang dihasilkan setelah menjalankan `yarn build <plugin> --tar`.

> Umumnya disarankan untuk menambahkan direktori `storage` ke `.gitignore` dan menanganinya secara terpisah saat deployment atau backup.

## Konfigurasi Lingkungan dan Skrip Proyek

-   `.env`, `.env.test`, `.env.e2e`: Digunakan untuk menjalankan secara lokal, pengujian unit/integrasi, dan pengujian end-to-end secara berurutan.
-   `scripts/`: Menyimpan skrip pemeliharaan umum (seperti inisialisasi database, utilitas rilis, dll.).

## Jalur Pemuatan dan Prioritas Plugin

**Plugin** mungkin ada di beberapa lokasi. NocoBase akan memuatnya dengan urutan prioritas berikut saat memulai:

1.  Versi kode sumber di `packages/plugins` (untuk pengembangan dan debug lokal).
2.  Versi terpaket di `storage/plugins` (diunggah melalui antarmuka pengguna atau diimpor melalui CLI).
3.  Paket dependensi di `node_modules` (diinstal melalui npm/yarn atau bawaan framework).

Ketika **plugin** dengan nama yang sama ada di direktori sumber dan direktori terpaket, sistem akan memprioritaskan pemuatan versi sumber, memfasilitasi penimpaan dan debug lokal.

## Template Direktori Plugin

Buat **plugin** menggunakan CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Struktur direktori yang dihasilkan adalah sebagai berikut:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Output build (dihasilkan sesuai kebutuhan)
├── src/                     # Direktori kode sumber
│   ├── client/              # Kode frontend (blok, halaman, model, dll.)
│   │   ├── plugin.ts        # Kelas utama plugin sisi klien
│   │   └── index.ts         # Titik masuk sisi klien
│   ├── locale/              # Sumber daya multibahasa (dibagi antara frontend dan backend)
│   ├── swagger/             # Dokumentasi OpenAPI/Swagger
│   └── server/              # Kode sisi server
│       ├── collections/     # Definisi koleksi / tabel data
│       ├── commands/        # Perintah kustom
│       ├── migrations/      # Skrip migrasi database
│       ├── plugin.ts        # Kelas utama plugin sisi server
│       └── index.ts         # Titik masuk sisi server
├── index.ts                 # Ekspor jembatan frontend dan backend
├── client.d.ts              # Deklarasi tipe frontend
├── client.js                # Artefak build frontend
├── server.d.ts              # Deklarasi tipe sisi server
├── server.js                # Artefak build sisi server
├── .npmignore               # Konfigurasi abaikan publikasi
└── package.json
```

> Setelah proses build selesai, direktori `dist/` serta file `client.js` dan `server.js` akan dimuat saat **plugin** diaktifkan.
> Selama fase pengembangan, Anda hanya perlu memodifikasi direktori `src/`. Sebelum publikasi, jalankan `yarn build <plugin>` atau `yarn build <plugin> --tar`.