:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Ikhtisar Pengembangan Plugin

NocoBase mengadopsi **arsitektur mikrokernel**, di mana inti sistem hanya bertanggung jawab untuk penjadwalan siklus hidup plugin, manajemen dependensi, dan enkapsulasi kemampuan dasar. Semua fungsi bisnis disediakan dalam bentuk plugin. Oleh karena itu, memahami struktur organisasi, siklus hidup, dan cara pengelolaan plugin adalah langkah pertama dalam menyesuaikan NocoBase.

## Konsep Inti

- **Pasang dan Pakai (Plug and Play)**: Plugin dapat diinstal, diaktifkan, atau dinonaktifkan sesuai kebutuhan, memungkinkan kombinasi fungsi bisnis yang fleksibel tanpa perlu mengubah kode.
- **Integrasi Penuh (Full-stack Integration)**: Plugin biasanya mencakup implementasi sisi server dan sisi klien secara bersamaan, memastikan konsistensi antara logika data dan interaksi antarmuka pengguna.

## Struktur Dasar Plugin

Setiap plugin adalah paket `npm` independen, yang biasanya memiliki struktur direktori sebagai berikut:

```bash
plugin-hello/
├─ package.json          # Nama plugin, dependensi, dan metadata plugin NocoBase
├─ client.js             # Hasil kompilasi frontend, dimuat saat runtime
├─ server.js             # Hasil kompilasi sisi server, dimuat saat runtime
├─ src/
│  ├─ client/            # Kode sumber sisi klien, dapat mendaftarkan blok, aksi, bidang, dll.
│  └─ server/            # Kode sumber sisi server, dapat mendaftarkan sumber daya, event, perintah, dll.
```

## Konvensi Direktori dan Urutan Pemuatan

NocoBase secara default akan memindai direktori berikut untuk memuat plugin:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugin dalam pengembangan kode sumber (prioritas tertinggi)
└── storage/
    └── plugins/          # Plugin yang sudah dikompilasi, misalnya plugin yang diunggah atau dipublikasikan
```

- `packages/plugins`: Direktori ini digunakan untuk pengembangan plugin lokal, mendukung kompilasi dan debugging secara real-time.
- `storage/plugins`: Menyimpan plugin yang sudah dikompilasi, seperti edisi komersial atau plugin pihak ketiga.

## Siklus Hidup dan Status Plugin

Sebuah plugin biasanya melalui tahapan-tahapan berikut:

1.  **Buat (create)**: Membuat template plugin melalui `CLI`.
2.  **Tarik (pull)**: Mengunduh paket plugin ke lokal, namun belum ditulis ke dalam database.
3.  **Aktifkan (enable)**: Saat pertama kali diaktifkan, ia akan menjalankan proses "registrasi + inisialisasi"; pengaktifan berikutnya hanya akan memuat logikanya.
4.  **Nonaktifkan (disable)**: Menghentikan jalannya plugin.
5.  **Hapus (remove)**: Menghapus plugin sepenuhnya dari sistem.

:::tip

-   `pull` hanya bertanggung jawab untuk mengunduh paket plugin; proses instalasi yang sebenarnya dipicu oleh `enable` pertama kali.
-   Jika sebuah plugin hanya di-`pull` tetapi tidak diaktifkan, maka plugin tersebut tidak akan dimuat.

:::

### Contoh Perintah CLI

```bash
# 1. Buat kerangka plugin
yarn pm create @my-project/plugin-hello

# 2. Tarik paket plugin (unduh atau tautkan)
yarn pm pull @my-project/plugin-hello

# 3. Aktifkan plugin (instalasi otomatis pada pengaktifan pertama)
yarn pm enable @my-project/plugin-hello

# 4. Nonaktifkan plugin
yarn pm disable @my-project/plugin-hello

# 5. Hapus plugin
yarn pm remove @my-project/plugin-hello
```

## Antarmuka Manajemen Plugin

Akses manajer plugin di browser untuk melihat dan mengelola plugin secara intuitif:

**URL Default:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Manajer Plugin](https://static-docs.nocobase.com/20251030195350.png)