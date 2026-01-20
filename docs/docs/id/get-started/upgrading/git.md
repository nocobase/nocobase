:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperbarui Instalasi dari Kode Sumber Git

:::warning Persiapan Sebelum Pembaruan

- Pastikan untuk mencadangkan basis data Anda terlebih dahulu.
- Hentikan instans NocoBase yang sedang berjalan (`Ctrl + C`).

:::

## 1. Beralih ke Direktori Proyek NocoBase

```bash
cd my-nocobase-app
```

## 2. Tarik Kode Terbaru

```bash
git pull
```

## 3. Hapus Cache dan Dependensi Lama (Opsional)

Jika proses pembaruan normal gagal, Anda dapat mencoba menghapus cache dan dependensi, lalu mengunduhnya kembali.

```bash
# Hapus cache nocobase
yarn nocobase clean
# Hapus dependensi
yarn rimraf -rf node_modules # setara dengan rm -rf node_modules
```

## 4. Perbarui Dependensi

📢 Karena faktor-faktor seperti lingkungan jaringan dan konfigurasi sistem, langkah ini mungkin memerlukan waktu lebih dari sepuluh menit.

```bash
yarn install
```

## 5. Jalankan Perintah Pembaruan

```bash
yarn nocobase upgrade
```

## 6. Mulai NocoBase

```bash
yarn dev
```

:::tip Tips Lingkungan Produksi

Tidak disarankan untuk menerapkan instalasi NocoBase dari kode sumber secara langsung di lingkungan produksi (untuk lingkungan produksi, silakan lihat [Penerapan Produksi](../deployment/production.md)).

:::

## 7. Memperbarui Plugin Pihak Ketiga

Lihat [Instal dan Perbarui Plugin](../install-upgrade-plugins.mdx)