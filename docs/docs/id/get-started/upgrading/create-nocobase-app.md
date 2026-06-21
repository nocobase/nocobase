---
title: "Panduan Upgrade create-nocobase-app"
description: "Upgrade NocoBase untuk instalasi create-nocobase-app: yarn nocobase upgrade, upgrade ke versi tertentu, backup, dan catatan."
keywords: "create-nocobase-app,Upgrade,yarn nocobase upgrade,Upgrade Versi,NocoBase"
---

# Upgrade Instalasi create-nocobase-app

:::warning Persiapan Sebelum Upgrade

- Pastikan untuk membackup database terlebih dahulu
- Hentikan NocoBase yang sedang berjalan

:::

## 1. Hentikan NocoBase yang Sedang Berjalan

Jika proses tidak berjalan di background, hentikan dengan `Ctrl + C`. Untuk lingkungan produksi, jalankan perintah `pm2-stop` untuk menghentikan.

```bash
yarn nocobase pm2-stop
```

## 2. Jalankan Perintah Upgrade

Cukup jalankan perintah upgrade `yarn nocobase upgrade`

```bash
# Pindah ke direktori yang sesuai
cd my-nocobase-app
# Jalankan perintah update
yarn nocobase upgrade
# Jalankan
yarn dev
```

### Upgrade ke Versi Tertentu

Modifikasi file `package.json` di direktori root proyek, ubah nomor versi `@nocobase/cli` dan `@nocobase/devtools` (hanya bisa upgrade, tidak bisa downgrade). Contoh:

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

Kemudian jalankan perintah upgrade

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```
