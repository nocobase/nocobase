:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Peningkatan Instalasi `create-nocobase-app`

:::warning Persiapan Sebelum Peningkatan

- Pastikan untuk mencadangkan basis data terlebih dahulu.
- Hentikan instansi NocoBase yang sedang berjalan.

:::

## 1. Hentikan Instansi NocoBase yang Sedang Berjalan

Jika bukan proses yang berjalan di latar belakang, hentikan dengan `Ctrl + C`. Di lingkungan produksi, jalankan perintah `pm2-stop` untuk menghentikannya.

```bash
yarn nocobase pm2-stop
```

## 2. Jalankan Perintah Peningkatan

Cukup jalankan perintah peningkatan `yarn nocobase upgrade`.

```bash
# Pindah ke direktori yang sesuai
cd my-nocobase-app
# Jalankan perintah peningkatan
yarn nocobase upgrade
# Mulai
yarn dev
```

### Peningkatan ke Versi Tertentu

Ubah berkas `package.json` di direktori akar proyek, dan ubah nomor versi untuk `@nocobase/cli` dan `@nocobase/devtools` (Anda hanya bisa meningkatkan, tidak bisa menurunkan versi). Contoh:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Kemudian jalankan perintah peningkatan

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```